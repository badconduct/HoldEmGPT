# Fortune Row v3: noir options and the current campaign playtest

Implementation note: the playable first pass is documented in
[V3-FIRST-ATTEMPT.md](V3-FIRST-ATTEMPT.md). The proposal below records the design
and remaining expansion work; the runtime uses eleven authored cases.

Status: design options, not implemented or approved story canon. Prepared
2026-10-16 against web revision `14d8c5ce81ef7b4a98d81909c660b8f5549126cd`.
This review reads the local web source; it does not verify the live deployment's
provider/model settings or change Dockernet.

**Later proposal:** a replayable mystery with five suspect bosses, five casino
hotels and five collected exhibits, exactly one false. All five exhibits unlock
the accusation; dialogue is optional. One variant has a boss faking their death.
See [the evidence pool and case matrix](V3-EMPTY-CHAIR-CASE-MATRIX.md) and
[the murder-mystery design](V3-EMPTY-CHAIR-MYSTERY.md).
The later [evidence flow and endings specification](V3-EVIDENCE-FLOW-AND-ENDINGS.md)
adds images, a bag and a culprit/hotel/weapon finale: keep the cash and continue
poker on success; lose this campaign's cash and become the next linked
campaign's victim on failure. This explicit final risk supersedes earlier
ending/economy suggestions where they conflict; ordinary poker recovery stays.
The latest framing uses the same suitcase, $1,000 and fixed letter at every
character's introduction and at the end of the ambiguous failed ending,
followed by The End and a return to the main menu.
The missing-person plot and alive-champion reveal below remain an earlier
alternative, not established canon for that proposal.

## Two workstreams

Develop the story design while the user plays the existing campaign. Use that
playthrough to establish table duration, difficulty, quote quality and where
players naturally want a break. Do not change economy, opponent prompts or boss
policies during the baseline run; record proposed fixes separately.

Keep final campaign development in this web game. The native conversion follows
the frozen design. The noir story must work with standard local opponents and
authored dialogue as well as LLM opponents.

## Common design constraints

- Keep 1947, the current five houses, their bosses, four ordinary tables plus a
  boss table per house, and the existing invitation chain.
- The player still arrives with their own $1,000 and an ambition to make a name.
  Each cosmetic character background fits the story without a forced detective
  profession, secret family relationship or predetermined personal history.
- Poker remains fair. Story flags never alter the shuffle, reveal hidden cards,
  make opponents deliberately lose or award victory before table settlement.
- Preserve the forgiving economy. Story choices do not impose surprise debts,
  mandatory bribes, travel charges or lost invitations. A good ending must be
  achievable after losses and recovery stakes.
- Put authored story scenes between tables, at casino arrivals and around boss
  results. Do not interrupt betting with investigations or dialogue menus.
- Give the player choices that affect trust, interpretation and the ending.
  Avoid a campaign that merely hands out five pieces of exposition.
- Required evidence cannot depend on a particular randomly seated regular,
  provoking a particular quote, winning a particular hand or replaying for RNG.
  Side conversations can use existing portraits without changing table lineups.
- The server owns established facts and reveals. An LLM can react only to facts
  authorized for that character and stage. It cannot invent a solution, disclose
  an unrevealed clue or advance the plot. Boss strategies remain scripted.

## Three directions

| Option | Player fantasy and hook | Meta-game | Main strength | Main cost/risk |
| --- | --- | --- | --- | --- |
| **The Empty Chair** | Last year's champion supposedly died. Someone has left their invitation in your coat. Every house remembers a different ending. | A small casebook; compare accounts, choose whom to trust and decide what to do with the truth. | Strong mystery across the existing route; mostly authored scenes and a few saved flags. | Clue chronology and character knowledge need careful writing. |
| **The Favor Book** | As your name spreads, powerful people offer introductions in return for favors. You discover the circuit also trades in promises people cannot escape. | Choose alliances and promises; maintain a small visible record of whom you helped and what you owe in the story. | More social agency and reasons to revisit characters; fits casino politics. | More branches and possible confusion between narrative obligations and actual bankroll debt. |
| **The Long Con** | A contact offers you a share in one final operation against the people who control Fortune Row. Your victories get you into rooms the crew cannot enter. | Select contacts, choose an approach and prepare a final operation through authored scenes. | Strong sense of participating in the plot, with different final approaches. | Largest writing/testing scope; can grow into a separate adventure game. Poker must never become a scripted con. |

