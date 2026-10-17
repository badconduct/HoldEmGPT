# Fortune Row v3: evidence, the final accusation and the next victim

Implementation note: the playable first pass is documented in
[V3-FIRST-ATTEMPT.md](V3-FIRST-ATTEMPT.md). The proposal below records the design
and remaining expansion work; the runtime uses eleven authored cases.

Status: design specification, 2026-10-16. No runtime or artwork changes are
implemented by this document. This records the user's latest direction and
supersedes the older jail ending, protected-wallet ending, automatic
pre-accusation retry and explicit murder-ending proposals. Every character now
opens on the same suitcase, $1,000 and fixed letter; a failed ending closes on
those same objects, then The End and the main menu. The proposed lineage and
staged-death rules below resolve interactions that still need playtesting.

The companion [scene and table-hint handoff](V3-SCENES-AND-TABLE-HINTS.md)
specifies panel placement, image rendering, working common text, object/choice
behavior and a very sparse two-character story-talk schedule. Exact case clues
and their deductions still need authoring and validation.

## The campaign loop

New Game -> name and portrait -> fixed suitcase introduction -> case briefing
-> casino 1 -> four regular
tables and its boss -> evidence reveal -> next casino. Repeat through casino 5,
then inspect the complete bag and submit the final accusation.

| Milestone | What the player sees | Persistent effect |
| --- | --- | --- |
| Shared introduction | A suitcase, exactly $1,000 and the same letter, for every character and every campaign. | Establish the ordinary starting stake once. |
| Case briefing | The victim's portrait, the apparent crime and the reason the player is implicated. | Present the already fixed, validated case without changing the shared introduction. |
| First four boss-table wins | A short departure/contact scene showing the newly obtained exhibit, its description and its source. | Pay the existing prize, award exactly one exhibit and open the next casino. |
| Fifth boss-table win | The fifth evidence reveal, followed by the complete dossier. | Pay the existing prize and unlock the accusation. |
| Evidence Bag | Five category slots; inspect any collected item and compare the suspect/hotel reference cards. | Preserve collected facts and optional working hypotheses. |
| Final accusation | Select the responsible boss, the hotel and the actual weapon. Review a confirmation page. | Resolve the case once against its fixed answer. |
| Correct accusation | An authored closing scene, then return to the casino map. | Keep all current cash; all five casinos remain available for open-ended poker. |
| Wrong accusation | An ambiguous closing scene, ending on a suitcase containing $1,000 and the same letter. The End, then the main menu. | Forfeit this campaign's cash; privately record this protagonist as the next linked campaign's victim. |

The casino route still unlocks in its existing order. Evidence replaces the
story role of a pass; there is no extra ticket purchase. Losing an ordinary
table keeps the current forgiving recovery rules. Failure at the final
accusation is a distinct, clearly announced terminal story outcome.

## The fixed opening and its closing echo

Every selected character begins with the same suitcase, exactly **$1,000 in
cash**, and **the same letter**. Keep the letter's wording, signature or lack of
one, and presentation identical across characters, case assignments and linked
successor campaigns. The same opening works for every cosmetic background. It
does not greet a particular name, identify the victim, name the guilty boss or
refer to a prior ending. Present variable case information in the separate
briefing that follows.

One possible fixed letter, still an authored draft:

> A seat has been reserved for you at The Gilded Alibi.
> Bring the enclosed stake. Come alone.

The opening's $1,000 is the normal starting bankroll, not a second bonus. The
letter is a framing prop, separate from the five collected evidence categories.
It is not a sixth exhibit, an additional false claim or a clue required to
identify the criminal. Its sender and the explanation for the repeating
suitcase remain deliberately unresolved; do not assign them to the randomized
culprit without a separate story decision.

The failed ending always finishes with a suitcase containing **$1,000 cash and
that exact letter**. Leave the recipient, ownership of the suitcase and fate of
the departing protagonist ambiguous. Do not show a body, confirm a killing,
identify who packed it or announce the next-victim link. Close on
**The End**, then return to the main menu. Starting another campaign remains an
explicit player choice.

Reuse an approved suitcase image/composition and the fixed letter text for
both bookends. Small authored still panels are sufficient for IE6. The
closing $1,000 is the visual setup for the next opening, not cash returned to
the failed character or transferred from their wallet. Even if the failed
protagonist has less than $1,000, the closing scene still shows the same amount;
do not explain its source with an invented accounting rule.

## Evidence artwork and readable descriptions

