import { Setting } from "obsidian";
import { TryCatchResult } from "./pure";

type Validate = (validations: TryCatchResult<void>[]) => boolean;

export const validateSetting = (setting: Setting | HTMLElement): Validate => {
	const validationEl = window.createDiv({ cls: "mod-warning" });

	return (validations) => {
		validationEl.empty();
		const el = setting instanceof Setting ? setting.descEl : setting;
		el.append(validationEl);

		return validations.reduce((acc, result) => {
			if (result.success) return acc;

			validationEl.createEl("br");
			validationEl.appendText(result.error);

			return false;
		}, true);
	};
};
