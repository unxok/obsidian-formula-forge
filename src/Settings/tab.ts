import { PluginSettingTab, SettingGroup } from "obsidian";
import { FormulaForge } from "~/Plugin";
import { t } from "~/i18n";
import { CustomFunctionsSettingGroup } from "./CustomFunctions/setting-group";
import { GlobalFormulasSettingGroup } from "./GlobalFormulas";

export class FormulaForgeSettingTab extends PluginSettingTab {
	constructor(public plugin: FormulaForge) {
		super(plugin.app, plugin);
	}

	display(): void {
		this.containerEl.empty();
		const { containerEl, plugin } = this;

		const settings = plugin.getSettings();

		const generalGroup = new SettingGroup(containerEl);
		generalGroup.setHeading(t("settings.formulaRendering.groupHeading"));
		generalGroup.addSetting((s) => {
			s.setName(t("settings.formulaRendering.inlineCodeSyntax.name"));
			s.setDesc(t("settings.formulaRendering.inlineCodeSyntax.desc"));
			s.addText((text) => {
				text.setValue(settings.inlineCodeSyntax);
				text.onChange((v) => {
					void plugin.updateSettings((prev) => ({
						...prev,
						inlineCodeSyntax: v,
					}));
				});
			});
		});
		generalGroup.addSetting((s) => {
			s.setName(t("settings.formulaRendering.codeBlockLanguage.name"));
			s.setDesc(t("settings.formulaRendering.codeBlockLanguage.desc"));
			s.addText((text) => {
				text.setValue(settings.codeBlockLanguage);
				text.onChange((v) => {
					void plugin.updateSettings((prev) => ({
						...prev,
						codeBlockLanguage: v,
					}));
				});
			});
		});

		new GlobalFormulasSettingGroup(plugin, containerEl, () => this.display());
		new CustomFunctionsSettingGroup(plugin, containerEl, () => this.display());
	}
}
