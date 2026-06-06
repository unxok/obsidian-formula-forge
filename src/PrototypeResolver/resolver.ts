import { around, dedupe } from "monkey-around";
import { App, Component, TFile, View } from "obsidian";
import {
	BasesContext,
	BasesController,
	BasesFilter,
	BasesFormula,
	BasesQuery,
	EmbedRegistry,
} from "obsidian-typings";
import { FormulaForge } from "~/Plugin";
import { monkeyAroundKey } from "~/utils";
import "./index.css";

export class PrototypeResolver extends Component {
	constructor(public plugin: FormulaForge) {
		super();
	}

	onload(): void {
		this.applyVaultPatches();
		void (async () => {
			await this.resolvePrototypes();
			this.onReadyCallback();
		})();
	}

	onunload(): void {}

	/**
	 * The callback called when the component has finished its async work
	 */
	private onReadyCallback: () => void = () => {};

	/**
	 * Adds a callback to be called when the component has finished its async work
	 */
	onReady(cb: () => void): void {
		this.onReadyCallback = cb;
	}

	async resolvePrototypes(): Promise<void> {
		const { plugin } = this;

		const containerEl = plugin.app.workspace.containerEl.createDiv({
			cls: "formula-forge--hidden-base",
			attr: {
				"aria-hidden": "true",
			},
		});

		const formulaName = "fn";

		const embedComponent = await this.createEmbeddableBaseEditor({
			query: `formulas:\n  ${formulaName}: "toString()"`,
			containerEl,
		});

		const { controller } = embedComponent;

		const formulaPrototype = Object.getPrototypeOf(
			controller.ctx.formulas[formulaName]
		) as BasesFormula;

		this.implementCreateFormula(formulaPrototype);

		// const functionPrototype = Object.getPrototypeOf(
		// 	controller.ctx.formulas[formulaName].formula
		// ) as BasesFormulaPartFunction;

		// this.patchFunction(functionPrototype);

		const contextPrototype = Object.getPrototypeOf(
			controller.ctx
		) as BasesContext;

		this.implementEvaluateFormula(contextPrototype);

		const controllerPrototype = Object.getPrototypeOf(
			controller
		) as typeof controller;

		this.patchController(controllerPrototype);

		const queryPrototype = Object.getPrototypeOf(
			controller.query
		) as typeof controller.query;

		if (!queryPrototype) {
			throw new Error("controller.query is nullish");
		}

		this.patchQuery(queryPrototype);

		embedComponent.unload();
		containerEl.remove();
	}

	/**
	 * Patches bases functions to handle custom functions
	 */
	// patchFunction(functionPrototype: BasesFormulaPartFunction): void {
	// 	const { customFunctions } = this.plugin.api;

	// 	const removePatch = around(functionPrototype, {
	// 		getValue: (old) =>
	// 			dedupe(monkeyAroundKey, old, function (ctx) {
	// 				// @ts-expect-error
	// 				const that = this as BasesFormulaPartFunction;

	// 				const custom = customFunctions.get(that.name);
	// 				if (custom) {
	// 					return custom({
	// 						args: that.args,
	// 						subject: that.subject,
	// 						ctx,
	// 					});
	// 				}

	// 				return old.call(that, ctx);
	// 			}),
	// 	});

	// 	this.register(removePatch);
	// }

	/**
	 * Implements the API method for creating formulas
	 */
	implementCreateFormula(formulaPrototype: BasesFormula): void {
		interface IBasesFormula {
			new (formula: string): BasesFormula;
		}
		const basesFormulaConstructor =
			formulaPrototype.constructor as IBasesFormula;

		this.plugin.api.createFormula = (formula) =>
			new basesFormulaConstructor(formula);
	}

	/**
	 * Implements the API method for evaluating formulas
	 */
	implementEvaluateFormula(contextPrototype: BasesContext): void {
		const { plugin } = this;

		interface IBasesContext {
			new (
				app: App,
				filter: BasesFilter | null,
				formulas: Record<string, BasesFormula>,
				file?: TFile
			): BasesContext;
		}
		const basesContextConstructor =
			contextPrototype.constructor as IBasesContext;

		const createBasesContext = (file?: TFile) => {
			const globalFormulas = plugin
				.getSettings()
				.globalFormulas.reduce((acc, { name, formula }) => {
					acc[name] = plugin.api.createFormula(formula);
					return acc;
				}, {} as Record<string, BasesFormula>);

			return new basesContextConstructor(
				plugin.app,
				null,
				globalFormulas,
				file
			);
		};

		plugin.api.evaluateFormula = (formula, containingFile) => {
			const formulaInstance =
				typeof formula === "string"
					? plugin.api.createFormula(formula)
					: formula;
			const context = createBasesContext(containingFile);
			return formulaInstance.getValue(context.local);
		};
	}

