import { NullValue, setIcon, setTooltip, TFile, Value } from "obsidian";
import { RendererManager } from "~~/features/live-formulas/RendererManager";

// export const initInlineFormulaRenderer = ({
// 	plugin,
// 	containerEl,
// 	formula,
// 	containingFile,
// }: {
// 	plugin: FormulaForge;
// 	containerEl: HTMLElement;
// 	formula: string;
// 	containingFile: TFile;
// }) => {
// 	const renderer = new FormulaRenderer(
// 		plugin,
// 		containerEl,
// 		formula,
// 		containingFile
// 	);

// 	renderer.render();
// 	plugin.rendererManager.renderers.add(renderer);

// 	return renderer;
// };

export class FormulaRenderer {
	formulaContainerEl: HTMLElement;

	constructor(
		public manager: RendererManager,
		public containerEl: HTMLElement,
		public formula: string,
		public containingFile: TFile
	) {
		this.formulaContainerEl = containerEl.createDiv({
			cls: "formula-forge--formula-container",
		});

		manager.renderers.add(this);

		this.render();
	}

	output: Value = NullValue.value;

	render(): void {
		const { manager, formula, containingFile, formulaContainerEl } = this;
		const { plugin } = manager;

		const formulaInstance = plugin.basesAdapter.createFormula(formula);
		setTooltip(formulaContainerEl, formula);

		if (formulaInstance.formula.type === "invalid") {
			this.displayError(formulaInstance.formula.getErrorMessage());
			return;
		}

		const output = plugin.basesAdapter.evaluateFormula(
			formulaInstance,
			containingFile
		);

		if (!(output instanceof Value)) {
			this.displayError("Invalid output. Did you incorrectly use a function?");
		}

		if (output.looseEquals(this.output)) {
			// skip re-rendering if output hasn't changed
			return;
		}

		this.output = output;

		if (!output) return;

		formulaContainerEl.empty();
		output.renderTo(formulaContainerEl, plugin.app.renderContext);
	}

	displayError(error: string): void {
		this.formulaContainerEl.empty();
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

	delete(): void {
		this.manager.renderers.delete(this);
	}
}
