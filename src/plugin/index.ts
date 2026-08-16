import { Plugin, Notice, debounce, App, PluginManifest } from "obsidian";
import {
	FormulaForgeSettings,
	formulaForgeSettingsSchema,
} from "~/plugin/schema";
import * as v from "valibot";
import { BasesAdapter } from "~/shared/bases-adapter";
import { FormulaForgeSettingTab } from "~/plugin/settings-tab";
import { Feature } from "~/features/types";
import { ExtraBuiltinFunctions } from "~/features/extra-builtin-functions";
import { CustomFunctions } from "~/features/custom-functions";
import { GlobalFormulas } from "~/features/global-formulas";
import { LiveFormulas } from "~/features/live-formulas";
import { SearchByFormula } from "~/features/search-by-formula";
import { Changelog } from "~/features/changelog";

export class FormulaForge extends Plugin {
	basesAdapter: BasesAdapter;
	features: Feature[] = [
		new Changelog(),
		new LiveFormulas(),
		new ExtraBuiltinFunctions(),
		new GlobalFormulas(),
		new CustomFunctions(),
		new SearchByFormula(),
	];

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);

		this.basesAdapter = new BasesAdapter(this);
	}

	/**
	 * Called when the plugin is loaded.
	 */
	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new FormulaForgeSettingTab(this));

		await this.basesAdapter.init();

		this.features.forEach((feature) => {
			feature.setup(this);
		});
	}

	/**
	 * Called when the plugin is unloaded.
	 */
	onunload(): void {
		return;
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
		this.onSettingsChanged(prev, settings);
	}

	/**
	 * Debounced function called after settings are changed
	 */
	private onSettingsChanged = debounce(
		(prev: FormulaForgeSettings, settings: FormulaForgeSettings) => {
			this.onSettingsChangeCallbacks.forEach((cb) => cb(prev, settings));
		},
		500,
		true
	);

	/**
	 * Functions meant to be called after the plugin settings are updated
	 */
	private onSettingsChangeCallbacks: ((
		prev: FormulaForgeSettings,
		settings: FormulaForgeSettings
	) => void)[] = [];

	/**
	 * Registers a function to be called when the plugin settings are updated
	 */
	public onSettingsChange(
		cb: (prev: FormulaForgeSettings, settings: FormulaForgeSettings) => void
	): void {
		this.onSettingsChangeCallbacks.push(cb);
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

	/**
	 * Called when the data.json file is modified on disk externally from Obsidian.
	 * This usually means that a Sync service or external program has modified the plugin settings.
	 */
	async onExternalSettingsChange(): Promise<void> {
		await this.loadSettings();
	}
}
