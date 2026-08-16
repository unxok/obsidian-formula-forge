import { Component, MarkdownRenderer, SettingGroup } from "obsidian";
import { Feature } from "~/features/types";
import { FormulaForge } from "~/plugin";
import { FormulaForgeSettingTab } from "~/plugin/settings-tab";
import changelogEntry from "./current-changelog.json";
import { ConfirmationModal } from "~/shared/confirmation-modal";
import { t } from "~/i18n";

export class Changelog extends Feature {
	setup(plugin: FormulaForge): void {
		plugin.addCommand({
			id: "show-changelog",
			name: "Show changelog",
			callback: () => {
				void this.showChangelog(plugin);
			},
		});

		const { showChangelogOnUpdate, seenChangelogVersion } =
			plugin.getSettings();

		if (!showChangelogOnUpdate) return;

		const seenVersion = new SemanticVersion(seenChangelogVersion);
		const currentVersion = new SemanticVersion(plugin.manifest.version);

		if (!currentVersion.isGreaterThan(seenVersion)) {
			return;
		}

		void this.showChangelog(plugin);
	}

	settings(plugin: FormulaForge, tab: FormulaForgeSettingTab): void {
		const { showChangelogOnUpdate } = plugin.getSettings();
		const group = new SettingGroup(tab.containerEl);
		group.addSetting((s) => {
			s.setName(t("settings.changelog.showChangelogOnUpdate.name"));
			s.setDesc(t("settings.changelog.showChangelogOnUpdate.desc"));
			s.addToggle((toggle) => {
				toggle.setValue(showChangelogOnUpdate);
				toggle.onChange(async (b) => {
					await plugin.updateSettings((prev) => ({
						...prev,
						showChangelogOnUpdate: b,
					}));
				});
			});
		});
	}

	async showChangelog(plugin: FormulaForge): Promise<void> {
		const cmp = new Component();
		const modal = new ConfirmationModal(plugin.app);
		modal.containerEl.classList.add("markdown-preview-view");
		modal.setTitle(
			t("changelog.modalTitle", {
				pluginNameAndVersion: `${plugin.manifest.name} ${plugin.manifest.version}`,
			})
		);
		modal.onClose = () => {
			cmp.unload();
		};
		modal.open();
		await MarkdownRenderer.render(
			plugin.app,
			changelogEntry.entry,
			modal.contentEl,
			"",
			cmp
		);
		modal.setFooterCheckbox((checkbox) => {
			checkbox.setLabel(t("changelog.dontShowOnUpdate"));
			checkbox.setValue(!plugin.getSettings().showChangelogOnUpdate);
			checkbox.onChange((b) => {
				void plugin.updateSettings((prev) => ({
					...prev,
					showChangelogOnUpdate: !b,
				}));
			});
		});
		modal.addFooterButton((btn) => {
			btn.setButtonText(t("common.close"));
			btn.onClick(() => {
				modal.close();
			});
		});
		await plugin.updateSettings((prev) => ({
			...prev,
			seenChangelogVersion: plugin.manifest.version,
		}));
	}
}

class SemanticVersion {
	major: number;
	minor: number;
	patch: number;

	constructor(public version: string) {
		const [major, minor, patch] = version.split(".").map(Number);
		this.major = major;
		this.minor = minor;
		this.patch = patch;
	}

	isGreaterThan(other: SemanticVersion): boolean {
		if (this.major !== other.major) {
			return this.major > other.major;
		}
		if (this.minor !== other.minor) {
			return this.minor > other.minor;
		}
		return this.patch > other.patch;
	}
}
