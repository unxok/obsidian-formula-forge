import { TextAreaComponent, setIcon, parseYaml } from "obsidian";
import { ConfirmationModal } from "~/common/ConfirmationModal";
import { syncTryCatch } from "~/utils";
import { formulaForgeSettingsSchema } from "../schema";
import * as v from "valibot";

export class CustomFunctionImportModal extends ConfirmationModal {
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
