import { StateEffect, StateField } from "@codemirror/state";

/**
 * Info about the live preview formula
 */
export type FormulaInfo = {
	isWithin: boolean;
	from: number;
	to: number;
};

/**
 * Effect to update the `formulaInfoField` field
 */
export const formulaInfoEffect = StateEffect.define<FormulaInfo>();

/**
 * Holds information about a live preview formula
 */
export const formulaInfoField = StateField.define<FormulaInfo>({
	create() {
		return {
			isWithin: false,
			from: -1,
			to: -1,
		};
	},

	update(value, transaction) {
		for (const effect of transaction.effects) {
			if (effect.is(formulaInfoEffect)) {
				return effect.value;
			}
		}
		return value;
	},
});
