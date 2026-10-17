# The Empty Chair: review corrections

This is the revision after the independent review of PR #3, head d60e3a7.
New campaigns now use story version 3, including the subsequent requested
cause-of-death descriptions and guilty-house source rule. Story version 2 is
retained for already-issued review saves. The poker engine, entry prices, payouts,
five-house route, optional provider settings and IE6 browser target are retained.

## Corrections

| Review finding | Result |
| --- | --- |
| Stale accusation can end another loaded case | Accusation and notebook submissions carry the story ID and recovery-branch ID. The server checks them before mutation. Both native forms and XHR reject stale pages; a matching duplicate verdict remains idempotent. |
| Victim selected as their own visitor | Revised ordinary cases have explicit living suspect alternatives. Historical first-draft alternatives also exclude the victim while preserving their original answer. |
| Travel dialogue expects a dead boss | Story travel/result lines use public absence and resolution state. They name an acting steward where appropriate and never consult hidden guilt to change a pre-verdict line. |
| Reply does not fit its question | Saved question indexes restrict the available reply IDs and fallback. All question/reply groups and save-shaped continuations are checked. |
| Exhibits directly repeat the answer | Six revised murders and five disappearance schemes use complementary account, location, method and exclusion comparisons. Reference cards translate marks into suspects/hotels. |
| Final houses add only duplicate confirmations | Version 2 retains two authored orders and ambiguity for all proper subsets. The later requested rule links the false exhibit to the guilty house in version 3; early deductions are now allowed. All five records remain necessary to file an accusation. |
| Victim portrait reveals staging on replay | Every boss can now be a genuine murder victim or an apparent victim in a staged case. The separate non-boss auditor and inherited-player victim remain genuine murder cases. A finite authored library can still be learned. |
| Stakes and motives appear only in the ending | Briefing and retained documents establish the false courier notice, held dispatch, threatened records and distinct financial dispute. Endings explain the specific contradiction and connect the corrected account to clearing the player. |
| Fake photograph only depicts an empty room | Five versioned scene prints now contain an indistinct covered figure, used in both real and staged cases. A staged print depicts a dressed form; no graphic injury or tiny image detail is required. |
| Evidence Bag requires excessive scrolling | Separate ordinary links open exhibits, reference cards, notes, the framing letter/briefing and optional comparison help. No modern client layout or scripting dependency was added. |
| Inflated test headline | npm scripts discover only `test/*.test.js`, excluding ignored exported copies. Report the actual current tests. |

## Clue design and checks

There are still eleven authored variants, with a 20% staged-death chance for new
standalone campaigns and uniform responsible-boss selection. Successor campaigns
use genuine murders. Each new case fixes its sole false exhibit to the responsible
boss's house, then shuffles the four truthful exhibits among the other houses.
All 24 assignments per case are valid. The assignment is saved and validated;
loading a game cannot move the false exhibit or change its source.

Scene reports describe the reported fatal wound or cause: a gunshot, narrow blade
injury, blunt blow, or pressure at the throat. Damaged copies explicitly retain
alternatives rather than claiming a certainty the comparisons cannot support.
A substituted report can contain a true detail alongside its false attribution.
Staged-death certifications remain disputed reports, not independent proof of a
body. The ending states the established cause and identifies the false source.

The briefing, delivery scenes and Evidence Bag establish the witnessed source
rule. The guilty boss's house supplies the false exhibit even if an acting
steward delivers it. The other four houses' records are truthful. Source labels
are public facts, not extra undisclosed evidence. This allows earlier deductions
than the version 2 rule, so the implementation no longer claims every incomplete
set stays ambiguous. All five must still be collected and inspected before the
final accusation. Generic stage reflections preserve uncertainty even if the
wardrobe record arrives early.

Each report states what its retained comparison allows or excludes. Damaged
readings can leave alternatives; those alternatives are not a claim that several
visitors entered. Exactly one exhibit contains an incorrect comparison. The
remaining four comparisons must all hold. A false exhibit can misattribute a
real object or supplied photograph. The unsigned invitation and the false courier
notice are framing documents outside the five-exhibit rule.

The new deductions do not simply mark every definite statement false. Some
genuine records contain exclusions or an intact method comparison, and false
reports can themselves contain shortlists. Displayed alternatives follow the
public reference order rather than putting the solution first.

The runtime checker enumerates the 150 host/hotel/method answers. An independent
test reads the printed comparison sentences and public reference cards without
using the private predicates or declared solution. Both identify the same sole
complete answer. Version 3 tests cover all 264 delivery assignments and every
route prefix against the public source rule, including an as-yet uncollected
false exhibit. Version 2 retains its all-proper-subsets ambiguity checks. The
tests also reject victim-as-visitor readings
in ordinary cases and verify public travel lines for all victims.

These are consistency and information checks. They do not establish human
enjoyment, realistic forensic precision, or the natural length of a 25-table
campaign. The tone remains an accessible noir logic puzzle. The new paper packets
are ready for a fresh reader; a blind human reading remains part of PR review.

## Review material

- [Paper dossiers, without solutions](design/story-dossiers-v3.md).
- [Separate solutions and reconstructions — spoilers](design/story-solutions-v3.md).
- Rebuild both with `node scripts/build-story-dossiers.mjs`.
- Create isolated browser fixtures with `node scripts/story-preview.mjs --serve --port 4183`.
- Run `npm run check` and `npm run check:browser`.
- Sample unforced local tables with `node scripts/story-local-playtest.mjs --max-hands=80 --max-ms=90000`.

The bounded local playtest uses ordinary shuffled decks, the built-in opponents
and a simulated Ada-style human seat that sees only its own cards and public
state. It samples one fresh table per house, with public victim absence and
appropriate prior-exhibit topics. It does not win entries, award campaign
progress or force a favourable hand. Its ignored transcript is
`artifacts/story-local-playtest.json`, with legal options, requested/effective
actions, paid chips, before/after boards and public quotes. A cap is reported as
incomplete, not a test failure. This is a small mechanical/transcript sample,
not a human difficulty or win-rate study.

## Compatibility and boundaries

Existing review saves retain story version 1 or 2, their victim, answer and
reveal assignment. Their original narrative is not silently replaced by a new
puzzle. Victim-as-visitor alternate names and public travel contradictions are
repaired without changing the answer. Old pending story exchanges expire on
upgrade; their published table history remains. Ordinary legacy campaigns and
original free-play saves retain their prior flow.

Story versions 2 and 3 use revised scene prints at `photo-N-v2.jpg` and separate small
thumbnails. The originals remain available for version 1. All 68 baseline JPEG
exports total 530,691 bytes, largest 42,819 bytes. The built-in image tool created
the five edits, with prompts in [story-v2-art-prompts.json](design/story-v2-art-prompts.json).
The exporter only resizes/compresses the selected generated sources.

The model still receives only a permitted topic and approved story lines in its
existing poker decision call. It never receives the solution or grades the
verdict. Generic hints discuss comparisons in already-collected categories;
they do not act as witnesses or become additional required evidence. The ordinary
free-form banter filter now rejects the reported shooting-claim example and
additional overt crime verbs. It remains a conservative filter, not a semantic
guarantee; live-model transcript evaluation is still needed.

Browser checks cover 800x600 and 1024x768, both endings, the live-table bag, stale
tabs, reference/notes pages and native story forms without JavaScript. They do
not emulate IE6. This revision still needs a physical Win98/IE6 pass and live
provider testing. Development uses local bots and mock providers.

This remains an application review PR. No merge, Dockernet infrastructure PR,
image publication or deployment is part of this revision.
