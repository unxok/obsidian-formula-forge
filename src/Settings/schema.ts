import { vOptionalObjectWithDefault } from "~/utils";
import * as v from "valibot";

const valueTypeSchema = v.union([
	v.literal("Any"),
	v.literal("Boolean"),
	v.literal("Date"),
	v.literal("File"),
	v.literal("Link"),
	v.literal("List"),
	v.literal("Number"),
	v.literal("Null"),
	v.literal("Object"),
	v.literal("Regexp"),
	v.literal("String"),
]);

/**
 * The plugin settings schema
 *
 * @warning Be very careful when changing this as it may invalidate users' existing settings data
 */
export const formulaForgeSettingsSchema = vOptionalObjectWithDefault({
	inlineCodeSyntax: v.optional(v.string(), "="),
	codeBlockLanguage: v.optional(v.string(), "base-formula"),
	globalFormulas: v.optional(
		v.array(
			v.object({
				name: v.string(),
				description: v.string(),
				formula: v.string(),
			})
		),
		[]
	),
	customFunctions: v.optional(
		v.array(
			vOptionalObjectWithDefault({
				name: v.optional(v.string(), ""),
				description: v.optional(v.string(), ""),
				scope: v.optional(
					v.union([v.literal("Global"), v.literal("Type")]),
					"Global"
				),
				scopeType: v.optional(valueTypeSchema, "Any"),

				parameters: v.optional(
					v.array(
						vOptionalObjectWithDefault({
							name: v.optional(v.string(), ""),
							type: v.optional(valueTypeSchema, "Any"),
							optional: v.optional(v.boolean(), false),
							variadic: v.optional(v.boolean(), false),
						})
					),
					[]
				),
				formula: v.optional(v.string(), ""),
			})
		),
		[]
	),
	integrations: vOptionalObjectWithDefault({
		templates: v.optional(v.boolean(), true),
	}),
});

/**
 * The shape of the plugin settings
 */
export type FormulaForgeSettings = v.InferOutput<
	typeof formulaForgeSettingsSchema
>;
