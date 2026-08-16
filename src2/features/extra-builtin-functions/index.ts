import { Feature } from "~~/features/types";
import { define } from "~~/features/extra-builtin-functions/functions/define";
import { files } from "~~/features/extra-builtin-functions/functions/files";
import { md } from "~~/features/extra-builtin-functions/functions/md";
import { stableRandom } from "~~/features/extra-builtin-functions/functions/stableRandom";
import { then } from "~~/features/extra-builtin-functions/functions/then";
import { FormulaForge } from "~~/plugin";

/**
 * Adds additional builtin functions to be used in formulas
 */
export class ExtraBuiltinFunctions extends Feature {
	setup(plugin: FormulaForge): void {
		files(plugin);
		then(plugin);
		define(plugin);
		md(plugin);
		stableRandom(plugin);
	}

	settings(): void {
		// this feature has no settings
	}
}
