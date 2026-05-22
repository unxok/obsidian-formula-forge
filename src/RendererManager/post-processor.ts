import { MarkdownPostProcessor, MarkdownRenderChild } from "obsidian";
import { initInlineFormulaRenderer } from "./renderer";
import { FormulaForge } from "~/Plugin";

/**
 * Creates the markdown-post-processor for rendering inline formulas in reading mode
 */
export const createFormulaRendererPostProcessor = (
	plugin: FormulaForge
): MarkdownPostProcessor => {
	const processor: MarkdownPostProcessor = (el, ctx) => {
		const { inlineCodeSyntax } = plugin.getSettings();

		if (el.tagName.toLowerCase() !== "code") {
			el.findAll("code").forEach((codeEl) => {
				void processor(codeEl, ctx);
			});
			return;
		}

		if (!el.textContent.startsWith(inlineCodeSyntax)) {
			return;
		}

		const formula = el.textContent.slice(inlineCodeSyntax.length);

		const containingFile =
			plugin.app.vault.getFileByPath(ctx.sourcePath) ?? undefined;
		if (!containingFile) return;

		const containerEl = window.createSpan();
		el.replaceWith(containerEl);
		const component = new MarkdownRenderChild(containerEl);
		ctx.addChild(component);

		const renderer = initInlineFormulaRenderer({
			plugin,
			containingFile,
			containerEl,
			formula,
		});

		component.register(() => {
			plugin.rendererManager.renderers.delete(renderer);
		});
	};
	return processor;
};
