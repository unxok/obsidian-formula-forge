import {
	App,
	TFile,
	FormulaContext,
	BasesEntry,
	Value,
	View,
	EventRef,
	Constructor,
} from "obsidian";
import {
	BasesContext,
	// BasesController as BasesControllerBase,
	BasesController,
	BasesFilter,
	EmbedComponent,
	EmbedContext,
} from "obsidian-typings";
import type { default as i18next } from "i18next";

type BasesControllerResults = Map<TFile, BasesEntry>;

interface EmbedBaseComponent extends Omit<EmbedComponent, "loadFile"> {
	controller: BasesController;
	containingFile: TFile | null;
	containerEl: HTMLElement;
	loadFile(): Promise<void>;
}

type BasesFormulaPart =
	| BasesFormulaPartArithmetic
	| BasesFormulaPartComparison
	| BasesFormulaPartNot
	| BasesFormulaPartFunction
	| BasesFormulaPartPrimitive
	| BasesFormulaPartIdent
	| BasesFormulaPartObjectAccess
	| BasesFormulaPartArray
	| BasesFormulaPartInvalid;

interface BasesFormulaPartBase {
	type: string;
	getValue(): unknown;
}

export interface BasesFormulaPartFunction extends BasesFormulaPartBase {
	type: "function";
	name: string;
	subject: BasesFormulaPart | null;
	args: BasesFormulaPart[];
	getValue(ctx: BasesEntry): Value;
}

interface BasesFormulaPartArithmetic extends BasesFormulaPartBase {
	type: "arithmetic";
	operator: "+" | "-" | "*" | "/" | "%";
	left: BasesFormulaPart;
	right: BasesFormulaPart;
}

interface BasesFormulaPartComparison extends BasesFormulaPartBase {
	type: "comparison";
	operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "&&" | "||";
	left: BasesFormulaPart;
	right: BasesFormulaPart;
}

interface BasesFormulaPartNot extends BasesFormulaPartBase {
	type: "not";
	expr: BasesFormulaPart;
}

interface BasesFormulaPartPrimitive extends BasesFormulaPartBase {
	type: "primitive";
	value: boolean | string | number | null | undefined;
	getValue(): Value;
}

interface BasesFormulaPartIdent extends BasesFormulaPartBase {
	type: "ident";
	id: "this" | ({} & string);
}

interface BasesFormulaPartObjectAccess extends BasesFormulaPartBase {
	type: "object_access";
	object: BasesFormulaPart;
	index: string;
}

interface BasesFormulaPartArray extends BasesFormulaPartBase {
	type: "array";
	elements: BasesFormulaPart[];
}

interface BasesFormulaPartInvalid extends BasesFormulaPartBase {
	type: "invalid";
	parseError: string | undefined;
	value: string;
	getErrorMessage(): string;
}

interface BasesControllerResultsValueNote {
	data: Record<string, unknown>;
	icon: string;
	lazyEvaluator: (...e: unknown[]) => unknown;

	equals(e: unknown): unknown;
	get(property: string): unknown;
	getInsensitive(e: unknown): unknown;
	isEmpty(): unknown;
	isTruthy(): unknown;
	keys(): unknown;
	objectAccess(e: unknown): unknown;
	valuesRaw(): unknown;
}

type FormulaFunctionParam<T extends Value> = {
	name: string;
	type: readonly Constructor<T>[];
	variadic?: boolean;
	optional?: boolean;
	customWidget?: string;
};

type FormulaFunctionParamToValue<P> = P extends {
	type: readonly Constructor<infer T>[];
}
	? T
	: never;

type FormulaFunctionParamsToArgs<P extends readonly FormulaFunctionParam[]> = {
	[K in keyof P]: FormulaFunctionParamToValue<P[K]>;
};

declare module "obsidian-typings" {
	interface EmbedRegistryEmbedByExtensionRecord {
		base: (
			context: EmbedContext,
			file: TFile,
			viewName?: string
		) => EmbedBaseComponent;
	}

	class BasesFormula {
		constructor(formula: string);

		formula: BasesFormulaPart;
		text: string;
		getValue(localContext: FormulaContext | null): Value;
	}

	interface BasesPropertyMenu {
		updateFormula(name: string, formula: BasesFormula): void;
	}

	interface BasesController {
		results: BasesControllerResults;
		view: View & {
			config: {
				order: string[];
			};
			updateVirtualDisplay(): void;
		};
		updateSearchQuery(query: BasesQuery): void;
		buildBasesContext(filter: BasesFilter | null): BasesContext;
	}

	interface BasesQuery {
		toString(): string;
		filters: BasesFilter | null;
	}

	class BasesContext {
		constructor(
			app: App,
			filter: BasesFilter | null,
			formulas: Record<string, BasesFormula>,
			file: TFile
		);

		// new (app: App,
		// 	filter: BasesFilter | null,
		// 	formulas: Record<string, BasesFormula>,
		// 	file: TFile): BasesContext;

		formulas: Record<string, BasesFormula>;
		local: FormulaContext | null;
		regenerateLocal(): FormulaContext;
	}

	// TODO open PR to obsidian-typings. Currently have to manually enter this in package
	interface PromisedQueue {
		queue: {
			promise: {
				promise: Promise<unknown>;
				resolve: () => unknown;
				reject: () => unknown;
			};
			runnable: {
				running: boolean;
				cancelled: boolean;
				onStart: () => unknown;
				onStop: () => unknown;
				onCancel: () => unknown;
			};
		};
	}

	interface MetadataEditor {
		focusProperty(property: string): void;
	}
}

declare module "obsidian" {
	interface SettingGroup {
		components: unknown[];
		controlEl: HTMLElement;
		headerEl: HTMLElement;
		headerInnerEl: HTMLElement;
		listEl: HTMLElement;
		searchContainerEl: HTMLElement | undefined;
	}

	interface Value {
		constructor: {
			type: string;
		};
	}

	interface ListValue {
		data: Value[];
	}

	interface RegExpValue {
		regexp: string;
	}

	interface PrimitiveValue<T> {
		data: T;
	}

	interface ObjectValue {
		data: Record<string, unknown>;
	}

	interface BasesEntry extends FormulaContext {
		// new (ctx: BasesContext, file: TFile): BasesEntry;

		app: App;
		file: TFile;
		frontmatter: Record<string, unknown>;
		note: BasesControllerResultsValueNote;

		getByIdentifier(identifier: string): Value;
		getRawProperty(property: string): unknown;
		getValue(identifier: string): Value;
		ctx: BasesContext;
	}

	interface Plugin {
		registerGlobalFunc<const P extends readonly FormulaFunctionParam[]>(func: {
			ctx: null;
			docString: () => string;
			name: string;
			params: P;
			applyWithContext: (
				ctx: BasesEntry,
				...args: FormulaFunctionParamsToArgs<P>
			) => Value;
		}): void;

		registerInstanceFunc<const P extends readonly FormulaFunctionParam[]>(
			value: Constructor<Value>,
			func: {
				ctx: null;
				docString: () => string;
				name: string;
				params: P;
				applyWithContext: (
					ctx: BasesEntry,
					...args: FormulaFunctionParamsToArgs<P>
				) => Value;
			}
		): void;
	}

	interface Component {
		_events: (EventRef | (() => void))[];
	}
}

declare global {
	interface Window {
		i18next: typeof i18next;
	}
}
