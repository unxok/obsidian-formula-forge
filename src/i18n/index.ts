import type { i18n } from "i18next";
import en from "./languages/en.json";

const ns = "formula-forge";

// TODO idk why `addResourceBundle` isn't a known method anymore...
type i18nCorrected = typeof window.i18next & i18n;
const i18next = window.i18next as i18nCorrected;

// add language packs below

i18next.addResourceBundle("en", ns, en); // English

//////////////////

const fixedT = window.i18next.getFixedT(null, ns);

type EN = typeof en;

export type NestedPaths<T, Prefix extends string = ""> = {
	[K in keyof T & string]: T[K] extends Record<string, unknown>
		? `${Prefix}${K}` | NestedPaths<T[K], `${Prefix}${K}.`>
		: `${Prefix}${K}`;
}[keyof T & string];

export const t = <T extends NestedPaths<EN>>(
	key: T,
	variables?: Record<string, string>
): string => {
	return fixedT(key, variables);
};
