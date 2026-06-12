import {
	EditorView,
	ViewPlugin,
	DecorationSet,
	ViewUpdate,
	Decoration,
} from "@codemirror/view";
import { ValueComponent, setIcon, setTooltip } from "obsidian";
import { FormulaForge } from "~/Plugin";
import { createFormulaSyntaxHighlighting } from "~/utils/codemirror";
import { validateFormula } from "~/utils/obsidian";

/**
 * A textarea-like formula editor with syntax highlighting and validation
 */
export class FormulaEditor extends ValueComponent<string> {
	editor: EditorView;
	editorContainerEl: HTMLElement;
	editorEl: HTMLElement;
	statusEl: HTMLElement;

	constructor(public plugin: FormulaForge, public containerEl: HTMLElement) {
		super();

		this.editorContainerEl = containerEl.createDiv({
			cls: "formula-editor-container formula-forge--formula-editor-container",
		});
		this.editorEl = this.editorContainerEl.createDiv({
			cls: "formula-editor formula-forge--formula-editor",
		});
		this.statusEl = this.editorContainerEl.createDiv({
			cls: "formula-editor-status",
		});

		const setStatus = this.setStatus.bind(this);
		const onChangeCallback: typeof this.onChangeCallback = (v) => {
			this.onChangeCallback(v);
		};
		const setValue = (v: string) => {
			this.value = v;
		};

		this.editor = new EditorView({
			doc: "",
			parent: this.editorEl,
			extensions: [
				EditorView.lineWrapping,
				ViewPlugin.fromClass(
					class {
						decorations: DecorationSet;
						view: EditorView;

						constructor(view: EditorView) {
							this.decorations = this.buildDecorations(view);
							this.view = view;
						}

						update(update: ViewUpdate) {
							const v = update.view.state.doc.toString();
							const { success, error } = validateFormula(plugin, v);
							setStatus(success, error);
							if (success) {
								setValue(v);
								onChangeCallback(v);
							}
							const isChanged =
								update.docChanged ||
								update.selectionSet ||
								update.viewportChanged;
							if (!isChanged) return;
							this.decorations = this.buildDecorations(update.view);
						}

						buildDecorations(view: EditorView) {
							const decos = createFormulaSyntaxHighlighting(
								view.state.doc.toString(),
								0
							);
							return Decoration.set(decos);
						}
					},
					{
						decorations: (v) => v.decorations,
					}
				),
			],
		});
	}

	private value: string = "";

	getValue(): string {
		return this.value;
	}
	setValue(value: string): this {
		this.editor.dispatch({
			changes: {
				from: 0,
				to: this.editor.state.doc.length,
				insert: value,
			},
		});
		this.value = value;
		return this;
	}

	private onChangeCallback: (value: string) => unknown = () => {};
	onChange(cb: (value: string) => unknown): this {
		this.onChangeCallback = cb;
		return this;
	}

	setStatus(isValid: boolean, error?: string): void {
		this.statusEl.empty();
		this.statusEl.classList[isValid ? "remove" : "add"]("mod-error");
		const iconEl = this.statusEl.createDiv({
			cls: "status-icon",
		});
		setIcon(iconEl, isValid ? "lucide-circle-check" : "lucide-x-circle");
		const msgEl = this.statusEl.createSpan({
			text: isValid ? "Valid formula" : "Invalid formula",
		});
		setTooltip(msgEl, error ?? "");
	}
}