Produce **25 base evidence illustrations**, five per category, using the
existing monochrome/sepia portrait and table art as the visual reference. They
are reusable object forms, not 150 sets of five unique paintings. Use an
evidence label or mount, consistent lighting and a plain background. Do not bake
case IDs, names, dates, truth labels or essential handwriting into generated
artwork. Render those facts as readable page text.

These are illustration briefs and neutral inspection introductions, not final
deduction clues. Each validated case must add its own visible observations,
reported claim, provenance and comparisons. Details claimed to be visible in
an image must actually be present in that image or a clearly labelled attached
record; descriptions must not invent a mark absent from the approved asset.

| ID | Evidence illustration | Neutral inspection introduction |
| --- | --- | --- |
| W1 | Small period pocket revolver, side view | A pocket revolver, photographed before it was placed in storage. The attached examination records its condition. |
| W2 | Pearl-handled letter opener | A narrow letter opener with a pale decorative handle. Its recovery details accompany the object. |
| W3 | Heavy brass desk ashtray | A substantial brass ashtray of the kind found on a hotel desk. The examination sheet records any relevant damage or traces. |
| W4 | Length of silk curtain cord | A length of curtain cord, laid out for inspection. The attached record distinguishes observations from the investigator's claims. |
| W5 | Heavy champagne bottle | A champagne bottle photographed as recovered. Its condition and alleged connection to the incident are recorded separately. |
| R1 | Gilded Alibi cashout receipt | A cashout slip bearing the Gilded Alibi heading. Its transcription lists the claimed customer, sum and transaction time. |
| R2 | Marigold Star cashout receipt | A cashout slip bearing the Marigold Star heading. Its transcription lists the claimed customer, sum and transaction time. |
| R3 | Casa del Azahar cashout receipt | A cashout slip bearing the Casa del Azahar heading. Its transcription lists the claimed customer, sum and transaction time. |
| R4 | Lantern Exchange cashout receipt | A cashout slip bearing the Lantern Exchange heading. Its transcription lists the claimed customer, sum and transaction time. |
| R5 | Salon des Brumes cashout receipt | A cashout slip bearing the Salon des Brumes heading. Its transcription lists the claimed customer, sum and transaction time. |
| P1 | Private-suite scene photograph | A mounted photograph of a private suite, with a separate scene report and identification record. |
| P2 | Closed-card-room scene photograph | A mounted photograph of a closed card room, with a separate scene report and identification record. |
| P3 | Service-corridor scene photograph | A mounted photograph of a service corridor, with a separate scene report and identification record. |
| P4 | Hotel-balcony scene photograph | A mounted photograph of a hotel balcony, with a separate scene report and identification record. |
| P5 | Rear-stairwell scene photograph | A mounted photograph of a rear stairwell, with a separate scene report and identification record. |
| L1 | Blackmail demand on period stationery | A demand threatening disclosure unless its terms are met. A legible transcription preserves the exact wording being examined. |
| L2 | Private-meeting invitation | A note proposing a private meeting. Its transcription includes the claimed participants, place and time. |
| L3 | Debt-settlement letter | A letter concerning a disputed account or settlement. The signed name is a claim to examine, not automatic proof of authorship. |
| L4 | Personal warning | A short warning addressed to someone involved in the case. The transcript preserves the wording without declaring its author truthful. |
| L5 | Travel instructions | A written route and departure arrangement. The transcript makes the claimed traveller and timing readable. |
| C1 | Dark dinner jacket | A dinner jacket laid out for inspection. The record describes its alleged owner and the basis of that identification. |
| C2 | Single glove | A single glove, photographed with a scale. The record explains its recovery and the claimed connection to its wearer. |
| C3 | Silk scarf | A silk scarf arranged for inspection. Its description distinguishes physical details from claims about who wore it. |
| C4 | Felt hat | A felt hat photographed as recovered. Any identifying details must be supported by the image or an attached record. |
| C5 | Bellboy uniform coat | A hotel-service uniform coat. Its record identifies the claimed hotel, wearer and recovery circumstances. |

The image alone never certifies authenticity. A real object can have a false
attribution; a receipt's printed house does not automatically identify the
crime hotel. Exactly one exhibit has a false core claim in each case. The bag
does not reveal an authoritative TRUE/FALSE badge before the ending.

Keep scene photographs non-graphic. The reusable room photograph can be mounted
beside the victim's portrait and an identification caption. This accommodates
an inherited player victim without generating personalized corpse art or making
the photo's truth obvious from an image seam. If a staged-body silhouette is
used, it must be consistent with both genuine and staged variants.

