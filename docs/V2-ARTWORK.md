# Fortune Row artwork / 1947

The replacement set follows the original monochrome poker room and sepia
engraved portraits. Five locations share one 1947 setting: Las Vegas, Hollywood,
Mexico City, New York and postwar Paris. The rejected decade-themed images have
been removed. The original table background, eight opponents and five player
portraits are preserved unchanged.

Each casino has **five individually generated table backgrounds**: four ordinary
tables and a boss table. These are separate images, with different woodwork,
rails, upholstery and room details. Their camera and empty felt area follow the
original table so the existing HTML seats, cards and pot can sit above them.
Each casino also has a selection-room image showing four ordinary tables and
one boss table. A new travel map connects the five cities.

| Location | Casino | Asset directory | Static boss portrait |
| --- | --- | --- | --- |
| Las Vegas | The Gilded Alibi | [gilded-alibi](../public/images/campaign/gilded-alibi/) | [Evelyn "The Count" Rook](../public/portraits/campaign/gilded-alibi/evelyn-rook.jpg) |
| Hollywood | The Marigold Star | [marigold-star](../public/images/campaign/marigold-star/) | [Vincent "Velvet" Vale](../public/portraits/campaign/marigold-star/vincent-vale.jpg) |
| Mexico City | Casa del Azahar | [casa-azahar](../public/images/campaign/casa-azahar/) | [Celeste Varela](../public/portraits/campaign/casa-azahar/celeste-varela.jpg) |
| New York | The Lantern Exchange | [lantern-exchange](../public/images/campaign/lantern-exchange/) | [Leon Lark](../public/portraits/campaign/lantern-exchange/leon-lark.jpg) |
| Paris | Le Salon des Brumes | [salon-des-brumes](../public/images/campaign/salon-des-brumes/) | [Madeleine Desrosiers](../public/portraits/campaign/salon-des-brumes/madeleine-desrosiers.jpg) |

Every directory above contains `table-1.jpg`, `table-2.jpg`, `table-3.jpg`,
`table-4.jpg`, `boss-table.jpg` and `room.jpg`. The travel map is
[travel-map.jpg](../public/images/campaign/travel-map.jpg). Names, prices,
locks and completion stamps remain HTML rather than text embedded in the art.

The portrait set includes five static bosses, 32 new regulars and five new
player choices. Original characters remain available, giving 40 regulars,
five bosses and ten player choices. The [cast catalog](V2-CAST.md) records
every name, role, style and portrait path.

## Files for the legacy browser

| New assets | Count | Native dimensions | Compressed size per file |
| --- | ---: | --- | --- |
| Table backgrounds | 25 | 740 x 300 | 31–38 KB |
| Casino selection rooms | 5 | 740 x 400 | 56–66 KB |
| Travel map | 1 | 740 x 400 | 72 KB |
| Regular portraits | 32 | 160 x 200 | 9.5–12 KB |
| Boss portraits | 5 | 160 x 200 | 10–12 KB |
| Extra player portraits | 5 | 160 x 200 | 10–12 KB |

All 73 exports are opaque, 8-bit, three-channel baseline JPEGs. Table and room
images are monochrome; portraits retain the original warm paper. Use native
background dimensions, the existing fixed table/card geometry and small portrait
display sizes. Load one current background and only visible portraits. No PNG
transparency, filters, animation or preload of the whole collection is needed.

## Review and provenance

Run `node scripts/build-v2-content-preview.js` and open the local
[artwork gallery](../artifacts/v2-content/artwork.html). It links all 25 table
previews, each with the original seat and card markup over its own background.
The [boss gallery](../artifacts/v2-content/bosses.html) shows all five static
portraits at native resolution. The [story walkthrough](../artifacts/v2-content/index.html)
includes the new travel map and separate casino-selection rooms.

The built-in **imagegen** tool generated 45 PNG masters using the original
table, Ada and Rail portraits as references. Table variants also reference their
new casino's first table. The [complete prompt set](artwork/v2-1947-prompts.json)
records every prompt and its project-relative reference images. Mechanical
cropping, resizing, grayscale conversion and baseline JPEG export produced the
shipping files; no external artwork was downloaded.

[content/v2/artwork.json](../content/v2/artwork.json) records final paths,
dimensions, byte sizes, export quality and SHA-256 hashes. PNG masters and crop
metadata remain under ignored `artifacts/v2-1947-art/`. These large working
files are not required by the browser.

Review covers the exported artwork, portrait crops, local links and sample table
geometry: 73 JPEG headers/hashes, 44 preview pages and 868 local links passed.
Native Windows MSHTML document mode 7 rendered all 25 table scenes with five
seats each, no overlaps or horizontal overflow at 800 pixels, and all four
border edges visible on 325 sample cards. Original asset hashes are unchanged.
These checks are useful compatibility evidence; the
implemented campaign still needs a physical Windows 98SE/IE6 acceptance run.
Runtime navigation uses these same assets, with scripted bosses and version 3
saves. Production deployment remains separate work.
