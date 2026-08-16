import * as v from "valibot";
import { vOptionalObjectWithDefault } from "~/shared/valibot";

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
	// changelog
	showChangelogOnUpdate: v.optional(v.boolean(), true),
	seenChangelogVersion: v.optional(v.string(), "0.0.0"),

	// formula-rendering
	inlineCodeSyntax: v.optional(v.string(), "="),
	codeBlockLanguage: v.optional(v.string(), "base-formula"),
	refreshTime: v.optional(v.number(), 500),

	// global-formulas
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

	// custom-functions
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
});

/**
 * The shape of the plugin settings
 */
export type FormulaForgeSettings = v.InferOutput<
	typeof formulaForgeSettingsSchema
>;
