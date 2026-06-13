import { Component, MarkdownPostProcessor } from "obsidian";
import { FormulaForge } from "~/Plugin";
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
			createInlineFormulaRendererPlugin(this.plugin),
			createFormulaSyntaxHighlightingPlugin(this.plugin),
		]);
		this.registerEvent(
			this.plugin.app.metadataCache.on("resolved", () =>
				this.reRenderFormulas()
			)
		);
	}

	postProcessor?: MarkdownPostProcessor;

	registerMarkdownPostProcessor(): void {
		if (!this.plugin.getSettings().inlineCodeSyntax) return;

		this.postProcessor = createFormulaRendererPostProcessor(this.plugin);
		this.plugin.registerMarkdownPostProcessor(this.postProcessor);
	}

	registerMarkdownCodeBlockProcessor(): void {
		if (!this.plugin.getSettings().codeBlockLanguage) return;

		this.plugin.registerMarkdownCodeBlockProcessor(
			...createFormulaRendererCodeblockProcessor(this.plugin)
		);
	}

	reRenderFormulas(): void {
		this.renderers.forEach((renderer) => {
			renderer.render();
		});
	}
}
