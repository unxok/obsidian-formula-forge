/**
 * Move an item in an array from one index to another
 * @remark You are responsible for ensuring the indexes are valid
 * @tutorial
 * ```ts
 * const arr = ['a', 'b', 'c', 'd'];
 * const newArr = arrayMove(arr, 1, 3);
 * // ['a', 'c', 'd', 'c']
 * ```
 */
export const arrayMove = <T>(arr: T[], from: number, to: number) => {
	const copy = [...arr];
	const item = copy[from];
	copy.splice(from, 1);
	copy.splice(to, 0, item);
	return copy;
};

export type TryCatchResult<T> =
	| {
			success: true;
			data: T;
			error: undefined;
	  }
	| {
			success: false;
			data: undefined;
			error: string;
	  };

/**
 * Async functional wrapper for try-catch blocks
 */
export const tryCatch = async <T>(
	toTry: Promise<T> | (() => Promise<T> | T)
): Promise<TryCatchResult<T>> => {
	try {
		const data = typeof toTry === "function" ? await toTry() : await toTry;
		return { success: true, data, error: undefined };
	} catch (e) {
		const error =
			e instanceof Error
				? e.message
				: typeof e === "string"
				? e
				: "Unknown error";
		return { success: false, data: undefined, error };
	}
};

/**
 * Synchronous functional wrapper for try-catch blocks
 */
export const syncTryCatch = <T>(toTry: () => T): TryCatchResult<T> => {
	try {
		const data = toTry();
		return { success: true, data, error: undefined };
	} catch (e) {
		const error =
			e instanceof Error
				? e.message
				: typeof e === "string"
				? e
				: "Unknown error";
		return { success: false, data: undefined, error };
	}
};

/**
 * A 32-bit pseudo-random number generator (PRNG). You provide a 32-bit seed, and it produces a deterministic sequence of values. The same seed always gives the same sequence
 *
 * @link https://www.4rknova.com/blog/2026/03/01/mulberry32-rng
 */
export const mulberry32 = (seed: number): number => {
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
export const hash32 = (seed: string): number => {
	let h = 2166136261 >>> 0; // FNV-1a 32-bit offset basis

	for (let i = 0; i < seed.length; i += 1) {
		h ^= seed.charCodeAt(i); // xor in next character

		h = Math.imul(h, 16777619); // multiply by FNV prime
	}

	return h >>> 0;
};
