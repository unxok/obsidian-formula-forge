import { App, TFile, FileValue, ListValue } from "obsidian";
import { FormulaForge } from "~/plugin";

export const files = (plugin: FormulaForge) => {
	plugin.registerGlobalFunc({
		name: "files",
		ctx: null,
		docString: () => "Get all files in the vault.",
		params: [],
		applyWithContext: () => {
			const { app } = plugin;
			const { vault } = app;
			interface IFileValue {
				new (app: App, file: TFile): FileValue;
			}

			const arr: FileValue[] = [];

			for (const name in vault.fileMap) {
				const file = vault.fileMap[name];
				if (!(file instanceof TFile)) continue;
				arr.push(new (FileValue as IFileValue)(app, file));
			}

			return new ListValue(arr);
		},
	});
};
