import { Setting } from "obsidian";
import { TryCatchResult } from "./pure";

type Validate = (validations: TryCatchResult<void>[]) => boolean;

export const validateSetting = (setting: Setting): Validate => {
	const validationEl = window.createDiv({ cls: "mod-warning" });

	return (validations) => {
		validationEl.empty();
		setting.descEl.append(validationEl);

		return validations.every((result) => {
			if (!result.success) {
				validationEl.createEl("br");
				validationEl.appendText(result.error);
			}
			return result.success;
		});
	};
};
