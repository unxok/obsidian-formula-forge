import { setIcon, TFile, Value } from "obsidian";
import { FormulaForge } from "~/Plugin";

export const initInlineFormulaRenderer = ({
	plugin,
	containerEl,
	formula,
	containingFile,
}: {
	plugin: FormulaForge;
	containerEl: HTMLElement;
	formula: string;
	containingFile: TFile;
}) => {
	const renderer = new FormulaRenderer(
		plugin,
		containerEl,
		formula,
		containingFile
	);

	renderer.render();
	plugin.rendererManager.renderers.add(renderer);

	return renderer;
};

export class FormulaRenderer {
	formulaContainerEl: HTMLElement;

	constructor(
		public plugin: FormulaForge,
		public containerEl: HTMLElement,
		public formula: string,
		public containingFile: TFile
	) {
		this.formulaContainerEl = containerEl.createDiv({
			cls: "formula-forge--formula-container",
		});
	}

	render(): void {
		const { plugin, formula, containingFile, formulaContainerEl } = this;

		const formulaInstance = plugin.api.createFormula(formula);
		formulaContainerEl.empty();

		if (formulaInstance.formula.type === "invalid") {
			this.displayError(formulaInstance.formula.getErrorMessage());
		}

		const output = plugin.api.evaluateFormula(formulaInstance, containingFile);
		if (!(output instanceof Value)) {
			this.displayError("Invalid output. Did you incorrectly use a function?");
		}

		if (!output) return;
		output.renderTo(formulaContainerEl, plugin.app.renderContext);
	}

	displayError(error: string): void {
		const errorEl = this.formulaContainerEl.createDiv({
			cls: "bases-formula-error",
		});
		setIcon(
			errorEl.createDiv({ cls: "warning-icon" }),
			"lucide-alert-triangle"
		);
		errorEl.createDiv({
			cls: "bases-formula-error-message",
			text: error,
		});
	}
}
