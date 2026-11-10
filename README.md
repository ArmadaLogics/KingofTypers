# KEYWARD Web — use this folder for future updates

This is the editable, split version of the current game. No build step, npm install, framework, or external library is needed to host this version.

Current version: **v131.56 Supports V-VIII** (three Monk or Healer supports in every Chapter V-VIII stage, four in VI-10; Supply Clock with a shorter supplier timer and longer words each stage; Wildfire and Frost Nova as passive upgrades of Burn and Freeze with a 0.5 / 1 tile spread; Fire Wall preview; two-tile ramps in place of stairs on every chapter; Chapter VIII Muster buildings removed; quiver giver shown on its wood stand), built on v131.37-v131.55. The parent `index.html` and `KEYWARD-v131.56.html` have the same game code, but they do not include this folder's loading screen. See [release notes](../KEYWARD-v131.56-RELEASE-NOTES.md).

The page shell uses classic scripts, stylesheets and external media files, listed in `manifest.json`. Existing images and music retain their original bytes and quality. The optional standalone embeds all of them in one HTML file.

**Local art update, 6 November 2026:** Chapter V's Lamplit Vaults overworld uses the Chapter I terrain drawing with the approved teal palette and smooth grass ramps, plus generated crystal-mine objects on the existing authored map. The original game water is restored; the added scrolling water design was removed after reproducing its rendering slowdown. Serve this folder and open `#lamplit-vaults` for the direct review with temporary saves. This update is in the split game; the older standalone exports have not been regenerated. See `assets/biomes/lamplit-vaults/README.md` for asset provenance and `js/27-lamplit-overworld.js` for the chapter-scoped renderer.

The Lamplit road atlas now replaces the painted road band along the same 94 authored road cells. Straight, corner, end and junction tiles are baked into the map canvas at build time. A missing road atlas uses the prior painted-road fallback; the original water rendering is retained.

The loading screen appears directly from the page shell, before the main game script arrives. It uses the existing RegularPaper artwork with added grain and fibers, the original six-frame running pawn holding its axe, centered above the bar, and the asset pack's wooden BigBar_Base with matching BigBar_Fill. The bar is at most 648px wide and 17.85px tall, shrinking to fit smaller screens, preserving the end caps and stretching only the middle. Its only visible text is “Loading...” below the bar. Progress follows the existing image completion count and the screen clears immediately when the game is ready. Open `#loading-preview` to inspect it at 64%. Portrait/landscape layouts and a reduced-motion still pose are supported. The active paper-grain asset is `assets/images/loading-paper-grain.svg`. The butterfly artwork and original standalone exports are preserved.

## Put it on GitHub Pages

1. Upload the **contents of this folder** to the repository's publishing folder. For a site published from the repository root, `index.html`, `js`, `css`, and `assets` belong directly at that root. Keep the folder structure and filename capitalization.
2. Include `.nojekyll`. The `tools`, `package.json`, `PREVIEW.cmd`, `manifest.json`, and this README are maintenance files; they can stay in the repo but are not required by the game.
3. In the repository's **Settings → Pages**, select **Deploy from a branch**, your publishing branch, and **/(root)**. If you instead place the game in `/docs`, select `/docs`.
4. Visit the Pages URL after deployment. Upload the extracted files, not the ZIP: GitHub Pages does not unpack ZIP archives into websites.

GitHub browser uploads allow **25 MiB per file** and **up to 100 files at a time**. Every file here is below the size limit. Because this game has more than 100 files, use GitHub Desktop to copy/upload the folder in one update, or upload through the browser in batches of at most 100 files while retaining each file's directory. Keep the large standalone HTML outside the split website publishing folder.

