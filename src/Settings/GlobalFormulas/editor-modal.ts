import { Modal, SettingGroup } from "obsidian";
import { t } from "~/i18n";
import { FormulaForge } from "~/Plugin";
import { validateSetting, validateFormula } from "~/utils/obsidian";
import {
	GlobalFormula,
	validateDuplicateFormulaName,
	validateNotEmpty,
} from "./utils";

export class GlobalFormulaEditorModal extends Modal {
	original: GlobalFormula;
	constructor(
		public plugin: FormulaForge,
		public globalFormula: GlobalFormula
	) {
		super(plugin.app);
		this.original = { ...globalFormula };
	}

	onOpen(): void | Promise<void> {
		const { contentEl, globalFormula } = this;
		this.setTitle(t("settings.globalFormulas.editorModal.title"));

		new SettingGroup(contentEl)
			.addSetting((s) => {
				const validate = validateSetting(s);
				s.setName(t("settings.globalFormulas.editorModal.name.name"));
				s.setDesc(t("settings.globalFormulas.editorModal.name.desc"));
				s.addText((text) => {
					text.setValue(globalFormula.name);
					text.onChange((v) => {
						const isValid = validate([
							validateDuplicateFormulaName(this.plugin, v),
							validateNotEmpty(v),
						]);

						if (v !== this.original.name && !isValid) {
							globalFormula.name = this.original.name;
							return;
						}

						globalFormula.name = v;
					});
				});
			})
			.addSetting((s) => {
				s.setName(t("settings.globalFormulas.editorModal.description.name"));
				s.setDesc(t("settings.globalFormulas.editorModal.description.desc"));
				s.addTextArea((text) => {
					text.setValue(globalFormula.description);
					text.onChange((v) => {
						globalFormula.description = v;
					});
				});
			})
			.addSetting((s) => {
				const validate = validateSetting(s);
				s.setName(t("settings.globalFormulas.editorModal.formula.name"));
				s.setDesc(
					window.createFragment((el) => {
						el.createEl("a", {
							text: t("settings.globalFormulas.editorModal.formula.desc"),
							href: "https://obsidian.md/help/formulas",
						});
					})
				);
				s.addTextArea((text) => {
					text.setPlaceholder(
						t("settings.globalFormulas.editorModal.formula.placeholder")
					);
					text.setValue(globalFormula.formula);
					text.onChange((v) => {
						const isValid = validate([validateFormula(this.plugin, v)]);

						if (!isValid) {
							globalFormula.formula = this.original.formula;
							return;
						}

						globalFormula.formula = v;
					});
				});
			});
	}
}
