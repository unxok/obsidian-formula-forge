import {
	Decoration,
	EditorView,
	ViewPlugin,
	WidgetType,
	ViewUpdate,
	DecorationSet,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { EditorSelection, Range } from "@codemirror/state";
import { editorInfoField, editorLivePreviewField, TFile } from "obsidian";
import { initInlineFormulaRenderer } from "./renderer";
import { FormulaForge } from "~/Plugin";
import { SyntaxNode, SyntaxNodeRef } from "@lezer/common";
import { createFormulaSyntaxHighlighting } from "~/utils/codemirror";

/**
 * Creates the CM6 plugin for rendering property links
 */
export const createInlineFormulaRendererPlugin = (plugin: FormulaForge) => {
	const inlineCodePlugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			view: EditorView;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
				this.view = view;
			}

			update(update: ViewUpdate) {
				if (!update.state.field(editorLivePreviewField)) {
					this.decorations = Decoration.none;
					return;
				}
				if (
					!(update.docChanged || update.selectionSet || update.viewportChanged)
				)
					return;
				this.decorations = this.buildDecorations(update.view);
			}

			buildDecorations(view: EditorView) {
				this.decorations = Decoration.set([]);
				const decorations: Range<Decoration>[] = [];
				let widgets: Range<Decoration>[] = [];
				const tree = syntaxTree(view.state);

				// traverse the document and find internal links
				for (const { from, to } of view.visibleRanges)
					tree.iterate({
						from,
						to,
						enter: (node) => {
							const names = node.name.split("_");

							if (names.includes("formatting-code-block")) {
								const decos = handleCodeblock(plugin, view, node);
								// formula codeblock was found and highlights were created
								if (decos) {
									decorations.push(...decos);
									return;
								}
							}

							const { inlineCodeSyntax } = plugin.getSettings();
							if (!inlineCodeSyntax) return;

							const text = view.state.doc.sliceString(node.from, node.to);
							if (!text.startsWith(inlineCodeSyntax)) return;

							const formula = text.slice(inlineCodeSyntax.length);
							if (!formula) return;

							const prev = node.node.prevSibling;
							const next = node.node.nextSibling;

							if (!prev || !next) return;

							const containingFile = view.state.field(editorInfoField).file;
							if (!containingFile) return;

							const selOverlap = selectionAndRangeOverlap(
								view.state.selection,
								prev.from,
								next.to
							);

							if (selOverlap) {
								// cursor or selection overlaps the inline code

								// apply syntax highlighting
								const offset = node.from + inlineCodeSyntax.length;
								decorations.push(
									...createFormulaSyntaxHighlighting(formula, offset)
								);
								return;
							}

							// render formula in place of inline code
							let widget = Decoration.replace({
								widget: new InlineFormulaRendererWidget(
									formula,
									plugin,
									containingFile,
									view
								),
							}).range(prev.from, next.to);
							widgets.push(widget);
						},
					});

				return Decoration.set(
					[...widgets, ...decorations].toSorted((a, b) => a.from - b.from)
				);
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
	return inlineCodePlugin;
};

/**
 * The CM6 widget for handling the rendering of property links
 */
class InlineFormulaRendererWidget extends WidgetType {
	constructor(
		private formula: string,
		private plugin: FormulaForge,
		private containingFile: TFile,
		private view: EditorView
	) {
		super();
	}

	toDOM(): HTMLElement {
		const { plugin, containingFile, formula } = this;

		const containerEl = window.createSpan();

		const renderer = initInlineFormulaRenderer({
			plugin,
			containerEl,
			formula,
			containingFile,
		});

		this.destroy = (dom) => {
			dom.remove();
			plugin.rendererManager.renderers.delete(renderer);
		};

		return containerEl;
	}

	ignoreEvent(event: MouseEvent | Event): boolean {
		// instanceof check does not work in pop-out windows, so check it like this
		if (event.type !== "mousedown") return true;
		const e = event as MouseEvent;
		const currentPos = this.view.posAtCoords({
			x: e.x,
			y: e.y,
		});
		if (e.shiftKey) {
			// set the cursor after the element so that it doesn't select starting from the last cursor position.
			if (currentPos) {
				const { editor } = this.view.state.field(editorInfoField);
				if (editor) {
					editor.setCursor(editor.offsetToPos(currentPos));
				}
			}
			return false;
		}

		return true;
	}

	eq(widget: InlineFormulaRendererWidget): boolean {
		return widget.formula === this.formula;
	}
}

/**
 * Check if cursor selection overlaps with a range
 */
const selectionAndRangeOverlap = (
	selection: EditorSelection,
	rangeFrom: number,
	rangeTo: number
) => {
	for (const range of selection.ranges) {
		return range.from <= rangeTo && range.to >= rangeFrom;
	}

	return false;
};

/**
 *
 * @param plugin The FormulaForge plugin instance
 * @param view The EditorView containing the node
 * @param node The node corresponding to the beginning of the codeblock formatting
 * @returns
 */
const handleCodeblock = (
	plugin: FormulaForge,
	view: EditorView,
	node: SyntaxNodeRef
): Range<Decoration>[] | void => {
	const { codeBlockLanguage } = plugin.getSettings();
	if (!codeBlockLanguage) return;
	const heading = view.state.doc.sliceString(node.from, node.to);
	const isFormula = heading === "```" + codeBlockLanguage;
	if (!isFormula) return;
	const endingNode = getCodeblockEnd(node.node);
	if (!endingNode) return;
	const formula = view.state.doc.sliceString(node.to, endingNode.from);
	const offset = node.to;
	return createFormulaSyntaxHighlighting(formula, offset);
};

/**
 * Finds the node which marks the end of the codeblock formatting
 * @param node The node corresponding to the beginning of the codeblock formatting
 * @returns
 */
const getCodeblockEnd = (node: SyntaxNode): SyntaxNode | undefined => {
	const { nextSibling } = node;
	if (!nextSibling) return undefined;
	const names = nextSibling.name.split("_");
	if (names.includes("HyperMD-codeblock-end")) {
		return nextSibling;
	}
	return getCodeblockEnd(nextSibling);
};
