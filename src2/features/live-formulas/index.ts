import { SettingGroup } from "obsidian";
import { RendererManager } from "~~/features/live-formulas/RendererManager";
import { Feature } from "~~/features/types";
import { t } from "~~/i18n";
import { FormulaForge } from "~~/plugin";
import { FormulaForgeSettingTab } from "~~/plugin/settings-tab";
import commands from "./commands";

export class LiveFormulas extends Feature {
	setup(plugin: FormulaForge): void {
		plugin.addChild(new RendererManager(plugin));
		commands(plugin).forEach((c) => plugin.addCommand(c));
	}

	settings(plugin: FormulaForge, tab: FormulaForgeSettingTab): void {
		const { inlineCodeSyntax, codeBlockLanguage, refreshTime } =
			plugin.getSettings();
		const group = new SettingGroup(tab.containerEl);
		group.setHeading(t("settings.formulaRendering.groupHeading"));
		group.addSetting((s) => {
			s.setName(t("settings.formulaRendering.inlineCodeSyntax.name"));
			s.setDesc(t("settings.formulaRendering.inlineCodeSyntax.desc"));
			s.addText((text) => {
				text.setValue(inlineCodeSyntax);
				text.onChange(async (v) => {
					await plugin.updateSettings((prev) => ({
						...prev,
						inlineCodeSyntax: v,
					}));
				});
			});
		});
		group.addSetting((s) => {
			s.setName(t("settings.formulaRendering.codeBlockLanguage.name"));
			s.setDesc(t("settings.formulaRendering.codeBlockLanguage.desc"));
			s.addText((text) => {
				text.setValue(codeBlockLanguage);
				text.onChange(async (v) => {
					await plugin.updateSettings((prev) => ({
						...prev,
						codeBlockLanguage: v,
					}));
				});
			});
		});
		group.addSetting((s) => {
			s.setName(t("settings.formulaRendering.refreshTime.name"));
			s.setDesc(t("settings.formulaRendering.refreshTime.desc"));
			s.addText((text) => {
				text.inputEl.type = "number";
				text.inputEl.inputMode = "numeric";
				text.setValue(refreshTime.toString());
				text.onChange(async (v) => {
					await plugin.updateSettings((prev) => ({
						...prev,
						refreshTime: Math.max(0, Number(v)),
					}));
				});
			});
		});
	}
}
