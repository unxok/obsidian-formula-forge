import * as v from "valibot";

/**
 * Creates an optional object schema which has a default value of the provided object parsed with an empty object
 */
export const vOptionalObjectWithDefault = <
	T extends {
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- I am intentionally wanint a non-nullish value
		[key: string]: v.OptionalSchema<v.GenericSchema, {}>;
	}
>(
	object: T
) => {
	const schema = v.object(object);
	return v.optional(schema, v.parse(schema, {}));
};

export type VOptionalObjectWithDefault = ReturnType<
	typeof vOptionalObjectWithDefault<
		// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- I am intentionally wanint a non-nullish value
		Record<string, v.OptionalSchema<v.GenericSchema, {}>>
	>
>;
