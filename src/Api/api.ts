import { around } from "monkey-around";
import {
	BasesEntry,
	BooleanValue,
	Constructor,
	DateValue,
	EventRef,
	Events,
	FileValue,
	LinkValue,
	ListValue,
	NullValue,
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
import { AnyValue } from "~/utils";

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
		scope,
		scopeType,
		parameters,
		formula,
	}: FormulaForgeSettings["customFunctions"][number]): void => {
		// this.customFunctions.set(name, getValue);

		const { plugin } = this;

		type Param =
			FormulaForgeSettings["customFunctions"][number]["parameters"][number];

		type ValueTypeString = Param["type"];

		const valueTypeMapping = {
			Any: AnyValue,
			Boolean: BooleanValue,
			Date: DateValue,
			File: FileValue,
			Link: LinkValue,
			List: ListValue,
			Null: NullValue,
			Number: NumberValue,
			Object: ObjectValue,
			Regexp: RegExpValue,
			String: StringValue,
		} satisfies Record<ValueTypeString, Constructor<Value>>;

		const params = parameters.map(({ name, type, optional, variadic }) => ({
			name,
			type: [valueTypeMapping[type]],
			optional,
			variadic,
		}));

		if (scope === "Type") {
			params.unshift({
				name: "self",
				type: [valueTypeMapping[scopeType]],
				optional: false,
				variadic: false,
			});
		}

		const func = {
			name,
			docString: () => description,
			ctx: null,
			params,
			applyWithContext: (ctx: BasesEntry, ...args: Value[]) => {
				const namedParamValues = params.reduce((acc, cur, i) => {
					acc[cur.name] = args[i];
					return acc;
				}, {} as Record<string, Value>);

				around(ctx, {
					getByIdentifier(old) {
						return function (identifier) {
							// @ts-expect-error
							const that = this as BasesEntry;

							if (identifier in namedParamValues) {
								return namedParamValues[identifier];
							}

							return old.call(that, identifier);
						};
					},
				});

				const formulaInstance = plugin.api.createFormula(formula);

				return formulaInstance.getValue(ctx);
			},
		};

		if (scope === "Global") {
			this.plugin.registerGlobalFunc(func);
		}
		if (scope === "Type") {
			this.plugin.registerInstanceFunc(valueTypeMapping[scopeType], func);
		}

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
