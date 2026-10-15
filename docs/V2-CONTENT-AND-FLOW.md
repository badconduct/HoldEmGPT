# Last Seat on Fortune Row: story and campaign flow

Working game title: **Last Seat on Fortune Row**. Short menu label: **Fortune Row**.
Tagline: **Five houses. One way to make your name.**

The campaign now implements this flow in the local application.
The names, copy, cast, voices, boss-policy briefs and asset paths are recorded in
[content/v2/campaign.json](../content/v2/campaign.json). They are loaded by the server through `lib/campaign-catalog.js`.
The original free-play mode remains available and version 1/2 saves retain it.

## First arrival

New Game -> Enter Name -> Choose Character -> Arrival Story -> Fortune Row Map
-> Open Casino -> Choose Table -> Win Four Ordinary Tables -> Boss Table
-> Earn Next Invitation -> Return to Map.

| Screen | What the player sees and does |
| --- | --- |
| Title | Game name, New Game, Load Game and Resume when available. |
| Name | Enter a printable name, up to 32 characters; continue to character selection. |
| Character | Ten portraits, presented as two pages of five. Each has a short background. All are cosmetic; everyone starts with $1,000. |
| Arrival | The chosen character's authored opening line, the shared story, and the player's name. One Continue button. |
| Map | Five cities appear on a travel chart. Only the Gilded Alibi in Las Vegas is open at the beginning. Other houses show the invitation required. |
| Casino | One room image, four ordinary table entries, a distinct boss table, progress stamps, cash, and a route back to the map. |
| Result | Show the actual whole-table result and cash settlement. A boss-table win leads to the pass-award scene. |
| Pass | An in-character concession, a named invitation, and the next casino opening on the map. The last boss awards the campaign title instead. |

Use separate pages for setup, story, map, casino selection and the existing poker
table. Keep the map as the campaign home, with compact links to Save, Load,
Invitations and Help. A returning player resumes the active table or map rather
than repeating onboarding. A new game explicitly starts a fresh campaign;
loading a save restores the recorded identity and progression.

## The five houses

| Order | Casino / city | Year | Boss | Signature | Reward |
| --- | --- | --- | --- | --- | --- |
| 1 | The Gilded Alibi / Las Vegas | 1947 | Evelyn "The Count" Rook | Value-led patience | Marigold Invitation |
| 2 | The Marigold Star / Hollywood | 1947 | Vincent "Velvet" Vale | Measured theatrical bluffs | Azahar Guest Card |
| 3 | Casa del Azahar / Mexico City | 1947 | Celeste Varela | Position and controlled traps | Lantern Letter |
| 4 | The Lantern Exchange / New York | 1947 | Leon Lark | Frequent small pressure | Brumes Invitation |
| 5 | Le Salon des Brumes / Paris | 1947 | Madeleine Desrosiers | Adapts to observed habits | Fortune Row Champion |

These are fictional houses in a single 1947 world. Fortune Row is a nickname
for the invitation circuit rather than a literal street. Paris is postwar.
Invitations include passage and a room, so travel adds no bankroll expense.
The original monochrome table and sepia portraits set the style throughout.
Each casino has four distinct ordinary table backgrounds, a boss-table
background and a separate selection room. Labels remain HTML.

## Arrival story

The first paragraph is personalized to the selected background. For example,
The Drifter begins:

> The bus left before dawn. You kept your suitcase, your stake, and a reason to
> see what lay beyond the station.

The shared continuation is:

> Las Vegas glows at the edge of the desert. You have $1,000, a change of clothes,
> and the kind of plan that sounds better after midnight.
>
> They call it Fortune Row: five private games, linked by introductions rather
> than streets. The Gilded Alibi is your first open door. Hollywood, Mexico City,
> New York and Paris keep their guest lists close.
>
> Win all four tables in a house, outlast its boss, and earn the next invitation.
> Passage and a room are included. You came to make a name that travels.
> Pick a chair, {name}.

Button: **Find your first game**.

The other nine backgrounds have their own arrival line. This copy is authored
and does not need an AI call. Insert the chosen name as text, preserving the
existing printable-name rules.

## Character selection

Keep the existing Drifter, Heiress, Pilot, Reporter and Crooner. Add the
Mechanic, Dancer, Tailor, Night Nurse and Gambler, each with a new matching sepia
portrait. Their backgrounds explain why they came; they do not grant different
cash, cards, betting powers or hidden information.

Five 72 x 90 thumbnails at a time fit the existing 740-pixel page. Put the
background beneath each choice and keep the selected portrait/name together
through the arrival story, game table and saves.

## Random tables and independent opponents

