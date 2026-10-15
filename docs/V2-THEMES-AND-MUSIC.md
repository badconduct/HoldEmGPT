# Fortune Row: locations, scripted bosses and music

The current direction is an international private-poker circuit in **1947**.
Las Vegas, Hollywood, Mexico City, New York and postwar Paris share the original
monochrome rooms and sepia engraved portraits. Fortune Row is the players'
nickname for the circuit. Invitations include passage and a room, keeping travel
costs out of the forgiving bankroll plan.

| City | Casino | Visual identity | Scripted boss |
| --- | --- | --- | --- |
| Las Vegas | The Gilded Alibi | Desert hotel, dark walnut, restrained luxury | Victor Maddox, desert bookmaker: patient value betting |
| Hollywood | The Marigold Star | Private studio supper club, theatrical lighting | Vincent Vale, the Headliner: measured bluffs |
| Mexico City | Casa del Azahar | Urban salon, carved wood, tiles and courtyard details | Celeste Varela, the Hostess: position and controlled traps |
| New York | The Lantern Exchange | Manhattan private club, tailored Art Deco details | Leon Lark, the Operator: frequent small pressure |
| Paris | Le Salon des Brumes | Restored postwar salon, paneled walls and muted elegance | Marcel Duvall, cabaret proprietor: adapts to public betting habits |

Each casino has four ordinary table backgrounds, a boss-table background and a
separate selection room. The cast and room details change while table geometry,
portrait sizes and card frames remain consistent. See the [artwork catalog](V2-ARTWORK.md)
and [story and flow](V2-CONTENT-AND-FLOW.md).

## Scripted bosses

Boss moves come from server strategy code with authored hand selection,
bet sizing, traps and bluff rules. Seeded randomness can vary choices and make
tests reproducible. The current content defines policy briefs and dialogue;
the executable strategies live in `lib/bosses.js`. Ordinary cast members retain
independent model prompts and memories.

Bosses receive their own cards, the board, public history/statistics and legal
actions. They use ordinary shuffling, chip accounting and dealer validation.
Authored dialogue templates respond to real arrivals, actions, showdowns and
results; verified public state supplies names and amounts. Their remarks enter
the shared conversation so regular characters can respond. A boss concedes and
awards the pass only after the player wins its entire table.

## Music remains an audio acceptance task

The user reported that the original MIDI opened but produced no audible sound
on either machine. Structural validation did not establish working playback.
This artwork pass does not change the soundtrack or claim that the issue is
resolved.

Before composing or selecting a full soundtrack, compare the original with one
known-audible standard General MIDI file: play directly on the Windows 98SE
machine, through a minimal IE6 page, then through the game. Check audible start,
stop, looping and the remembered Off preference. If direct playback is silent,
check the selected MIDI output and its mixer. If direct playback works, inspect
the browser's load/control path.

Keep the eventual soundtrack quiet and instrumental, with simple piano or small
ensemble arrangements suited to the shared 1940s setting. Begin with one track
per location after playback works. An original composition remains a valid
option and avoids adding a third-party composition credit. If using outside
music, record the composer, arranger/sequencer, source, reuse terms, required
credits, edits and file hash before bundling it. A free download alone does not
establish those terms.

Preserve a simple On/Off control and load only the current music. Any rendered
audio fallback needs its own size, playback and instrument-bank review. Actual
track selection, listening and real-machine playback remain future work.
