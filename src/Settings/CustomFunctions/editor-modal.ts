import { SettingGroup } from "obsidian";
import { ConfirmationModal } from "~/common/ConfirmationModal";
import { ReorderSettingGroup } from "~/common/ReorderSettingGroup";
import { t } from "~/i18n";
import { FormulaForge } from "~/Plugin";
import { ParameterModal } from "./parameter-modal";
import {
	CustomFunction,
	Param,
	validateDuplicateFunctionName,
	validateFormula,
	validateJsStyleVariable,
} from "./utils";
import { validateSetting } from "~/utils/obsidian";
import { arrayMove } from "~/utils";

export class CustomFunctionEditorModal extends ConfirmationModal {
	public original: CustomFunction;
	constructor(
		public plugin: FormulaForge,
		public customFunction: CustomFunction,
		public isNew?: boolean
	) {
		super(plugin.app);

		this.original = {
			...customFunction,
			parameters: { ...customFunction.parameters },
		};
	}

	onOpen(): void {
		const { contentEl, customFunction, plugin } = this;
		this.contentEl.empty();
		// this.setTitle(t("settings.customFunctions.editorModal.title"));
		this.setTitle(this.isNew ? "Create function" : "Edit function");

		const infoGroup = new SettingGroup(contentEl);
		infoGroup.addSetting((s) => {
			const validate = validateSetting(s);
			s.setName(t("settings.customFunctions.editorModal.name.name"));
			s.setDesc(t("settings.customFunctions.editorModal.name.desc"));
			s.addText((text) => {
				text.setValue(customFunction.name).onChange((v) => {
					const isValid = validate([
						validateJsStyleVariable(v),
						// skip checking duplicate if name is same as original name
						v === this.original.name
							? { success: true, data: undefined, error: undefined }
							: validateDuplicateFunctionName(plugin, {
									...customFunction,
									name: v,
							  }),
					]);

					if (!isValid) {
						customFunction.name = this.original.name;
						return;
					}

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
					frag.appendText("Type - call as a function of the specified type: ");
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
		paramsGroup.onReorder((from, to) => {
			customFunction.parameters = arrayMove(
				customFunction.parameters,
				from,
				to
			);
			this.onOpen();
		});
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
			const validate = validateSetting(s);
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
						const isValid = validate([validateFormula(plugin, v)]);
						if (!isValid) {
							this.customFunction.formula = this.original.formula;
							return;
						}

						customFunction.formula = v;
					});
			});
		});
	}
}
