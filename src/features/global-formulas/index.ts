import { around, dedupe } from "monkey-around";
import { BasesContext } from "obsidian-typings";
import { GlobalFormulasSettingGroup } from "~/features/global-formulas/settings-group";
import { Feature } from "~/features/types";
import { FormulaForge } from "~/plugin";
import { FormulaForgeSettingTab } from "~/plugin/settings-tab";
import { monkeyAroundKey } from "~/shared/constants";

export class GlobalFormulas extends Feature {
	setup(plugin: FormulaForge): void {
		this.patchBasesAdapter(plugin);
		this.patchController(plugin);
		this.patchQuery(plugin);
	}

	settings(plugin: FormulaForge, tab: FormulaForgeSettingTab): void {
		new GlobalFormulasSettingGroup(plugin, tab);
	}

	/**
	 * Patches `plugin.baseAdapter` to allow for global formulas to be used in bases and other features
	 */
	patchBasesAdapter(plugin: FormulaForge): void {
		around(plugin.basesAdapter, {
			// allows formula-rendering to get autocomplete for global formulas
			getFormulaLanguageSupport(old) {
				return dedupe(monkeyAroundKey, old, function () {
					// @ts-expect-error
					const that = this as typeof plugin.basesAdapter;
					const lang = old.call(that);

					const { globalFormulas } = plugin.getSettings();
					globalFormulas.forEach(({ name, formula }) => {
						const formulaInstance = plugin.basesAdapter.createFormula(formula);
						lang.ctx.formulaResults.formulas[name] = formulaInstance;
					});

					return lang;
				});
			},
			// allows `BaseAdapter.evaluateFormula()` (which uses this method) to access global formulas
			createContext(old) {
				return dedupe(monkeyAroundKey, old, function (file) {
					// @ts-expect-error
					const that = this as typeof plugin.basesAdapter;

					const ctx = old.call(that, file);
					const { globalFormulas } = plugin.getSettings();
					ctx.formulas = Object.fromEntries(
						globalFormulas.map(({ name, formula }) => [
							name,
							plugin.basesAdapter.createFormula(formula),
						])
					);

					return ctx.regenerateLocal() as BasesContext;
				});
			},
		});

		// no need to clean up since it patches a plugin internal
	}

	/**
	 * Patches `BasesController` to add global formulas to all bases
	 */
	patchController(plugin: FormulaForge): void {
		const controllerPrototype = plugin.basesAdapter.getControllerPrototype();

		const uninstallControllerPatch = around(controllerPrototype, {
			// Adds global formulas to the base
			buildBasesContext: (old) =>
				dedupe(monkeyAroundKey, old, function (ctx) {
					// @ts-expect-error
					const that = this as typeof controllerPrototype;
					const built = old.call(that, ctx);
					const { globalFormulas } = plugin.getSettings();

					if (!globalFormulas || that.query instanceof Error) {
						return old.call(that, ctx);
					}
					if (!that.query) {
						throw new Error("controller.query is nullish");
					}

					that.query.formulas ??= {};

					const formulas = {
						...built.formulas,
						...Object.fromEntries(
							globalFormulas.map(({ name, formula }) => [
								name,
								plugin.basesAdapter.createFormula(formula),
							])
						),
					};

					that.query.formulas = formulas;
					built.formulas = { ...formulas };

					return built;
				}),
		});

		plugin.register(uninstallControllerPatch);
	}

	/**
	 * Patches `BasesQuery` to prevent bases from saving global formulas to the file contents
	 */
	patchQuery(plugin: FormulaForge): void {
		const queryPrototype = plugin.basesAdapter.getQueryPrototype();

		const uninstallQueryPatch = around(
			queryPrototype,
			// @ts-expect-error
			// TODO I think TS is matching toString to the builtin method on an object but it doesn't always happen so idk
			{
				toString(old) {
					return dedupe(monkeyAroundKey, old, function () {
						// @ts-expect-error
						const that = this as typeof queryPrototype;
						const { globalFormulas } = plugin.getSettings();
						const copy = { ...that.formulas };

						// temporarily delete global formulas
						globalFormulas.forEach(({ name }) => {
							delete that.formulas[name];
						});

						// query is stringified (while global formulas are removed)
						const str = old.call(that);

						// afterwards reset formulas back to original state
						that.formulas = copy;

						return str;
					});
				},
			}
		);

		plugin.register(uninstallQueryPatch);
	}
}
