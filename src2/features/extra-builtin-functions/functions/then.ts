import { NullValue } from "obsidian";
import { FormulaForge } from "~~/plugin";
import { AnyValue } from "~~/shared/constants";

export const then = (plugin: FormulaForge) => {
	plugin.registerGlobalFunc({
		name: "then",
		ctx: null,
		docString: () => "Returns the last of all the provided values.",
		params: [{ name: "values", type: [AnyValue], variadic: true }],
		applyWithContext(_ctx, ...values) {
			return values.pop() ?? NullValue.value;
		},
	});

	plugin.registerInstanceFunc(NullValue, {
		name: "then",
		ctx: null,
		docString: () => "Returns the last of all the provided values.",
		params: [
			{ name: "self", type: [NullValue] },
			{ name: "values", type: [AnyValue], variadic: true },
		],
		applyWithContext(_ctx, _self, ...values) {
			return values.pop() ?? NullValue.value;
		},
	});
};
