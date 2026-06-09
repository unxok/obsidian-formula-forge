import { TryCatchResult } from "~/utils";
import { FormulaForgeSettings } from "../schema";
import { FormulaForge } from "~/Plugin";
import { ErrorValue } from "obsidian";
import { obsidianText } from "~/i18n/obsidian";
import { t } from "~/i18n";

export type CustomFunction = FormulaForgeSettings["customFunctions"][number];
export type Param = CustomFunction["parameters"][number];

export const validateJsStyleVariable = (str: string): TryCatchResult<void> => {
	const regexp = /^[_$\p{ID_Start}][_$\p{ID_Continue}]*$/gu;
	const isValid = regexp.test(str);
	if (!isValid) {
		return {
			success: false,
			data: undefined,
			error: t("errors.jsStyleVariableName"),
		};
	}
	return {
		success: true,
		data: undefined,
		error: undefined,
	};
};

export const validateDuplicateFunctionName = (
	plugin: FormulaForge,
	{ name, scope, scopeType }: CustomFunction
): TryCatchResult<void> => {
	const defaultValueMapping = {
		Any: '""',
		Boolean: "true",
		Date: "now()",
		File: "file",
		Link: "file.asLink()",
		List: "[]",
		Null: "null",
		Number: "1",
		Object: "file.properties",
		Regexp: "/abc/",
		String: '""',
	} satisfies Record<CustomFunction["scopeType"], string>;

	const isGlobal = scope === "Global";
	const scopedName = `${isGlobal ? "" : scopeType + "."}${name}`;
	const error = t("errors.duplicateFunctionName", { function: scopedName });

	const result = plugin.api.evaluateFormula(
		`${isGlobal ? "" : defaultValueMapping[scopeType] + "."}${name}()`
	);

	// function was called successfully, so it exists already
	if (
		result.constructor.type !==
		("Error" satisfies ErrorValue["constructor"]["type"])
	) {
		return {
			success: false,
			data: undefined,
			error,
		};
	}
	const { message } = result as ErrorValue;

	// function not found, so it is valid
	if (
		isGlobal &&
		message ===
			obsidianText("formulas.msg-error-invalid-function", { function: name })
	) {
		return {
			success: true,
			data: undefined,
			error: undefined,
		};
	}

	// instance function not found, so it is valid
	if (
		!isGlobal &&
		message ===
			obsidianText("formulas.msg-error-invalid-instance-function", {
				function: name,
				type: scopeType,
			})
	) {
		return {
			success: true,
			data: undefined,
			error: undefined,
		};
	}

	// error is something else, indicating it does exist already
	return {
		success: false,
		data: undefined,
		error,
	};
};