- Every casino has eight regulars and one named boss. The Gilded Alibi keeps the
  original eight regulars; the other four houses each receive eight new people.
- At an ordinary table, the server draws four different regulars from that
  casino's pool, without replacement, and randomizes their seat order.
- At a boss table, draw three different regulars from the same pool and add its
  fixed boss. Both table types have five seats including the player.
- Draw the lineup when buying into a new table. Do not redraw for a new hand,
  page navigation, view switching, retries or save loading. Save exact cast IDs,
  seats and independent memories alongside the table.
- Every regular has an individual role, playing style, aggression/looseness/bluff
  defaults, voice, mannerism and character prompt. The server uses these defaults
  for local bots and these prompts for model opponents. Difficulty still needs playtesting.
- Ordinary AI opponents keep independent prompts and memories. They receive
  only their own cards and the public state/history, including recent public
  remarks and observed betting tendencies. No other private cards or thoughts.
- Tells are occasional character flavor, not reliable hand-strength labels.
  Quotes should respond to the actual wager, action or conversation. Avoid
  turning every move into the same occupation metaphor.
- Bosses use authored server strategy and event-triggered dialogue. The content
  includes policy briefs and lines; `lib/bosses.js` implements the five policies
  against restricted public state, without model calls. They receive the same restricted information and obey
  normal legal-action validation and fair dealing.

## Table wins, invitations and recovery

Each casino has four ordinary table IDs with the planned buy-ins. Winning an
entire ordinary table records its permanent clear stamp. Hand wins do not clear
a table. All four stamps unlock the boss, while affordability still controls
entry. A stamped table remains available for another game.

An invitation is awarded only after the player wins the entire boss table.
Eliminating the boss while another opponent still has chips is not enough.
Award cash and progression once for that table instance. If the boss was
eliminated earlier, show its authored concession in the final result scene.

Passes include travel and a room. They are permanent records, never consumed on entry. Losing later does not
remove a pass, lock an earned casino or erase stamps. The fifth boss awards
**Fortune Row Champion** and a completion scene; cleared casinos remain replayable.
The existing [forgiving economy plan](V2-CAMPAIGN-PLAN.md) remains the balance
baseline, including cash/chip separation, affordable entries and house-stake
recovery. Starting the campaign does not buy into a table automatically.

## Review package

Run `node scripts/build-v2-content-preview.js` to build the offline walkthrough.
Open [artifacts/v2-content/index.html](../artifacts/v2-content/index.html) from the
workspace. Enter a name, choose among ten portraits and read the personalized
story before reaching the starting map. The cast catalog also exposes all five
houses and their authored pass scenes for content review. This preview does not
play poker or modify actual saves. Its temporary name/portrait choice lasts only
in the preview browser window.

Review checks covered all 55 portrait references, five linked casino definitions,
40 individual regular prompts, five boss briefs and all 44 preview pages. Every
new portrait JPEG is baseline RGB at 160 x 200 and below 13 KB. The generated browser
script parses as ES3. Native Windows MSHTML document mode 7 carried a chosen
name and avatar through to the correct arrival story, rendered the starting map
with one open venue, loaded the images and showed no horizontal overflow at
800 pixels. These checks do not replace a later physical Windows 98SE/IE6 test.

[Cast and portrait catalog](V2-CAST.md) lists every profile and final JPEG path.
[Artwork prompts](artwork/v2-1947-prompts.json) record the built-in imagegen
prompts and style references. Four eight-portrait atlas masters plus ten single
portraits produced 42 new JPEGs: 32 regulars, five bosses and five avatars. The
original eight opponents and five avatars are retained.

The new exports are opaque 160 x 200 baseline JPEGs; each is below 13 KB.
Original PNGs are copied into `artifacts/v2-1947-art/originals/` and retained in
the tool's generated-images folder. The export manifest records crop rectangles
and hashes. Production pages should load only visible portraits and one current
room/map background, using the proven table/card geometry. The
[artwork gallery](../artifacts/v2-content/artwork.html) links all 25 table
backgrounds with sample seats and cards. The
[boss gallery](../artifacts/v2-content/bosses.html) shows the five static
boss portraits at native size. See the [artwork catalog](V2-ARTWORK.md) for
all final assets, sizes and provenance.

Campaign state, scripted bosses, runtime navigation and version 3 saves are
implemented. Automated checks cover the full 25-win path, losses, checkpoints,
locked entries, cash settlement, restart and legacy compatibility. Native MSHTML
checks cover the actual onboarding/map/entry/table flow and 20 view switches.
A physical Windows 98SE/IE6 campaign run and production deployment remain pending.
