import {
	App,
	Menu,
	Modal,
	parseYaml,
	PluginSettingTab,
	setIcon,
	SettingGroup,
	stringifyYaml,
	TextAreaComponent,
} from "obsidian";
import { confirm, ConfirmationModal } from "~/common/ConfirmationModal";
import { ReorderSettingGroup } from "~/common/ReorderSettingGroup";
import { FormulaForge } from "~/Plugin";
import { FormulaForgeSettings, formulaForgeSettingsSchema } from "./schema";
import { arrayMove, syncTryCatch } from "~/utils";
import { t } from "~/i18n";
import * as v from "valibot";
import "./index.css";

const validateJsStyleVariable = (str: string, validationEl: HTMLDivElement) => {
	const regexp = /^[_$\p{ID_Start}][_$\p{ID_Continue}]*$/gu;
	const isValid = regexp.test(str);
	validationEl.empty();
	if (!isValid) {
		validationEl.createEl("br");
		validationEl.appendText(
			"Cannot start with a number and may only contain letters, numbers, _, and $."
		);
	}
	return isValid;
};

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

						// const modal = new ConfirmationModal(plugin.app);
						// modal.setTitle(t("settings.globalFormulas.deleteModal.title"));
						// modal.setContent(
						// 	t("settings.globalFormulas.deleteModal.warning", {
						// 		name: globalFormula.name,
						// 	})
						// );
						// modal.addFooterButton((button) => {
						// 	button
						// 		.setButtonText(t("common.delete"))
						// 		.setWarning()
						// 		.onClick(async () => {
						// 			await plugin.updateSettings((prev) => {
						// 				const copy = { ...prev };
						// 				copy.globalFormulas = copy.globalFormulas.filter(
						// 					(_, i) => i !== index
						// 				);
						// 				return copy;
						// 			});
						// 			this.display();
						// 			modal.close();
						// 		});
						// });
						// modal.open();
					});
				});
			});
		});

		const customFunctionsGroup = new ReorderSettingGroup(containerEl);
		customFunctionsGroup.onReorder((from, to) => {
			void (async () => {
				await plugin.updateSettings((prev) => {
					const copy = { ...prev };
					copy.customFunctions = arrayMove(copy.customFunctions, from, to);
					return copy;
				});
				this.display();
			})();
		});

		customFunctionsGroup.setHeading(t("settings.customFunctions.groupheading"));
		customFunctionsGroup.addExtraButton((button) => {
			button.setIcon("lucide-more-horizontal");
			button.extraSettingsEl.addEventListener("click", (e) => {
				const menu = new Menu();
				menu.addItem((item) => {
					item.setIcon("lucide-import");
					item.setTitle("Import YAML");
					item.onClick(() => {
						const modal = new FunctionImportModal(plugin.app);
						modal.onClose = () => {
							const { shouldSave, functionDefinition } = modal;
							if (!shouldSave || !functionDefinition) return;
							void (async () => {
								await plugin.updateSettings((prev) => ({
									...prev,
									customFunctions: [
										...prev.customFunctions,
										functionDefinition,
									],
								}));
								this.display();
							})();
						};
						modal.open();
					});
				});
				menu.addItem((item) => {
					item.setIcon("lucide-sort-asc");
					item.setTitle("Sort");
					const submenu = item.setSubmenu();
					submenu.setNoIcon();
					submenu.addItem((subItem) => {
						subItem.setTitle(`${"A to Z"}`);
						subItem.onClick(async () => {
							await plugin.updateSettings((prev) => ({
								...prev,
								customFunctions: prev.customFunctions.toSorted((a, b) =>
									a.name.localeCompare(b.name)
								),
							}));
							this.display();
						});
					});
					submenu.addItem((subItem) => {
						subItem.setTitle(`${"Z to A"}`);
						subItem.onClick(async () => {
							await plugin.updateSettings((prev) => ({
								...prev,
								customFunctions: prev.customFunctions.toSorted((a, b) =>
									b.name.localeCompare(a.name)
								),
							}));
							this.display();
						});
					});
				});
				menu.showAtMouseEvent(e);
			});
		});
		customFunctionsGroup.addExtraButton((button) => {
			button.setIcon("lucide-plus-circle");
			button.setTooltip(t("settings.customFunctions.addTooltip"));
			button.onClick(() => {
				let name = "myFunction";
				let i = 1;
				while (
					plugin.getSettings().customFunctions.find((f) => f.name === name)
				) {
					name = "myFunction" + i;
					i++;
				}
				const modal = new CustomFunctionModal(
					plugin,
					{
						name,
						description: "",
						scope: "Global",
						scopeType: "Any",
						parameters: [],
						formula: "",
					},
					true
				);
				modal.onClose = () => {
					void (async () => {
						await plugin.updateSettings((prev) => ({
							...prev,
							customFunctions: [...prev.customFunctions, modal.customFunction],
						}));
						this.display();
					})();
				};
				modal.open();
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

		settings.customFunctions.forEach((customFunction, index) => {
			customFunctionsGroup.addSetting((s) => {
				s.setName(
					customFunction.scope === "Global"
						? customFunction.name
						: `${customFunction.scopeType}.${customFunction.name}`
				);
				s.setDesc(customFunction.description);
				s.addExtraButton((button) => {
					button.setIcon("lucide-settings");
					button.setTooltip("Edit");
					button.onClick(() => {
						const modal = new CustomFunctionModal(plugin, {
							...customFunction,
						});
						modal.onClose = () => {
							void (async () => {
								await plugin.updateSettings((prev) => {
									const copy = { ...prev };
									copy.customFunctions[index] = modal.customFunction;
									return copy;
								});
								this.display();
							})();
						};
						modal.open();
					});
				});
				s.addExtraButton((button) => {
					button.setIcon("lucide-copy");
					button.setTooltip("Copy YAML");
					button.onClick(async () => {
						const yaml = stringifyYaml(customFunction);
						await navigator.clipboard.writeText(yaml);
						new window.Notice("Copied function as YAML");
					});
				});
				s.addExtraButton((button) => {
					button.setIcon("lucide-x");
					button.setTooltip("Delete");
					button.onClick(() => {
						confirm({
							app: plugin.app,
							title: t("settings.customFunctions.deleteModal.title"),
							desc: t("settings.customFunctions.deleteModal.warning", {
								name: customFunction.name,
							}),
							confirmLabel: t("common.delete"),
							onClose: async (isConfirmed) => {
								if (!isConfirmed) return;
								await plugin.updateSettings((prev) => {
									const copy = { ...prev };
									copy.customFunctions = copy.customFunctions.filter(
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
		public customFunction: FormulaForgeSettings["customFunctions"][number],
		public isNew?: boolean
	) {
		super(plugin.app);
	}

	onOpen(): void {
		const { contentEl, customFunction, plugin } = this;
		this.contentEl.empty();
		// this.setTitle(t("settings.customFunctions.editorModal.title"));
		this.setTitle(this.isNew ? "Create function" : "Edit function");

		const infoGroup = new SettingGroup(contentEl);
		infoGroup.addSetting((s) => {
			const validationEl = window.createDiv({ cls: "mod-warning" });
			s.setName(t("settings.customFunctions.editorModal.name.name"));
			s.setDesc(
				window.createFragment((frag) => {
					frag.createDiv({
						text: t("settings.customFunctions.editorModal.name.desc"),
					});
					frag.appendChild(validationEl);
				})
			);
			s.addText((text) => {
				text.setValue(customFunction.name).onChange((v) => {
					const isValid = validateJsStyleVariable(v, validationEl);
					if (!isValid) return;

					customFunction.name = v;
				});
			});
		});
		infoGroup.addSetting((s) => {
			s.setName(t("settings.customFunctions.editorModal.description.name"));
			s.setDesc(t("settings.customFunctions.editorModal.description.desc"));
			s.addTextArea((text) => {
				text.setValue(customFunction.description).onChange((v) => {
					customFunction.description = v;
				});
			});
		});
		infoGroup.addSetting((s) => {
			s.setName("Scope");
			s.setDesc(
				window.createFragment((frag) => {
					frag.appendText("Global - call directly by name: ");
					frag.createEl("code", { text: `${"myFunc()"}` });
					frag.createEl("br");
					frag.appendText("Type - call as a property of the specified type: ");
					frag.createEl("code", { text: `${"67.myFunc()"}` });
				})
			);
			s.addDropdown((dropdown) => {
				dropdown.addOptions({
					Global: "Global",
					Type: "Type",
				} satisfies Record<(typeof customFunction)["scope"], (typeof customFunction)["scope"]>);
				dropdown.setValue(customFunction.scope);
				dropdown.onChange((v) => {
					customFunction.scope = v as (typeof customFunction)["scope"];
					this.onOpen();
				});
			});
		});

		infoGroup.addSetting((s) => {
			if (customFunction.scope === "Global") {
				s.settingEl.remove();
				return;
			}
			s.setName("Scope type");
			s.setDesc(
				'The data type to scope this function to. Use the implicit parameter "self" in the function\'s formula definition to refer to the value the function is being called on.'
			);
			s.addDropdown((dropdown) => {
				dropdown.addOptions({
					Any: "Any",
					Boolean: "Boolean",
					Date: "Date",
					File: "File",
					Link: "Link",
					List: "List",
					Number: "Number",
					Null: "Null",
					Object: "Object",
					Regexp: "Regexp",
					String: "String",
				} satisfies Record<Param["type"], Param["type"]>);
				dropdown.setValue(customFunction.scopeType);
				dropdown.onChange((v) => {
					customFunction.scopeType = v as Param["type"];
				});
			});
		});

		const paramsGroup = new ReorderSettingGroup(contentEl);
		paramsGroup.setHeading("Parameters");
		paramsGroup.addExtraButton((button) => {
			button.setIcon("lucide-plus-circle");
			button.setTooltip("Add parameter");
			button.onClick(() => {
				let name = "myParam";
				let i = 1;
				while (customFunction.parameters.find((p) => p.name === name)) {
					name = "myParam" + i;
					i++;
				}

				const paramModal = new ParameterModal(
					{ name, type: "Any", optional: false, variadic: false },
					plugin.app,
					true
				);
				paramModal.onClose = () => {
					if (!paramModal.param.name) return;
					customFunction.parameters.push(paramModal.param);
					this.onOpen();
				};
				paramModal.open();
			});
		});

		this.customFunction.parameters.forEach((param, i) => {
			paramsGroup.addSetting((s) => {
				s.setName(param.name);
				s.setDesc(
					window.createFragment((frag) => {
						frag.appendText(param.type);
						if (param.optional) {
							frag.appendText("  • Optional");
						}
						if (param.variadic) {
							frag.appendText("  • Variadic");
						}
					})
				);
				s.addExtraButton((button) => {
					button.setIcon("lucide-settings");
					button.onClick(() => {
						const paramModal = new ParameterModal(param, plugin.app);
						paramModal.onClose = () => {
							customFunction.parameters[i] = paramModal.param;
							this.onOpen();
						};
						paramModal.open();
					});
				});
				s.addExtraButton((button) => {
					button.setIcon("lucide-x");
					button.onClick(() => {
						customFunction.parameters = customFunction.parameters.filter(
							(_, i2) => i2 !== i
						);
						this.onOpen();
					});
				});
			});
		});

		new SettingGroup(contentEl).addSetting((s) => {
			s.setName(t("settings.customFunctions.editorModal.formula.name"));
			s.setDesc(
				window.createFragment((el) => {
					el.createEl("a", {
						text: t("settings.customFunctions.editorModal.formula.desc"),
						href: "https://obsidian.md/help/formulas",
					});
				})
			);
			s.addTextArea((text) => {
				text
					.setPlaceholder(
						t("settings.customFunctions.editorModal.formula.placeholder")
					)
					.setValue(customFunction.formula)
					.onChange((v) => {
						customFunction.formula = v;
					});
			});
		});
	}
}

type Param =
	FormulaForgeSettings["customFunctions"][number]["parameters"][number];

class ParameterModal extends Modal {
	constructor(public param: Param, app: App, public isNew?: boolean) {
		super(app);
	}

	onOpen(): void | Promise<void> {
		const { contentEl, param } = this;

		contentEl.empty();
		this.setTitle(this.isNew ? "Add parameter" : "Edit parameter");

		const group = new SettingGroup(contentEl);
		group.addSetting((s) => {
			s.setName("Name");
			const validationEl = window.createDiv({ cls: "mod-warning" });
			s.setDesc(
				window.createFragment((frag) => {
					frag.createDiv({
						text: "The name to refer to this parameter within this function's formula definition.",
					});
					frag.appendChild(validationEl);
				})
			);
			s.addText((text) => {
				text.setValue(param.name);
				text.onChange((v) => {
					const isValid = validateJsStyleVariable(v, validationEl);
					if (!isValid) return;

					param.name = v;
				});
			});
		});
		group.addSetting((s) => {
			s.setName("Type");
			s.setDesc(`The data type of this parameter.`);
			s.addDropdown((dropdown) => {
				dropdown.addOptions({
					Any: "Any",
					Boolean: "Boolean",
					Date: "Date",
					File: "File",
					Link: "Link",
					List: "List",
					Number: "Number",
					Null: "Null",
					Object: "Object",
					Regexp: "Regexp",
					String: "String",
				} satisfies Record<Param["type"], Param["type"]>);
				dropdown.setValue(param.type);
				dropdown.onChange((v) => {
					param.type = v as Param["type"];
				});
			});
		});
		group.addSetting((s) => {
			s.setName("Optional");
			s.setDesc(
				"If true, the parameter is not required to be passed when calling this function and should be treated as possibly undefined in the function's formula definition."
			);
			s.addToggle((toggle) => {
				toggle.setValue(param.optional);
				toggle.onChange((b) => {
					param.optional = b;
				});
			});
		});
		group.addSetting((s) => {
			s.setName("Variadic");
			s.setDesc(
				`This may only be set to true if it's the last parameter. If true, multiple values may be provided for the parameter and should be treated as a ${"List"} in the function's formula definition.`
			);
			s.addToggle((toggle) => {
				toggle.setValue(param.variadic);
				toggle.onChange((b) => {
					param.variadic = b;
				});
			});
		});
	}
}

class FunctionImportModal extends ConfirmationModal {
	private schema =
		formulaForgeSettingsSchema.wrapped.entries.customFunctions.wrapped.item;

	public shouldSave: boolean = false;
	public functionDefinition: v.InferOutput<typeof this.schema> | null = null;

	onOpen(): void | Promise<void> {
		this.setTitle("Import custom function as YAML");
		const textarea = new TextAreaComponent(this.contentEl);
		const validationEl = this.contentEl.createDiv({
			cls: "formula-forge--valibort-errors-container",
		});
		const validationIconEl = validationEl.createDiv({
			cls: "status-icon",
		});
		const validationLabelEl = validationEl.createSpan();
		this.addFooterButton((button) => {
			button.setButtonText("Save");
			button.setDisabled(true);
			button.onClick(() => {
				if (!this.functionDefinition) return;
				this.shouldSave = true;
				this.close();
			});
			textarea.onChange((v) => {
				const result = this.tryParse(v);
				this.functionDefinition = result.success ? result.data : null;
				button.setDisabled(!result.success);
				validationEl.classList[result.success ? "remove" : "add"](
					"mod-warning"
				);
				setIcon(
					validationIconEl,
					result.success ? "lucide-check-circle" : "lucide-x-circle"
				);
				validationLabelEl.textContent = result.success
					? "Valid function definition"
					: result.error;
				validationEl.setText(
					result.success ? "Valid function definition" : result.error
				);
			});
		});
	}

	private tryParse(str: string) {
		return syncTryCatch(() => {
			const yaml = parseYaml(str);
			const parsed = v.safeParse(this.schema, yaml);
			if (!parsed.success) {
				throw new Error(v.summarize(parsed.issues));
			}
			return parsed.output;
		});
	}
}

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
