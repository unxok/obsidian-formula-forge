# Changelog

Each release should include an entry detailing the changes made since the last
release. Some specific details may be omitted for brevity.

<!--

## <version>

### New

- Added...

### Improvements

- Something: Now does a thing

### No longer broken

- Fixed: ...

### Developers

- Something...

-->

## 1.1.0

### New

- Added the **global function** `stableRandom()`. Use it to get a consistent random number between 0 and 1 based on the provided seed.
- Added formula syntax highlighting to inline-code, codeblocks, and settings. <!-- TODO update demo images and gifs -->

### Improvements

- Something: Now does a thing

### No longer broken

- Fixed: Inline formula rendering now correctly renders lists on the same line.
- Fixed: Markdown rendered with `md()` in formula properties within the bases `List` view now correctly renders on the same line.
- Fixed: The global scope version of `then()` now behaves as expected when only one parameter is provided.
- Fixed: There is no longer an error in the dev console on vault startup if FF is enabled.

### Developers

- Something...

## 1.0.0

### New

- Added **formula rendering** in notes by starting inline code with an equals sign (which can be changed in the plugin settings).
- Added **formula rendering** in notes by setting the language of a codeblock as `bases-formula` (which can be changed in the plugin settings).
- Added **global function** `files()` to get all files in the vault.
- Added **global function** `md()` to render a markdown string as HTML.
- Added **global functions** `define()` and `then()` to allow defining and using local variables in a formula.
- Added ability to define **global formulas** in the plugin settings which can be accessed from any base or formula.
- Added ability to define **custom functions** in the plugin settings which can be accessed from any base or formula.

### Developers

- An API is available to use formulas in your own custom js and scripts. See the docs for more details.
- Included example of how to setup a Templater integration. See the docs for more details.
