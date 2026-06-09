# Contributing

Thanks in advance for wanting to contribute to Formula Forge <3

## Creating issues

Probably the easiest way to help out is to [open an issue](https://github.com/unxok/obsidian-formula-forge/issues/new/choose) for a bug you found, a feature you'd like, or a question you have.

## Pull requests

Before starting/submitting a PR, I would prefer you open an issue to give some context and allow you and I to have a discussion about it to make sure we align on the goal before you spend time working on the PR.

### A note on building the project locally...

I have it setup to copy the build files to my local testing vault, so make sure to edit `vite.config.ts` and replace `../formula-forge-vault/.obsidian/plugins/formula-forge/` with the relative path to vault you want to use.

## Translations

To add support for a language, follow these steps:

1. Make a fork of the repository
2. Make a copy of `src/i18n/languages/en.json` in that same directory and rename it to the [ISO 639 language code](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes) of your target language
3. Edit `src/i18n/index.ts`:
   1. Copy the `import...` line at the top of the file, replacing the language code as needed, and place it at after the other lines similar to it. Example: `import es from "./languages/es.json";`
   2. Copy the `window.i18next.addResoureBundle...` line, replacing the language code and name as need, and place it below the other lines similar to it. Example: `window.i18next.addResourceBundle("es", ns, es); // Español`
4. Now replace each string of text in your `.json` file with the translation in your target language
   1. Any time you see `{{something}}`, that means that specific text is dynamically added at runtime, so don't translate it.
5. Finally, make a Pull Request with your changes!
