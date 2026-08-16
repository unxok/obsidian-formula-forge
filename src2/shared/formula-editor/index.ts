import { EditorView, tooltips } from "@codemirror/view";
import { ValueComponent, setIcon, setTooltip } from "obsidian";
import { FormulaForge } from "~~/plugin";
import { validateFormula } from "~~/shared/obsidian";
import "./index.css";
import { Compartment } from "@codemirror/state";

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
		const onFocusChangeCallback: typeof this.onFocusChangeCallback = (f, v) => {
			this.onFocusChangeCallback(f, v);
		};
		const setValue = (v: string) => {
			this.value = v;
		};

		const languageSupport = plugin.basesAdapter.getFormulaLanguageSupport();

		const compartment = new Compartment();

		this.editor = new EditorView({
			doc: "",
			parent: this.editorEl,
			extensions: [
				languageSupport,
				compartment.of(
					tooltips({
						parent: containerEl.doc.body,
					})
				),
				EditorView.lineWrapping,
				EditorView.updateListener.of((update) => {
					const v = update.view.state.doc.toString();
					const { success, error } = validateFormula(plugin, v);
					setStatus(success, error);
					if (success) {
						setValue(v);
						onChangeCallback(v);
					}
				}),
				EditorView.focusChangeEffect.of((state, focusing) => {
					const value = state.doc.toString();
					onFocusChangeCallback(focusing, value);
					return null;
				}),
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

	private onFocusChangeCallback: (focusing: boolean, value: string) => unknown =
		() => {};
	onFocusChange(cb: (focusing: boolean, value: string) => unknown) {
		this.onFocusChangeCallback = cb;
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
