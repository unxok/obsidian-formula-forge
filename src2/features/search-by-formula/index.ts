import { Keymap, SuggestModal, TFile } from "obsidian";
import { Feature } from "~~/features/types";
import { FormulaForge } from "~~/plugin";
import { FormulaForgeSettingTab } from "~~/plugin/settings-tab";

export class SearchByFormula extends Feature {
	setup(plugin: FormulaForge): void {
		plugin.addCommand({
			id: "search-files-by-formula",
			name: "Search files by formula",
			callback: () => {
				const modal = new SearchByFormulaSuggestModal(plugin);
				modal.open();
			},

			// editorCallback: (_, ctx) => {
			// 	const modal = new SearchByFormulaSuggestModal(
			// 		plugin,
			// 		ctx.file ?? undefined
			// 	);
			// 	modal.open();
			// },
		});
	}

	settings(_plugin: FormulaForge, _tab: FormulaForgeSettingTab): void {}
}

class SearchByFormulaSuggestModal extends SuggestModal<TFile> {
	originalEmptyStateText: string = "";

	constructor(public plugin: FormulaForge) {
		super(plugin.app);
		this.originalEmptyStateText = this.emptyStateText;
	}

	error?: string;

	override onNoSuggestion(): void {
		this.emptyStateText = this.error ?? this.originalEmptyStateText;
		super.onNoSuggestion();
	}

	async getSuggestions(query: string): Promise<TFile[]> {
		const { plugin } = this;
		const { vault, workspace } = plugin.app;
		const recentFilePath = workspace.recentFileTracker.lastOpenFiles.find(
			(path) => {
				return vault.getFileByPath(path);
			}
		);

		// TODO can I simplify this to only call vault.getFileByPath once?
		const recentFile = recentFilePath
			? vault.getFileByPath(recentFilePath)
			: undefined;

		const currentFile = plugin.app.workspace.activeEditor?.file;

		const file = currentFile ?? recentFile;

		if (!file) {
			// at least one file is needed to be used for the context of the formula
			return [];
		}

		const result = await plugin.basesAdapter.getFilesByFormula(query, file);

		if (typeof result === "string") {
			this.error = result;
			return [];
		}

		this.error = undefined;
		return result.toArray();
	}
	renderSuggestion(value: TFile, el: HTMLElement): void {
		const contentEl = el.createDiv({ cls: "suggestion-content" });

		const title =
			value.extension.toLowerCase() === "md"
				? value.path.slice(0, -3)
				: value.path;
		contentEl.createDiv({ cls: "suggestion-title", text: title });
	}

	onChooseSuggestion(item: TFile, e: MouseEvent | KeyboardEvent): void {
		void this.plugin.app.workspace.openLinkText(
			item.path,
			"",
			Keymap.isModEvent(e)
		);
	}
}
