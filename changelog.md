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

- Fixed ...

### Developers

- Something...

-->

## 1.2.2

### Other

- Updated valibot (dependency)
- Removed unused dependencies

## 1.2.1

### Other

- Removed unused CSS that was only for testing purposes
- Removed the "show changelog" feature (which was added in the last release) because I realized it's not that useful when I will often have to do tiny releases (like this very one) which drowns out actually useful changelog entries ¯\\(ツ)/¯.

## 1.2.0

### New

- Added the command "create-live-formula". This allows editing a formula with full autocomplete and results preview before inserting it into a note.
- Added the command "search-files-by-formula" which is basically the built-in quick switcher but it uses a formula to filter files.
- Added changelog popup after the plugin is updated. This can be disabled in the settings to prevent it from automatically opening. You can also run the command "show-changelog" at any time.
- There's now a setting to control how long to wait after the last file change before refreshing live formulas.

### Improvements

- Formula syntax highlighting now better matches the built-in highlighting in formula properties.
- Live formulas now have their formula text as a tooltip on hover.
- Live formulas will now only re-render if their output changes
- Formula editors within settings now have autocomplete suggestions.

### No longer broken

- Multiple live formula codeblocks now correctly highlight each block, rather than only the first.

## 1.1.2

### Improvements

- Improved the performance of the `files()` global function.

## 1.1.1

### Improvements

- Formula syntax highlighting now works in source mode.
- Formula codeblocks now render as wide as the full width of the note.

### No longer broken

- Fixed formula codeblock syntax highlighting not working consistently.

## 1.1.0

### New

- Added the **global function** `stableRandom()`. Use it to get a consistent random number between 0 and 1 based on the provided seed.
- Added formula syntax highlighting to inline-code, codeblocks, and settings. <!-- TODO update demo images and gifs -->

### No longer broken

- Fixed: Inline formula rendering now correctly renders lists on the same line.
- Fixed: Markdown rendered with `md()` in formula properties within the bases `List` view now correctly renders on the same line.
- Fixed: The global scope version of `then()` now behaves as expected when only one parameter is provided.
- Fixed: There is no longer an error in the dev console on vault startup if FF is enabled.

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
