# Formula Forge

> [!NOTE]
> UNDER CONSTRUCTION

Render bases formulas in your notes, define global formulas, API for custom functions, and more formula-related features.

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

## Custom functions

In the plugin settings, you can define custom functions which can accept typed parameters and be used in any base or formula in your vault.

## API

```ts
const { api } = app.plugins.plugins["formula-forge"];

// if using something that runs on vault startup,
// do the following to ensure the API is ready for use
api.on("ready", () => {
	// do some stuff...
});

// evaluate a formula
api.evaluateFormula(
	"this.file.path", // the formula to eval
	app.vault.getFileByPath("path/to/note.md") // the file to use as `this`
);
```