## Five evidence reveal scenes

Use five short authored scenes, each showing the new exhibit prominently and
providing a clear Continue button. Existing casino/arrival art can provide the
backdrop; there is no requirement for another set of five full-screen images.
The scene text varies with the actual awarded item. Award order is already a
per-case assignment and must not be hardcoded to category order.

| After the boss at | Suggested scene setting | Destination |
| --- | --- | --- |
| Gilded Alibi | An envelope passed over the cashier's counter after closing | Marigold Star opens. |
| Marigold Star | A studio messenger leaves a package at the hotel desk | Casa del Azahar opens. |
| Casa del Azahar | A trusted contact meets the player in the courtyard | Lantern Exchange opens. |
| Lantern Exchange | A clerk retrieves a sealed package from the night office | Salon des Brumes opens. |
| Salon des Brumes | A final delivery laid beside the four earlier exhibits | Final dossier and accusation open. |

These are delivery settings, not automatic crime scenes. A casino supplying
an exhibit does not identify its forger, its owner or the location of the crime.
Use representatives or contacts where the nominal boss is dead or absent.

Each reveal needs a brief scene paragraph, the exhibit image, its readable
description, an Evidence Bag link and Continue. The essential observations
remain available in the bag after leaving the scene. Replaying a reveal never
reissues its cash reward or changes its contents.

## The Evidence Bag

Add an **Evidence** link beside Save, History and Help, available throughout the
campaign. Open a dedicated page rather than a modal over the poker table. Offer
a clear Return to Table/Map link that restores the existing session without
advancing a hand. Do not allow a player's turn to act automatically while they
read; the authoritative table remains at its current decision point.

Show five labelled category slots. Uncollected slots say Not collected, without
leaking their assigned form or future source. Collected slots have a thumbnail,
title and Inspect button. Inspection displays:

- The larger image, exhibit number and collection scene.
- A readable factual description, the item's reported core claim, and any
  attached transcript or examination record supplied by the case.
- Links to the always-available suspect and hotel reference cards.
- Optional working notes or a suspect/false-item hypothesis, clearly labelled
  as the player's theory. They are not extra graded answers.

Keep a simple five-item list and one selected inspection panel. A drag-and-drop
board, microscopic handwriting or recollection of an AI quote is unnecessary.
AI dialogue can discuss facts already available to that actor. It cannot
authenticate an exhibit, supply a missing mandatory clue or change the answer.
The complete mystery must remain solvable with LLM Off.

## Three answers at the finale

Once all five exhibits are collected, the player chooses:

1. **Who was responsible?** One of the five bosses.
2. **Where did it happen?** One of the five casino hotels.
3. **What was the weapon?** One of the five weapon forms, or **None - the death
   was staged**.

The no-murder option is always visible, including in genuine murder cases. In
a staged-death case the responsible person is the boss who arranged it, and the
hotel is where the apparent death was staged. Their exposure is described as
a disappearance/frame-up scheme, not conviction for a nonexistent killing.

In a false-weapon case the correct answer is the **actual weapon**, not the
planted recovered item. The other genuine exhibits must establish that answer
without relying on an optional interview. Add weapon and murder/staging to the
case's uniqueness checks; the current assignment matrix is not yet proof of
readable, fair deductions.

All three selections must match the saved case. Identifying the false exhibit
is useful reasoning but is not a fourth graded selection. Supporting evidence
and player-written prose are not hidden win conditions. The server applies
authored rules; there is no LLM judge, persuasion score or reroll at submission.

Before committing, show the three selections, an Evidence Bag link and this
plain-language warning: **A wrong accusation ends this character's story and
forfeits their cash.** Preserve the ambiguity of the closing scene and the
later victim reveal. Allow
backtracking and a normal manual save before confirmation. Do not automatically
retry a failed accusation or silently overwrite an older saved snapshot.

## Endings and open-ended play

For a correct accusation, write a short case-specific explanation identifying
the culprit, hotel, actual weapon or staged death, and the false exhibit. End
with the protagonist's money intact and the map available for unrestricted
replay of all five casinos. Keep table buy-ins, winnings and local/LLM options
working normally. Repeated boss wins do not award more mystery items or replay
the finale unless the player deliberately opens the completed case review.

Illustrative success text, not final case canon:

> By dawn the right man was in custody, and the false cashout had lost its
> shine. Your name was clear. Your winnings were still yours. Somewhere
> downstairs, the house was opening another table.

