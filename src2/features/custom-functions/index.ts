import { Feature } from "~~/features/types";
import { FormulaForge } from "~~/plugin";
import { FormulaForgeSettings } from "~~/plugin/schema";
import { around } from "monkey-around";
import {
	BooleanValue,
	DateValue,
	FileValue,
	LinkValue,
	ListValue,
	NullValue,
	NumberValue,
	ObjectValue,
	RegExpValue,
	StringValue,
	Constructor,
	Value,
	BasesEntry,
	EventRef,
} from "obsidian";
import { AnyValue } from "~~/shared/constants";
import { FormulaForgeSettingTab } from "~~/plugin/settings-tab";
import { CustomFunctionsSettingGroup } from "~~/features/custom-functions/settings-group";

/**
 * Adds ability to create custom functions through the settings UI to be used in formulas
 */
export class CustomFunctions extends Feature {
	setup(plugin: FormulaForge): void {
		this.initCustomFunctions(plugin);

		plugin.onSettingsChange((prev, settings) => {
			const isChanged =
				JSON.stringify(prev.customFunctions) !==
				JSON.stringify(settings.customFunctions);

			if (!isChanged) return;

			this.initCustomFunctions(plugin);
		});
	}

	settings(plugin: FormulaForge, tab: FormulaForgeSettingTab): void {
		new CustomFunctionsSettingGroup(plugin, tab);
	}

	/**
	 * Removes any existing custom functions, then registers all that exist in the settings
	 */
	initCustomFunctions(plugin: FormulaForge) {
		const { customFunctions } = plugin.getSettings();

		// unregister all
		this.customFunctionRemovers.keys().forEach((name) => {
			this.unregisterFunction(name);
		});

		// register all
		customFunctions.forEach((func) => {
			this.registerFunction(plugin, func);
		});
	}

	/**
	 * Stores callbacks to remove custom functions
	 *
	 * This is needed because there is no direct API currently
	 */
	customFunctionRemovers: Map<string, () => void> = new Map();

	/**
	 * Registers a custom function to use in formulas
	 */
	registerFunction = (
		plugin: FormulaForge,
		{
			name,
			description,
			scope,
			scopeType,
			parameters,
			formula,
		}: FormulaForgeSettings["customFunctions"][number]
	): void => {
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

		// currently I only support one type per param, but the API requires an array, so this grabs the mapped value prototype and wraps in an array
		const params = parameters.map(({ name, type, optional, variadic }) => ({
			name,
			type: [valueTypeMapping[type]],
			optional,
			variadic,
		}));

		// The "self" param is required in instance (Type) functions, this adds it
		if (scope === "Type") {
			params.unshift({
				name: "self",
				type: [valueTypeMapping[scopeType]],
				optional: false,
				variadic: false,
			});
		}

		// constructs the function definition object
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

				// patches the ctx to allow named params to be used in the formula definition
				// this is intentionally not deduped nor registered to be removed
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

				const formulaInstance = plugin.basesAdapter.createFormula(formula);

				return formulaInstance.getValue(ctx);
			},
		};

		if (scope === "Global") {
			plugin.registerGlobalFunc(func);
		}
		if (scope === "Type") {
			plugin.registerInstanceFunc(valueTypeMapping[scopeType], func);
		}

		// there is currently no API to unregister the custom function, so this is a workaround
		const remover = (plugin._events as (EventRef | (() => void))[]).last();
		if (!(remover instanceof Function)) return;
		this.customFunctionRemovers.set(name, remover);
	};

	/**
	 * Unregisters a custom function
	 */
	unregisterFunction(name: string): void {
		const remover = this.customFunctionRemovers.get(name);
		if (!remover) {
			throw new Error("Custom function not found with name: " + name);
		}

		remover();
		this.customFunctionRemovers.delete(name);
	}
}
