import {
	StringValue,
	HTMLValue,
	MarkdownRenderChild,
	MarkdownRenderer,
} from "obsidian";
import { FormulaForge } from "~/plugin";

export const md = (plugin: FormulaForge) => {
	plugin.registerGlobalFunc({
		name: "md",
		ctx: null,
		docString: () =>
			"Converts a markdown string into a code snippet that renders as HTML.",
		params: [
			{
				name: "input",
				type: [StringValue],
			},
		],
		applyWithContext: (ctx, input) => {
			const value = new HTMLValue(input.data);

			value.renderTo = (el) => {
				const mdrc = new MarkdownRenderChild(el);
				const markdownContainerEl = el.createDiv({
					cls: "formula-forge--formula-md-rendered",
				});
				void MarkdownRenderer.render(
					plugin.app,
					value.data,
					markdownContainerEl,
					ctx.file.path,
					mdrc
				);
			};

			return value;
		},
	});
};