For a wrong accusation, show an ambiguous authored ending. Its final scene is
always the suitcase, exactly $1,000 cash and the same letter used at the start.
Then show **The End** and return to the main menu. Do not insert an explanatory
solution screen, death notice or New Game choice between the final still and
the menu. Any optional post-game case review is a separate, deliberate choice
from the menu, with a spoiler warning.

Internally, set this campaign's wallet to zero and end its playable story.
House recovery stakes and table retry must not resume that failed campaign.
Record the successor victim without announcing it in the ending. The suitcase
cash is not a refund, a minimum-balance grant or a usable remaining bankroll.

Illustrative failure text:

> The room had gone quiet. Downstairs, someone was dealing another hand.
>
> A suitcase. One thousand dollars. A letter.
>
> The End.

Previously saved snapshots retain normal save/load semantics. This is a story
consequence, not an anti-reload system, and must not debit unrelated campaigns.
Losing cash through ordinary poker after a successful ending does not create a
new murder victim; this consequence belongs to the wrong final accusation.

## The failed player becomes the next victim

At a failed ending, record a small successor-victim entry: the protagonist's
display name, approved portrait ID, failed campaign ID and ending version.
When the player explicitly starts the next linked campaign, show that name and
portrait in the new case briefing, identification record and evidence bag,
after the unchanged suitcase introduction. The ending itself does not reveal
this link; recognizing the previous character in the next case provides the
payoff. The new protagonist gets their own name/portrait and the ordinary $1,000 stake.
Generate a fresh validated case; copy no old wallet, cards, opponent memory or
culprit assignment. Do not imply that the identity can carry across unrelated
devices without a linked save/profile.

**Proposed compatibility rule:** the immediate successor to a failed campaign
uses a genuine murder case with the failed protagonist as victim. It does not
also use the boss-faking-their-own-death variant. This keeps one central incident
and exactly one false exhibit. Standalone campaigns and campaigns following a
successful ending may still use boss-victim and staged-death cases. Introducing
two simultaneous apparent deaths would require a separate, newly authored case.

The inherited identity changes more than the name field. Each culprit needs a
validated motive and timeline for this victim: for example, silencing the player
after the failed accusation. Do not reuse champion-only or boss-only motives
unchanged. The existing 150 rows are base assignment drafts; they are not 150
completed successor-victim scripts. Case generation must apply the selected
identity before constructing the five claims and validating their consistency.

Link this within a player's campaign/save lineage, never to a global server
"last person who died" value. Another player's failed avatar must not appear by
accident. Save/load must preserve the link, and refresh or duplicate requests
must not create another successor victim. A different browser/device needs the
appropriate save/recovery code to resume the lineage. Reopening an older save
must not rewrite the victim in an already-created successor campaign.

## IE6 and implementation boundaries

Use ordinary server-rendered HTML, links, form controls and simple table layouts
within the existing 740-pixel page. Explicit image dimensions prevent jumps.
Initial artwork targets are 240 x 160 pixels for inspections and 72 x 48 for
thumbnails; these are proposed budgets, not measured performance guarantees.
Use baseline JPEG for tonal artwork and GIF where a flat label benefits. Load
only collected thumbnails and the selected larger image. Reuse cached assets;
do not preload all 25 images, animate flips, add a canvas board or depend on
modern layout features. Check actual IE6 rendering and smaller resolutions
before calling this ready.

Future server state needs a versioned case, victim identity, collected exhibits,
acknowledged/replayable scene IDs, final submission/result and successor link.
Keep the solution and unrevealed claims out of player HTML, API payloads and AI
prompts. The author-only assignment catalog must never be served as game data.

Commit a boss settlement and its clue exactly once, then render its reveal.
The prize cannot depend on clicking Continue. Save after settlement so closing
the browser during a reveal does not lose the item. Likewise, commit the final
result, wallet effect and successor-victim entry together; duplicate submissions
or refresh must return the same ending without another debit or new link.

Before implementation expands, validate one complete paper case and its actual
weapon deduction, then build the reveal -> bag -> three-answer finale slice.
Acceptance checks should cover LLM Off; all five awards with repeated boss wins;
save/load mid-reveal and before/after either ending; false-weapon and staged
answers; success followed by more poker; the identical opening props/letter
for every portrait; an ambiguous failed ending with exactly $1,000 and the same
letter followed by The End and the menu; failure followed by a fresh $1,000
campaign with the correct inherited portrait in its briefing; no extra wallet
credit from either suitcase scene; and isolation between two players.
Only then expand the authored cases and produce the full 25-image set.
