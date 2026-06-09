import { Menu, Setting, stringifyYaml } from "obsidian";
import { ReorderSettingGroup } from "~/common/ReorderSettingGroup";
import { t } from "~/i18n";
import { FormulaForge } from "~/Plugin";
import { arrayMove } from "~/utils";
import { CustomFunctionEditorModal } from "./editor-modal";
import { CustomFunctionImportModal } from "./import-modal";
import { confirm } from "~/common/ConfirmationModal";
import { CustomFunction } from "./utils";

export class CustomFunctionsSettingGroup extends ReorderSettingGroup {
	constructor(
		public plugin: FormulaForge,
		public containerEl: HTMLElement,
		public reRenderTab: () => void
	) {
		super(containerEl);

		const settings = plugin.getSettings();

		this.onReorder((from, to) => {
			void (async () => {
				await plugin.updateSettings((prev) => {
					const copy = { ...prev };
					copy.customFunctions = arrayMove(copy.customFunctions, from, to);
					return copy;
				});
				reRenderTab();
			})();
		});

		this.setHeading(t("settings.customFunctions.groupheading"));
		this.createMoreButton();
		this.createAddButton();

		settings.customFunctions.forEach((customFunction, index) => {
			this.addSetting((s) => {
				this.setupSettingItem(s, customFunction, index);
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
					item.setIcon("lucide-import");
					item.setTitle(t("settings.customFunctions.importLabel"));
					item.onClick(() => {
						const modal = new CustomFunctionImportModal(this.plugin);
						modal.onClose = () => {
							const { shouldSave, functionDefinition } = modal;
							if (!shouldSave || !functionDefinition) return;
							void (async () => {
								await this.plugin.updateSettings((prev) => ({
									...prev,
									customFunctions: [
										...prev.customFunctions,
										functionDefinition,
									],
								}));
								this.reRenderTab();
							})();
						};
						modal.open();
					});
				});
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
								customFunctions: prev.customFunctions.toSorted((a, b) => {
									const aIsGlobal = a.scope === "Global";
									const bIsGlobal = b.scope === "Global";

									// sort global first
									if (aIsGlobal !== bIsGlobal) {
										return aIsGlobal ? -1 : 1;
									}

									const aName = aIsGlobal ? a.name : `${a.scopeType}.${a.name}`;
									const bName = bIsGlobal ? b.name : `${b.scopeType}.${b.name}`;

									return aName.localeCompare(bName);
								}),
							}));
							this.reRenderTab();
						});
					});
					submenu.addItem((subItem) => {
						subItem.setTitle(t("common.zToA"));
						subItem.onClick(async () => {
							await this.plugin.updateSettings((prev) => ({
								...prev,
								customFunctions: prev.customFunctions.toSorted((a, b) => {
									const aIsGlobal = a.scope === "Global";
									const bIsGlobal = b.scope === "Global";

									// sort global first
									if (aIsGlobal !== bIsGlobal) {
										return aIsGlobal ? -1 : 1;
									}

									const aName = aIsGlobal ? a.name : `${a.scopeType}.${a.name}`;
									const bName = bIsGlobal ? b.name : `${b.scopeType}.${b.name}`;

									return bName.localeCompare(aName);
								}),
							}));
							this.reRenderTab();
						});
					});
				});
				menu.addItem((item) => {
					item.setSection("danger");
					item.setWarning(true);
					item.setTitle(t("settings.customFunctions.deleteAllLabel"));
					item.setIcon("lucide-trash-2");
					item.onClick(() => {
						confirm({
							app: this.plugin.app,
							title: t("settings.customFunctions.deleteAllModal.title"),
							desc: t("settings.customFunctions.deleteAllModal.desc"),
							confirmLabel: t(
								"settings.customFunctions.deleteAllModal.confirmLabel"
							),
							onClose: async (isConfirmed) => {
								if (!isConfirmed) return;
								await this.plugin.updateSettings((prev) => ({
									...prev,
									customFunctions: [],
								}));
								this.reRenderTab();
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
			button.setTooltip(t("settings.customFunctions.addTooltip"));
			button.onClick(() => {
				let name = "myFunction";
				let i = 1;
				while (
					this.plugin.getSettings().customFunctions.find((f) => f.name === name)
				) {
					name = "myFunction" + i;
					i++;
				}
				const modal = new CustomFunctionEditorModal(
					this.plugin,
					{
						name,
						description: "",
						scope: "Global",
						scopeType: "Any",
						parameters: [],
						formula: "",
					},
					true
				);
				modal.onClose = () => {
					void (async () => {
						await this.plugin.updateSettings((prev) => ({
							...prev,
							customFunctions: [...prev.customFunctions, modal.customFunction],
						}));
						this.reRenderTab();
					})();
				};
				modal.open();
			});
		});
	}

	setupSettingItem(
		s: Setting,
		customFunction: CustomFunction,
		index: number
	): void {
		s.setName(
			customFunction.scope === "Global"
				? customFunction.name
				: `${customFunction.scopeType}.${customFunction.name}`
		);
		s.setDesc(customFunction.description);
		s.addExtraButton((button) => {
			button.setIcon("lucide-settings");
			button.setTooltip(t("common.edit"));
			button.onClick(() => {
				const modal = new CustomFunctionEditorModal(this.plugin, {
					...customFunction,
				});
				modal.onClose = () => {
					void (async () => {
						await this.plugin.updateSettings((prev) => {
							const copy = { ...prev };
							copy.customFunctions[index] = modal.customFunction;
							return copy;
						});
						this.reRenderTab();
					})();
				};
				modal.open();
			});
		});
		s.addExtraButton((button) => {
			button.setIcon("lucide-copy");
			button.setTooltip(t("settings.customFunctions.copyYamlTooltip"));
			button.onClick(async () => {
				const yaml = stringifyYaml(customFunction);
				await navigator.clipboard.writeText(yaml);
				new window.Notice(t("settings.customFunctions.copyYamlNotice"));
			});
		});
		s.addExtraButton((button) => {
			button.setIcon("lucide-x");
			button.setTooltip(t("common.delete"));
			button.onClick(() => {
				confirm({
					app: this.plugin.app,
					title: t("settings.customFunctions.deleteModal.title"),
					desc: t("settings.customFunctions.deleteModal.warning", {
						name: customFunction.name,
					}),
					confirmLabel: t("common.delete"),
					onClose: async (isConfirmed) => {
						if (!isConfirmed) return;
						await this.plugin.updateSettings((prev) => {
							const copy = { ...prev };
							copy.customFunctions = copy.customFunctions.filter(
								(_, i) => i !== index
							);
							return copy;
						});
						this.reRenderTab();
					},
				});
			});
		});
	}
}
