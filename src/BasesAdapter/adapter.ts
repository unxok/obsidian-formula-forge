import { LanguageSupport } from "@codemirror/language";
import { around, dedupe } from "monkey-around";
import { App, Component, QueryController, TFile, Value, Vault } from "obsidian";
import { BasesContext, BasesFilter, BasesFormula } from "obsidian-typings";
import { FormulaForge } from "~~/plugin";
import { monkeyAroundKey } from "~~/shared/constants";

export class BasesAdapter extends Component {
	constructor(public plugin: FormulaForge) {
		super();
	}

	async init(): Promise<void> {
		const componentContainerEl = window.createDiv({
			cls: "formula-forge--embeddable-base-editor-container",
		});

		// eslint-disable-next-line -- obsidianmd/no-tfile-tfolder-cast
		const fakeFile = {} as TFile;

		const formulaName = "fn";
		const query = `formulas:\n  ${formulaName}: "toString()"`;

		const embedComponent = this.plugin.app.embedRegistry.embedByExtension[
			"base"
		](
			{ app: this.plugin.app, containerEl: componentContainerEl },
			fakeFile,
			""
		);

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

		await embedComponent.loadFile();
		embedComponent.load();
		// console.log("embedComponent: ", embedComponent);

		const { controller } = embedComponent;

		this.getFormulaLanguageSupport = () => {
			return controller.getEditorLanguageSupport() as LanguageSupport;
		};

		this.getQueryControllerPrototype = () =>
			Object.getPrototypeOf(controller) as QueryController;

		this.getContextPrototype = () =>
			Object.getPrototypeOf(controller.ctx) as BasesContext;

		this.getFormulaPrototype = () =>
			Object.getPrototypeOf(
				controller.query!.formulas[formulaName]
			) as BasesFormula;

		// debugger;

		vaultPatch();
		embedComponent.unload();
		componentContainerEl.remove();
	}

	public getFormulaLanguageSupport(): LanguageSupport {
		throw new Error("Method not implemented");
	}

	public getQueryControllerPrototype(): QueryController {
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
}
