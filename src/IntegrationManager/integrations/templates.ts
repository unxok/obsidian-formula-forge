import { around, dedupe } from "monkey-around";
import { EditorPosition, Editor, TFile } from "obsidian";
import { TemplatesPluginInstance } from "obsidian-typings";
import { FormulaForge } from "~/Plugin";
import { monkeyAroundKey } from "~/utils";
import { InternalPluginIntegration } from "../types";

export class TemplatesIntegration extends InternalPluginIntegration<"templates"> {
	constructor(plugin: FormulaForge) {
		super(plugin, "templates", "templates");
	}

	/**
	 * Patches the Templates core plugin such that any formula templates in the syntax "{{formula:<expression>}}" are replaced with their corresponding formula output
	 */
	public override async init(
		templatesPlugin: TemplatesPluginInstance
	): Promise<void> {
		const { workspace } = this.plugin.app;
		const extractFormulas = this.extractFormulas.bind(this);
		const insertFormulas = this.insertFormulas.bind(this);

		const uninstaller = around(templatesPlugin, {
			insertTemplate(old) {
				return dedupe(monkeyAroundKey, old, async function (templateFile) {
					// @ts-expect-error
					const that = this as typeof templatesPlugin;
					await old.call(that, templateFile);

					const { activeEditor } = workspace;
					if (!activeEditor) return;
					const { editor, file } = activeEditor;
					if (!editor || !file) return;
					const data = editor.getValue();
					const formulas = extractFormulas(data);
					insertFormulas(formulas, editor, file);
				});
			},
		});
		this.register(uninstaller);
	}

	/**
	 * Parses file content for formula templates and extracts their expression and positions
	 */
	extractFormulas(data: string): {
		start: EditorPosition;
		end: EditorPosition;
		formula: string;
	}[] {
		const extracted: ReturnType<typeof this.extractFormulas> = [];

		const indexToPos = (index: number): EditorPosition => {
			let line = 0;
			let ch = 0;

			for (let i = 0; i < index; i++) {
				if (data.charAt(i) !== "\n") {
					ch++;
					continue;
				}
				line++;
				ch = 0;
			}

			return { line, ch };
		};

		// TODO write unit tests for this

		charLoop: for (let i = 0; i < data.length; i++) {
			const currentChar = () => data.charAt(i);
			const nextChar = () => data.charAt(i + 1);
			const prevChar = () => data.charAt(i - 1);

			// ignore all chars until "{{" is found
			if (currentChar() !== "{" || nextChar() !== "{") {
				continue;
			}

			// found double braces
			const startIndex = i;

			// move past opening double braces
			i += 2;

			// look for identifier immediately after
			const IDENTIFIER = "formula:";
			const identifierEnd = i + IDENTIFIER.length;
			const identifier = data.slice(i, identifierEnd);
			if (identifier !== IDENTIFIER) continue;

			// move past the identifier
			i = identifierEnd;

			let formula = "";

			// add chars to formula until "}}" is found
			while (currentChar() !== "}" || nextChar() !== "}") {
				if (i === data.length) continue charLoop;

				formula += currentChar();

				// if not entering quotes, move on
				if (currentChar() !== '"' && currentChar() !== "'") {
					i++;
					continue;
				}

				// entering quotes, so remember it and move past
				const quoteChar = currentChar();
				i++;

				// add chars to formula until at end of quotes, but skip checking for "}}"
				while (currentChar() !== quoteChar || prevChar() === "\\") {
					if (i === data.length) continue charLoop;
					formula += currentChar();
					i++;
				}

				// reached end quote, add it and move past
				formula += currentChar();
				i++;
			}

			// move past closing braces
			i += 2;
			const endIndex = i;

			extracted.push({
				start: indexToPos(startIndex),
				end: indexToPos(endIndex),
				formula,
			});
			continue;
		}

		return extracted;
	}

	/**
	 * Replaces formula templates in a file with their outputs
	 */
	insertFormulas(
		formulas: ReturnType<typeof this.extractFormulas>,
		editor: Editor,
		file: TFile
	): void {
		const { api } = this.plugin;

		// do in reverse order to not mess up positions of subsequent replacements
		formulas.reverse().forEach(({ start, end, formula }) => {
			const formulaInstance = api.createFormula(formula);
			const output =
				formulaInstance.formula.type === "invalid"
					? "`" + formulaInstance.formula.getErrorMessage() + "`"
					: api.evaluateFormula(formulaInstance, file).toString();
			editor.replaceRange(output, start, end);
		});
	}
}
