import { FormulaForge } from "~/Plugin";
import { FormulaForgeSettings } from "../schema";
import { TryCatchResult } from "~/utils";
import { t } from "~/i18n";

export type GlobalFormula = FormulaForgeSettings["globalFormulas"][number];

export const validateDuplicateFormulaName = (
	plugin: FormulaForge,
	name: string
): TryCatchResult<void> => {
	const { globalFormulas } = plugin.getSettings();
	const isDuplicate = globalFormulas.some(
		(f) => f.name.toLowerCase() === name.toLowerCase()
	);

	if (isDuplicate) {
		return {
			success: false,
			data: undefined,
			error: t("errors.duplicateGlobalFormulaName", {
				formula: name,
			}),
		};
	}

	return { success: true, data: undefined, error: undefined };
};

export const validateNotEmpty = (name: string): TryCatchResult<void> => {
	if (!name) {
		return {
			success: false,
			data: undefined,
			error: t("errors.notEmpty"),
		};
	}

	return { success: true, data: undefined, error: undefined };
};
