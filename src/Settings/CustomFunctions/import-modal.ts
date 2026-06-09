import { TextAreaComponent, parseYaml } from "obsidian";
import { ConfirmationModal } from "~/common/ConfirmationModal";
import { syncTryCatch, TryCatchResult } from "~/utils";
import { formulaForgeSettingsSchema } from "../schema";
import * as v from "valibot";
import {
	validateSetting,
	validateFormula as validateFormulaUtil,
} from "~/utils/obsidian";
import {
	validateDuplicateFunctionName,
	validateJsStyleVariable,
} from "./utils";
import { FormulaForge } from "~/Plugin";
import "./index.css";
import { t } from "~/i18n";

export class CustomFunctionImportModal extends ConfirmationModal {
	constructor(public plugin: FormulaForge) {
		super(plugin.app);
	}
	private schema =
		formulaForgeSettingsSchema.wrapped.entries.customFunctions.wrapped.item;

	public shouldSave: boolean = false;
	public functionDefinition: v.InferOutput<typeof this.schema> | null = null;

	onOpen(): void | Promise<void> {
		this.setTitle(t("settings.customFunctions.importModal.title"));
		const textarea = new TextAreaComponent(this.contentEl);
		textarea.inputEl.setAttrs({
			cols: "30",
			rows: "15",
		});

		const errorEl = this.contentEl.createDiv({
			cls: "formula-forge--import-custom-function-error-container mod-warning",
		});
		const validate = validateSetting(errorEl);

		this.addFooterButton((button) => {
			button.setButtonText(t("common.save"));
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
				errorEl.empty();

				if (!result.success) {
					errorEl.appendText(t("errors.parsing", { error: result.error }));
					return;
				}

				const { data } = result;

				const validateName = (): TryCatchResult<void> => {
					const jsResult = validateJsStyleVariable(data.name);
					if (!jsResult.success) {
						jsResult.error = `name: ${jsResult.error}`;
						return jsResult;
					}

					const duplicateResult = validateDuplicateFunctionName(
						this.plugin,
						data
					);
					if (!duplicateResult.success) {
						duplicateResult.error = `name: ${duplicateResult.error}`;
						return duplicateResult;
					}

					return {
						success: true,
						data: undefined,
						error: undefined,
					};
				};

				const validateParamNames = (): TryCatchResult<void>[] => {
					return data.parameters.map((p, i) => {
						const result = validateJsStyleVariable(p.name);
						if (!result.success) {
							result.error = `parameter[${i}].name: ${result.error}`;
						}
						return result;
					});
				};

				const validateParamVariadics = (): TryCatchResult<void>[] => {
					return data.parameters.map((p, i) => {
						const isLast = i === data.parameters.length - 1;
						if (!isLast && p.variadic) {
							return {
								success: false,
								data: undefined,
								error: `parameter[${i}].name: ${t("errors.lastParamVariadic")}`,
							};
						}
						return {
							success: true,
							data: undefined,
							error: undefined,
						};
					});
				};

				const validateFormula = (): TryCatchResult<void> => {
					const result = validateFormulaUtil(this.plugin, data.formula);
					if (!result.success) {
						result.error = `formula: ${result.error}`;
					}
					return result;
				};

				const isValid = validate([
					validateName(),
					...validateParamNames(),
					...validateParamVariadics(),
					validateFormula(),
				]);

				button.setDisabled(!isValid);
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
