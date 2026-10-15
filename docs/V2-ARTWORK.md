# Fortune Row artwork / 1947

The artwork follows the original monochrome poker room and sepia engraved
portraits. Las Vegas, Hollywood, Mexico City, New York and postwar Paris share
one 1947 setting. The original table and returning cast retain their designs;
superseded portraits and profiles have been removed.

Each casino has five individually generated table backgrounds: four ordinary
tables and a boss table. Different woodwork, rails, upholstery and room details
surround the same empty felt area and camera position. Each casino also has a
selection-room image showing its five tables. A travel map connects the cities.

| Location | Casino | Asset directory | Current boss portrait |
| --- | --- | --- | --- |
| Las Vegas | The Gilded Alibi | [gilded-alibi](../public/images/campaign/gilded-alibi/) | [Victor "The House" Maddox](../public/portraits/campaign/gilded-alibi/victor-maddox.jpg) |
| Hollywood | The Marigold Star | [marigold-star](../public/images/campaign/marigold-star/) | [Vincent "Velvet" Vale](../public/portraits/campaign/marigold-star/vincent-vale.jpg) |
| Mexico City | Casa del Azahar | [casa-azahar](../public/images/campaign/casa-azahar/) | [Celeste Varela](../public/portraits/campaign/casa-azahar/celeste-varela.jpg) |
| New York | The Lantern Exchange | [lantern-exchange](../public/images/campaign/lantern-exchange/) | [Leon Lark](../public/portraits/campaign/lantern-exchange/leon-lark.jpg) |
| Paris | Le Salon des Brumes | [salon-des-brumes](../public/images/campaign/salon-des-brumes/) | [Marcel "Le Patron" Duvall](../public/portraits/campaign/salon-des-brumes/marcel-duvall.jpg) |

Every background directory contains `table-1.jpg`, `table-2.jpg`, `table-3.jpg`,
`table-4.jpg`, `boss-table.jpg` and `room.jpg`. The map is
[travel-map.jpg](../public/images/campaign/travel-map.jpg). Names, prices,
locks and completion stamps remain HTML rather than text embedded in the art.

## Cast refresh

Each casino now draws from five male and three female regulars. Four bosses are
men and one is a woman. Ten player choices include six men and four women.
The [cast catalog](V2-CAST.md) records every current name, role, style and path.

The refresh adds 27 portraits: two bosses, five male regulars, all 15 remaining
female regulars and five player choices. Faces vary in age, shape, expression,
hair, glasses and clothing. Authored voices and tells match the new identities.
Victor is a desert bookmaker; Marcel is a Montmartre cabaret proprietor. Their
scripted policies and the campaign economy remain the same.

Campaign and free-play tables use the current cast. Superseded files and their
save-compatibility profiles have been removed. Local development saves were
cleared for the refresh. Versioned URLs request the revised art.

## Files for the legacy browser

| Asset group | Count | Native dimensions | Compressed size per file |
| --- | ---: | --- | --- |
| Table backgrounds | 25 | 740 x 300 | 31-38 KB |
| Casino selection rooms | 5 | 740 x 400 | 56-66 KB |
| Travel map | 1 | 740 x 400 | 72 KB |
| Retained campaign portraits | 21 | 160 x 200 | 9.5-12 KB |
| Refreshed portraits | 27 | 160 x 200 | 9,490-11,859 bytes |
| Current title collage | 1 | 740 x 250 | 57,182 bytes |

The manifest contains 80 current exports. All are
opaque, 8-bit, three-channel baseline JPEGs. Use native background dimensions,
the existing fixed card geometry and small portrait display sizes. Load one
current background and only visible portraits. The refresh adds no animation,
filters, transparency or client JavaScript.

The opening menu uses the revised
[boss collage](../public/images/campaign/boss-collage-v2.jpg), showing the current
five bosses against their city backdrops. It remains one 740 x 250 image, with
New Game and Load side by side below. Titles, labels and forms remain HTML.

## Review and provenance

Run `node scripts/build-v2-content-preview.js` to generate the local
[artwork gallery](../artifacts/v2-content/artwork.html),
[boss gallery](../artifacts/v2-content/bosses.html) and
[story walkthrough](../artifacts/v2-content/index.html). The artwork gallery
links all 25 tables with the existing seat and card markup.

The original campaign used 45 PNG masters from the built-in **imagegen** tool,
referencing the original table, Ada and Rail portraits. Its
[original prompt set](artwork/v2-1947-prompts.json) and the
[first title-collage prompt](artwork/title-boss-collage.json) remain historical
records; source paths describe the files present when those images were made.
Superseded reference portraits are no longer shipped. Mechanical crops, resizing and baseline JPEG export produced the
browser files; no external artwork was downloaded.

The [cast-refresh prompt set](artwork/cast-refresh-1947-prompts.json) records the
27 new portraits and the revised collage, also made with built-in imagegen.
Portraits reference Ada and Rail; the revised collage references the original
collage and both new boss portraits. Large PNG masters remain under ignored
`artifacts/cast-refresh-1947/originals/`. Earlier masters remain under
`artifacts/v2-1947-art/` and `artifacts/title-screen/`.

[content/v2/artwork.json](../content/v2/artwork.json) records final paths,
dimensions, byte sizes, export quality and SHA-256 hashes. These large working
masters are not required by the browser. Gameplay checks cover current saved casts,
fresh table selection, scripted bosses and campaign progression. Native Windows
MSHTML mode 7 passed onboarding, all five casino rooms, local opponent turns,
20 view switches and the full portrait gallery at 800 pixels wide. New Game and
Load remain visible in an 800 x 450 viewport. A physical Windows
98SE/IE6 acceptance run remains the final browser check for this refresh.
