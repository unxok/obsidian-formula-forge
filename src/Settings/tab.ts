import { Modal, PluginSettingTab, SettingGroup } from "obsidian";
import { ConfirmationModal } from "~/common/ConfirmationModal";
import { ReorderSettingGroup } from "~/common/ReorderSettingGroup";
import { FormulaForge } from "~/Plugin";
import { FormulaForgeSettings } from "./schema";
import { arrayMove } from "~/utils";
import { t } from "~/i18n";

export class FormulaForgeSettingTab extends PluginSettingTab {
	constructor(public plugin: FormulaForge) {
		super(plugin.app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		const { containerEl, plugin } = this;

		const settings = plugin.getSettings();

		new SettingGroup(containerEl)
			.setHeading(t("settings.formulaRendering.groupHeading"))
			.addSetting((s) => {
				s.setName(t("settings.formulaRendering.inlineCodeSyntax.name"))
					.setDesc(t("settings.formulaRendering.inlineCodeSyntax.desc"))
					.addText((text) => {
						text.setValue(settings.inlineCodeSyntax).onChange((v) => {
							void plugin.updateSettings((prev) => ({
								...prev,
								inlineCodeSyntax: v,
							}));
						});
					});
			})
			.addSetting((s) => {
				s.setName(t("settings.formulaRendering.codeBlockLanguage.name"))
					.setDesc(t("settings.formulaRendering.codeBlockLanguage.desc"))
					.addText((text) => {
						text.setValue(settings.codeBlockLanguage).onChange((v) => {
							void plugin.updateSettings((prev) => ({
								...prev,
								codeBlockLanguage: v,
							}));
						});
					});
			});

		const globalFormulasGroup = new ReorderSettingGroup(containerEl).onReorder(
			(from, to) => {
				void (async () => {
					await plugin.updateSettings((prev) => {
						const copy = { ...prev };
						copy.globalFormulas = arrayMove(copy.globalFormulas, from, to);
						return copy;
					});
					this.display();
				})();
			}
		);

		globalFormulasGroup
			.setHeading(t("settings.globalFormulas.groupheading"))
			.addExtraButton((button) => {
				button
					.setIcon("lucide-plus-circle")
					.setTooltip(t("settings.globalFormulas.addTooltip"))
					.onClick(() => {
						const modal = new GlobalFormulaModal(plugin, {
							name: "",
							description: "",
							formula: "",
						});
						modal
							.onSave(() => {
								void (async () => {
									await plugin.updateSettings((prev) => ({
										...prev,
										globalFormulas: [
											...prev.globalFormulas,
											modal.globalFormula,
										],
									}));
									this.display();
								})();
							})
							.open();
					});
			});

		settings.globalFormulas.forEach((globalFormula, index) => {
			globalFormulasGroup.addSetting((s) => {
				s.setName(globalFormula.name)
					.setDesc(
						window.createFragment((el) => {
							if (globalFormula.description) {
								el.appendText(globalFormula.description);
								el.createEl("br");
								el.createEl("br");
							}
							el.appendText(globalFormula.formula);
						})
					)

					.addButton((button) => {
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
					})
					.addExtraButton((button) => {
						button
							.setTooltip(t("common.delete"))
							.setIcon("lucide-x")
							.onClick(() => {
								const modal = new ConfirmationModal(plugin.app);
								modal
									.setTitle(t("settings.globalFormulas.deleteModal.title"))
									.setContent(
										t("settings.globalFormulas.deleteModal.warning", {
											name: globalFormula.name,
										})
									)
									.addFooterButton((button) => {
										button
											.setButtonText(t("common.delete"))
											.setWarning()
											.onClick(async () => {
													await plugin.updateSettings((prev) => {
														const copy = { ...prev };
														copy.globalFormulas = copy.globalFormulas.filter(
															(_, i) => i !== index
														);
														return copy;
													});
													this.display();
												modal.close();
											});
									})
									.open();
							});
					});
			});
		});

		const customFunctionsGroup = new ReorderSettingGroup(containerEl).onReorder(
			(from, to) => {
				void (async () => {
					await plugin.updateSettings((prev) => {
						const copy = { ...prev };
						copy.customFunctions = arrayMove(copy.customFunctions, from, to);
						return copy;
					});
					this.display();
				})();
			}
		);

		customFunctionsGroup
			.setHeading(t("settings.customFunctions.groupheading"))
			.addExtraButton((button) => {
				button
					.setIcon("lucide-plus-circle")
					.setTooltip(t("settings.customFunctions.addTooltip"))
					.onClick(() => {
						const modal = new CustomFunctionModal(plugin, {
							name: "",
							description: "",
							parameters: [],
							formula: "",
						});
						modal
							.onSave(() => {
								void (async () => {
									await plugin.updateSettings((prev) => ({
										...prev,
										customFunctions: [
											...prev.customFunctions,
											modal.customFunction,
										],
									}));
									this.display();
								})();
							})
							.open();
					});
			});

		settings.customFunctions.forEach((globalFormula, index) => {
			customFunctionsGroup.addSetting((s) => {
				s.setName(globalFormula.name)
					.setDesc(
						window.createFragment((el) => {
							if (globalFormula.description) {
								el.appendText(globalFormula.description);
								el.createEl("br");
								el.createEl("br");
							}
							if (globalFormula.parameters) {
								el.appendText("parameters:");
								const ul = el.createEl("ul");
								globalFormula.parameters.forEach(({ name, type }) => {
									ul.createEl("li", { text: `${name} - ${type}` });
								});
								el.createEl("br");
								// el.createEl("br");
							}
							el.appendText("formula: " + globalFormula.formula);
						})
					)

					.addButton((button) => {
						button.setButtonText(t("common.edit")).onClick(() => {
							const modal = new CustomFunctionModal(plugin, {
								...globalFormula,
							});
							modal
								.onSave(() => {
									void (async () => {
										await plugin.updateSettings((prev) => {
											const copy = { ...prev };
											copy.customFunctions[index] = modal.customFunction;
											return copy;
										});
										this.display();
									})();
								})
								.open();
						});
					})
					.addExtraButton((button) => {
						button
							.setTooltip(t("common.delete"))
							.setIcon("lucide-x")
							.onClick(() => {
								const modal = new ConfirmationModal(plugin.app);
								modal
									.setTitle(t("settings.customFunctions.deleteModal.title"))
									.setContent(
										t("settings.customFunctions.deleteModal.warning", {
											name: globalFormula.name,
										})
									)
									.addFooterButton((button) => {
										button
											.setButtonText(t("common.delete"))
											.setWarning()
											.onClick(async () => {
													await plugin.updateSettings((prev) => {
														const copy = { ...prev };
														copy.customFunctions = copy.customFunctions.filter(
															(_, i) => i !== index
														);
														return copy;
													});
													this.display();
												modal.close();
											});
									})
									.open();
							});
					});
			});
		});
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

class CustomFunctionModal extends ConfirmationModal {
	constructor(
		public plugin: FormulaForge,
		public customFunction: FormulaForgeSettings["customFunctions"][number]
	) {
		super(plugin.app);
	}

	onSaveCallback: () => void = () => {};
	onSave(cb: () => void): this {
		this.onSaveCallback = cb;
		return this;
	}

	onOpen(): void {
		const { contentEl, customFunction: globalFormula } = this;
		this.setTitle(t("settings.customFunctions.editorModal.title"));

		const reRender = () => {
			contentEl.empty();
		new SettingGroup(contentEl)
			.addSetting((s) => {
				s.setName(t("settings.customFunctions.editorModal.name.name"))
					.setDesc(t("settings.customFunctions.editorModal.name.desc"))
					.addText((text) => {
						text.setValue(globalFormula.name).onChange((v) => {
							globalFormula.name = v;
						});
					});
			})
			.addSetting((s) => {
				s.setName(t("settings.customFunctions.editorModal.description.name"))
					.setDesc(t("settings.customFunctions.editorModal.description.desc"))
					.addTextArea((text) => {
						text.setValue(globalFormula.description).onChange((v) => {
							globalFormula.description = v;
						});
					});
			})
			.addSetting((s) => {
				s.setName(t("settings.customFunctions.editorModal.parameters.name"))
					.setDesc(
						window.createFragment((el) => {
							const ul = el.createEl("ul");
							this.customFunction.parameters.forEach(({ name, type }) => {
								ul.createEl("li", { text: `${name} - ${type}` });
							});
						})
					)
					.addButton((button) => {
						button.setButtonText(t("common.edit")).onClick(() => {
							const modal = new Modal(this.plugin.app);

							modal.onOpen = () => {
								modal.contentEl.empty();
								modal.setTitle(
									t(
										"settings.customFunctions.editorModal.parameters.editorModal.title"
									)
								);

								const group = new ReorderSettingGroup(modal.contentEl)
									.setHeading(
										t(
											"settings.customFunctions.editorModal.parameters.editorModal.heading"
										)
									)
									.addExtraButton((button) => {
										button
											.setTooltip(
												t(
													"settings.customFunctions.editorModal.parameters.editorModal.addTooltip"
												)
											)
											.setIcon("lucide-plus-circle")
											.onClick(() => {
												this.customFunction.parameters.push({
													name: "",
													type: "Any",
												});
												modal.onOpen();
											});
									})
									.onReorder((from, to) => {
										this.customFunction.parameters = arrayMove(
											this.customFunction.parameters,
											from,
											to
										);
										modal.onOpen();
									});

								this.customFunction.parameters.forEach((param, i) => {
									group.addSetting((s) => {
										s.addText((text) => {
											text
												.setPlaceholder(
													t(
														"settings.customFunctions.editorModal.parameters.editorModal.namePlaceholder"
													)
												)
												.setValue(param.name)
												.onChange((v) => {
													param.name = v;
												});
										})
											.addDropdown((dropdown) => {
												type T =
													FormulaForgeSettings["customFunctions"][number]["parameters"][number]["type"];
												dropdown
													.addOptions({
														Any: "Any",
														Boolean: "Boolean",
														Date: "Date",
														File: "File",
														Link: "Link",
														List: "List",
														Number: "Number",
														Object: "Object",
														Regexp: "Regexp",
														String: "String",
													} satisfies Record<T, T>)
													.setValue(param.type)
													.onChange((v) => {
														param.type = v as typeof param.type;
													});
											})
											.addExtraButton((button) => {
												button.setIcon("lucide-x").onClick(() => {
													this.customFunction.parameters =
														this.customFunction.parameters.filter((_, i2) => {
															return i !== i2;
														});
													modal.onOpen();
												});
											});
									});
								});
							};

							modal.onClose = () => {
									reRender();
							};

							modal.open();
						});
					});
			})
			.addSetting((s) => {
				s.setName(t("settings.customFunctions.editorModal.formula.name"))
					.setDesc(
						window.createFragment((el) => {
							el.createEl("a", {
								text: t("settings.customFunctions.editorModal.formula.desc"),
								href: "https://obsidian.md/help/formulas",
							});
						})
					)
					.addTextArea((text) => {
						text
							.setPlaceholder(
								t("settings.customFunctions.editorModal.formula.placeholder")
							)
							.setValue(globalFormula.formula)
							.onChange((v) => {
								globalFormula.formula = v;
							});
					});
			});
		};

		reRender();

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
