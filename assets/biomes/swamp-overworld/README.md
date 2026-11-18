# Supplied swamp terrain — Chapter III overworld

The Chapter III (Blighted Span) overworld uses `Assets/Terrain/Tileset/NewThemes/Tilemap_swamp.png`, supplied by the user. The original source remains unchanged. Its olive moss, texture and green-gray stone are retained.

`terrain.png` is the prepared 576 × 384, 9 × 6 atlas for the game's existing 64px terrain roles. `_build/prepare-swamp-atlas.py` registers the swamp material against `Assets/Terrain/Tileset/Tilemap_color1.png`, which matches the atlas loaded in Chapter I byte for byte. Source and runtime hashes, palette mapping and semantic tile roles are in `atlas-provenance.json`.

**Alignment correction:** the generated sheet's grass cap originally stopped up to 7px before the cliff head, exposing lower ground. The runtime atlas now uses Chapter I's exact cap, cliff, corner and ramp masks. Native outlines and stone pixel clusters receive a swamp palette; the cliffs retain the native six-tone shading structure. The approved softer swamp texture is retained inside the native grass rim. This fixes the join without changing the renderer, map layout or gameplay collision data. The sampled cap/cliff gap is now zero, with zero alpha-mask differences against Chapter I across the atlas.

**Raised cliff artwork.** The left, middle, right and single tiles keep Chapter I's stone, outline and rim pixels in their original positions. One subdued swamp highlight follows the whole stone bevel across the grass cap and cliff face. The softer texture is applied to grass pixels on the raised tiles so the rim and stone details stay visible. Reference, previous adjustment and corrected game renders are in `output/swamp-cliff-reference-audit/`.

**Buildings.** The placements use Reed Cottage, Fisher Dwelling, Heron Watch and Reedwake Citadel from `Assets/Buildings/BiomeBuildings48/swamp`. Reed Cottage and Fisher Dwelling sit on separate steps of the widened southern shore. The renderer preserves the PNG proportions and uses the scaled bounds and ground anchors for collision, shadows and depth ordering.

Building contact shadows follow the pixel contours of their foundations, using the translucent blue-gray ink found in Chapter I's building sprites. The map bakes the masks beneath each structure and clips them to the receiving land or raised shelf.

**Watchtower pine.** The pine below Heron Watch uses the approved Sage Tips palette on its original 192 × 256 frame. Its footprint and the mirrored placement use the native foliage renderer.

**Road.** `roads.png` is the approved 4 × 4 packed-earth overlay, with one 64px tile for each N/E/S/W neighbor mask (bits 1/2/4/8). The map bakes it along the authored route. A missing atlas uses the existing painted road. The tile manifest and material study are in `output/swamp-road-tileset/`.

**Atmosphere.** Existing blight patches give off layered ground haze and rising wisps. The fog falls off naturally over the road and shoreline. Stage markers and the player draw above the fog. Reduced-motion mode holds the haze still and omits the bubbles.

**Lighting.** The ground uses an even amber grade, with a localized highlight on the citadel roof. The archer and supplier use cached amber sprite tints. The original poison bubbles rise and pop above the haze and below actors and stage markers.

**Cliff approaches.** Reedwake Citadel sits on a nine-tile-wide shelf and Heron Watch sits on a six-tile-wide shelf. The west ramp under the citadel and the east ramp under the tower use Chapter I's two-cell edge placement and the corresponding upper and lower slope tiles. The roads and stage entrances use their original positions.

**Softer mottling revision:** at the user's request, dark green surface spots are lifted toward a conservative image-generation color edit at 40% blend before geometry registration. That earlier color-only pass retains the generated source's alpha; the subsequent registration pass intentionally replaces cap, cliff and ramp geometry with the native template described above. The original `Tilemap_swamp.png` remains unchanged. The color study is preserved in `Assets/Terrain/Tileset/NewThemes/Revisions/SwampSoftMottle-v1/Color_Study.png`; its prompt and earlier before/after evidence are in `output/swamp-overworld-soft-mottle-2026-11-10/`.

`js/29-swamp-overworld.js` temporarily supplies the prepared atlas to the existing map builder only for Chapter III overworlds, including the poison controller's cached clean terrain. Original terrain references are restored before combat maps are built. Ground outside the viewport uses the same swamp sample. The existing water, foam, poison clouds, roads, props, map topology, stage nodes, supplier and collision data are retained.

Open the current split game's `index.html#swamp-overworld` through the local preview server for a direct review. That hash uses temporary in-memory saves. The normal game continues to use its existing saves. A missing or invalid swamp image falls back to the existing terrain renderer.

Current correction evidence is saved in `output/swamp-alignment-fix-2026-11-10/`: failing-then-passing grass/cliff regression, exact native contour checks, unchanged softer ground-interior pixels, native A/B fixtures, and desktop/mobile captures. The functional comparison loads both the old and repaired atlases with the same current game files so unrelated chapter changes cannot contaminate the result. CPU rendering is used for reproducible canvas hashes.

This changes the editable `KEYWARD-Web` build. Older standalone HTML exports are not regenerated.
