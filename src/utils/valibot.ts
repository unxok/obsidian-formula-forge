import * as v from "valibot";

/**
 * Creates an optional object schema which has a default value of the provided object parsed with an empty object
 */
export const vOptionalObjectWithDefault = <
	T extends {
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
		Record<string, v.OptionalSchema<v.GenericSchema, {}>>
	>
>;
