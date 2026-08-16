import { Component, MarkdownPostProcessor } from "obsidian";
import { FormulaForge } from "~/Plugin";
import { FormulaRenderer } from "./renderer";
import "./index.css";
import { createFormulaRendererCodeblockProcessor } from "./codeblock-processor";
import { createFormulaRendererPostProcessor } from "./post-processor";
import {
	createFormulaSyntaxHighlightingPlugin,
	createInlineFormulaRendererPlugin,
	// withinFormulaEditorField,
} from "./view-plugin";
import { tooltips } from "@codemirror/view";
import { Compartment } from "@codemirror/state";
import { CompletionSource } from "@codemirror/autocomplete";
import { formulaInfoField } from "~/RendererManager/formula-info";

export class RendererManager extends Component {
	renderers: Set<FormulaRenderer> = new Set();

	// might be useful later
	// this.app.workspace.trigger("post-processor-change"),

	constructor(public plugin: FormulaForge) {
		super();
	}

	onload(): void {
		// support[1] - syntax highlighting
		// support[0,2] - autocomplete

		const compartment = new Compartment();

		// const { support, language } =
		// 	this.plugin.prototypeResolver.getFormulaLanguageSupport();

		const { support, language } =
			this.plugin.basesAdapter.getFormulaLanguageSupport();

		const autocompleteExtensions = Array.isArray(support)
			? [language, support[0], support[2]]
			: [];

		const supportValue = Array.isArray(support)
			? (
					support[2] as {
						value: {
							autocomplete: CompletionSource;
						};
					}
			  ).value
			: undefined;

		const originalAutocomplete = supportValue!.autocomplete;

		supportValue!.autocomplete = (ctx) => {
			const info = ctx.state.field(formulaInfoField, false);
			if (!info?.isWithin) {
				return null;
			}

			return originalAutocomplete(ctx);

			// TODO figure out how to narrow ctx down to only formula text rather than the whole note
		};

		const tooltipCompartment = new Compartment();
		const tooltipExtension = tooltipCompartment.of(
			tooltips({
				parent: window.activeDocument.doc.body,
			})
		);

		this.registerMarkdownPostProcessor();
		this.registerMarkdownCodeBlockProcessor();
		this.plugin.registerEditorExtension([
			createInlineFormulaRendererPlugin(this.plugin),
			createFormulaSyntaxHighlightingPlugin(this.plugin),
			formulaInfoField,
			compartment.of(autocompleteExtensions),
			tooltipExtension,
			// EditorView.updateListener.of((update) => {
			// 	return;
			// 	const isWithinFormula = update.view.state.field(
			// 		withinFormulaEditorField,
			// 		false
			// 	);

			// 	console.log(isWithinFormula);

			// 	const currentExtensions = compartment.get(update.view.state);
			// 	const hasExtensions = Array.isArray(currentExtensions)
			// 		? !!currentExtensions.length
			// 		: false;

			// 	// if (isWithinFormula === hasExtensions) {
			// 	// 	return;
			// 	// }

			// 	console.log("has: ", hasExtensions);

			// 	const effect = compartment.reconfigure({
			// 		extension: isWithinFormula ? autocompleteExtensions : [],
			// 	});
			// 	// update.view.dispatch({ effects: effect });
			// }),
			// [
			// 	formulaLangSupport.language,
			// 	formulaLangSupport.support[0],
			// 	formulaLangSupport.support[2],
			// 	// formulaLangSupport.support[3],
			// ],
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
