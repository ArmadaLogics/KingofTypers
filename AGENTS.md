# Working on KEYWARD Web

This folder is the editable split game for GitHub Pages. Make future game updates here when the user refers to this web version.

- Keep the page shell in `index.html`, code in `js/`, styles in `css/`, and media in `assets/`.
- Preserve the classic script loading order and shared globals. Do not add `async` or convert individual files to modules without updating their dependencies.
- Keep media external. Do not re-embed base64 images or audio into HTML or JavaScript.
- Paths must work beneath a repository URL such as `/repository/`; use relative asset paths.
- The parent `index.html` is the original single-file game. Editing this folder does not require changing that original.
- `tools/import-html.cjs` is an explicit migration tool. Do not run it during ordinary split-file development: it overwrites the generated game files.
- Run `npm run check` from this folder for syntax and package checks. A source path passed to `tools/check.cjs` enables the stricter initial migration check, which intentionally fails after manual game edits.
- Browser-test behavior changes. The initial packaging has desktop, mobile viewport, Lancer preview, Troll preview, and full media loading verification in the parent `_build/check-keyward-web.cjs`.
- When adding files, update `manifest.json` as needed for the maintenance checker and refresh the distributable ZIP with `tools/package.ps1` when requested.
