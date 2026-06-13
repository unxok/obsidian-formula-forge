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

			const info = ctx.getSectionInfo(el);
			if (!info) {
				throw new Error("Info not found for provided element");
			}
			const langLine = info.text.split("\n")[info.lineStart];
			const cssClasses = langLine
				.split(" ")
				.map((str) => str.trim())
				.filter((str, i) => {
					return i !== 0 && str;
				});

			// const containerEl = window.createSpan({ cls: cssClasses });
			// el.replaceWith(containerEl);
			const component = new MarkdownRenderChild(el);
			ctx.addChild(component);

			const renderer = initInlineFormulaRenderer({
				plugin,
				containingFile,
				containerEl: el,
				formula,
			});

			if (cssClasses) {
				renderer.containerEl.classList.add(...cssClasses);
			}

			component.register(() => {
				plugin.rendererManager.renderers.delete(renderer);
			});
		},
	];
};
