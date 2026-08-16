import { Component, debounce, MarkdownPostProcessor } from "obsidian";
import { FormulaForge } from "~~/plugin";
import { FormulaRenderer } from "./renderer";
import "./index.css";
import { createFormulaRendererCodeblockProcessor } from "./codeblock-processor";
import { createFormulaRendererPostProcessor } from "./post-processor";
import {
	createFormulaSyntaxHighlightingPlugin,
	createInlineFormulaRendererPlugin,
} from "./view-plugin";

export class RendererManager extends Component {
	renderers: Set<FormulaRenderer> = new Set();

	// might be useful later
	// this.app.workspace.trigger("post-processor-change"),

	constructor(public plugin: FormulaForge) {
		super();
	}

	onload(): void {
		this.registerMarkdownPostProcessor();
		this.registerMarkdownCodeBlockProcessor();
		this.plugin.registerEditorExtension([
			createInlineFormulaRendererPlugin(this),
			createFormulaSyntaxHighlightingPlugin(this.plugin),
		]);

		this.reRenderFormulas = this.getFormulasRerenderer();

		this.registerEvent(
			this.plugin.app.metadataCache.on("resolved", () =>
				this.reRenderFormulas()
			)
		);

		this.plugin.onSettingsChange((prev, settings) => {
			if (prev.refreshTime !== settings.refreshTime) {
				this.reRenderFormulas = this.getFormulasRerenderer();
			}
		});
	}

	postProcessor?: MarkdownPostProcessor;

	registerMarkdownPostProcessor(): void {
		if (!this.plugin.getSettings().inlineCodeSyntax) return;

		this.postProcessor = createFormulaRendererPostProcessor(this);
		this.plugin.registerMarkdownPostProcessor(this.postProcessor);
	}

	registerMarkdownCodeBlockProcessor(): void {
		if (!this.plugin.getSettings().codeBlockLanguage) return;

		this.plugin.registerMarkdownCodeBlockProcessor(
			...createFormulaRendererCodeblockProcessor(this)
		);
	}

	getFormulasRerenderer(): () => void {
		return debounce(
			() => {
				this.renderers.forEach((r) => {
					r.render();
				});
			},
			this.plugin.getSettings().refreshTime,
			true
		);
	}

	reRenderFormulas(): void {
		throw new Error("Method not implemented");
	}
}
