# Guttered Vaults overworld artwork

Implemented only on Chapter VI's overworld by `js/26-guttered-overworld.js`.

- Terrain comes from `Proposals/GutteredVaults/Overworld-Implementation-v1/Source/terrain-approved.png`, copied from the user's latest `exec-5f0a6446-2f23-4427-a0a0-28ef2d2ffe0d.png` attachment (SHA256 `53d7e7c222699b99b863ecb96e8129017f0e2456b6852bf13760f0b7b155809f`). Fourteen measured source blocks are fitted independently to the native 9x6 layout. A uniform sheet resize incorrectly included the next cliff row. Flat/top tiles retain native footprint masks; cliff/slope tiles retain their own rock silhouette instead of the original grass fringe. No recoloring is applied. Props/water reuse the earlier reviewed art pack; water is darker.
- Chapter VI raised tops use soil rows above a single native cliff face, avoiding a doubled blue cap. Each ramp replaces the upper rectangular soil cell and draws the two existing slope pieces with a dark cut following their alpha. The diagonal begins inside the platform; no new staircase artwork or collision change is introduced.
- `trail.png`: actual 4x4 trail atlas derived from the reviewed generated sheet. N/E/S/W bits are 1/2/4/8. Matching sockets share identical edge strips. No painted map screenshot is used as a terrain or collision map.
- House/tower/castle: transparent image-generation adaptations of the accepted building designs, then alpha-trimmed and fitted to native sprite canvases. The castle includes two blue-flame sconces.
- `tree.png`: reviewed Chapter I conifer variant. Three trees are planted away from route interaction points.
- Runtime mist reuses three existing Blighted Span `poisonCloud` textures, tinted neutral white at 0.075 opacity. It has no poison controller, bubbles, damage or spreading behavior. Reduced motion freezes the new ambient effects.
- `art.json` records the source hashes, sprite frame/bounds/foot specifications and trail layout.

Art source: **host_image**. Generation route: built-in **image_gen**. Gameplay map layout and collisions remain native data. Only the house is moved inland and the reviewed castle shelf is flattened; stage nodes, roads, supplier and all combat maps retain their authored positions/rules.

Source sheet and prompt: `Proposals/GutteredVaults/Overworld-Implementation-v1/Source/` in the workspace.