These are working story labels. **Last Seat on Fortune Row** remains the game
title. None requires replacing the art direction or the current cast.

## Recommended direction: The Empty Chair

Start with the investigation, using a few relationship choices from The Favor
Book. Keep the con campaign as an alternative rather than attempting all three.

**Hook:** You came for the money. After your first win, an envelope addressed to
last year's champion appears among your belongings. The staff call it a mistake.
Then a stranger offers to buy it before you have opened it.

The central question is personal and clear: *What happened to the previous
champion, and why does somebody want you to take their place?* The player can
remain an ambitious gambler drawn into trouble; they do not have to become a
professional investigator.

### Five-act route

| House and existing boss | Proposed dramatic job | Example evidence or reversal | Player's meaningful choice |
| --- | --- | --- | --- |
| **The Gilded Alibi**, Victor "The House" Maddox | Establish the disappearance and make the next invitation desirable for more than money. | A winner's name has been crossed out of the previous circuit register. Victor admits the official account is incomplete. | Show the envelope to a contact or keep its contents private. |
| **The Marigold Star**, Vincent "Velvet" Vale | Contrast a polished public account with what actually happened. | A studio contact sheet places the missing champion alive after their reported death. Vincent helped construct the public story. | Confront him directly or protect the source while asking for his version. |
| **Casa del Azahar**, Celeste Varela | Give the people behind the evidence agency and complicate the player's assumptions. | Celeste sheltered a witness. The champion was pursuing records of coercion and private obligations, but their motives were not entirely generous. | Promise to protect the witness's identity or insist on a corroborated public account. |
| **The Lantern Exchange**, Leon Lark | Reveal the system that connects the houses. | A payment record links the invitation circuit to a trade in leverage over its guests. Some hosts profit, some cooperate under pressure, and others protect their patrons. | Preserve a source's confidence or use a limited disclosure to obtain another account. |
| **Le Salon des Brumes**, Marcel "Le Patron" Duvall | Resolve the disappearance and let the player decide what winning means. | The champion is alive. They used the trail to recruit a successor who could carry evidence beyond the circuit, while exposing that successor to the same danger. | Publish a corroborated account, negotiate protection for the people involved, or accept a place inside the system. |

This is a proposed spine, not a finished script. Before writing all scenes,
settle one exact timeline, what the disputed records prove, why each person
cooperates, and what each ending actually changes. Winning a boss table earns
the established introduction and a private audience; it does not magically
compel a criminal confession or transfer a secret document with the pot.

Do not write all five bosses as interchangeable villains. Victor can be a
pragmatist, Vincent a participant hiding behind a performance, Celeste a
protector with conditions, Leon a broker, and Marcel a keeper of the circuit's
institutional memory. These are story roles alongside their existing poker
policies, not replacements for those policies.

### What the player actually does

Use a compact casebook available from the map. It separates established facts
from attributed claims: "Photograph dated Tuesday" is evidence; "Victor says
the visitor left Monday" remains Victor's account. A disagreement can be marked
without forcing a mandatory deduction puzzle or asking the player to type prose.

Offer one or two short scene choices per house, such as questioning a source,
protecting an identity or sharing something already learned. Record a handful
of specific choices rather than introducing a large reputation simulation.
Give visible, understandable consequences in later conversations and the ending.
Required progress continues even if optional trust is lost; supplemental context
and available resolutions can differ.

Plan up to one short beat per first ordinary-table clear, plus a boss payoff.
Some beats can be an optional casebook note rather than a full scene. Start
around 40-100 words for a normal scene, then adjust to the playtest's table
durations. Let players reread completed scenes. Replays do not award clues twice.
Avoid spending the whole campaign's noir vocabulary on repeated threats and
cryptic one-liners: include ordinary conversation, humor, practical concerns,
silences, evasions and changing relationships.

Endings should differ in whom the player protects and what reputation they
leave behind. Keep earned money and the poker championship legible. Noir need
not mean every choice is a punishment or that a hopeful ending requires a
perfect undefeated run. Write three clear outcomes with short character-specific
epilogues before considering a combinatorial ending system.

