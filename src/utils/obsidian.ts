import { Setting } from "obsidian";
import { TryCatchResult } from "./pure";
import { FormulaForge } from "~/Plugin";

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

export const validateFormula = (
	plugin: FormulaForge,
	text: string
): TryCatchResult<void> => {
	const { formula } = plugin.api.createFormula(text);
	if (formula.type === "invalid") {
		return {
			success: false,
			data: undefined,
			error: formula.getErrorMessage(),
		};
	}
	return { success: true, data: undefined, error: undefined };
};
