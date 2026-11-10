# Lamplit Vaults overworld art

Chapter V's existing 40×22 overworld, reskinned by `js/27-lamplit-overworld.js`.

- `terrain.png`: `Proposals/LamplitVaultsAtlas-v2/Lamplit_Vaults_Terrain_Atlas.png`, preserving Chapter I's native grass edges, caps and cliff drawing with the dark teal/navy palette inspired by the approved ramps. Its four ramp cells use `Teal-Grass-Ramps-v1/Grass_Ramps_Atlas.png` unchanged. This is the selected smooth teal-grass design (`exec-3d24e485-195c-487c-8c1c-9cdd32965717.png`), not the stepped variant. 64×64 cells, 9×6 layout, native alpha preserved.
- `props.png`: generated 512×512 crystal-mine object atlas, unchanged from Atlas-v2. Existing scenery slots draw crystals, rock/fungi variants, mine entrances, a timber frame/cart, support posts and torches, preserving native anchor/collision data.
- `roads.png`: the approved 256×256 road overlay atlas from `Proposals/LamplitVaultsRoads-v1/`. Its 16 cells are 64×64; neighbor bits N=1, E=2, S=4, W=8 select straights, turns, ends and junctions. All 94 existing road cells are baked once over flat terrain and under raised terrain/scenery. A missing or incorrectly sized road atlas restores the previous painted roads without disabling the other biome art.
- Water uses the original game sea and foam renderer. The generated water texture, scrolling pattern and foam tint were removed after reproducing their rendering slowdown. Reduced motion suppresses animated foam for this overworld.
- `art.json`: source paths, approval reference, sprite rectangles and output hashes.

Terrain bottom caps and both ramp pieces use the atlas's semantic cells. Native map tiles/decor/roads, ten stage nodes, supplier, all colliders and combat maps remain authoritative. The adapter restores shared terrain and drawing hooks after constructing the overworld; only Chapter V's overworld consumes these assets.

Art source: generated objects and Chapter I native drawing with a generated teal/navy palette, route **built-in image_gen**. The terrain update is in `Proposals/LamplitVaultsAtlas-v2/`. Native-scale runtime screenshots, full-map overview and regression results are also in `Proposals/LamplitVaultsOverworld-v1/`. The overview screenshot uses a temporary overview camera in the capture harness; normal play keeps the native following camera.

Open the served game at `#lamplit-vaults` for a direct preview using isolated temporary save storage.
