import {
	Menu,
	Modal,
	parseYaml,
	PluginSettingTab,
	setIcon,
	SettingGroup,
	stringifyYaml,
	TextAreaComponent,
} from "obsidian";
import { ConfirmationModal } from "~/common/ConfirmationModal";
import { ReorderSettingGroup } from "~/common/ReorderSettingGroup";
import { FormulaForge } from "~/Plugin";
import { FormulaForgeSettings, formulaForgeSettingsSchema } from "./schema";
import { arrayMove, syncTryCatch } from "~/utils";
import { t } from "~/i18n";
import * as v from "valibot";
import "./index.css";

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
					.setTooltip(t("settings.customFunctions.addTooltip"));

				button.extraSettingsEl.addEventListener("click", (e) => {
					new Menu()
						.addItem((item) => {
							item
								.setTitle("Create new")
								.setIcon("lucide-edit")
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
						})
						.addItem((item) => {
							item
								.setTitle("Import YAML")
								.setIcon("lucide-import")
								.onClick(() => {
									const modal = new ConfirmationModal(plugin.app);

									modal.setTitle("Import custom function as YAML");

									modal.onOpen = () => {
										const textarea = new TextAreaComponent(modal.contentEl);

										const validationEl = modal.contentEl.createDiv({
											cls: "formula-forge--valibort-errors-container",
										});
										const validationIconEl = validationEl.createDiv({
											cls: "status-icon",
										});
										const validationLabelEl = validationEl.createSpan();

										// const validate = (): boolean => {
										// 	const formula = textarea.getValue();
										// 	const instance = plugin.api.createFormula(formula);
										// 	const isValid = instance.formula.type !== "invalid";
										// 	validationEl.classList[isValid ? "remove" : "add"]("mod-error");
										// 	const msg =
										// 		// TODO can I get TS to infer this from isValid somehow?
										// 		instance.formula.type !== "invalid"
										// 			? ""
										// 			: instance.formula.getErrorMessage();
										// 	setTooltip(validationEl, msg);
										// 	setIcon(validationIconEl, isValid ? "lucide-check-circle" : "lucide-x-circle");
										// 	validationLabelEl.textContent = isValid ? "Valid formula" : "Invalid formula";
										// 	return isValid;
										// };

										modal.addFooterButton((button) => {
											const schema =
												formulaForgeSettingsSchema.wrapped.entries
													.customFunctions.wrapped.item;
											let functionDefinition: v.InferOutput<
												typeof schema
											> | null = null;

											button.setButtonText("Save").onClick(() => {
												if (!functionDefinition) return;

												void (async () => {
													if (!functionDefinition) return;
													await plugin.updateSettings((prev) => {
														if (!functionDefinition) return prev;
														return {
															...prev,
															customFunctions: [
																...prev.customFunctions,
																functionDefinition,
															],
														};
													});
													modal.close();
													this.display();
												})();
											});

											const tryParse = (str: string) =>
												syncTryCatch(() => {
													const yaml = parseYaml(str);

													const parsed = v.safeParse(schema, yaml);
													if (!parsed.success) {
														throw new Error(v.summarize(parsed.issues));
													}
													return parsed.output;
												});

											textarea.onChange((v) => {
												const result = tryParse(v);
												functionDefinition = result.success
													? result.data
													: null;
												button.setDisabled(!result.success);
												validationEl.classList[
													result.success ? "remove" : "add"
												]("mod-error");
												setIcon(
													validationIconEl,
													result.success
														? "lucide-check-circle"
														: "lucide-x-circle"
												);
												validationLabelEl.textContent = result.success
													? "Valid function definition"
													: result.error;
												validationEl.setText(
													result.success
														? "Valid function definition"
														: result.error
												);
											});
										});
									};
									modal.open();
								});
						})
						.showAtMouseEvent(e);
				});

				// .onClick(() => {
				// 	const modal = new CustomFunctionModal(plugin, {
				// 		name: "",
				// 		description: "",
				// 		parameters: [],
				// 		formula: "",
				// 	});
				// 	modal
				// 		.onSave(() => {
				// 			void (async () => {
				// 				await plugin.updateSettings((prev) => ({
				// 					...prev,
				// 					customFunctions: [
				// 						...prev.customFunctions,
				// 						modal.customFunction,
				// 					],
				// 				}));
				// 				this.display();
				// 			})();
				// 		})
				// 		.open();
				// });
			});

		settings.customFunctions.forEach((globalFormula, index) => {
			customFunctionsGroup.addSetting((s) => {
				s.setName(globalFormula.name)
					.setDesc(globalFormula.description)
					.addExtraButton((button) => {
						button.setIcon("lucide-more-horizontal");
						button.extraSettingsEl.addEventListener("click", (e) => {
							new Menu()
								.addItem((item) => {
									item
										.setTitle("Edit")
										.setIcon("lucide-edit")
										.onClick(() => {
											const modal = new CustomFunctionModal(plugin, {
												...globalFormula,
											});
											modal
												.onSave(() => {
													void (async () => {
														await plugin.updateSettings((prev) => {
															const copy = { ...prev };
															copy.customFunctions[index] =
																modal.customFunction;
															return copy;
														});
														this.display();
													})();
												})
												.open();
										});
								})
								.addItem((item) => {
									item
										.setTitle("Copy YAML")
										.setIcon("lucide-copy")
										.onClick(async () => {
											const yaml = stringifyYaml(globalFormula);
											await navigator.clipboard.writeText(yaml);
											new window.Notice("Copied function as YAML");
										});
								})
								.addItem((item) => {
									item
										.setTitle("Delete")
										.setIcon("trash")
										.setWarning(true)
										.onClick(() => {
											const modal = new ConfirmationModal(plugin.app);
											modal
												.setTitle(
													t("settings.customFunctions.deleteModal.title")
												)
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
																copy.customFunctions =
																	copy.customFunctions.filter(
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
								})
								.showAtMouseEvent(e);
						});
					});
				// .addButton((button) => {
				// 	button.setButtonText(t("common.edit")).onClick(() => {
				// 		const modal = new CustomFunctionModal(plugin, {
				// 			...globalFormula,
				// 		});
				// 		modal
				// 			.onSave(() => {
				// 				void (async () => {
				// 					await plugin.updateSettings((prev) => {
				// 						const copy = { ...prev };
				// 						copy.customFunctions[index] = modal.customFunction;
				// 						return copy;
				// 					});
				// 					this.display();
				// 				})();
				// 			})
				// 			.open();
				// 	});
				// })
				// .addExtraButton((button) => {
				// 	button
				// 		.setTooltip(t("common.delete"))
				// 		.setIcon("lucide-x")
				// 		.onClick(() => {
				// 			const modal = new ConfirmationModal(plugin.app);
				// 			modal
				// 				.setTitle(t("settings.customFunctions.deleteModal.title"))
				// 				.setContent(
				// 					t("settings.customFunctions.deleteModal.warning", {
				// 						name: globalFormula.name,
				// 					})
				// 				)
				// 				.addFooterButton((button) => {
				// 					button
				// 						.setButtonText(t("common.delete"))
				// 						.setWarning()
				// 						.onClick(async () => {
				// 							await plugin.updateSettings((prev) => {
				// 								const copy = { ...prev };
				// 								copy.customFunctions = copy.customFunctions.filter(
				// 									(_, i) => i !== index
				// 								);
				// 								return copy;
				// 							});
				// 							this.display();
				// 							modal.close();
				// 						});
				// 				})
				// 				.open();
				// 		});
				// });
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
