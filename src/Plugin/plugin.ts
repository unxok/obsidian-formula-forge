import {
	App,
	debounce,
	FileValue,
	ListValue,
	MarkdownPreviewRenderer,
	Notice,
	Plugin,
	PluginManifest,
	TFile,
} from "obsidian";
import { FormulaForgeSettings, formulaForgeSettingsSchema } from "~/Settings";
import * as v from "valibot";
import { PrototypeResolver } from "~/PrototypeResolver";
import { Api } from "~/Api";
import { FormulaForgeSettingTab } from "~/Settings/tab";
import { RendererManager } from "~/RendererManager";

export class FormulaForge extends Plugin {
	prototypeResolver: PrototypeResolver;
	rendererManager: RendererManager;
	api: Api;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.prototypeResolver = new PrototypeResolver(this);
		this.rendererManager = new RendererManager(this);
		this.api = new Api(this);
	}

	async onload(): Promise<void> {
		this.registerUtilityFunctions();

		await this.loadSettings();
		// eslint-disable-next-line
		new Notice("Formula Forge loaded");

		this.addSettingTab(new FormulaForgeSettingTab(this));
		this.addChild(this.prototypeResolver);

		this.prototypeResolver.onReady(() => {
			this.api.trigger("ready");
			this.addChild(this.rendererManager);

			if (!this.app.workspace.layoutReady) return;
			this.rebuildLeaves({ bases: true, formulas: true });

			// this.getSettings().customFunctions.forEach((func) => {
			// 	this.api.registerFunction(func);
			// });

			this.registerCustomFunctions();
		});

		// this.registerGlobalFunc({
		// 	name: "mod",
		// 	docString: () => "moddd",
		// 	ctx: null,
		// 	params: [{ name: "score", type: [NumberValue] }],
		// 	applyWithContext: (ctx, ...args) => {
		// 		console.log("ctx", ctx);
		// 		console.log(score);
		// 		const mod = Math.floor((score.data - 10) / 2);
		// 		return new NumberValue(mod);
		// 	},
		// });
	}

	onunload(): void {
		this.rebuildLeaves({ bases: true, formulas: true });
	}

	/**
	 * The plugin settings
	 */
	private settings: FormulaForgeSettings = v.parse(
		formulaForgeSettingsSchema,
		{}
	);

	/**
	 * Read and parse the plugin settings from disk
	 */
	async loadSettings(): Promise<void> {
		const data: unknown = (await this.loadData()) ?? {};

		const parsed = v.safeParse(formulaForgeSettingsSchema, data);
		if (!parsed.success) {
			// TODO handle this better
			const msg = "Formula Forge: Invalid settings detected";
			console.error(msg);
			new Notice(msg);
			this.settings = v.parse(formulaForgeSettingsSchema, {});
			return;
		}

		this.settings = parsed.output;
	}

	/**
	 * Get the plugin settings
	 */
	getSettings(): Readonly<FormulaForgeSettings> {
		return structuredClone(this.settings);
	}

	/**
	 * Set the plugin settings and save it to disk
	 */
	async setSettings(settings: FormulaForgeSettings): Promise<void> {
		const prev = this.getSettings();
		this.settings = settings;
		await this.saveData(this.settings);
		this.handleSettingsChange(prev, settings);
	}

	/**
	 * Update the plugin's settings and save it to disk
	 */
	async updateSettings(
		cb: (settings: Readonly<FormulaForgeSettings>) => FormulaForgeSettings
	): Promise<void> {
		await this.setSettings(cb(this.getSettings()));
		return;
	}

	async onExternalSettingsChange(): Promise<void> {
		await this.loadSettings();
	}

	/**
	 * Performs tasks that need to be done when the plugin settings have changed
	 */
	handleSettingsChange = debounce(
		(
			prev: Readonly<FormulaForgeSettings>,
			current: Readonly<FormulaForgeSettings>
		) => {
			const isGlobalFormulasChanged =
				prev.globalFormulas.length !== current.globalFormulas.length ||
				prev.globalFormulas.some((formulaA, i) => {
					const formulaB = current.globalFormulas[i];
					return (
						formulaA.name !== formulaB.name ||
						formulaA.description !== formulaB.description ||
						formulaA.formula !== formulaB.formula
					);
				});

			const isInlineCodeSyntaxChanged =
				prev.inlineCodeSyntax !== current.inlineCodeSyntax;

			if (isInlineCodeSyntaxChanged && this.rendererManager.postProcessor) {
				MarkdownPreviewRenderer.unregisterPostProcessor(
					this.rendererManager.postProcessor
				);
				this.rendererManager.registerMarkdownPostProcessor();
			}

			if (prev.codeBlockLanguage !== current.codeBlockLanguage) {
				MarkdownPreviewRenderer.unregisterCodeBlockPostProcessor(
					prev.codeBlockLanguage
				);
				this.rendererManager.registerMarkdownCodeBlockProcessor();
			}

			const isCustomFunctionsChanged =
				prev.customFunctions.length !== current.customFunctions.length ||
				prev.customFunctions.some((functionA, i) => {
					const functionB = current.customFunctions[i];
					return (
						functionA.name !== functionB.name ||
						functionA.description !== functionB.description ||
						functionA.formula !== functionB.formula
					);
				});

			if (isCustomFunctionsChanged) {
				prev.customFunctions.forEach(({ name }) => {
					const remover = this.api.customFunctionRemovers.get(name);
					if (!remover) return;
					remover();
					this.api.customFunctionRemovers.delete(name);
				});
				this.registerCustomFunctions();
			}

			this.rebuildLeaves({
				bases: isCustomFunctionsChanged || isGlobalFormulasChanged,
				formulas: isCustomFunctionsChanged || isInlineCodeSyntaxChanged,
			});
		},
		500,
		true
	);

	/**
	 * Rebuilds leaves containing bases
	 */
	rebuildLeaves(filter: { bases?: boolean; formulas?: boolean }): void {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (!filter.bases && !filter.formulas) return;

			const containsBase =
				filter.bases && leaf.view.containerEl.querySelector(".bases-view");
			const containsFormula =
				filter.formulas &&
				leaf.view.containerEl.querySelector(
					".formula-forge--formula-container"
				);

			if (!(containsBase || containsFormula)) return;

			void leaf.rebuildView();
		});
	}

	registerCustomFunctions(): void {
		this.getSettings().customFunctions.forEach((func) => {
			this.api.registerFunction(func);
		});
	}

	registerUtilityFunctions(): void {
		this.registerGlobalFunc({
			name: "files",
			ctx: null,
			docString: () => "Get all files in the vault.",
			params: [],
			applyWithContext: () => {
				interface IFileValue {
					new (app: App, file: TFile): FileValue;
				}

				return new ListValue(
					this.app.vault
						.getFiles()
						.map((f) => new (FileValue as IFileValue)(this.app, f))
				);
			},
		});

		this.registerInstanceFunc(ListValue, {
			name: "first",
			ctx: null,
			docString: () => "Returns the first item of the list.",
			params: [{ name: "list", type: [ListValue] }],
			applyWithContext: (_ctx, list: ListValue) => {
				return list.get(0);
			},
		});

		this.registerInstanceFunc(ListValue, {
			name: "last",
			ctx: null,
			docString: () => "Returns the last item of the list.",
			params: [{ name: "list", type: [ListValue] }],
			applyWithContext: (_ctx, list: ListValue) => {
				return list.get(list.length() - 1);
			},
		});

		this.registerInstanceFunc(ListValue, {
			name: "random",
			ctx: null,
			docString: () => "Returns a random item from the list.",
			params: [{ name: "list", type: [ListValue] }],
			applyWithContext: (_ctx, list: ListValue) => {
				const randomIndex = Math.floor(Math.random() * list.length());
				return list.get(randomIndex);
			},
		});

		// TODO can't figure out how to allow using variable names in an expression passed as an argument, similar to how List.reduce() does it
		// this.registerInstanceFunc(ListValue, {
		// 	name: "some",
		// 	ctx: null,
		// 	docString: () =>
		// 		"Determines whether expression is true for any item in the list.",
		// 	params: [
		// 		{ name: "list", type: [ListValue] },
		// 		{ name: "value", type: [BooleanValue] },
		// 	],
		// 	applyWithContext: (ctx, list: ListValue, value: BooleanValue) => {
		// 		around(ctx, {
		// 			getByIdentifier: old => dedupe(monkeyAroundKey, old, function(identifier) {
		// 				// @ts-expect-error
		// 				const that = this as typeof ctx;

		// 				return old.call(that, identifier);
		// 			})
		// 		})

		// 		return list.get(list.length() - 1);
		// 	},
		// });
	}
}
