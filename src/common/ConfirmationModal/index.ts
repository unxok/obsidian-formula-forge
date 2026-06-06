import { App, ButtonComponent, Modal } from "obsidian";

export class ConfirmationModal extends Modal {
	buttonContainerEl: HTMLElement;
	checkbox: Checkbox | undefined = undefined;
	constructor(app: App) {
		super(app);

		this.buttonContainerEl = this.modalEl.createDiv({
			cls: "modal-button-container",
		});
	}

	setFooterCheckbox(cb: (checkbox: Checkbox) => void): this {
		this.checkbox = new Checkbox(this.buttonContainerEl);
		cb(this.checkbox);
		return this;
	}

	addFooterButton(cb: (btn: ButtonComponent) => void): this {
		const btn = new ButtonComponent(this.buttonContainerEl);
		cb(btn);
		return this;
	}
}

class Checkbox {
	inputEl: HTMLInputElement;
	labelEl: HTMLLabelElement;
	labelTextNode: Node;
	onChangeCallback: (value: boolean) => void = () => {};
	constructor(public containerEl: HTMLElement) {
		this.labelEl = containerEl.createEl("label", { cls: "mod-checkbox" });
		this.inputEl = this.labelEl.createEl("input", {
			attr: {
				tabindex: "-1",
				type: "checkbox",
			},
		});
		this.labelTextNode = document.createTextNode("");
		this.labelEl.appendChild(this.labelTextNode);
		this.inputEl.addEventListener("change", () =>
			this.onChangeCallback(this.inputEl.checked)
		);
	}

	setLabel(label: string): this {
		this.labelTextNode.textContent = label;
		return this;
	}

	setValue(checked: boolean): this {
		this.inputEl.checked = checked;
		return this;
	}

	onChange(cb: (value: boolean) => void): this {
		this.onChangeCallback = cb;
		return this;
	}
}

export const confirm = ({
	app,
	title,
	desc = "",
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onClose,
}: {
	app: App;
	title: string;
	desc?: string | DocumentFragment;
	confirmLabel?: string;
	cancelLabel?: string;
	onClose: (isConfirmed?: boolean) => void | Promise<void>;
}) => {
	let isConfirmed = false;
	const modal = new ConfirmationModal(app);
	modal.setTitle(title);
	modal.setContent(desc);
	modal.addFooterButton((button) => {
		button.setButtonText(cancelLabel);
		button.onClick(() => {
			modal.close();
		});
	});
	modal.addFooterButton((button) => {
		button.setButtonText(confirmLabel);
		button.setWarning();
		button.onClick(() => {
			isConfirmed = true;
			modal.close();
		});
	});
	modal.onClose = () => {
		void onClose(isConfirmed);
	};
	modal.open();
};
