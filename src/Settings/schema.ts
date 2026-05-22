import { vOptionalObjectWithDefault } from "~/utils";
import * as v from "valibot";

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
			v.object({
				name: v.string(),
				description: v.string(),
				parameters: v.array(
					v.object({
						name: v.string(),
						type: v.union([
							v.literal("Any"),
							v.literal("Boolean"),
							v.literal("Date"),
							v.literal("File"),
							v.literal("Link"),
							v.literal("List"),
							v.literal("Number"),
							v.literal("Object"),
							v.literal("Regexp"),
							v.literal("String"),
						]),
					})
				),
				formula: v.string(),
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
