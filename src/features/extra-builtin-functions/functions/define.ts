import { around } from "monkey-around";
import { BasesEntry, StringValue, Value, NullValue } from "obsidian";
import { AnyValue } from "~/shared/constants";
import { FormulaForge } from "~/plugin";

export const define = (plugin: FormulaForge) => {
	const patchContextForDefine = (
		ctx: BasesEntry,
		name: StringValue,
		value: Value
	) => {
		around(ctx, {
			getByIdentifier: function (old) {
				return function (ident) {
					// @ts-expect-error
					const that = this as typeof ctx;

					if (ident === name.data) {
						return value;
					}

					return old.call(that, ident);
				};
			},
		});
	};

	plugin.registerGlobalFunc({
		name: "define",
		ctx: null,
		docString: () => "Define a variable",
		params: [
			{
				name: "name",
				type: [StringValue],
			},
			{
				name: "value",

				type: [AnyValue],
			},
		],
		applyWithContext: (ctx, name, value) => {
			patchContextForDefine(ctx, name, value);
			return NullValue.value;
		},
	});

	plugin.registerInstanceFunc(NullValue, {
		name: "define",
		ctx: null,
		docString: () => "Define a variable",
		params: [
			{
				name: "self",
				type: [NullValue],
			},
			{
				name: "name",
				type: [StringValue],
			},
			{
				name: "value",

				type: [AnyValue],
			},
		],
		applyWithContext: (ctx, _self, name, value) => {
			patchContextForDefine(ctx, name, value);
			return NullValue.value;
		},
	});
};
