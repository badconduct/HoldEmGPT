# The Empty Chair: review corrections

Current new games use story rules version 4. This records the fixes from both
Astra reviews of PR #3, including the second review at `2df9e92`. The five-house
poker route, bankroll rules, optional providers and IE6 browser target remain.

## Second-review findings

| Finding | Implemented correction |
| --- | --- |
| Stale selection GET can mint a confirmation for another campaign | Selection forms, review URLs and change-selection links carry a case/recovery hash. The renderer validates it before accepting selections or issuing a confirmation. The review also identifies the reported victim. |
| Four truthful clues are sufficient but not necessary | Every truthful exhibit now provides a different incident-room exclusion. All four checks are needed to eliminate the other hotels, even after the guilty supplier is known. Identity and injury comparisons still establish the culprit, method and false record. |
| Shuffled reflections describe evidence not yet received | Reflections concern only the current object. They do not name another exhibit or announce a comparison's result. This also fixes affected historical review saves without changing their puzzle assignments. |
| Scene forms can cross snapshot branches | Every scene advance validates the case/recovery hash as well as its scene-position token. Repeated matching presses remain idempotent. |
| Identifying the fake is only an optional note | The bag can set one exhibit aside and restore it, retaining the full text. New-case final accounts require that choice and record it in the verdict. A choice inconsistent with the selected boss's public source is rejected before cash can change. |

The case/recovery hash is one-way: review URLs do not contain the recovery save
code. A stale GET, POST, scene advance or set-aside action rejects without
changing the active wallet, notes, scene or outcome. This includes loading a
snapshot of the same case as a new recovery branch.

## Clue structure

There are eleven authored variants: six murders and five staged-death schemes.
New standalone games retain the 20% staged chance and uniform responsible-boss
selection; linked successors use genuine murders. Each case has 24 valid
assignments. The guilty boss's house always supplies the sole false exhibit;
the four truthful packets are shuffled among the other houses at creation.

The four truthful packets carry separate recovery, room-key deposit,
photographic border, appointment-route or wardrobe checks. Each rules out one
different competing hotel. All five packets carry a room check, so a missing field cannot identify the
forgery. The false packet also misstates the location; its whole report must be
set aside, rather than selectively trusting an unverified component. Omitting a truthful packet therefore leaves its excluded hotel
as an alternative, with the same culprit, method and false supplier. This holds
for all 264 assignments, including public victim facts.

The physical reports still describe gunshots, blade wounds, blunt blows,
strangulation or a disputed pose. Their alternative readings and the account
comparisons identify the false record. Last Departure's false print now
misattributes the visitor; its truthful deposit account supplies the second
independent comparison needed to discredit that caption. Its actual victim,
culprit, hotel and weapon are unchanged in new cases.

The reference cards identify account seals and hotel marks. Generic room
furniture, illustrative images and a paying desk's heading do not identify the
incident hotel. New scene photographs have a neutral exhibit label. Each
necessary location comparison appears in readable HTML; no pixel examination
or LLM statement is required.

All four truthful exhibits are logically necessary. If the guilty house is last,
the four earlier truthful records can settle the answer before its packet is
collected; that is a valid deduction. All five deliveries are still needed to
file the accusation. Every other guilty-house position requires the final
truthful delivery to settle the location.

## Evidence and final account

Setting aside an exhibit saves a working assumption, with no correctness
feedback. The bag marks the choice and keeps its original image and report
readable. Restoring it clears the choice. Notebook edits and manual snapshots
preserve this state. The final account asks for boss, hotel, actual weapon or
staged death, and the rejected exhibit. Its confirmation shows the alleged
victim and the rejected exhibit's witnessed source.

A contradiction between the selected boss and rejected exhibit's public
supplier is a form error, not a forfeiture. A consistent but incorrect account
still produces the ambiguous loss ending. A correct account retains the cash,
explains the false assertion, cause, supplier and motive, and opens continued
poker. Table remarks remain optional context.

## Validation and review material

- `npm run check` includes the dealer, bankroll, provider, campaign and story regressions.
- An independent oracle reads printed comparisons and public reference cards. It checks all 264 assignments and all 32 observed subsets, with the supplier and public victim rules included.
- All 1,056 omissions of a truthful exhibit leave competing solutions; all four truths together identify the intended answer. The runtime checker agrees with the independent oracle.
- HTTP tests cover stale selection/review bookmarks, stale final submissions, notebook and set-aside actions, same-case snapshot branches, scene idempotency, required rejection, and unchanged wallets after rejection.
- Browser checks at 800x600 and 1024x768 cover set-aside presentation, stale GET selections and final forms, both endings, live-table reading and native forms without JavaScript.
- Historical story versions 1, 2 and 3 complete their original routes and endings under the current save validator.
- [Current paper dossiers, without answers](design/story-dossiers-v4.md).
- [Current reconstructions and solutions ? spoilers](design/story-solutions-v4.md).
- Rebuild the two current packets with `node scripts/build-story-dossiers.mjs`.
- Create separate fixtures with `node scripts/story-preview.mjs --serve --port 4186 --save-dir artifacts/story-v4-preview-saves --codes-file artifacts/story-v4-preview-codes.json`.

These checks establish consistency and regressions, not human enjoyment or
realistic forensic precision. A fresh reader should still assess atmosphere,
reading burden and difficulty. Chromium checks do not emulate IE6. Physical
Win98/IE6 and live-provider transcript testing remain separate review work.

## Preserved earlier corrections and boundaries

Earlier fixes still bind final POSTs and notebook edits, exclude victims from
ordinary false visitor alternatives, respect absent/arrested hosts in table
lineups and travel, and pair each permitted story reply with its question.
Every boss can be a genuine or apparent victim. The opening establishes the
false courier notice implicating the protagonist; the financial motives are
present in retained records and the case-specific ending.

Story versions 1-3 retain their original records, answers, victims, reveal
assignments and three-answer endings. Only unsafe reflections are replaced
with order-independent wording. Version 4 applies to new campaigns. Existing
ordinary campaigns and original free-play saves retain their flow.

The 68 baseline JPEG assets remain 530,691 bytes in total, largest 42,819 bytes.
No new image, browser dependency or provider configuration was added. The model
receives approved optional lines in its existing action request; it neither
receives the solution nor grades the verdict. The free-form banter filter is
still a conservative guard rather than a semantic guarantee.

This is an application review PR. Its workflow verifies a container but skips
image publication. No merge or Dockernet deployment is part of these fixes.
