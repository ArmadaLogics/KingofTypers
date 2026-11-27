# Lamplit Vaults overworld art

Chapter V's existing 40×22 overworld, reskinned by `js/27-lamplit-overworld.js`.

The current overworld excludes placed crystals and dark stone props. Mushrooms draw at 65% of their previous width and keep their original aspect ratios. Player collision uses the smaller mushroom bounds, and the seven blue lanterns provide local lighting.

- `terrain.png`: the revised Moonlit Ruins atlas from `Assets/Terrain/Tileset/NewThemes/DarkOptions/Tilemap_dark_moonlit.png`, documented in `Proposals/LamplitVaultsChapter1Texture-v1/`. It follows actual Chapter I fine pixel texture with three close ground shades and fewer whole bright clusters, replacing the embedded pavers and larger tufts. Native 64×64 cells, 9×6 layout and both ramp orientations are retained.
- `cliff-variant.png`: an alternate straight cliff face with a wider fractured shelf. The upper 64×64 cell meets land and the lower cell meets water. A stable selection by map position mixes the variant into Lamplit Vaults cliff runs. The tile borders match the corresponding faces in `terrain.png`.
- `props.png`: generated 512×512 crystal-mine object atlas, unchanged from Atlas-v2. The current map uses its mushroom sprites. Removed props are excluded before map construction so their collision footprints are released.
- `moonlit-pine.png` is the approved slate-blue Chapter I recolor using the original 192×256 sprite frames. Three pines are baked into the overworld off the roads, with collision at their trunks.
- `roads.png`: the 256×256 slate-gray road overlay atlas from `Proposals/LamplitVaultsRoads-v2/`. Its 16 cells are 64×64, with neighbor bits N=1, E=2, S=4, W=8 selecting straights, turns, ends and junctions. The road uses a muted palette slightly lighter than the surrounding ground. All 94 road cells are baked once over flat terrain and under raised terrain and scenery. A missing or incorrectly sized road atlas restores the painted roads.
- Water uses the original game sea and foam renderer. The generated water texture, scrolling pattern and foam tint were removed after reproducing their rendering slowdown. Reduced motion suppresses animated foam for this overworld.
- `art.json`: source paths, approval reference, sprite rectangles and output hashes.

Terrain bottom caps and both ramp pieces use the atlas's native semantic cells. Terrain, roads, ten stage nodes, supplier and remaining scenery retain their authored positions. The adapter restores shared terrain, dressing and drawing hooks after constructing the overworld; only Chapter V's overworld uses the scenery removal. Other chapter maps and all combat maps are unchanged.

Art source: generated objects and Chapter I native drawing with a restrained moonlit palette. A **built-in image_gen** color study is normalized to eleven native swatches, and selected whole interior bright clusters are thinned. Current source art, normal-scale runtime screenshots, full-map overview and regression results are in `Proposals/LamplitVaultsChapter1Texture-v1/`. The overview screenshot uses a temporary overview camera in the capture harness; normal play keeps the native following camera.

Open the served game at `#lamplit-vaults` for a direct preview using isolated temporary save storage.

Scenery removal verification: `node _build/check-lamplit-no-wood.cjs`, with runtime captures and results in `Proposals/LamplitVaultsNoWood-v1/`. The check covers removed sprites, released collision, unchanged other maps, reachability and supplier trading.

**23 November 2026:** The two large crystal landmarks are removed from the current v132.18 web build. Medium and small crystals, all seven blue lanterns, roads and terrain retain their placements. Large-crystal source cells and hand-dressing are filtered before collision, lighting and reflection caches are built, releasing two formerly blocked cells and removing the associated light pools. The shared prop sheet is retained. Current regression evidence and normal-scale/full-map runtime captures are in `Proposals/LamplitVaultsNoLargeCrystals-v1/`; run `node _build/check-lamplit-no-large-crystals.cjs` to verify the change against the preserved pre-removal adapter.
