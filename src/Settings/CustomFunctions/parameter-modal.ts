import { Modal, App, SettingGroup } from "obsidian";
import { Param, validateJsStyleVariable } from "./utils";
import { validateSetting } from "~/utils/obsidian";

export class ParameterModal extends Modal {
	original: Param;
	constructor(public param: Param, app: App, public isNew?: boolean) {
		super(app);
		this.original = { ...param };
	}

	onOpen(): void | Promise<void> {
		const { contentEl, param } = this;

		contentEl.empty();
		this.setTitle(this.isNew ? "Add parameter" : "Edit parameter");

		const group = new SettingGroup(contentEl);
		group.addSetting((s) => {
			const validate = validateSetting(s);
			s.setName("Name");
			s.setDesc(
				"The name to refer to this parameter within this function's formula definition."
			);
			s.addText((text) => {
				text.setValue(param.name);
				text.onChange((v) => {
					const isValid = validate([validateJsStyleVariable(v)]);
					if (!isValid) {
						param.name = this.original.name;
						return;
					}
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
