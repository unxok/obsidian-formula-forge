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
import { createFormulaSyntaxHighlighting } from "~/utils/codemirror";
import { FormulaInfo, formulaInfoEffect } from "~/RendererManager/formula-info";

export const createFormulaSyntaxHighlightingPlugin = (plugin: FormulaForge) => {
	const syntaxHighlightingPlugin = ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;
			view: EditorView;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
				this.view = view;
			}

			update(update: ViewUpdate) {
				if (
					!(update.docChanged || update.selectionSet || update.viewportChanged)
				)
					return;
				this.decorations = this.buildDecorations(update.view);
			}

			buildDecorations(view: EditorView) {
				this.decorations = Decoration.set([]);
				const decorations: Range<Decoration>[] = [];
				const tree = syntaxTree(view.state);

				let codeblockStart: number | undefined = undefined;
				let codeblockEnd: number | undefined = undefined;

				const CB_BEGIN = "HyperMD-codeblock-begin";
				const CB_END = "HyperMD-codeblock-end";
				const INLINE_CODE = "inline-code";

				const formulaInfo: FormulaInfo = { isWithin: false, from: -1, to: -1 };

				// traverse the document and find internal links
				for (const { from, to } of view.visibleRanges)
					tree.iterate({
						from,
						to,
						enter: (node) => {
							const names = node.name.split("_");

							// check for beginning of formula codeblock
							if (names.includes(CB_BEGIN)) {
								const heading = view.state.doc.sliceString(node.from, node.to);
								const isFormula =
									heading === "```" + plugin.getSettings().codeBlockLanguage;
								if (isFormula) {
									codeblockStart = node.to;
								}
							}

							// check for end of formula codeblock
							if (
								codeblockStart !== undefined &&
								codeblockEnd === undefined &&
								names.includes(CB_END)
							) {
								codeblockEnd = node.from;
								const formula = view.state.doc.sliceString(
									codeblockStart,
									codeblockEnd
								);
								const decos = createFormulaSyntaxHighlighting(
									plugin,
									formula,
									codeblockStart
								);
								decorations.push(...decos);

								const sel = view.state.selection.main;
								const isCursorWithin =
									sel.from === sel.to &&
									sel.from >= codeblockStart &&
									sel.to <= codeblockEnd;

								if (isCursorWithin) {
									formulaInfo.isWithin = isCursorWithin;
									formulaInfo.from = codeblockStart;
									formulaInfo.to = codeblockEnd;
								}
								return;
							}

							if (!names.includes(INLINE_CODE)) return;

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

							const formulaFrom = node.from;
							const formulaTo = node.to;

							const sel = view.state.selection.main;
							const isCursorWithin =
								sel.from === sel.to &&
								sel.from >= formulaFrom &&
								sel.to <= node.to;

							if (isCursorWithin) {
								formulaInfo.isWithin = isCursorWithin;
								formulaInfo.from = formulaFrom;
								formulaInfo.to = formulaTo;
							}

							// apply syntax highlighting
							const offset = node.from + inlineCodeSyntax.length;
							decorations.push(
								...createFormulaSyntaxHighlighting(plugin, formula, offset)
							);
						},
					});

				this.setWithinFormula(view, formulaInfo);

				return Decoration.set(decorations, true);
			}

			/**
			 * Dispatches `formulaInfoEffect`
			 *
			 */
			setWithinFormula(view: EditorView, info: FormulaInfo) {
				// TODO find a way to do this the "right" way without a zero timeout
				window.setTimeout(() => {
					view.dispatch({
						effects: [
							formulaInfoEffect.of({
								...info,
							}),
						],
					});
				}, 0);
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
	return syntaxHighlightingPlugin;
};

/**
 * Creates the CM6 plugin for detecting inline formula syntax
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
				let widgets: Range<Decoration>[] = [];
				const tree = syntaxTree(view.state);

				// traverse the document and find internal links
				for (const { from, to } of view.visibleRanges)
					tree.iterate({
						from,
						to,
						enter: (node) => {
							const names = node.name.split("_");

							if (!names.includes("inline-code")) return;

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

							// skip rendering because cursor is in code or selection overlaps it
							if (selOverlap) return;

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

				return Decoration.set(widgets, true);
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
	return inlineCodePlugin;
};

/**
 * The CM6 widget for handling the rendering of the inline formula's output
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

	eq(widget: this): boolean {
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
