# The Empty Chair: evidence pool and five starter cases

Implementation note: the playable first pass is documented in
[V3-FIRST-ATTEMPT.md](V3-FIRST-ATTEMPT.md). The proposal below records the design
and remaining expansion work; the runtime uses eleven authored cases.

Status: proposed outlines, 2026-10-16. No runtime implementation or completed
deduction validation. These are five authored starter situations, not every
possible boss/location/evidence combination.

The expanded [150-row scenario assignment table](V3-EMPTY-CHAIR-ALL-SCENARIOS.md)
now covers every boss/hotel/false-category setup plus staged deaths. Its
[structured catalog](design/empty-chair-scenarios.json) records the proposed
claims, corrections and award locations. These generated assignments do not
replace the narrative-proof work described below.

The latest [evidence flow and endings specification](V3-EVIDENCE-FLOW-AND-ENDINGS.md)
defines the 25 reusable image briefs, five reveal scenes, evidence bag,
three-answer finale and failed-player-as-next-victim rule. These outlines are
base assignments; successor-victim motives and descriptions need their own
validation before use.

## Current rules

- Five bosses; one is responsible for the case.
- Five possible locations: the hotel attached to each existing casino. The
  circuit's pre-campaign gathering occurs at the selected hotel; all suspects
  need a plausible opportunity to attend that gathering.
- Five official exhibits per campaign, one from each category below. Five
  variants per category give a pool of 25 possible exhibit forms.
- Exactly four collected exhibits make true core claims and one makes a false
  core claim. A false item can be fabricated, altered, falsely attributed or
  staged. A genuine but irrelevant object is not automatically false.
- Truth belongs to a case assignment, not permanently to an asset variant.
- Each whole boss-table win awards one official exhibit, pays the cash prize
  and opens the next casino. The exhibit need not concern the supplying casino.
- Dialogue and interviews are optional. All necessary facts appear in the
  exhibits and always-available suspect/hotel reference cards. No generated
  remark or random opponent lineup gates an essential clue.

Ordinary cases have a murderer. The staged-death case has a responsible boss
but no murder. The accusation asks **who was responsible, which hotel, and the
actual weapon**. Its weapon selector always includes **None - the death was
staged**, rather than revealing that option only when correct. A false-item
hypothesis is useful but is not a fourth graded answer.

## Evidence pool

| Category | Variant 1 | Variant 2 | Variant 3 | Variant 4 | Variant 5 |
| --- | --- | --- | --- | --- | --- |
| Recovered weapon | Pocket revolver | Pearl-handled letter opener | Brass desk ashtray | Silk curtain cord | Heavy champagne bottle |
| Casino cashout receipt | Gilded Alibi slip | Marigold Star slip | Casa del Azahar slip | Lantern Exchange slip | Salon des Brumes slip |
| Crime-scene photograph | Private suite | Closed card room | Service corridor | Hotel balcony | Rear stairwell |
| Written letter | Blackmail demand | Private meeting invitation | Debt-settlement letter | Personal warning | Travel instructions |
| Piece of clothing | Dinner jacket | Single glove | Silk scarf | Felt hat | Bellboy's uniform coat |

These are forms, not finished clues. A case supplies visible dates, times,
names/initials, distinctive details, location marks and a concise factual claim.
The same form can be genuine or misleading in different cases. A receipt
identifies where a transaction happened, not necessarily the crime location.
A photo shows a room rather than simply printing the answer casino's name.

Reference cards must explicitly supply any identifying features, house marks
and record conventions needed for comparisons. Do not require obscure real-
world forensic knowledge or a fact that only an optional NPC can reveal.

## Five starter situations: author-only solutions

**Elias Rook** is a proposed former circuit champion, not an existing runtime
character. Some cases instead have a genuine or apparent boss victim.

| Case | Responsible boss | Actual hotel | Victim | False category | Outline and intended deduction |
| --- | --- | --- | --- | --- | --- |
| **The Last Cashout** | Victor "The House" Maddox | The Marigold Star, Hollywood | Elias Rook, murdered | Weapon | Rook threatens to expose diverted winnings. A revolver is presented as the weapon, but genuine scene details point to an ashtray attack. Victor's transaction, the meeting letter and a torn jacket connect him to the Hollywood room. |
| **The Velvet Alibi** | Vincent "Velvet" Vale | Casa del Azahar, Mexico City | Celeste Varela, murdered | Receipt | Celeste plans to expose Vincent's diversion of circuit money. A genuine letter opener and the other exhibits place the confrontation at her hotel. An altered New York cashout is intended to give Vincent an alibi; its details must conflict with readable facts in the genuine exhibits. |
| **A Letter in the Wrong Hand** | Celeste Varela | The Lantern Exchange, New York | Elias Rook, murdered | Letter | Rook plans to sell records identifying people Celeste has been protecting. He is killed with a curtain cord. A forged threat implicates Leon, while a genuine New York transaction, scene and glove connect Celeste to the meeting. The forged letter's claimed origin must fail a visible comparison. |
| **The Borrowed Coat** | Leon Lark | Le Salon des Brumes, Paris | Elias Rook, murdered | Clothing | Rook has discovered a second set of accounts. A jacket is falsely attributed to Marcel as the attacker's clothing. A genuine broken bottle, Paris transaction, scene and meeting letter instead establish Leon's route to the victim. |
| **The Man in His Own Photograph** | Marcel "Le Patron" Duvall, staging and framing | The Gilded Alibi, Las Vegas | Marcel, alive | Photograph | Marcel stages his death to disappear with circuit funds and leave the player blamed. A real, unfired revolver, later cashout, travel instructions and uniform coat record his route out. The staged photograph's claim that he died is the one false exhibit. |

