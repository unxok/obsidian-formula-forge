import { AbstractInputSuggest, setIcon } from "obsidian";

export type Suggestion = {
	title: string | DocumentFragment;
	note?: string | DocumentFragment;
	aux?: string | DocumentFragment;
	icon?: string;
};

export abstract class InputSuggest<T> extends AbstractInputSuggest<T> {
	/**
	 * Get the suggestions for the popover
	 * @note Make sure to utilize `this.setFilterCallback`
	 */
	protected abstract getSuggestions(query: string): T[] | Promise<T[]>;

	/**
	 * Convert a suggestion value of type `T` to the `Suggestion` type
	 */
	protected abstract parseSuggestion(value: T): Suggestion;

	/**
	 * Renders suggestions
	 */
	renderSuggestion(value: T, el: HTMLElement): void {
		const { title, aux, note, icon } = this.parseSuggestion(value);
		el.classList.add("mod-complex");
		if (icon) {
			const iconEl = el
				.createDiv({ cls: "suggestion-icon" })
				.createSpan({ cls: "suggestion-flair" });
			setIcon(iconEl, icon);
		}
		const contentEl = el.createDiv({ cls: "suggestion-content" });
		contentEl.createDiv({
			cls: "suggestion-title",
			text: title,
		});
		if (note !== undefined) {
			contentEl.createDiv({ cls: "suggestion-note", text: note });
		}
		if (aux !== undefined) {
			el.createDiv({ cls: "suggestion-aux" }).createSpan({
				cls: "suggestion-flair",
				text: aux,
			});
		}
	}
}
