import { Modal, App, SettingGroup } from "obsidian";
import { Param, validateJsStyleVariable } from "./utils";
import { validateSetting } from "~/utils/obsidian";
import { t } from "~/i18n";

export class ParameterModal extends Modal {
	original: Param;
	constructor(public param: Param, app: App, public isNew?: boolean) {
		super(app);
		this.original = { ...param };
	}

	onOpen(): void | Promise<void> {
		const { contentEl, param } = this;

		contentEl.empty();
		this.setTitle(
			this.isNew
				? t(
						"settings.customFunctions.editorModal.parameters.editorModal.addTitle"
				  )
				: t(
						"settings.customFunctions.editorModal.parameters.editorModal.editTitle"
				  )
		);

		const group = new SettingGroup(contentEl);
		group.addSetting((s) => {
			const validate = validateSetting(s);
			s.setName(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.name.name"
				)
			);
			s.setDesc(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.name.desc"
				)
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
			s.setName(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.type.name"
				)
			);
			s.setDesc(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.type.desc"
				)
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
				dropdown.setValue(param.type);
				dropdown.onChange((v) => {
					param.type = v as Param["type"];
				});
			});
		});
		group.addSetting((s) => {
			s.setName(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.optional.name"
				)
			);
			s.setDesc(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.optional.desc"
				)
			);
			s.addToggle((toggle) => {
				toggle.setValue(param.optional);
				toggle.onChange((b) => {
					param.optional = b;
				});
			});
		});
		group.addSetting((s) => {
			s.setName(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.variadic.name"
				)
			);
			s.setDesc(
				t(
					"settings.customFunctions.editorModal.parameters.editorModal.variadic.desc"
				)
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
