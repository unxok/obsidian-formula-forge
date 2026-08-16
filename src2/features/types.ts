import { FormulaForge } from "~~/plugin";
import { FormulaForgeSettingTab } from "~~/plugin/settings-tab";

/**
 * A feature which implements functionality independently from any other feature
 */
export abstract class Feature {
	constructor() {}

	/**
	 * Sets up the feature. Called within `Plugin.onload()`
	 */
	abstract setup(plugin: FormulaForge): void;

	/**
	 * Renders the feature's settings. Called within `PluginSettingTab.display()`
	 */
	abstract settings(plugin: FormulaForge, tab: FormulaForgeSettingTab): void;
}
