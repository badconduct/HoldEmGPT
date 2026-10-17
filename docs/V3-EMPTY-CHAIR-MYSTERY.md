# The Empty Chair: five suspects, one fixed truth

Implementation note: the playable first pass is documented in
[V3-FIRST-ATTEMPT.md](V3-FIRST-ATTEMPT.md). The proposal below records the design
and remaining expansion work; the runtime uses eleven authored cases.

Status: proposed design following the user's murder-mystery refinement on
2026-10-16. Not implemented or approved final story. This replaces the earlier
missing-person outline. The latest refinement is detailed in
[the evidence pool and starter-case matrix](V3-EMPTY-CHAIR-CASE-MATRIX.md): five
official exhibits, exactly one false, a variable crime location and an optional
staged-death case. Dialogue and interviews are optional; collecting all five
exhibits unlocks the accusation. The staged victim is a boss, distinct from
the earlier missing-champion-is-alive outline. The latest
[evidence flow and endings specification](V3-EVIDENCE-FLOW-AND-ENDINGS.md) adds
illustrated reveals, an inspectable bag and a three-answer finale. Success keeps
the money and opens continued poker; failure forfeits this campaign's cash and
makes its protagonist the next linked campaign's victim. The opening is always
a suitcase, $1,000 and the same letter. The failed ending echoes those objects
without confirming the character's fate, then shows The End and the main menu.
The [scene and table-hint handoff](V3-SCENES-AND-TABLE-HINTS.md) adds explicit
panel sequences, image sizes, working common copy and occasional two-character
remarks attached to ordinary poker turns. These remarks are optional context,
not additional required testimony.

## Player experience

Make Fortune Row a poker-driven detective game. Winning tables opens access to
people and records; the player compares their accounts and makes an accusation.
Authored scenes deliver evidence, while optional model dialogue performs the
characters and draws attention to things worth investigating. The mystery is
solved through corroboration, not by clicking through every page or asking a
model to name the killer.

Opening premise: an apparent murder follows a meeting attended by the five
bosses. The victim can be a former circuit champion or a boss; one case instead
has a boss staging their death. Every suspect needs a plausible relationship to
the victim and opportunity to be involved. Someone has placed evidence
implicating the player, giving the investigation personal stakes.

This case premise appears in a separate briefing after the shared introduction.
Every character's introduction starts with a suitcase, exactly $1,000 and the
same fixed letter. Victim identities and other variable facts do not change
that opening or its letter.

Keep each case at one shared place/time selected from the five casino hotels,
rather than claiming
five people in five cities all had simultaneous physical access. The exact
frame-up, timeline and reason the authorities have not already resolved the
case still need writing. Preserve all cosmetic player backgrounds and the
existing arrival stake; do not require a fixed profession or secret family tie.

## Fix the case at New Game

Select one responsible boss from the existing five: a murderer in an ordinary
case, or the perpetrator of the frame-up in the staged-death case:

- Victor "The House" Maddox, The Gilded Alibi.
- Vincent "Velvet" Vale, The Marigold Star.
- Celeste Varela, Casa del Azahar.
- Leon Lark, The Lantern Exchange.
- Marcel "Le Patron" Duvall, Le Salon des Brumes.

The murderer need not be the last boss encountered. Each boss should be a
possible culprit across campaigns, with no identity permanently telegraphed as
the villain. Their scripted poker policies and the fair shuffle do not change
with guilt. An aggressive poker player is not therefore a murderer.

Start with five authored case variants, one for each guilty boss. Each needs a
coherent motive, opportunity, cover account, clue distribution and final proof.
Then vary compatible dates/times, props, witness assignments and innocent
secrets from tested sets. Do not independently randomize every element or ask
an LLM to invent an unconstrained crime halfway through play.

Generate and validate the case once, before any clue appears. Save its version,
selected variant, assignments, evidence IDs and interview state. Refresh, failed
tables, retries, model errors and save/load must preserve that truth. Keep case
generation randomness independent of card shuffling. Truth and unrevealed clues
remain server-side, outside client HTML/XML and ordinary actor prompts.

## How poker advances the investigation

| Existing milestone | Investigation payoff |
| --- | --- |
| Arrive at a casino | Hear its boss's public account and learn which questions matter here. |
| Clear ordinary tables | Hear optional accounts, review collected items or meet a contact. No additional required clue depends on dialogue. |
| Clear the whole boss table | Receive one official exhibit, the cash prize and access to the next casino. Optional questioning adds context. |
| Collect all five official exhibits | Unlock the final accusation scene. Earlier private suspicions can be recorded in the notebook. |

The regular tables can introduce a statement, expose an apparent inconsistency
in a collected item and supply optional context. Each of the five mandatory
exhibits arrives through a boss-clear event, even if no model delivers a useful
hint or a particular regular never appears in a lineup. All necessary facts
are readable in those exhibits and the supplied reference cards.

Optional questions can use simple buttons: "Ask about the time," "Ask about the victim,"
"Present this receipt" and "Challenge this account." These provide genuine
investigation choices without making free-text prompt tricks necessary. A
free-text interview can be a later option using the same limited evidence and
question topics. Boss poker strategy stays scripted in either case; a separate
interview actor may use the model to perform its permitted responses.

Boss-victim cases need a house representative when a boss is absent; the
apparently dead boss must not sit at a poker table without explanation. This
convention requires new implementation, as described in the case matrix.

No additional buy-ins, interrogation charges, clue purchases or poker penalties
are required. Existing recovery stakes and permanent invitations remain useful.

