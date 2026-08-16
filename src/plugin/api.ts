import {
	EventRef,
	Events,
	ListValue,
	ObjectValue,
	PrimitiveValue,
	TFile,
	Value,
} from "obsidian";
import { BasesFormula } from "obsidian-typings";
import { FormulaForge } from "~/plugin";

export class Api extends Events {
	constructor(public plugin: FormulaForge) {
		super();
	}

	/**
	 * Creates a formula instance
	 */
	public createFormula = (formula: string): BasesFormula => {
		return this.plugin.basesAdapter.createFormula(formula);
	};

	/**
	 * Evaluates a formula from a string
	 */
	public evaluateFormula = (
		formula: string | BasesFormula,
		containingFile?: TFile | string
	): Value => {
		return this.plugin.basesAdapter.evaluateFormula(formula, containingFile);
	};

	/**
	 * Converts the data structure used for values returned from formulas to their primitive values (more or less)
	 */
	public normalizeFormulaValue = (
		value: Value
	): null | boolean | number | string | Record<string, unknown> | unknown[] => {
		if (value instanceof ListValue) {
			return value.data.map((v) => this.normalizeFormulaValue(v));
		}

		if (value instanceof PrimitiveValue || value instanceof ObjectValue) {
			return value.data as boolean | number | string;
		}

		// nullish coalesce to null because if you set a property to undefined in FileManager.processFrontmatter() it will remove the property
		return value?.toString() ?? null;
	};

	private ready: boolean = false;

	on(name: "ready", callback: () => unknown): EventRef;
	on(name: string, callback: () => unknown): EventRef;
	on(name: string, callback: () => unknown): EventRef {
		if (name === "ready" && this.ready) {
			callback();
		}
		return super.on(name, callback);
	}

	trigger(name: "ready"): void;
	trigger(name: string): void;
	trigger(name: string): void {
		if (name === "ready") {
			this.ready = true;
		}
		return super.trigger(name);
	}
}