Official instructions: [uploading files](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository), [Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

All game asset paths are relative, so the game works at a GitHub project URL such as `https://YOUR-NAME.github.io/YOUR-REPO/`.

## Keep updating this version

Treat **KEYWARD-Web** as the working game folder from now on. Make future changes here and upload the changed files to the same paths in your repo. There is no need to rebuild or recreate the large single-file HTML.

| File or folder | What to update |
| --- | --- |
| `index.html` | Page shell and script loading order |
| `js/00-loading-screen.js` | Loading progress, completion and design preview; load before the main game |
| `js/01-game.js` | Main gameplay, UI, asset map, skills, music, and existing integrated controllers |
| `js/02-brood-boss.js` | Brood boss |
| `js/03-spirit-boss.js` | Spirit boss |
| `js/04-skull-cleave.js` | Skull cleave |
| `js/05-fire-arrow.js` | Fire arrow art/controller |
| `js/06-glowburst.js` | Glowburst/orb controller |
| `js/07-ice-arrow.js` | Ice arrow art/controller |
| `js/08-thunder.js` | Thunder sprites and effects |
| `js/09-haunt-burst.js` | Haunt/explosion controller |
| `js/12-script.js` | v125 boss resistance and control strip |
| `js/13-script.js` | Shared chapter boss mechanics and redirected Stormward strikes |
| `js/14-poison-fog.js` | Approved poison-cloud motion, gradual spread and reduced bubbles |
| `js/15-poison-timing.js`, `blightmother-attacks.js`, `16-blightmother.js` | Poison exposure and current Blightmother attacks |
| `js/18-stormward-effects.js`, `19-stormward-weather.js`, `20-stormward-thunder.js` | Storm sprites, rain, environmental lightning and thunder |
| `js/21-turtle-water-ball.js`, `22-turtle-ball-demo.js` | Turtle freezing Downpour, translucent mist and isolated preview |
| `js/24-fletcher.js` | Original quiver supplier sprite and badge at the meat trading post |
| `js/27-lamplit-overworld.js` | Chapter V overworld asset replacement; original authored map/collisions retained |
| `js/23-mastery-gate.js` | Final Arrow Mastery purchase guard; keep last in script order |
| `js/00-preview-storage.js`, `10-lancer-preview.js`, `11-troll-preview.js` | Existing preview support |
| `css/game.css`, `css/preview.css` | Existing page and preview styles |
| `assets/images/` | PNG and WebP images |
| `assets/audio/` | Original WebM music |

Assets have stable filenames based on their original content hashes. Search for an asset filename in the scripts to find its assignment. You can replace its file in place, or give a replacement a new filename and change the matching path in the script. A new filename also helps browsers notice updated art. Do not paste base64 images or music back into the scripts.

The scripts use shared globals and load in their original order. Keep them as classic scripts; changing them to modules or adding `async` can break their dependencies. This is a packaging change, so existing gameplay and controls are preserved.

## Preview locally

**Easiest: double-click `PLAY.cmd`.** It needs nothing but Windows: it starts a small local server and opens the game in your browser. Keep its window open while you play. Do not double-click `index.html`; browsers block part of the art when a page is opened straight from a file.

If Node.js is installed, `PREVIEW.cmd` works too:

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

`manifest.json` records the initial import fingerprint and file inventory. Its `release` field identifies the current release and matching standalone export. The initial conversion was also verified by reconstructing the original HTML exactly, including script order, styles, and all embedded media.

To refresh the optional standalone after editing this folder, use the explicit exporter:

```powershell
npm run export:html -- ../KEYWARD-v131.14.html --overwrite
```

It embeds the current scripts, styles and manifest media in their page order, checks JavaScript syntax, and rejects unresolved local media. It leaves the editable web files external. Copy the verified export to the parent `index.html` when updating that launch copy as well.

## Current skills and saves

Burn, Freeze, Thunder, Venom Arrow and Gust Arrow affect only the enemy whose name you typed. A new run starts with no learned skills; learning an arrow equips the first empty slot. Every first stage clear awards one point, and a chapter boss awards three. Existing saves retain their free starter ranks and receive the points owed under the restored rewards once. Word usage carries across stages and sessions to reduce repeated names.

## Only if you receive a newer single-file game

The importer is an optional migration tool. Running it replaces the split game files, so use it only when the newer single-file HTML is the version you want to keep. Preserve any changes made in this folder first.

From inside this folder:

```powershell
node tools/import-html.cjs ../index.html --overwrite
node tools/check.cjs ../index.html
```

That second command performs the stricter source-equivalence check and expects no subsequent manual changes. The importer leaves unreferenced older assets on disk; remove them manually after confirming they are no longer used.

## v131 Blightmother

Chapter III stage XXX now uses the floating Blightmother. The three-second casting warning releases a four-second poison field. Normal clouds and the field share exposure; base damage is 10 HP at 2.4s, then 3.8s. Killing the boss clears its field. Confusion is disabled. The seven-heart boss and final three names remain.

Use index.html#blightmother-demo on your local server to try the final wave with normal player controls and combat. That shortcut keeps its saves in memory. The regular index.html keeps normal campaign saves. New controller: js/16-blightmother.js; timing: js/15-poison-timing.js; art: assets/bosses/blightmother/.


Super cadence: first warning after 12 seconds; 20 seconds of recharge after each field clears (27 seconds between warning starts). The 3-second warning and 4-second field are unchanged.

Normal boss attacks are connected: alternating Poison Bolt (0.8s windup, fixed aim, 10 HP) and Poison Meteor (fixed target marker, impact after 1.8s, 20 HP within 76px). Dodge the bolt or leave the meteor circle. Freeze pauses a pending cast; already released attacks continue. At least two normal attacks separate supers, and the field waits for normal hazards to clear. Confusion stays disabled. Existing field duration/exposure timing and poison resistance upgrades remain intact. Controller timing/collision is in js/blightmother-attacks.js; original accepted caster and effect sprites remain external.


Bouncing Poison: added as the first normal attack, then aimed bolt and meteor follow in rotation. A 0.8s cast releases a glob for up to three 0.72s hops (maximum 190px per hop). Each marked landing is fixed during flight; the next hop aims at the player's new position. Landing within the 48px marker deals 10 HP through native hit protection and bursts the glob. Airborne contact does not hurt. The glob clears after the third landing or boss/stage cleanup. The existing super delay/recharge, continuous poison-field exposure, disabled confusion, and absence of a blue safe area are preserved.


Visual adjustment: bouncing ball enlarged from 96px to 160px draw cells (about 67% larger), with a larger ground shadow. Per user request, bouncing landing circles and straight-projectile aiming lines have been removed. Damage, targeting, bounce timing and the super cooldown are unchanged.

## Stormward storm effects

Chapter IV's map and all ten campaign stages now use the approved rain, overcast terrain lighting, surface ripples, environmental lightning flashes and rolling thunder. Distant flashes precede their rumble by 0.8–1.3 seconds. Nearby bolts light the scenery at impact. The existing Clouds/Clear and Sound FX settings control the atmosphere; reduced motion suppresses environmental flashes. Blocking cards, focus loss and hidden tabs fade out thunder.

Overworld flashes use a clear lightning crack followed by a rolling tail, at a level close to the combat cue. Combat's distant ambience stays softer so it does not cover attack sounds. Map audio plays through the normal game loop after the first player interaction; it respects Sound FX mute and blocking pause cards.

Storm hazards now use the approved six-frame blue-white lightning and separate field-shock sprites. The plain ground warning keeps its fixed damage boundary and shrinking inner ring, without a numeric strike timer or charging aura. Lightning begins first; field damage and enemy stun follow 240 ms later. Native target placement, warning duration, damage amount and dodge behavior remain active. The Stormward boss retains its TURN words and redirected strikes, including the half-heart hit, two-second stun and final-word forgiveness when the redirected field lands.

Implementation: `js/18-stormward-effects.js`, `js/19-stormward-weather.js`, `js/20-stormward-thunder.js`, and `assets/effects/stormward/`. Native storm and boss hooks remain in `js/01-game.js` and `js/13-script.js`. Sprite-load failure keeps the original native warning and strike rendering available. Regular play keeps campaign saves and controls; the standalone preview toolbar and shield are not included.

Validation: `npm run check`, plus the parent `_build/check-stormward-web.cjs` browser test for all Chapter IV stages, normal and redirected boss strikes, dodge/damage timing, map lighting, delayed thunder, other chapters, small viewports and repository-relative media paths.