### Smallest useful story prototype

Write the opening, all five act summaries and all endings first, to prove that
the mystery pays off. Then build only the Las Vegas chapter as a vertical slice:
the envelope scene, a contact conversation, a piece of evidence, one consequential
choice and Victor's departure scene. Test that chapter with the existing poker
tables before writing the remaining twenty table beats.

Keep story definitions as versioned data, with stable scene/evidence IDs and
explicit conditions/effects. Trigger mandatory scenes from existing first-clear
and boss-result events. Save seen scenes, evidence and choices; apply each event
once across refresh, save/load and retry. Extend the save schema deliberately
and define how existing campaigns receive catch-up context. Use short HTML
pages and ordinary links/buttons so the IE6 target remains practical.

## B: what the current logging can and cannot establish

Source inspection found these existing records:

- The table history records public moves, board cards, public showdowns,
  settlements and published quotes. The browser receives only its last 160
  events through `lib/game.js:view`.
- A campaign autosave stores the current game, including that table's history,
  after actions. It is a changing snapshot, not a chronological audit of all
  25 tables. A new table replaces the active game.
- Opponent private memory is capped at twelve recent entries. It is not a full
  historical record of every model decision.
- `server.js:pump` applies decisions, publishes speech and saves. There is no
  complete per-decision audit of the exact request, raw response, timing,
  rejected output and the reason a quote was replaced. Its public retry error
  intentionally does not expose diagnostic detail.

The user can assess fun, pacing and perceived dialogue now. A genuinely
thorough AI diagnosis needs a small server-side audit/export addition before
that run. Do not assume the visible chat or ordinary container stdout is enough.
Record the deployed revision and actual provider/model configuration at the
start; a run of local bots measures different opponents and dialogue behavior
from an API/CLI run. Keep credentials out of the audit.

### Proposed playtest evidence

| Area | Capture | Review question |
| --- | --- | --- |
| Decision quality | Run/table/hand/street/seat IDs, actor-authorized cards/state, legal options, exact supplied observations/memory, returned action and applied action, validation/error/retry outcome, timing | Are calls/raises sensible for price and stack? Does behavior respond to observed aggression without pretending hidden cards were known? |
| Dialogue | Model's requested line, published line, reply target, fallback/filter reason, repeated-line counts and examples | Is speech relevant to the actual move, varied, distinct by character and capable of responding to another speaker? Are occupations becoming repetitive metaphors? |
| Boss behavior | Policy ID, restricted input, policy output and settlement | Do the five policies feel different and stay fair? Separate scripted lines from model-written speech when judging diversity. |
| Economy/pacing | Entries, wins/losses, retries, grants, cash changes, hands and elapsed active time per table/casino | Is recovery humane? Are there repetitive stalls or sharp difficulty jumps? Can the player tell chips from campaign cash? |
| Reliability | Resume/refresh, failed requests, save/load checkpoints, result/pass awards | Does each move, payout, stamp and pass happen once, with correct order after recovery? |

Diagnostic inputs and private memory belong in a server-only operator audit,
not the public chat or a public download. Model decision records should contain
only what that actor was authorized to know; never feed an omniscient diagnostic
snapshot back into an opponent. Archive the complete run across table changes,
including actual published speech when a model line was filtered or replaced.

For a manual run, note casino/table/hand when something feels wrong and keep
examples of both good exchanges and repeated/awkward ones. Record retries and
checkpoint restores rather than quietly excluding them. Capture save checkpoints
at each casino boundary. A single campaign is a valuable qualitative baseline;
it does not establish a statistically reliable win rate or balanced difficulty.
Use repeated controlled simulations later for economy/rule properties and a
broader set of actual-model decisions for opponent quality.

## Suggested sequence

1. Add the small operator audit/export needed for B, without changing opponents.
2. User completes the current campaign; review logs and fix clear rule, dialogue
   and pacing problems. Version any changes so before/after runs stay comparable.
3. Choose the noir direction, then finish its timeline, cast knowledge and endings.
4. Build and play the Las Vegas story slice in the web version.
5. Expand the proven structure across the remaining houses, then freeze it for
   the full native conversion.

The design work and current-state playtest can overlap. Major narrative coding
and economy changes should wait until the baseline identifies what needs fixing.
