import { PluginSettingTab } from "obsidian";
import { FormulaForge } from "~~/plugin";

export class FormulaForgeSettingTab extends PluginSettingTab {
	constructor(public plugin: FormulaForge) {
		super(plugin.app, plugin);
	}

	display(): void {
		this.containerEl.empty();

		this.plugin.features.forEach((feature) => {
			feature.settings(this.plugin, this);
		});
	}
}
