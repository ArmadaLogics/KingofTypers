# Guttered Vaults overworld artwork

Implemented only on Chapter VI's overworld by `js/26-guttered-overworld.js`.

- Terrain comes from `Proposals/GutteredVaults/Flooded-Overworld-v1/Tilemap_guttered_vaults.png`. It adapts Blighted Span's soft mottling and cliff facets to charcoal ground, muted teal moss and blue-gray slate. The 576×384 atlas preserves the native 9×6 layout and exact 64 px tile masks.
- Water uses the chapter's flat `#0b0f16` sea color and the existing shoreline foam.
- Raised tops, cliffs and ramps use the native Chapter I assembly rules with the textured Chapter VI atlas.
- `trail.png`: actual 4x4 trail atlas derived from the reviewed generated sheet. N/E/S/W bits are 1/2/4/8. Matching sockets share identical edge strips. No painted map screenshot is used as a terrain or collision map.
- House/tower/castle: the Wickkeeper Cottage, Tidewatch Spire and Floodlock Citadel from the approved Guttered Vaults concept direction. Active art is under `structures-v2/`; the earlier three building sprites are retained here as legacy sources. The citadel PNG has two empty cups. `js/30-guttered-structures.js` draws the approved flame strip at the two cup anchors at 12 fps, with a four-frame phase offset. Reduced motion holds both poses. Stage torches are separate.
- `tree.png`: reviewed Chapter I conifer variant. Three trees frame the pools and east bank. Small groups of shoreline plants leave clear gaps around tree crowns, buildings, paths and ramps. Trees, bushes, and planted shoreline props receive short shadows derived from their base silhouettes.
- Cold Moonlight shades the terrain, buildings, archer and Fletcher. Softer wall and roof contrast and thinner exterior ink bring the structures closer to the trees under moonlight. The building pass preserves warm window cores and draws translucent shadows from each foundation’s silhouette, following the Blighted Span technique. The Sky setting toggles low blue mist along the banks.
- [`structures-v2/art.json`](structures-v2/art.json) records the active building dimensions, placement offsets and sconce animation. The parent [`art.json`](art.json) records terrain and prop provenance, legacy building specifications and the trail layout.

Terrain source: the Chapter III swamp atlas. Props and trail reuse the reviewed art pack. Gameplay map layout and collisions remain native data. Only the house is moved inland and the reviewed castle shelf is flattened; stage nodes, roads, supplier and all combat maps retain their authored positions/rules.

Earlier art sources and prompts are in `Proposals/GutteredVaults/Overworld-Implementation-v1/Source/`.
