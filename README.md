# KEYWARD Web — use this folder for future updates

This is the editable, split version of the current game. The original `../index.html` was left unchanged. No build step, npm install, framework, or external library is needed to host this version.

The original HTML was **37,737,854 bytes**. The new `index.html` is **994 bytes**, and the game files total **28,655,782 bytes** (about 24% smaller before HTTP compression). The largest individual file is **2,337,362 bytes**. Images and music retain their original bytes and quality.

## Put it on GitHub Pages

1. Upload the **contents of this folder** to the repository's publishing folder. For a site published from the repository root, `index.html`, `js`, `css`, and `assets` belong directly at that root. Keep the folder structure and filename capitalization.
2. Include `.nojekyll`. The `tools`, `package.json`, `PREVIEW.cmd`, `manifest.json`, and this README are maintenance files; they can stay in the repo but are not required by the game.
3. In the repository's **Settings → Pages**, select **Deploy from a branch**, your publishing branch, and **/(root)**. If you instead place the game in `/docs`, select `/docs`.
4. Visit the Pages URL after deployment. Upload the extracted files, not the ZIP: GitHub Pages does not unpack ZIP archives into websites.

GitHub browser uploads allow **25 MiB per file** and **up to 100 files at a time**. Every file here is below the size limit. Because this game has more than 100 files, use GitHub Desktop to copy/upload the folder in one update, or upload through the browser in batches of at most 100 files while retaining each file's directory. Do not upload the old 37.7 MB HTML alongside this version.

Official instructions: [uploading files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

All game asset paths are relative, so the game works at a GitHub project URL such as `https://YOUR-NAME.github.io/YOUR-REPO/`.

## Keep updating this version

Treat **KEYWARD-Web** as the working game folder from now on. Make future changes here and upload the changed files to the same paths in your repo. There is no need to rebuild or recreate the large single-file HTML.

| File or folder | What to update |
| --- | --- |
| `index.html` | Page shell and script loading order |
| `js/01-game.js` | Main gameplay, UI, asset map, skills, music, and existing integrated controllers |
| `js/02-brood-boss.js` | Brood boss |
| `js/03-spirit-boss.js` | Spirit boss |
| `js/04-skull-cleave.js` | Skull cleave |
| `js/05-fire-arrow.js` | Fire arrow art/controller |
| `js/06-glowburst.js` | Glowburst/orb controller |
| `js/07-ice-arrow.js` | Ice arrow art/controller |
| `js/08-thunder.js` | Thunder sprites and effects |
| `js/09-haunt-burst.js` | Haunt/explosion controller |
| `js/00-preview-storage.js`, `10-lancer-preview.js`, `11-troll-preview.js` | Existing preview support |
| `css/game.css`, `css/preview.css` | Existing page and preview styles |
| `assets/images/` | PNG and WebP images |
| `assets/audio/` | Original WebM music |

Assets have stable filenames based on their original content hashes. Search for an asset filename in the scripts to find its assignment. You can replace its file in place, or give a replacement a new filename and change the matching path in the script. A new filename also helps browsers notice updated art. Do not paste base64 images or music back into the scripts.

The scripts use shared globals and load in their original order. Keep them as classic scripts; changing them to modules or adding `async` can break their dependencies. This is a packaging change, so existing gameplay and controls are preserved.

## Preview locally

With Node.js installed, double-click `PREVIEW.cmd`, then open `http://127.0.0.1:8080/`. Or run these commands inside this folder:

```powershell
npm start
```

Stop the server with Ctrl+C. Use an HTTP server for local testing, just as GitHub Pages will serve the game.

## Check changes

Inside this folder:

```powershell
npm run check
```

This checks script syntax, the extracted file inventory, and file sizes. It reports how many tracked game files differ from the initial import; intentional edits are allowed. Add new script or stylesheet tags in `index.html` and update the manifest inventory if you expand the package. A browser playtest is still needed for gameplay changes.

`manifest.json` records the source fingerprint and file inventory. The initial conversion was also verified by reconstructing the original HTML exactly, including script order, styles, and all embedded media.

## Only if you receive a newer single-file game

The importer is an optional migration tool. Running it replaces the split game files, so use it only when the newer single-file HTML is the version you want to keep. Preserve any changes made in this folder first.

From inside this folder:

```powershell
node tools/import-html.cjs ../index.html --overwrite
node tools/check.cjs ../index.html
```

That second command performs the stricter source-equivalence check and expects no subsequent manual changes. The importer leaves unreferenced older assets on disk; remove them manually after confirming they are no longer used.
