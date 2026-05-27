<center>
  <img src="https://github.com/unxok/obsidian-formula-forge/blob/main/assets/formula-forge.png" />
</center>
<br />

# Formula Forge

> [!NOTE]
> UNDER CONSTRUCTION

Render bases formulas in your notes, define global formulas and functions, and more formula-related features.

## Formula rendering

You can render formulas in your notes in inline code or a codeblock.

By default, the inline code syntax is an equals sign. For example:

```
`=2+2`
```

By default, the codeblock language is "bases-formula". For example:

````
```bases-formula
2+2
```
````

## Global formulas

In the plugin settings, you can define global formulas which can be accessed in any base or formula in your vault.

![global formula demo](todo)

## Custom functions

In the plugin settings, you can define custom functions which can accept typed parameters and be used in any base or formula in your vault.

## API

FF provides an API for some formula-related features in your own plugins and scripts. See below for an overview of its use.

For the full type definition, see [src/Api/api.ts](https://github.com/unxok/obsidian-formula-forge/blob/main/src/Api/api.ts).

```ts
// access the API
const { api } = app.plugins.plugins["formula-forge"];

// ensure the API is ready for use (because it's loaded asynchronously)
// do this when accessing the API in things like startup scripts
api.on("ready", () => {
	// do some stuff...
});

// evaluate a formula
const output = api.evaluateFormula(
	"this.file.path", // the formula to eval
	app.vault.getFileByPath("path/to/note.md") // the file to use as `this`
);

// render formula output to the DOM
output.renderTo(myEl, app.renderContext);

// get the actual value of a formula's output
const raw = api.normalizeFormulaValue(output);
typeof raw === "string"; // true
```
