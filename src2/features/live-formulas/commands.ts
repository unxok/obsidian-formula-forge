import {
	Command,
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	Menu,
} from "obsidian";
import { FormulaForge } from "~~/plugin";
import { ConfirmationModal } from "~~/shared/confirmation-modal";
import { FormulaEditor } from "~~/shared/formula-editor";

export default (plugin: FormulaForge): Command[] => [
	{
		id: "create-live-formula",
		name: "Create live formula",
		editorCallback: (editor, ctx) => {
			createLiveFormulaModal(plugin, editor, ctx);
		},
		callback: () => {
			createLiveFormulaModal(plugin);
		},
	},
];

const createLiveFormulaModal = (
	plugin: FormulaForge,
	editor?: Editor,
	ctx?: MarkdownView | MarkdownFileInfo
) => {
	const modal = new ConfirmationModal(plugin.app);
	modal.setTitle("Create live formula");
	const formulaEditor = new FormulaEditor(plugin, modal.contentEl);
	modal.contentEl.createEl("br");
	const outputContainerEl = modal.contentEl.createDiv();

	formulaEditor.onChange((v) => {
		outputContainerEl.empty();
		const output = plugin.basesAdapter.evaluateFormula(
			v,
			ctx?.file ?? undefined
		);
		output.renderTo(outputContainerEl, plugin.app.renderContext);
	});

	const getInlineCode = () =>
		`\`${plugin.getSettings().inlineCodeSyntax}${formulaEditor.getValue()}\``;
	const getCodeblock = () =>
		"```" +
		plugin.getSettings().codeBlockLanguage +
		"\n" +
		formulaEditor.getValue() +
		"\n```";

	modal.addFooterButton((btn) => {
		btn.setButtonText("Copy");
		btn.onClick((e) => {
			const menu = new Menu();
			menu.setNoIcon();
			menu.addItem((item) => {
				item.setTitle("Inline code");
				item.onClick(async () => {
					await navigator.clipboard.writeText(getInlineCode());
					modal.close();
				});
			});
			menu.addItem((item) => {
				item.setTitle("Codeblock");
				item.onClick(async () => {
					await navigator.clipboard.writeText(getCodeblock());
					modal.close();
				});
			});
			menu.showAtMouseEvent(e);
		});
	});

	modal.addFooterButton((btn) => {
		btn.setButtonText("Insert");
		btn.setCta();
		if (!editor) {
			btn.setDisabled(true);
			return;
		}
		btn.onClick((e) => {
			const menu = new Menu();
			menu.setNoIcon();
			menu.addItem((item) => {
				item.setTitle("Inline code");
				item.onClick(() => {
					editor.replaceSelection(getInlineCode());
					modal.close();
				});
			});
			menu.addItem((item) => {
				item.setTitle("Codeblock");
				item.onClick(() => {
					editor.replaceSelection(getCodeblock());
					modal.close();
				});
			});
			menu.showAtMouseEvent(e);
		});
	});

	modal.open();
};
