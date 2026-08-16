import { MarkdownPostProcessor, MarkdownRenderChild } from "obsidian";
import { FormulaRenderer } from "./renderer";
import { RendererManager } from "~~/features/live-formulas/RendererManager";

/**
 * Creates the markdown-post-processor for rendering inline formulas in reading mode
 */
export const createFormulaRendererPostProcessor = (
	manager: RendererManager
): MarkdownPostProcessor => {
	const { plugin } = manager;
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

		const renderer = new FormulaRenderer(
			manager,
			containerEl,
			formula,
			containingFile
		);

		component.register(() => {
			renderer.delete();
		});
	};
	return processor;
};
