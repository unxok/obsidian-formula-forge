import { Component } from "obsidian";
import { FormulaForge } from "~/Plugin";
import { PluginIntegration } from "./types";
import { TemplatesIntegration } from "./integrations/templates";

export class IntegrationManager extends Component {
	constructor(public plugin: FormulaForge) {
		super();

		this.integrations.push(new TemplatesIntegration(plugin));
	}

	onload(): void {
		void this.handleIntegrations();

		this.registerEvent(
			this.plugin.app.internalPlugins.on("change", async () => {
				await this.handleIntegrations();
			})
		);
	}

	integrations: PluginIntegration<unknown>[] = [];

	async handleIntegrations() {
		for (const integration of this.integrations) {
			const shouldActivate = await this.checkShouldActivate(integration);
			if (!shouldActivate) {
				this.removeChild(integration);
				continue;
			}
			this.addChild(integration);
		}
	}

	async checkShouldActivate(
		integration: (typeof this.integrations)[number]
	): Promise<boolean> {
		const settings = this.plugin.getSettings();
		const isEnabled = settings.integrations[integration.settingsKey];
		const isPluginFound = !!(await integration.getPlugin());
		return isEnabled && isPluginFound;
	}
}
