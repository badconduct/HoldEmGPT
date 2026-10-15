# Last Seat on Fortune Row: campaign implementation plan

Build five casinos, each with four ordinary tables and one boss table. A new
campaign starts with $1,000 and Casino 1 open. Four table wins unlock that
casino's boss; a boss-table win awards the next casino's pass. The final boss
completes the campaign, with cleared casinos still available for replay.

The proposed default is forgiving: money provides a cushion, while recorded
table wins and passes control progression. These rules are implemented in the local build. Production deployment
is separate work.

The content package names this game **Last Seat on Fortune Row**, with five
fictional casinos in Las Vegas, Hollywood, Mexico City, New York and postwar
Paris, all in 1947. See the
[story and flow](V2-CONTENT-AND-FLOW.md), [cast](V2-CAST.md) and
[content definitions](../content/v2/campaign.json). Portraits and backgrounds are
connected to the campaign routes.
Boss betting and dialogue are scripted on the server; the regular opponents
remain AI-driven. See [themes and music](V2-THEMES-AND-MUSIC.md) for the concept,
the unresolved MIDI playback issue and the required real-machine audio test.

**Cash and chips**

- Separate cash from tournament chips. Every player starts a table with 1,000
  chips and 10/20 blinds, regardless of its cash entry fee. A $250 entry must
  still buy a full game. Label cash with dollars and bets/stacks as chips.
- Five seats contribute the same entry fee. Winning the whole table pays five
  times that fee, including the winner's entry. Net gain is four times the fee;
  a loss costs one entry. Hand wins only move table chips.
- Store entry fee and cash prize on the table instance. Replace the current
  assumption that the final chip stack can be added directly to cash.
- Keep prices fixed. Recommend the cheapest uncleared ordinary table, show the
  entry/prize/cash remaining, and allow any affordable ordinary table in an
  unlocked casino. Completing all four still gates the boss.

Implemented cash curve, following ordinary tables from cheapest to most expensive:

| Casino | Ordinary table entries | Boss entry | Cash before boss* | Cash after boss* |
| --- | --- | ---: | ---: | ---: |
| 1 | $250 / $500 / $1,000 / $2,000 | $4,000 | $16,000 | $32,000 |
| 2 | $1,000 / $2,000 / $4,000 / $8,000 | $16,000 | $92,000 | $156,000 |
| 3 | $2,500 / $5,000 / $10,000 / $20,000 | $40,000 | $306,000 | $466,000 |
| 4 | $5,000 / $10,000 / $20,000 / $40,000 | $80,000 | $766,000 | $1,086,000 |
| 5 | $10,000 / $20,000 / $40,000 / $80,000 | $160,000 | $1,686,000 | $2,326,000 |

*Assumes a $1,000 campaign start, carryover cash, all tables won on the first
attempt, no grants, and five-times-entry payouts. These are configured values,
not estimates of a player's actual results.*

The first boss risks 25% of the expected $16,000 bankroll, leaving $12,000 after
one loss. This is gentler than the earlier $12,000 boss suggestion. Later
casinos provide larger cushions; character behavior supplies the challenge.

**Losses and recovery**

- Stamps and passes survive every loss. Cleared tables remain replayable for
  their normal cash prizes; each new table instance can pay once.
- Between tables, if cash cannot cover the cheapest table in the highest
  unlocked casino, offer a house stake. Set cash to four entries for that
  cheapest table. It is repeatable when needed, carries no debt, and is tracked
  separately from winnings. A player can always get back into a game.
- Retain manual snapshot saves and add automatic campaign saves after each
  settled hand and table result. Show one persistent private campaign recovery
  code that can load the latest state after a server restart.
- Keep a checkpoint from before the current table as a recovery option. A retry
  from that checkpoint creates a fresh table/deck and restores that checkpoint's
  cash/progress; it must not replay a known saved deal.
- Start with fixed blinds and no decision timer. Measure table length before
  considering an optional blind schedule.

Cash calculations checked during planning:

- Three opening $250 losses leave $250 for another attempt. Four losses leave
  zero and trigger the house-stake offer.
- One loss before every one of the 25 table wins remains affordable throughout
  and finishes at $1,744,750, without grants or checkpoint retries.
- Two boss losses at every casino, with ordinary tables won first try, remains
  affordable and finishes at $1,726,000 without grants or retries.

These deterministic checks establish the arithmetic, not actual difficulty.
Playtest full-table victory frequency, table length, and recovery use before
freezing the curve. Test additional loss-heavy sequences and synthetic table
win rates; do not treat synthetic rates as measured AI/player performance.

**Implementation checklist**

The following features are implemented and covered by automated tests.
Deployment steps and a physical Windows 98SE/IE6 campaign run are pending.

1. **Economy and table configuration.** Add data definitions for entries,
   five-times-entry prizes, chip stacks, blinds, cast and boss IDs. Parameterize
   game creation and bankroll settlement, retaining existing defaults for
   legacy free play. Verify cash/chip separation, affordability and one payout
   per completed table instance.
2. **Campaign state and saves.** Add server-owned casino/table IDs, clear stamps,
   passes, completion status and house-stake accounting. Validate every entry
   and unlock on the server. Save version 3 includes campaign state, the active
   table, its fixed prize and payout status. Continue loading versions 1/2 as
   legacy free-play games, preserving their cash. Persist autosaves atomically
   and keep manual snapshots and the pre-table checkpoint separate.
3. **One complete casino.** Build map -> casino selection -> existing table ->
   result -> map. Include four ordinary tables, boss gating, the boss, pass
   award, loss recovery and save/load. Connect the prepared artwork and content.
   Prove this complete loop before connecting the remaining four casinos.
4. **All five locations and casts.** Give each casino eight regular opponents
   and one boss. Ordinary tables draw four different regulars; a boss table draws
   three regulars plus its boss and the player. Preserve cast IDs and seats until
   that table ends, including through saves. Script each boss's betting
   policy, bluff frequencies, public-history responses and dialogue triggers.
   Boss scripts receive only their own cards, public state and legal options;
   normal dealing and action validation apply. Regulars retain their independent
   AI decisions and prompts. Update the approved
   portrait catalog/static asset allowlist for the new cast.
5. **Legacy presentation.** Use the small opaque JPEG travel map with ordinary
   HTML links and text alternatives. Keep casino selection on its own page. Preserve
   the proven table/view structure and block card frames. Load only the current
   page's assets; retain baseline portrait JPEGs and caching. Audit all visible
   amounts and prompts so chips and cash cannot be confused. Verify a known-good
   MIDI on the actual Windows98SE machine before selecting the soundtrack; then
   add one licensed track per casino, with the saved On/Off preference retained.
6. **Balance, regression and release.** Check the full win path, losses,
   bankruptcy recovery, repeat wins, duplicate settlement, forged/locked table
   requests, save/restart/checkpoint restore and legacy save compatibility.
   Retain poker-rule, privacy, chip-conservation and ES3 checks. Repeat geometry
   and card-edge checks in both views, then test the complete loop on physical
   Windows98SE/IE6. Publish through application CI and the reviewed immutable
   container workflow, saving the active game before deployment and confirming
   the second Ansible pass makes no changes.

All five casinos are connected. The test suite completes 25 real dealer-settled
tables, checks once-only rewards, losses/recovery, boss information boundaries,
HTTP saves/restart and legacy saves. Native MSHTML checks exercise actual setup,
entry and repeated view changes at 800 x 600. Real-machine campaign acceptance
and balance playtesting are still required; the arithmetic does not measure
how often a human player will win.
