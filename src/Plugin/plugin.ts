import {
	App,
	BasesEntry,
	debounce,
	FileValue,
	HTMLValue,
	ListValue,
	MarkdownPreviewRenderer,
	MarkdownRenderer,
	Notice,
	NullValue,
	NumberValue,
	Plugin,
	PluginManifest,
	StringValue,
	TFile,
	Value,
} from "obsidian";
import { FormulaForgeSettings, formulaForgeSettingsSchema } from "~/Settings";
import * as v from "valibot";
import { PrototypeResolver } from "~/PrototypeResolver";
import { Api } from "~/Api";
import { FormulaForgeSettingTab } from "~/Settings/tab";
import { RendererManager } from "~/RendererManager";
import { around } from "monkey-around";
import { AnyValue, hash32, mulberry32 } from "~/utils";

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

		this.addSettingTab(new FormulaForgeSettingTab(this));
		this.addChild(this.prototypeResolver);

		this.prototypeResolver.onReady(() => {
			this.api.trigger("ready");
			this.addChild(this.rendererManager);
			this.registerCustomFunctions();

			if (this.app.workspace.layoutReady) {
				this.rebuildLeaves({ bases: true, formulas: true });
			}
			this.handleSettingsChange(this.getSettings(), this.getSettings());
		});
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
						functionA.formula !== functionB.formula ||
						functionA.parameters.length !== functionB.parameters.length ||
						functionA.parameters.some((p1, i) => {
							const p2 = functionB.parameters[i];
							return p1.name !== p2.name || p1.type !== p2.name;
						})
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

	/**
	 * Register the custom functions defined in the settings
	 */
	registerCustomFunctions(): void {
		this.getSettings().customFunctions.forEach((func) => {
			this.api.registerFunction(func);
		});
	}

	/**
	 * Register utility functions like files(), define(), and then()
	 */
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

		this.registerGlobalFunc({
			name: "then",
			ctx: null,
			docString: () => "Returns the last of all the provided values.",
			params: [{ name: "values", type: [AnyValue], variadic: true }],
			applyWithContext(_ctx, ...values) {
				return values.pop() ?? NullValue.value;
			},
		});

		this.registerInstanceFunc(NullValue, {
			name: "then",
			ctx: null,
			docString: () => "Returns the last of all the provided values.",
			params: [
				{ name: "self", type: [NullValue] },
				{ name: "values", type: [AnyValue], variadic: true },
			],
			applyWithContext(_ctx, _self, ...values) {
				return values.pop() ?? NullValue.value;
			},
		});

		const patchContextForDefine = (
			ctx: BasesEntry,
			name: StringValue,
			value: Value
		) => {
			around(ctx, {
				getByIdentifier: function (old) {
					return function (ident) {
						// @ts-expect-error
						const that = this as typeof ctx;

						if (ident === name.data) {
							return value;
						}

						return old.call(that, ident);
					};
				},
			});
		};

		this.registerGlobalFunc({
			name: "define",
			ctx: null,
			docString: () => "Define a variable",
			params: [
				{
					name: "name",
					type: [StringValue],
				},
				{
					name: "value",

					type: [AnyValue],
				},
			],
			applyWithContext: (ctx, name, value) => {
				patchContextForDefine(ctx, name, value);
				return NullValue.value;
			},
		});

		this.registerInstanceFunc(NullValue, {
			name: "define",
			ctx: null,
			docString: () => "Define a variable",
			params: [
				{
					name: "self",
					type: [NullValue],
				},
				{
					name: "name",
					type: [StringValue],
				},
				{
					name: "value",

					type: [AnyValue],
				},
			],
			applyWithContext: (ctx, _self, name, value) => {
				patchContextForDefine(ctx, name, value);
				return NullValue.value;
			},
		});

		this.registerGlobalFunc({
			name: "md",
			ctx: null,
			docString: () =>
				"Converts a markdown string into a code snippet that renders as HTML.",
			params: [
				{
					name: "input",
					type: [StringValue],
				},
			],
			applyWithContext: (ctx, input) => {
				const value = new HTMLValue(input.data);

				value.renderTo = (el) => {
					void MarkdownRenderer.render(
						this.app,
						value.data,
						el,
						ctx.file.path,
						ctx.ctx
					);
				};

				return value;
			},
		});

		this.registerGlobalFunc({
			name: "stableRandom",
			ctx: null,
			docString: () =>
				"Returns a random number between 0 and 1 that is consistent per the provided `seed` parameter.",
			params: [
				{
					name: "seed",
					type: [AnyValue],
				},
			],
			applyWithContext: (_ctx, seed): NumberValue => {
				const str = seed.toString();
				const hash = hash32(str);
				const num = mulberry32(hash);
				return new NumberValue(num);
			},
		});
	}
}
