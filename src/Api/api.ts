import { around, dedupe } from "monkey-around";
import {
	BasesEntry,
	BooleanValue,
	DateValue,
	EventRef,
	Events,
	FileValue,
	LinkValue,
	ListValue,
	NumberValue,
	ObjectValue,
	PrimitiveValue,
	RegExpValue,
	StringValue,
	TFile,
	Value,
} from "obsidian";
import { BasesFormula } from "obsidian-typings";
import { FormulaForge } from "~/Plugin";
import { FormulaForgeSettings } from "~/Settings";
import { monkeyAroundKey } from "~/utils";

export class Api extends Events {
	constructor(public plugin: FormulaForge) {
		super();
	}

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

	/**
	 * Creates a formula instance
	 */
	createFormula = (formula: string): BasesFormula => {
		void formula;
		throw new Error("Method not implemented");
	};

	/**
	 * Evaluates a formula from a string
	 */
	evaluateFormula = (
		formula: string | BasesFormula,
		containingFile?: TFile
	): Value => {
		void formula;
		void containingFile;
		throw new Error("Method not implemented");
	};

	customFunctionRemovers: Map<string, () => void> = new Map();

	/**
	 * Registers a custom function to use in formulas
	 */
	registerFunction = ({
		name,
		description,
		parameters,
		formula,
	}: FormulaForgeSettings["customFunctions"][number]): void => {
		// this.customFunctions.set(name, getValue);

		const { plugin } = this;

		class AnyValue extends Value {
			toString(): string {
				return "";
			}
			isTruthy(): boolean {
				return true;
			}
		}

		const getTypeValue = (
			type: FormulaForgeSettings["customFunctions"][number]["parameters"][number]["type"]
		) => {
			switch (type) {
				case "Any":
					return AnyValue;
				case "Boolean":
					return BooleanValue;
				case "Date":
					return DateValue;
				case "File":
					return FileValue;
				case "Link":
					return LinkValue;
				case "List":
					return ListValue;
				case "Number":
					return NumberValue;
				case "Object":
					return ObjectValue;
				case "Regexp":
					return RegExpValue;
				case "String":
				default:
					return StringValue;
			}
		};

		const params = parameters.map(({ name, type }) => ({
			name,
			type: [getTypeValue(type)],
		}));

		this.plugin.registerGlobalFunc({
			name,
			docString: () => description,
			ctx: null,
			params,
			applyWithContext: (ctx: BasesEntry, ...args: Value[]) => {
				const namedParamValues = parameters.reduce((acc, cur, i) => {
					acc[cur.name] = args[i];
					return acc;
				}, {} as Record<string, Value>);

				around(ctx, {
					getByIdentifier: (old) =>
						dedupe(monkeyAroundKey, old, function (identifier) {
							// @ts-expect-error
							const that = this as BasesEntry;

							if (identifier in namedParamValues) {
								return namedParamValues[identifier];
							}

							return old.call(that, identifier);
						}),
				});

				const formulaInstance = plugin.api.createFormula(formula);

				return formulaInstance.getValue(ctx);
			},
		});

		const remover = (plugin._events as (EventRef | (() => void))[]).last();
		if (!(remover instanceof Function)) return;
		this.customFunctionRemovers.set(name, remover);
	};

	/**
	 * Converts the data structure used for values returned from formulas to their primitive values (more or less)
	 */
	normalizeFormulaValue = (
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
}
