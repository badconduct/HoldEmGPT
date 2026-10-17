# The Empty Chair: first playable story attempt

This is the implementation record for the review branch. Earlier v3 documents
remain design history and expansion plans. The 150-row assignment catalog is
an authoring draft; it is not the runtime randomizer.

## Included

New campaigns select from eleven authored variants: six murders covering every
responsible boss and every false-exhibit category, plus one staged-death variant
per boss. All suspects can be guilty; the actual hotel need not be their home
casino. Each variant has five readable records with exactly one false core
claim. Fresh standalone campaigns have a 20% staged-death chance; successor
campaigns use genuine murders. The revised version 2 dossiers choose between two
authored reveal orders per case, then save that order. These comparisons leave
multiple answers for every proper subset of the exhibits and one answer for the
complete set. Reference cards translate the initials, seals and hotel marks;
positive and negative comparisons narrow the possibilities without requiring
pixel inspection. All five bosses can be genuine victims or stage their deaths.
The original version 1 rules remain available to load first-draft review saves.

A separate test reads the printed comparison sentences and public reference
cards without using the private predicates. Both checks enumerate the 150
boss/hotel/weapon-or-no-murder answers. Neither check measures human enjoyment:
fresh-reader feedback and natural campaign pacing remain review work. See the
[review corrections](V3-REVIEW-REVISION.md) and [paper dossiers](design/story-dossiers-v2.md).

The opening always presents the same suitcase, $1,000 and unsigned letter.
Its three still/text panels lead to a two-panel case briefing. Every first
whole-boss-table clear saves the ordinary payout and one exhibit, then opens a
three-panel evidence sequence. The first four lead back to the map; the fifth
leads to accusation preparation. Reloads resume the current panel. Replaying an
old reveal reads it without issuing another award.

The Evidence Bag is a separate page linked from campaign pages and the table.
It contains five category slots, 240 x 160 item illustrations, readable attached
reports/transcripts, the framing letter, reliable suspect/hotel references and
optional saved working notes. Exhibits, references, notes, the briefing and
comparison help have separate ordinary page links. The letter is a personal effect, not a sixth case
exhibit. Uncollected forms and descriptions are not sent to the client. Gameplay
does not advance while the human is reading on their turn.

The accusation asks for the responsible boss, the hotel and the actual weapon.
The weapon list always includes "None - the death was staged." An explicit
review/confirmation warns that a wrong accusation ends the character's story and
forfeits their cash. A correct answer keeps the money and opens continued poker
at every house. Repeated boss wins cannot re-award the case or repeat its finale.
The confirmation and notebook forms carry the story and recovery-branch identity;
submitting a page from a different loaded save safely rejects before mutation.

A wrong answer clears the campaign wallet once and closes ambiguously on the
same suitcase, $1,000 and fixed letter. The End returns to the main menu. The
cash in that still never refunds the failed character. A new linked campaign
starts with the ordinary $1,000 and uses the failed protagonist's name/portrait as
its genuine murder victim. It generates a fresh case; the predecessor's culprit,
cash, cards and NPC memories are not copied. This successor excludes staged
boss death so the central victim remains consistent. The link belongs to the
campaign/save, never a global "last dead player" slot.

Victim bosses, whether genuinely or apparently dead, have an acting house
steward at their boss table. The house's existing scripted poker policy remains
in use. Old v3 campaign saves without a story keep their original invitation
flow; original free-play saves retain their prior rules.

## Table dialogue and providers

Story conversation is separate from ordinary poker banter. After two quiet
opening hands, an eligible hand has a 10% scheduling chance, with four complete
quiet hands between exchanges and at most two exchanges per whole table attempt.
An exchange involves at most two regulars and one question/reply pair. A reply
attaches to that NPC's next real action and can expire if the hand ends.

Topics refer only to generic uncertainty or already-collected evidence. The
server supplies approved lines, with replies restricted to the chosen question;
an API/ChatGPT opponent may select an allowed
line ID in its ordinary decision response. The server resolves the ID and uses
an authored fallback for absent/invalid choices. No extra speech-only call is
made. Local bots vary approved selections across hands without a network/model dependency.
Old pending exchanges expire when upgraded; their already published table history
remains intact. Newly entered open-circuit tables do not schedule unresolved-case talk.
Boss poker policies remain scripted. No LLM receives the case solution or grades
the accusation. A conservative filter blocks overt unsolicited mystery claims
in ordinary model remarks; free-form prose is not a semantic truth guarantee.

