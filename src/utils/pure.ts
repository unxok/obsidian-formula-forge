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
