import { NumberValue } from "obsidian";
import { FormulaForge } from "~/plugin";
import { AnyValue } from "~/shared/constants";

export const stableRandom = (plugin: FormulaForge) => {
	plugin.registerGlobalFunc({
		name: "stableRandom",
		ctx: null,
		docString: () =>
			"Returns a random number between 0 and 1 that is consistent per the provided `seed` parameter.",
		params: [
			{
				name: "seed",
				type: [AnyValue],
			},
		],
		applyWithContext: (_ctx, seed): NumberValue => {
			const str = seed.toString();
			const hash = hash32(str);
			const num = mulberry32(hash);
			return new NumberValue(num);
		},
	});
};

/**
 * A 32-bit pseudo-random number generator (PRNG). You provide a 32-bit seed, and it produces a deterministic sequence of values. The same seed always gives the same sequence
 *
 * @link https://www.4rknova.com/blog/2026/03/01/mulberry32-rng
 */
const mulberry32 = (seed: number): number => {
	let t = seed >>> 0; // force seed into uint32

	t = (t + 0x6d2b79f5) >>> 0; // advance internal state (uint32 wrap)

	// Mix bits using xor-shifts and 32-bit multiplication.

	let x = Math.imul(t ^ (t >>> 15), t | 1);

	x ^= x + Math.imul(x ^ (x >>> 7), x | 61);

	// Convert uint32 to float in [0, 1).

	return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};

/**
 * Hashes a string to a 32-bit integer
 *
 * @link https://www.4rknova.com/blog/2026/03/01/mulberry32-rng#seeding-from-strings
 */
const hash32 = (seed: string): number => {
	let h = 2166136261 >>> 0; // FNV-1a 32-bit offset basis

	for (let i = 0; i < seed.length; i += 1) {
		h ^= seed.charCodeAt(i); // xor in next character

		h = Math.imul(h, 16777619); // multiply by FNV prime
	}

	return h >>> 0;
};
