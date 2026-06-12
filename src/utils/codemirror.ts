import { Range } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import { parser } from "@lezer/javascript";

/**
 *
 * @param text The formula text to apply syntax highlighting to
 * @param offset The offset from the start of the document to the start of the provided text
 * @returns A set of decorations
 */
export const createFormulaSyntaxHighlighting = (
	text: string,
	offset: number
): Range<Decoration>[] => {
	const decorations: Range<Decoration>[] = [];

	// certain things are commented out because Obsidian natively doesn't mark them
	// I'm not sure why they don't mark all the tokens correctly... I asked why in the discord here:
	// https://discord.com/channels/686053708261228577/840286264964022302/1514568255644110969
	const nameClassMappingObj: Record<string, string[]> = {
		operator: [/* "CompareOp", */ "ArithOp"],
		punctuation: [".", ",", "(", ")", "[", "]"],
		// boolean: ["BooleanLiteral"],
		number: ["Number"],
		string: ["String"],
		property: ["PropertyName", "VariableName"],
		// regex: ["RegExp"],
	};
	const nameClassMapping = Object.entries(nameClassMappingObj);

	const jsTree = parser.parse(text);
	jsTree.iterate({
		from: 0,
		to: jsTree.length - 1,
		enter: (node) => {
			if (node.from - node.to === 0) return;

			const className = nameClassMapping.find(([_className, names]) =>
				names.contains(node.name)
			)?.[0];
			if (!className) return;

			decorations.push(
				Decoration.mark({
					class: "token " + className,
				}).range(offset + node.from, offset + node.to)
			);
		},
	});
	return decorations;
};
