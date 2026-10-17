# Fortune Row v3: scene presentation and sparse table hints

Implementation note: the playable first pass is documented in
[V3-FIRST-ATTEMPT.md](V3-FIRST-ATTEMPT.md). The proposal below records the design
and remaining expansion work; the runtime uses eleven authored cases.

Status: implementation handoff draft, 2026-10-16. Extends
[evidence flow and endings](V3-EVIDENCE-FLOW-AND-ENDINGS.md). This specifies
proposed presentation, working copy and hint defaults. It does not implement
scenes, generate images or finish the case proofs.

## What is ready, and what is missing

| Area | Enough to build a first slice? | Still needed before a full release |
| --- | --- | --- |
| Placement and progression | Yes: fixed opening, briefing, five boss evidence sequences, accusation, two outcomes. | Playtest pacing and save/return behavior. |
| Visual presentation | Yes: static image, portrait/text panel, explicit navigation, readable item inspection. | Approved art, offline crops/compression and actual IE6 checks. |
| Opening and ambiguous failure | Working text below; one fixed letter shared across all characters. | Editorial review and approved suitcase composition. |
| Successful ending | Common closing text plus a case-specific explanation. | Each explanation must be written from a validated solution. |
| Objects and choices | Yes: starting stake, framing letter, five collected exhibits and three final answers. | UI implementation and persisted state. |
| Evidence Bag | Yes: five slots, inspectable records, references and optional theories. | Final transcripts, observations and image assets for each shipping case. |
| Optional LLM hints | Proposed scheduler, knowledge limits and exchange format below. | Character variants, actual-model evaluation and audit logging. |
| Mystery itself | Outlines and 150 assignment drafts exist. | Exact timelines and clues, unique culprit/hotel/weapon deduction, false-item consistency and human solvability review. |

We have enough to build and test one complete vertical slice. The assignment
matrix is not 150 fully written, proven mysteries. A complete paper case must
precede treating its descriptions or hints as authoritative game content.

## Scene order and choices

| Scene | Panels and player choices | Result |
| --- | --- | --- |
| Opening | Suitcase still and narration -> Read the Letter -> fixed letter -> Begin. | Start with exactly $1,000 once; preserve the letter for rereading. |
| Briefing | Victim portrait/identification -> apparent incident and shared gathering -> Review the Houses or Go to Map. | Introduce the fixed case after the identical opening. Reference cards remain available. |
| Boss result | Show actual whole-table payout -> Continue to Evidence. | Settlement has already saved the cash, stamp, next-house access and new exhibit. |
| Evidence sequence 1-4 | Establish contact/location -> inspect received exhibit -> short authored reflection -> Inspect in Bag or Continue to Next House. | Reading adds no charge, clue roll or extra award. |
| Evidence sequence 5 | Establish delivery -> inspect fifth exhibit -> complete dossier -> Review Evidence or Prepare Accusation. | All five items unlock the final filing. |
| Evidence Bag | Choose one of five slots -> inspect -> read references/replay its reveal -> Return. | Reading never consumes an item, changes a hand or proves authenticity automatically. |
| Accusation | Select boss, hotel and actual weapon/no murder -> Review -> Confirm or Return to Evidence. | Only the confirmed three-answer submission resolves the case. |
| Correct | Case-specific resolution -> common success closing -> Return to Open Circuit. | Keep current cash and continue poker at all five houses. |
| Wrong | Ambiguous departure -> suitcase, $1,000 and identical letter -> The End -> Main Menu. | End this campaign, forfeit its cash and privately record the successor victim. |

There is no investigation cutscene after an individual poker hand. The
mandatory sequences occur after the first whole-boss-table clear at each
casino, not every replay win. Ordinary table clears may have brief optional
flavor, but cannot award an additional required exhibit. The fifth casino's
sequence replaces onward travel with the accusation preparation screen.

Continue advances a scene, not a second transaction. Reload resumes the saved
panel; Back, replay or Evidence Bag inspection cannot duplicate payouts or
exhibits. A failed poker table returns to the normal result/retry flow without
an evidence award. A scene can be reread without replaying the poker table.

## Rendering contract

Use a separate page with the existing 740-pixel shell. Each panel has a still
image, optional speaker portrait/name, ordinary text below it, and visible
buttons. Advance on a button; do not require clicking the picture or a timed
animation. No automatic typewriter effect or timed dismissal.

