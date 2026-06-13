import { Range } from "@codemirror/state";
import { Decoration } from "@codemirror/view";
import { parser } from "@lezer/javascript";

// certain things are commented out because Obsidian natively doesn't mark them
// I'm not sure why they don't mark all the tokens correctly... I asked why in the discord here:
// https://discord.com/channels/686053708261228577/840286264964022302/1514568255644110969

/**
 * A map of formula token CSS class name -> JS node names
 */
const nameClassMappingObj: Record<string, string[]> = {
	operator: [/* "CompareOp", */ "ArithOp"],
	punctuation: [".", ",", "(", ")", "[", "]"],
	// boolean: ["BooleanLiteral"],
	number: ["Number"],
	string: ["String"],
	property: ["PropertyName", "VariableName"],
	// regex: ["RegExp"],
};

/**
 * A map of JS node name -> formula CSS class name
 */
const nameClassMapping: Record<string, string> = Object.entries(
	nameClassMappingObj
).reduce((acc, [name, jsNames]) => {
	jsNames.forEach((jsName) => {
		acc[jsName] = name;
	});
	return acc;
}, {} as Record<string, string>);

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

	const jsTree = parser.parse(text);
	jsTree.iterate({
		from: 0,
		to: jsTree.length - 1,
		enter: (node) => {
			if (node.from - node.to === 0) return;

			const className = nameClassMapping[node.name];
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
