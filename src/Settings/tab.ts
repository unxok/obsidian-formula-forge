import { PluginSettingTab, SettingGroup } from "obsidian";
import { confirm, ConfirmationModal } from "~/common/ConfirmationModal";
import { ReorderSettingGroup } from "~/common/ReorderSettingGroup";
import { FormulaForge } from "~/Plugin";
import { FormulaForgeSettings } from "./schema";
import { arrayMove } from "~/utils";
import { t } from "~/i18n";
import "./index.css";
import { CustomFunctionsSettingGroup } from "./CustomFunctions/setting-group";

export class FormulaForgeSettingTab extends PluginSettingTab {
	constructor(public plugin: FormulaForge) {
		super(plugin.app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		const { containerEl, plugin } = this;

		const settings = plugin.getSettings();

		const generalGroup = new SettingGroup(containerEl);
		generalGroup.setHeading(t("settings.formulaRendering.groupHeading"));
		generalGroup.addSetting((s) => {
			s.setName(t("settings.formulaRendering.inlineCodeSyntax.name"));
			s.setDesc(t("settings.formulaRendering.inlineCodeSyntax.desc"));
			s.addText((text) => {
				text.setValue(settings.inlineCodeSyntax);
				text.onChange((v) => {
					void plugin.updateSettings((prev) => ({
						...prev,
						inlineCodeSyntax: v,
					}));
				});
			});
		});
		generalGroup.addSetting((s) => {
			s.setName(t("settings.formulaRendering.codeBlockLanguage.name"));
			s.setDesc(t("settings.formulaRendering.codeBlockLanguage.desc"));
			s.addText((text) => {
				text.setValue(settings.codeBlockLanguage);
				text.onChange((v) => {
					void plugin.updateSettings((prev) => ({
						...prev,
						codeBlockLanguage: v,
					}));
				});
			});
		});

		const globalFormulasGroup = new ReorderSettingGroup(containerEl);
		globalFormulasGroup.onReorder((from, to) => {
			void (async () => {
				await plugin.updateSettings((prev) => {
					const copy = { ...prev };
					copy.globalFormulas = arrayMove(copy.globalFormulas, from, to);
					return copy;
				});
				this.display();
			})();
		});

		globalFormulasGroup.setHeading(t("settings.globalFormulas.groupheading"));
		globalFormulasGroup.addExtraButton((button) => {
			button.setIcon("lucide-plus-circle");
			button.setTooltip(t("settings.globalFormulas.addTooltip"));
			button.onClick(() => {
				const modal = new GlobalFormulaModal(plugin, {
					name: "",
					description: "",
					formula: "",
				});
				modal.onSave(() => {
					void (async () => {
						await plugin.updateSettings((prev) => ({
							...prev,
							globalFormulas: [...prev.globalFormulas, modal.globalFormula],
						}));
						this.display();
					})();
				});
				modal.open();
			});
		});

		settings.globalFormulas.forEach((globalFormula, index) => {
			globalFormulasGroup.addSetting((s) => {
				s.setName(globalFormula.name);
				s.setDesc(
					window.createFragment((el) => {
						if (globalFormula.description) {
							el.appendText(globalFormula.description);
							el.createEl("br");
							el.createEl("br");
						}
						el.appendText(globalFormula.formula);
					})
				);
				s.addButton((button) => {
					button.setButtonText(t("common.edit")).onClick(() => {
						const modal = new GlobalFormulaModal(plugin, {
							...globalFormula,
						});
						modal
							.onSave(() => {
								void (async () => {
									await plugin.updateSettings((prev) => {
										const copy = { ...prev };
										copy.globalFormulas[index] = modal.globalFormula;
										return copy;
									});
									this.display();
								})();
							})
							.open();
					});
				});
				s.addExtraButton((button) => {
					button.setTooltip(t("common.delete"));
					button.setIcon("lucide-x");
					button.onClick(() => {
						confirm({
							app: plugin.app,
							title: t("settings.globalFormulas.deleteModal.title"),
							desc: t("settings.globalFormulas.deleteModal.warning", {
								name: globalFormula.name,
							}),
							confirmLabel: t("common.delete"),
							onClose: async (isConfirmed) => {
								if (!isConfirmed) return;
								await plugin.updateSettings((prev) => {
									const copy = { ...prev };
									copy.globalFormulas = copy.globalFormulas.filter(
										(_, i) => i !== index
									);
									return copy;
								});
								this.display();
							},
						});
					});
				});
			});
		});

		new CustomFunctionsSettingGroup(plugin, containerEl, () => this.display());
	}
}

class GlobalFormulaModal extends ConfirmationModal {
	constructor(
		public plugin: FormulaForge,
		public globalFormula: FormulaForgeSettings["globalFormulas"][number]
	) {
		super(plugin.app);
	}

	onSaveCallback: () => void = () => {};
	onSave(cb: () => void): this {
		this.onSaveCallback = cb;
		return this;
	}

	onOpen(): void | Promise<void> {
		const { contentEl, globalFormula } = this;
		this.setTitle(t("settings.globalFormulas.editorModal.title"));

		new SettingGroup(contentEl)
			.addSetting((s) => {
				s.setName(t("settings.globalFormulas.editorModal.name.name"))
					.setDesc(t("settings.globalFormulas.editorModal.name.desc"))
					.addText((text) => {
						text.setValue(globalFormula.name).onChange((v) => {
							globalFormula.name = v;
						});
					});
			})
			.addSetting((s) => {
				s.setName(t("settings.globalFormulas.editorModal.description.name"))
					.setDesc(t("settings.globalFormulas.editorModal.description.desc"))
					.addTextArea((text) => {
						text.setValue(globalFormula.description).onChange((v) => {
							globalFormula.description = v;
						});
					});
			})
			.addSetting((s) => {
				s.setName(t("settings.globalFormulas.editorModal.formula.name"))
					.setDesc(
						window.createFragment((el) => {
							el.createEl("a", {
								text: t("settings.globalFormulas.editorModal.formula.desc"),
								href: "https://obsidian.md/help/formulas",
							});
						})
					)
					.addTextArea((text) => {
						text
							.setPlaceholder(
								t("settings.globalFormulas.editorModal.formula.placeholder")
							)
							.setValue(globalFormula.formula)
							.onChange((v) => {
								globalFormula.formula = v;
							});
					});
			});

		this.addFooterButton((button) => {
			button
				.setCta()
				.setButtonText(t("common.save"))
				.onClick(() => {
					this.onSaveCallback();
					this.close();
				});
		});
	}
}