| Image role | Proposed display and source | Rendering rule |
| --- | --- | --- |
| Scene establishing still | 740 x 250; prepared crop of current casino art or a new approved still | One image at its saved pixel dimensions; never stretch a 740 x 400 room image into a different aspect ratio. |
| Opening/closing suitcase | One reusable 740 x 250 still, same composition in both scenes | Cash and letter are visible props; the exact amount and letter text also appear as HTML. |
| Speaker/victim portrait | Existing approved portrait at 72 x 90 | Ordinary table cell beside text, with name as text and a useful image description. |
| Evidence closeup | 240 x 160 base illustration | Below the scene still on the receipt panel, with the case description/transcript alongside or below. Do not float it over another image. |
| Bag thumbnail | Separate 72 x 48 derivative | Five-row list; load only collected items, then one selected larger image. Do not download a large master to draw a thumbnail. |
| Letter/receipt wording | Readable HTML transcript beside its object illustration | Never require reading generated handwriting or inspecting a tiny pixel. |

Use baseline JPEG for tonal images and GIF where appropriate for flat artwork.
Give every image explicit width/height and alt text. A missing image must leave
its complete description/transcript and navigation usable. Server-side scene
progress and normal form submissions allow reading without client scripting.
Any enhancement must remain ES3-compatible and preserve that path.

Keep image, dialogue and buttons in normal document flow with table-based
portrait/item arrangements. Allow text to grow and the page to scroll; avoid
clipping text in a fixed-height speech box. Reuse the existing palette, borders
and typography. Prepare compressed derivatives offline, cache by asset version,
load only the current panel and avoid preloading the next casino's assets.
These are design budgets, not measured performance guarantees.

## Objects received and what choices do

- **Suitcase:** recurring visual prop; not a usable poker item.
- **$1,000:** the initial wallet stake. Reading the opening or letter does not
  credit it again. The ending suitcase never credits a failed campaign.
- **Opening letter:** a fixed personal effect, rereadable through a separate
  Personal Effects link in the bag. It does not occupy one of the five evidence
  slots or count toward the one-false-exhibit rule.
- **Five case exhibits:** one per category, awarded once by the five boss clears.
  Inspection, scene replay and optional dialogue cannot consume or replace them.
- **Reference cards:** always-readable suspect and hotel facts needed to compare
  records. They are not random loot or paid hints.

Read, Inspect, Ask About and Continue are navigation or optional context
choices. They do not secretly change the culprit or penalize cash. The final
boss/hotel/weapon selection is the consequential choice. Optional notebook
theories are not extra graded answers. Poker's own betting choices retain their
ordinary financial effects.

## Working opening and ending text

These lines are a concrete common-script draft, not completed case-specific
dialogue. Every character uses the same opening words and fixed letter; their
selected name/portrait may appear separately in the UI.

**Opening, panel 1 — suitcase:**

> A suitcase waited on the bed. Inside were one thousand dollars and a folded
> letter.

**Opening, panel 2 — letter (also used in the failed ending):**

> A seat has been reserved for you at The Gilded Alibi.
> Bring the enclosed stake. Come alone.

**Opening, panel 3 — departure:**

> No signature. Enough money to get started. You closed the suitcase.

Begin leads to the variable case briefing, then the map. The framing does not
explain who left the suitcase or fix a cosmetic character's profession/history.

**Evidence receipt, reusable panel structure:**