These examples separate the guilty boss from the crime location. Their
assignments are not a universal rotation rule. Shipping only five fixed
solutions would let repeat players memorize them; additional replayability
requires further authored, validated assignments.

## Which five exhibits each case uses

Fake/genuine labels are for the designer, not the player. Each completed item
still needs its exact core claim and visible details before it can support a
validated solution.

| Case | Weapon | Receipt | Photograph | Letter | Clothing |
| --- | --- | --- | --- | --- | --- |
| Last Cashout | **False:** revolver identified as the weapon | Genuine Marigold cashout | Genuine closed-card-room scene | Genuine blackmail demand | Genuine dinner jacket |
| Velvet Alibi | Genuine letter opener | **False:** altered Lantern cashout | Genuine courtyard-facing balcony scene | Genuine meeting invitation | Genuine silk scarf |
| Wrong Hand | Genuine curtain cord | Genuine Lantern cashout | Genuine rear-stairwell scene | **False:** threat attributed to Leon | Genuine glove |
| Borrowed Coat | Genuine champagne bottle | Genuine Brumes cashout | Genuine service-corridor scene | Genuine debt-settlement letter | **False:** jacket attributed to Marcel as the attacker's |
| Own Photograph | Genuine recovered revolver, unfired | Genuine Marigold cashout after the alleged death | **False:** staged Gilded Alibi suite death | Genuine travel instructions | Genuine bellboy uniform coat |

The pool need not exhaust every variant across these five examples. The hat
and personal-warning letter remain available for later cases. Do not force an
asset into a story just to make a symmetrical spreadsheet.

## Keeping the staged-death case fair

1. **Avoid a second false exhibit.** The gun's claim is "recovered from the
   suite, unfired," not "fired the fatal shot." The photo asserts death; the
   other four items are genuine and accurately described. Use the category
   label "recovered weapon" to accommodate a case without an actual murder.
2. **Handle the absent boss.** A house can appoint a representative while its
   owner is away, missing or dead, using the house's existing scripted policy.
   Use that convention in other circumstances too, so a substitute is not an
   automatic reveal. No corpse plays poker or speaks in an ordinary NPC prompt.
3. **Avoid a victim-identity giveaway.** Velvet Alibi also has a genuinely dead
   boss. Further boss-victim variants or initially unconfirmed identities can
   broaden this: a boss appearing to die must not always mean staging.
4. **Prove identity as well as time.** A cashout after a reported death alone
   is insufficient; someone else could use a name. Genuine exhibits must tie
   that transaction to Marcel personally and connect it to his disguise/route.
5. **Describe the ending correctly.** Marcel is exposed for the disappearance
   scheme and framing the player, not convicted of a nonexistent killing.

The current game assumes every fixed boss is available to play. Representatives
are a required future design/code addition for boss-victim cases, not an
existing feature or deployment change.

## Required proof work before generation

Write a truth table over suspect, hotel, actual weapon, false category and murder/staging
hypotheses. Define the visible statements each hypothesis satisfies. Accept a
case only when one supported solution survives with exactly four true claims.
Check that treating another item as false does not create a second solution.

These outlines have not passed that test: exact documents, timestamps,
reference-card facts and exclusion rules still need authoring. An eventual
validator checks explicit puzzle rules; human review establishes whether the
deduction feels fair. Complete one paper case before generating its art or
building the randomizer. LLMs do not generate or change the solution at runtime.

## Optional dialogue and final filing

AI characters can react to a collected item, point at a visible discrepancy,
express a suspicion or defend someone. They receive permitted local accounts,
not the solution table. They do not create a sixth required clue, authenticate
evidence or grade an accusation. Authored hints remain available with LLM Off.

Use five evidence slots, five suspect cards and five hotel cards, with ordinary
buttons for working hypotheses. Put every essential image detail into a
readable inspection caption. Success must not depend on finding an accidental
pixel artifact in a generated photo. IE6 and the later native build can both
present this with simple layouts.

The final filing selects the responsible boss, hotel and actual weapon (or no
murder/staged death). It unlocks after all five official items, not after optional
interviews. A correct filing preserves the player's cash and enables continued
poker in all five casinos. A wrong filing forfeits this campaign's cash and ends
ambiguously on a suitcase, $1,000 and the same letter used in every character's
opening. The End leads to the main menu. The player's name and portrait become
the next linked campaign's victim, without the ending announcing that fate.
Show the cash/story stakes and allow normal saving before confirmation;
do not automatically retry a failed filing. See the evidence flow specification
for the proposed genuine-murder successor rule and save/lineage behavior.
