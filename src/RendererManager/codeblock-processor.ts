import { MarkdownRenderChild, Plugin } from "obsidian";
import { initInlineFormulaRenderer } from "./renderer";
import { FormulaForge } from "~/Plugin";

export const createFormulaRendererCodeblockProcessor = (
	plugin: FormulaForge
): Parameters<Plugin["registerMarkdownCodeBlockProcessor"]> => {
	return [
		plugin.getSettings().codeBlockLanguage,
		(formula, el, ctx) => {
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
		},
	];
};
