import { Component, Plugin } from "obsidian";
import {
	InternalPluginNameType,
	InternalPluginNameInstancesMapping,
} from "obsidian-typings";
import { FormulaForge } from "~/Plugin";
import { FormulaForgeSettings } from "~/Settings";

/**
 * A feature which integrates with another plugin
 */
export abstract class PluginIntegration<P> extends Component {
	constructor(
		public plugin: FormulaForge,
		public name: string,
		public settingsKey: keyof FormulaForgeSettings["integrations"]
	) {
		super();
	}

	onload(): void {
		void (async () => {
			const plugin = await this.getPlugin();
			if (!plugin) {
				throw new Error("Integration loaded but plugin cannot be retrieved");
			}
			await this.init(plugin);
		})();
	}

	/**
	 * Get the plugin to integrate with
	 */
	abstract getPlugin(): Promise<P | null>;

	/**
	 * Initialize the features of the integration
	 */
	public init(plugin: P): void | Promise<void> {
		void plugin;
		throw new Error("Method not implemented");
	}
}

/**
 * A feature which integrates with an internal (core) plugin
 */
export class InternalPluginIntegration<
	P extends InternalPluginNameType
> extends PluginIntegration<InternalPluginNameInstancesMapping[P]> {
	constructor(
		plugin: FormulaForge,
		public name: P,
		settingsKey: keyof FormulaForgeSettings["integrations"]
	) {
		super(plugin, name, settingsKey);
	}

	async getPlugin(): Promise<InternalPluginNameInstancesMapping[P] | null> {
		return this.plugin.app.internalPlugins.getEnabledPluginById(this.name);
	}
}

/**
 * A feature which integrates with a community plugin
 */
export class CommunityPluginIntegration<
	P extends Plugin
> extends PluginIntegration<P> {
	async getPlugin(): Promise<P | null> {
		return this.plugin.app.plugins.getPlugin(this.name) as P | null;
	}
}
