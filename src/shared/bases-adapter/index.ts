import { around, dedupe } from "monkey-around";
import {
	App,
	Component,
	ErrorValue,
	stringifyYaml,
	TFile,
	Value,
	Vault,
} from "obsidian";
import {
	BasesContext,
	BasesController,
	BasesFilter,
	BasesFormula,
	BasesPluginInstance,
	BasesQuery,
} from "obsidian-typings";
import { FormulaForge } from "~/plugin";
import { monkeyAroundKey } from "~/shared/constants";

export class BasesAdapter extends Component {
	constructor(public plugin: FormulaForge) {
		super();
	}

	async init(): Promise<void> {
		const componentContainerEl = window.createDiv({
			cls: "formula-forge--embeddable-base-editor-container",
		});

		const fakeFileName = crypto.randomUUID();
		const fakeFile: TFile = {
			basename: fakeFileName,
			cache() {},
			deleted: false,
			extension: "base",
			getNewPathAfterRename: () => "",
			getShortName: () => fakeFileName,
			name: fakeFileName + ".base",
			parent: null,
			path: fakeFileName + ".base",
			saving: false,
			setPath() {},
			stat: { ctime: -1, mtime: -1, size: -1 },
			updateCacheLimit() {},
			vault: this.plugin.app.vault,
			constructor__: {} as TFile["constructor__"],
		};
		const formulaName = "fn";
		const query = `formulas:\n  ${formulaName}: "toString()"`;

		const embedComponent = this.plugin.app.embedRegistry.embedByExtension[
			"base"
		](
			{ app: this.plugin.app, containerEl: componentContainerEl },
			fakeFile,
			""
		);

		// temporarily patch the vault to prevent reading the fake file
		const vaultPatch = around(Vault.prototype, {
			read(old) {
				return dedupe(monkeyAroundKey, old, function (file) {
					// @ts-expect-error
					const that = this as Vault;

					if (file === fakeFile) {
						return new Promise<string>((res) => res(query));
					}
					return old.call(that, file);
				});
			},
		});

		// takes about 1.5 ms for < 100 notes
		// takes about 3.5 ms for > 10000 notes
		await embedComponent.loadFile();
		embedComponent.load();

		const { controller } = embedComponent;

		this.getFormulaLanguageSupport = () => {
			const lang = controller.getEditorLanguageSupport();
			lang.ctx.formulaResults.formulas = {};
			return lang;
		};

		this.getControllerPrototype = () =>
			Object.getPrototypeOf(controller) as BasesController;

		this.getQueryPrototype = () =>
			Object.getPrototypeOf(controller.query) as BasesQuery;

		this.getContextPrototype = () =>
			Object.getPrototypeOf(controller.ctx) as BasesContext;

		this.getFormulaPrototype = () =>
			Object.getPrototypeOf(
				controller.query!.formulas[formulaName]
			) as BasesFormula;

		vaultPatch();
		embedComponent.unload();
		componentContainerEl.remove();
	}

	public getFormulaLanguageSupport(): ReturnType<
		BasesController["getEditorLanguageSupport"]
	> {
		throw new Error("Method not implemented");
	}

	public getControllerPrototype(): BasesController {
		throw new Error("Method not implemented");
	}

	public getQueryPrototype(): BasesQuery {
		throw new Error("Method not implemented");
	}

	public getFormulaPrototype(): BasesFormula {
		throw new Error("Method not implemented");
	}

	public createFormula(text: string): BasesFormula {
		const proto = this.getFormulaPrototype();
		interface IBasesFormula {
			new (formula: string): BasesFormula;
		}

		const basesFormulaConstructor = proto.constructor as IBasesFormula;

		return new basesFormulaConstructor(text);
	}

	public evaluateFormula(
		formula: string | BasesFormula,
		containingFile?: string | TFile
	): Value {
		const { plugin } = this;

		const formulaInstance =
			typeof formula === "string" ? this.createFormula(formula) : formula;

		const file =
			typeof containingFile === "string"
				? plugin.app.vault.getFileByPath(containingFile) ?? undefined
				: containingFile;
		const context = this.createContext(file);
		return formulaInstance.getValue(context.local);
	}

	public getContextPrototype(): BasesContext {
		throw new Error("Method not implemented");
	}

	public createContext(file?: TFile): BasesContext {
		const { plugin } = this;

		interface IBasesContext {
			new (
				app: App,
				filter: BasesFilter | null,
				formulas: Record<string, BasesFormula>,
				file?: TFile
			): BasesContext;
		}

		const basesContextConstructor = this.getContextPrototype()
			.constructor as IBasesContext;

		return new basesContextConstructor(plugin.app, null, {}, file);
	}

	public async getFilesByFormula(
		formula: string,
		containingFile: TFile
	): Promise<MapIterator<TFile> | string> {
		const result = this.evaluateFormula(formula, containingFile);
		if (result.constructor.type === "Error") {
			return (result as ErrorValue).message;
		}

		const { app } = this.plugin;
		const { instance } = app.internalPlugins.plugins["bases"];
		interface IBasesController {
			new (
				app: App,
				basesPluginInstance: BasesPluginInstance,
				containerEl: HTMLElement
			): BasesController;
		}

		const controllerConstructor = this.getControllerPrototype()
			.constructor as IBasesController;

		const containerEl = window.activeDocument.body.createDiv();

		const controller = new controllerConstructor(app, instance, containerEl);
		if (containingFile) {
			controller.updateCurrentFile(containingFile);
		}
		controller.load();

		const queryString = formula
			? stringifyYaml({
					filters: { and: [formula] },
			  })
			: "";
		const query = this.getQueryPrototype().constructor.fromString(queryString);

		controller.setQuery(query);
		controller.runQuery(controller.ctx);

		const wait = async () => {
			let isTimedOut = false;

			window.setTimeout(() => {
				isTimedOut = true;
			}, 10000);

			while (!isTimedOut) {
				if (!controller.queue.queue) {
					return;
				}
				const { running } = (
					controller.queue.queue as unknown as {
						runnable: { running: boolean };
					}
				).runnable;

				if (!running) return;

				await new Promise((res) => window.setTimeout(res, 10));
			}
		};

		// averages about 175 ms on a vault with 10k notes, regardless of the formula and result count
		await wait();

		controller.unload();
		containerEl.remove();

		// TODO open PR to obsidian-typings to fix type of `controller.results`
		return controller.results.keys() as MapIterator<TFile>;
	}
}