Provider settings and credentials use the existing documented server options.
No new API-specific URL, model requirement or browser AI setting is introduced.
Automated provider checks use local mock endpoints/CLI processes; this branch's
local review runs with built-in bots rather than production credentials.

## Artwork and rendering

Twenty-five original evidence illustrations, the suitcase, the empty corridor
and Elias Rook's portrait are generated with the built-in image tool. Five
arrival stills reuse prepared crops of the existing casino artwork. Final assets
live in `public/images/story/`; prompts and an export manifest live in
`docs/design/story-art-prompts.json` and `docs/design/story-artwork.json`.
Five revised scene prints show an indistinct covered figure, used in both genuine
and staged cases. They have separate versioned full/thumbnail files so old review
saves retain their original room illustrations. Their edit prompts are in
`docs/design/story-v2-art-prompts.json`. The 68 baseline JPEGs total 530,691 bytes;
the largest is 42,819 bytes. No high-resolution source is sent to a browser.

Only small baseline JPEG exports ship: evidence 240 x 160, separate 72 x 48
thumbnails, story stills 740 x 250 and Rook's portrait 72 x 90. HTML supplies all
essential writing. There is no browser scaling of large originals, SVG/canvas,
CSS animation, image filter or full asset preload. Normal document flow and
table layouts keep text outside images. Missing art leaves records readable.

Story form submissions work with the existing ES3/ActiveX client and also have
CSRF-token-protected ordinary POST/redirect behavior. Solutions, uncollected
records, authoring catalogs and local preview fixtures are not static routes.

## Reviewing locally

Run the normal application with `AI_MODE=local` and start a New Game, or create
isolated review saves to jump to a reveal, complete dossier, either ending,
open-ended play or the successor character:

```text
node scripts/story-preview.mjs --serve --port 4183
```

Open `http://127.0.0.1:4183/` and Load one of the printed codes. Fixtures and their
codes are written under ignored `artifacts/`, separate from normal `data/saves`.
The preview binds only to localhost, uses local bots and has no deployment step.
The fixture generator is not included in the container. Stop it with Ctrl+C.

Rebuilding art exports is optional development work requiring Python and Pillow:

```text
python scripts/prepare-story-art.py --sources PATH-TO-PRIVATE-SOURCE-MANIFEST.json
python scripts/prepare-story-art.py --revised-scenes PATH-TO-PRIVATE-V2-PHOTO-SOURCES.json
```

That manifest maps `w1`..`w5`, `r1`..`r5`, `p1`..`p5`, `l1`..`l5`, `c1`..`c5`,
`suitcase`, `corridor` and `rook` to original image paths. It is not a runtime
dependency and must not contain live credentials. Exporting never deletes an
original. The committed assets make Python/image generation unnecessary to run
or package the game.

## Validation record

The change adds full-route tests for all eleven cases, uniqueness of the declared
clue predicates, panel save/load, repeat-button idempotency, both outcomes,
continued poker, inherited-victim isolation, absent-boss lineups, evidence/notes
escaping, private-route exclusions, sparse local-bot talk and native form CSRF.
Existing poker, bankroll, provider, save, ES3/ActiveX, view-switching and MIDI
checks also remain required. Artwork checks validate dimensions, baseline JPEG
encoding, byte budgets and static delivery. `npm run check:browser` runs an
isolated Chromium regression at 800 x 600 and 1024 x 768, exercising both endings,
the bag during a real player turn, successor identity and script-free story
forms. It writes screenshots and a report to `artifacts/story-browser/`; CI
uploads those as `story-browser-review`. Install its development browser once
with `npx playwright install chromium` (CI uses `--with-deps`). It is not a runtime
dependency and never attaches to an existing browser profile.

Browser and container observations are recorded in the PR after they are run;
physical IE6 behavior requires a real machine check and is not implied by an ES3
parse or a modern browser screenshot. The first artwork pass found the Win98
machine offline; the revised story has not been run on physical IE6 hardware.
Production model credentials were not used.

No Dockernet infrastructure change, merge or deployment is part of this branch.