## Give the model a witness role, not the solution

The server owns the truth. A dialogue request gets only:

- Character identity, voice and conversational attitude.
- That character's currently permitted observations or official account.
- The player's selected question and any evidence actually presented.
- The small amount of relevant public conversation needed to respond.
- Allowed response/evidence IDs for this stage.

Do not include the culprit ID, a guilt flag, the complete case file, hidden
evidence or other characters' private accounts. Even the culprit's model can
receive "Your account is that you stayed downstairs" without being told that
this account is false. The actor performs the assigned cover story; the server
tracks its relationship to the actual crime.

Return a structured reply such as an allowed statement ID, attitude and short
flavor line. The server checks the selected ID and stage, displays the authored
substantive statement, and records any permitted clue itself. Critical evidence
has a fixed canonical version in the notebook. The model does not award an item,
verify an alibi, decide that a suspect is cleared or grade an accusation.

For example, the player has a scripted porter receipt placing a suspect on the
fourth floor; that suspect's recorded account says they stayed in the lobby.
A witness might remark, "A generous tip for a floor he says he's never seen."
That directs the player toward a contradiction. It does not establish murder:
the person might be hiding another meeting, and separate evidence must connect
them to the crime.

Use generated speech for evasions, reactions, follow-up wording and occasional
table banter referencing authorized observations. Hints should depend on the
current question/evidence and the speaker's knowledge. They must not be random
ominous lines or function as a guilt meter. Innocent characters can conceal
unrelated secrets; the culprit need not sound uniquely nervous.

Limited context reduces solution leakage; it does not guarantee that free-form
text cannot invent a confession or guess the culprit. A fact-ID field alone
does not validate every sentence in its accompanying prose. For critical
testimony, use authored wording selected by the server and let the AI supply
bounded performance around it. Reject unsupported disclosures and use an
authored fallback. Evaluate those controls with adversarial interview questions
and actual-model dialogue before relying on them. Existing poker quote filters
are not a murder-mystery fact validator.

## The notebook and deduction

Keep a readable notebook with a row for each suspect: stated whereabouts,
motive/relationship, supporting evidence and unresolved contradictions. Separate
physical/independently confirmed records from attributed testimony. Allow the
player to mark connections and revisit completed interviews without replaying
tables. Ordinary HTML tables and server-rendered pages are enough for IE6.

Some accounts are wrong for reasons unrelated to the killing. Resolve those
secrets coherently; do not make every lie proof of guilt. A strong case links
opportunity, a significant false account and independent corroboration. The
player should be able to explain the deduction without remembering the exact
wording of a generated quote.

Validate every case against suspect, hotel, actual-weapon, false-exhibit and event hypotheses.
At completion the five official exhibits must support one responsible person,
place, actual weapon (or no murder), false item and event type through explicit contradiction/exclusion rules.
A generator validator cannot prove that
players find a mystery satisfying, so authored cases also need human review.
Check every culprit in every campaign position, required-clue reachability,
model-free play, failed tables and save/retry sequences. Reject or regenerate
an invalid assignment before play begins; never change the answer to defeat a
player's early deduction.

Let an observant player suspect the answer early. The final filing is gated on
all five official exhibits; correct early reasoning should not be punished by
withholding every meaningful clue until Paris or rerolling the culprit.

## Final accusation and the next victim

After all five exhibits, the player selects the responsible boss, crime hotel
and actual weapon. The weapon selector always includes "None - the death was
staged." Identifying the false exhibit can be a working hypothesis, but is not
an additional graded answer. A false recovered weapon must be distinguishable
from the actual weapon using the genuine exhibits.

The server compares all three selections with the fixed case. An LLM, player
prose or a fresh random roll cannot decide the outcome. A correct accusation
clears the player, retains their cash and leaves every casino open for continued
poker. A wrong accusation forfeits this campaign's cash and ends ambiguously,
on a suitcase containing exactly $1,000 and the same opening letter. Show The
End, then return to the main menu. Their name and portrait privately become
the victim in the next explicitly started, linked campaign, revealed in its
case briefing after the unchanged opening. This supersedes the earlier jail,
explicit murder ending and protected-wallet proposals.

Show those stakes before confirmation and allow normal saving and evidence
review. Do not automatically retry a failed accusation. Existing saved snapshots
retain normal load behavior. The proposed immediate successor uses a genuine
murder case with the failed protagonist as victim; staged boss death remains a
separate case type. See the evidence flow specification for the lineage rules,
artwork plan, open-ended ending and save/refresh behavior.

## LLM Off and scope of the first slice

Every case remains solvable from its five exhibits and reference cards. The
model can enrich performance and conversation; it is not required to reveal a
mandatory fact. This preserves the native LLM-Off requirement and allows a
baseline test independent of model quality.

Before coding all five cities:

1. Write one complete murder timeline, five suspect dossiers and an evidence
   matrix. Prove a unique, understandable solution on paper.
2. Write and validate the other four culprit variants so the design does not
   accidentally assume the first boss is always innocent or guilty.
3. Build one casino's clue/interview flow with authored replies and a notebook.
4. Add model performance to those same permitted statements. Compare relevance,
   variety, unwanted disclosures and fallback rate against scripted replies.
5. Expand the validated flow through the five houses and final accusation.

The playtest audit should record case/variant version, scene/question IDs,
allowed and selected statement IDs, actual published lines, blocked replies,
clue awards and final accusation selections. Keep truth-only diagnostic fields out
of player responses and out of later opponent prompts. Full campaign balance
and dialogue playtesting of the existing game can proceed independently.