> [Contact's authored delivery line, appropriate to the casino and case.]
>
> Received: [exhibit title].
>
> [Readable case-specific observations, reported claim and attached transcript.]

Follow with a short authored reflection that points toward comparing records,
not a declaration of who is guilty. The exact item text must be written and
validated; neutral object descriptions alone do not make a solvable puzzle.

**Correct ending:**

First show the authored explanation for this exact case: responsible boss,
hotel, actual weapon or staging, and the contradiction establishing the false
exhibit. Use a staged-death-specific resolution where appropriate. Then:

> Your name was clear. Your winnings were still yours. Downstairs, the house
> was opening another table.

Show current cash and Return to Open Circuit. The explanation must derive from
canonical evidence, not be invented by an LLM after judging the answer.

**Wrong ending, panel 1 — empty corridor:**

> The room had gone quiet. Downstairs, someone was dealing another hand.

**Wrong ending, final still — the same suitcase, visible cash and letter:**

> A suitcase. One thousand dollars. A letter.

The identical letter may be readable beside the still. Then **The End**, with
a Continue to Main Menu button; no automatic start of another character.
Keep the fate off-screen and the suitcase's recipient unexplained. The old
portrait's appearance in a later case supplies the connection. Do not insert
a solution dump or explicit death notice into this closing sequence.

## Very occasional two-character story talk

Here, **round means one dealt hand**, not each preflop/flop/turn/river betting
street. Normal poker banter can continue as it does now. Apply this small budget
only to mystery-related remarks. These are proposed tunable starting values:

- Do not schedule a story exchange during the first two hands of a table.
- At the start of an eligible later hand, use a 10% chance to plan one exchange.
  Leave at least four complete hands between story exchanges.
- Cap this at two exchanges per whole table attempt, each involving at most
  two NPCs and one short question/response. Most hands have no story talk.
- Select randomly among seated, available regulars with permission for that
  topic. Guilt, hidden cards and the story's correct answer are not selection
  criteria. Do not turn a certain speaker or nervous tone into a guilt signal.
- Attach an opening line after the chosen NPC's next ordinary validated action.
  A recipient can respond on their next ordinary turn. If they fold out, never
  get a turn or the hand ends first, let the unanswered exchange expire. Do not
  manufacture an action or delay dealing to complete a conversation.
- Allow at most one reply, then return to poker conversation. Suppress repeats
  with recent topic IDs; save the schedule, budget, speaker IDs and delivered
  lines so refresh does not reroll or replay them.

For example, where the shared scene/timeline permits it:

> A: "Did you hear something upstairs last night?"
>
> B: "I don't think so."

Use "that night" when the incident was not yesterday. Do not give a speaker an
eyewitness claim about a hotel they never visited. "I don't think so" is an
uncertain personal reply, not official proof that the corridor was empty or
that the speaker is innocent.

Another evidence-related exchange, after an appropriate record is collected:

> A: "You kept that cashout slip?"
>
> B: "Paper has a better memory than most people."

The question refers to a known object; it does not invent a customer, amount,
timestamp or alibi. The player may be nudged to look again without receiving a
sixth required clue. All five exhibits still suffice with the table log ignored.

## Knowledge and LLM integration

The future server scheduler chooses an approved topic for the current stage,
not a random ominous sentence. Give the acting model only its character voice,
the permitted topic/account, relevant already-published exchange and approved
line variants for its assigned role. It also retains its normal restricted
poker context. Never add the complete mystery answer or another NPC's private
knowledge to a poker prompt. Story observations cannot reveal hidden cards or
change the rules of a betting action.

For the first slice, use server-authored question/response variants and let the
LLM select an allowed line ID fitting its voice. The server resolves that ID to
the authored line. Ordinary non-story poker remarks retain their current path.
Free-form LLM story wording may be a later evaluated option; choosing a fact ID
does not prove that generated prose contains no invented confession or clue.

A future optional decision field can carry `storyLineId` and `replyToSeat`.
Validate the line against that seat's assigned role, topic, stage and already
delivered question. A valid poker move with an invalid story line still proceeds;
use an authored line or omit the story remark. Do not retry a bet just to repair
dialogue. Escape all displayed names/text and treat quoted dialogue as data.

Choose the story line in the existing NPC decision call; add no separate
speech-only LLM call. With LLM Off, pick an authored character variant under
the same topic permissions and sparse schedule. Scripted bosses keep their
existing poker policies; they need not participate in these random exchanges.
Optional boss interviews remain a separate authored interaction.

Log campaign/table/hand IDs, topic and permitted line IDs, selected speakers,
actual published lines, omission/fallback reasons and whether the topic refers
to a collected exhibit. Keep diagnostic truth out of player logs/prompts.
Use an independent story random source so scheduling does not consume deck
randomness or change dealing order.

## First implementation acceptance

Complete one paper case, then implement its opening -> boss settlement ->
three-panel evidence reveal -> inspectable bag -> three-answer accusation ->
both endings. Use placeholder art with the final dimensions while preparing
the illustrations. Add two approved sparse exchange topics to the same slice.

Verify that an ignored/expired exchange cannot block play or evidence, repeated
boss wins do not duplicate items, save/load preserves panels and budgets, the
same letter appears in both bookends, and the wrong ending returns to the menu
without another $1,000 credit. Check the complete slice on IE6 and with LLM Off.
Then expand the validated case content, illustrations and character line pools.