	/**
	 * Patches `BasesController` to add global formulas to all bases
	 */
	patchController(controllerPrototype: BasesController): void {
		const { plugin } = this;

		const uninstallControllerPatch = around(controllerPrototype, {
			// Adds global formulas to the base
			buildBasesContext: (old) =>
				dedupe(monkeyAroundKey, old, function (ctx) {
					// @ts-expect-error
					const that = this as typeof controllerPrototype;

					const built = old.call(that, ctx);

					const { globalFormulas } = plugin.getSettings();

					if (!globalFormulas || that.query instanceof Error) {
						return old.call(that, ctx);
					}

					if (!that.query) {
						throw new Error("controller.query is nullish");
					}

					that.query.formulas ??= {};

					const formulas = {
						...built.formulas,
						...Object.fromEntries(
							globalFormulas.map(({ name, formula }) => [
								name,
								plugin.api.createFormula(formula),
							])
						),
					};

					that.query.formulas = formulas;
					built.formulas = { ...formulas };

					return built;
				}),
		});

		this.register(uninstallControllerPatch);
	}

	/**
	 * Patches `BasesQuery` to prevent bases from saving global formulas to the file contents
	 */
	patchQuery(queryPrototype: BasesQuery): void {
		const { plugin } = this;

		const uninstallQueryPatch = around(queryPrototype, {
			toString(old) {
				return dedupe(monkeyAroundKey, old, function () {
					// @ts-expect-error
					const that = this as typeof queryPrototype;

					const { globalFormulas } = plugin.getSettings();

					const copy = { ...that.formulas };

					globalFormulas.forEach(({ name }) => {
						delete that.formulas[name];
					});

					const str = old.call(that);
					that.formulas = copy;
					return str;
				});
			},
		});

		this.register(uninstallQueryPatch);
	}

	/**
	 * Creates a Base context
	 */
	createBasesContext: (file: TFile) => BasesContext = () => {
		throw new Error("Method not implemented");
	};

	/**
	 * Creates a Base by initializing a Base embed component with a fake file
	 */
	async createEmbeddableBaseEditor({
		query = "",
		containerEl,
		containingFile,
	}: {
		query: string;
		containerEl: HTMLElement;
		containingFile?: TFile;
	}): Promise<EmbedBaseComponent> {
		this.fakeFileContent = query;

		const componentContainerEl = containerEl.createDiv({
			cls: "better-properties--embeddable-base-editor-container",
		});

		const embedComponent = this.plugin.app.embedRegistry.embedByExtension[
			"base"
		](
			{ app: this.plugin.app, containerEl: componentContainerEl },
			this.getFakeFile(),
			""
		);

		embedComponent.containingFile = containingFile ?? this.getFakeFile();
		embedComponent.controller.currentFile =
			containingFile ?? this.getFakeFile();

		await embedComponent.loadFile();

		componentContainerEl
			.querySelector("div.bases-view")
			?.addEventListener("scroll", () => {
				// TODO open PR to obsidian-typings
				const view = embedComponent?.controller.view as View & {
					updateVirtualDisplay(): void;
				};
				view.updateVirtualDisplay();
			});

		this.fakeFileContent = "";

		return embedComponent;
	}

	fakeFileName: string = crypto.randomUUID();
	fakeFileContent: string = "";

	/**
	 * Creates the fake file used in `createEmbeddableBaseEditor()`
	 */
	getFakeFile(): TFile {
		const { fakeFileName } = this;
		return {
			basename: fakeFileName,
			cache: () => {},
			deleted: false,
			extension: "base",
			getNewPathAfterRename: () => fakeFileName,
			getShortName: () => fakeFileName,
			name: fakeFileName + ".base",
			parent: null,
			path: fakeFileName + ".base",
			saving: false,
			setPath: () => {},
			stat: {
				ctime: -1,
				mtime: -1,
				size: 0,
			},
			updateCacheLimit: () => {},
			vault: this.plugin.app.vault,
			constructor__() {
				return this;
			},
		};
	}

	/**
	 * Patches Vault to prevent the fake file from being created/modified and allows the vault to be able to read the contents of the fake file despite it not being real
	 */
	applyVaultPatches() {
		const { plugin } = this;
		const fakeFile = this.getFakeFile();

		// eslint-disable-next-line @typescript-eslint/no-this-alias -- Necessary to reference the resolver instance
		const resolver = this;

		const uninstall = around(plugin.app.vault, {
			read: (old) =>
				dedupe(monkeyAroundKey, old, function (file) {
					// @ts-expect-error
					const that = this as typeof plugin.app.vault;

					if (file.path === fakeFile.path) {
						return new Promise((res) => {
							res(resolver.fakeFileContent);
						});
					}

					return old.call(that, file);
				}),
			cachedRead: (old) =>
				dedupe(monkeyAroundKey, old, function (file) {
					// @ts-expect-error
					const that = this as typeof resolver.plugin.app.vault;

					if (file.path === fakeFile.path) {
						return new Promise((res) => res(resolver.fakeFileContent));
					}

					return old.call(that, file);
				}),
			modify: (old) =>
				dedupe(monkeyAroundKey, old, function (file, data, options) {
					// @ts-expect-error
					const that = this as typeof plugin.app.vault;

					if (file.path === fakeFile.path)
						return new Promise<void>((res) => res());

					return old.call(that, file, data, options);
				}),
			create: (old) =>
				dedupe(monkeyAroundKey, old, function (path, data, options) {
					// @ts-expect-error
					const that = this as typeof plugin.app.vault;

					if (path === fakeFile.path)
						return new Promise<TFile>((res) => res(resolver.getFakeFile()));

					return old.call(that, path, data, options);
				}),
		});

		this.register(uninstall);
	}
}

type EmbedBaseComponent = ReturnType<EmbedRegistry["embedByExtension"]["base"]>;
