import { ReorderSettingGroup } from "~~/shared/reorder-setting-group";
import { t } from "~~/i18n";
import { FormulaForge } from "~~/plugin";
import { arrayMove } from "~~/shared/utils";
import { confirm } from "~~/shared/confirmation-modal";
import { Menu, Setting } from "obsidian";

import { GlobalFormulaEditorModal } from "./editor-modal";
import { GlobalFormula } from "../utils";
import { FormulaForgeSettingTab } from "~~/plugin/settings-tab";

export class GlobalFormulasSettingGroup extends ReorderSettingGroup {
	constructor(public plugin: FormulaForge, public tab: FormulaForgeSettingTab) {
		super(tab.containerEl);

		const settings = plugin.getSettings();

		this.onReorder((from, to) => {
			void (async () => {
				await plugin.updateSettings((prev) => {
					const copy = { ...prev };
					copy.globalFormulas = arrayMove(copy.globalFormulas, from, to);
					return copy;
				});
				this.tab.display();
			})();
		});

		this.setHeading(t("settings.globalFormulas.groupheading"));

		this.createMoreButton();
		this.createAddButton();

		settings.globalFormulas.forEach((globalFormula, index) => {
			this.addSetting((s) => {
				this.setupSettingItem(s, globalFormula, index);
			});
		});
	}

	createMoreButton(): void {
		this.addExtraButton((button) => {
			button.setIcon("lucide-more-horizontal");
			button.extraSettingsEl.addEventListener("click", (e) => {
				const menu = new Menu();
				menu.addSections(["", "danger"]);
				menu.addItem((item) => {
					item.setIcon("lucide-sort-asc");
					item.setTitle(t("common.sort"));
					const submenu = item.setSubmenu();
					submenu.setNoIcon();
					submenu.addItem((subItem) => {
						subItem.setTitle(t("common.aToZ"));
						subItem.onClick(async () => {
							await this.plugin.updateSettings((prev) => ({
								...prev,
								globalFormulas: prev.globalFormulas.toSorted((a, b) =>
									a.name.localeCompare(b.name)
								),
							}));
							this.tab.display();
						});
					});
					submenu.addItem((subItem) => {
						subItem.setTitle(t("common.zToA"));
						subItem.onClick(async () => {
							await this.plugin.updateSettings((prev) => ({
								...prev,
								globalFormulas: prev.globalFormulas.toSorted((a, b) =>
									b.name.localeCompare(a.name)
								),
							}));
							this.tab.display();
						});
					});
				});
				menu.addItem((item) => {
					item.setSection("danger");
					item.setWarning(true);
					item.setTitle(t("settings.globalFormulas.deleteAllLabel"));
					item.setIcon("lucide-trash-2");
					item.onClick(() => {
						confirm({
							app: this.plugin.app,
							title: t("settings.globalFormulas.deleteAllModal.title"),
							desc: t("settings.globalFormulas.deleteAllModal.desc"),
							confirmLabel: t(
								"settings.globalFormulas.deleteAllModal.confirmLabel"
							),
							onClose: async (isConfirmed) => {
								if (!isConfirmed) return;
								await this.plugin.updateSettings((prev) => ({
									...prev,
									globalFormulas: [],
								}));
								this.tab.display();
							},
						});
					});
				});
				menu.showAtMouseEvent(e);
			});
		});
	}

	createAddButton(): void {
		this.addExtraButton((button) => {
			button.setIcon("lucide-plus-circle");
			button.setTooltip(t("settings.globalFormulas.addTooltip"));
			button.onClick(() => {
				let name = "myFormula";
				let i = 1;
				while (
					this.plugin
						.getSettings()
						.globalFormulas.find(
							(f) => f.name.toLocaleLowerCase() === name.toLowerCase()
						)
				) {
					name = "myFormula" + i;
					i++;
				}
				const modal = new GlobalFormulaEditorModal(this.plugin, {
					name,
					description: "",
					formula: "",
				});
				modal.onClose = () => {
					void (async () => {
						await this.plugin.updateSettings((prev) => ({
							...prev,
							globalFormulas: [...prev.globalFormulas, modal.globalFormula],
						}));
						this.tab.display();
					})();
				};
				modal.open();
			});
		});
	}

	setupSettingItem(
		s: Setting,
		globalFormula: GlobalFormula,
		index: number
	): void {
		const { plugin } = this;
		s.setName(globalFormula.name);
		s.setDesc(globalFormula.description);
		s.addExtraButton((button) => {
			button.setIcon("lucide-settings");
			button.setTooltip(t("common.edit"));
			button.onClick(() => {
				const modal = new GlobalFormulaEditorModal(plugin, {
					...globalFormula,
				});
				modal.onClose = () => {
					void (async () => {
						await plugin.updateSettings((prev) => {
							const copy = { ...prev };
							copy.globalFormulas[index] = modal.globalFormula;
							return copy;
						});
						this.tab.display();
					})();
				};
				modal.open();
			});
		});
		s.addExtraButton((button) => {
			button.setTooltip(t("common.delete"));
			button.setIcon("lucide-x");
			button.onClick(() => {
				confirm({
					app: plugin.app,
					title: t("settings.globalFormulas.deleteModal.title"),
					desc: t("settings.globalFormulas.deleteModal.warning", {
						name: globalFormula.name,
					}),
					confirmLabel: t("common.delete"),
					onClose: async (isConfirmed) => {
						if (!isConfirmed) return;
						await plugin.updateSettings((prev) => {
							const copy = { ...prev };
							copy.globalFormulas = copy.globalFormulas.filter(
								(_, i) => i !== index
							);
							return copy;
						});
						this.tab.display();
					},
				});
			});
		});
	}
}
