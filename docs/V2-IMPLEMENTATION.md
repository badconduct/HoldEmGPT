# Campaign implementation and verification

The primary application now implements New Game -> Name -> ten-character
selection -> arrival story -> map -> casino -> poker table -> result/pass -> map.
Only Las Vegas is initially open. Four ordinary whole-table wins unlock each
boss; winning its whole table awards the permanent next-house invitation.

`lib/campaign-catalog.js` loads the authored JSON and the exact public asset
allowlist. `lib/campaign.js` owns entries, progress, fixed cash prizes, grants,
checkpoints and save validation. The poker dealer still owns shuffling, turn
order, legal actions, showdown visibility and chip accounting.

`lib/bosses.js` implements the five authored policies. It receives the same
restricted state as an ordinary opponent, samples unknown cards through
`lib/equity.js`, and selects contextual authored dialogue. Bosses make no API
calls. Ordinary opponents continue to use the configured local/API/CLI mode.

Campaign pages are server-rendered HTML 4 in `lib/campaign-pages.js`, with a
small ES3 form/XHR client in `public/campaign.js`. A page loads one room/map
background, or one table background and five visible portraits. The proven
two-root Classic/Perspective markup and block card frames are retained.

`lib/save-store.js` serializes writes by code, writes a unique temporary file,
then renames atomically. Version 3 includes identity, cash, invitations, stamps,
the fixed table prize, private per-seat memories and the pre-entry checkpoint.
Campaigns autosave on entry and each action/result. Manual snapshots branch to
a new recovery code when loaded, preserving the original latest autosave.
Loading a recovery code transfers ownership from its previous in-memory session.
Versions 1/2 still load as original free play.

## Checks performed

- Existing poker rules, privacy, conversation, API-provider formats, original
  saves and repeated view-switch tests pass.
- Campaign tests settle 25 actual dealer games and finish at $2,326,000, verify
  cash/chip separation, once-only cash/stamps/pass awards, locked/unaffordable
  entries, hand-win/boss-elimination gating, replay, checkpoints, grants,
  independent cast/memory, scripted boss legality and information boundaries.
- HTTP tests cover onboarding, double-entry requests, hidden cards, automatic
  and manual saves, restart, snapshot branching, ownership transfer and old-save
  compatibility. Storage tests verify ordered atomic autosaves.
- All browser clients parse as ES3. Native Windows MSHTML document mode 7
  traverses real name/character/intro/map/casino/entry/table routes at 800 x 600,
  loads the new assets, plays local opponent turns and switches views 20 times.
- `scripts/smoke-check.js` now exercises campaign onboarding, entry, dialogue,
  card privacy, save/load and both recovery/snapshot restore after restart.

The development server uses local bots, as requested. The previously configured
model endpoint returned HTTP 401 for a missing bearer token. API/CLI protocol
support remains unchanged; configure a valid server-side `AI_TOKEN_FILE` or
`AI_TOKEN` before using that authenticated provider. No token is bundled.

Docker's build context and Dockerfile include the runtime campaign JSON. A
container build was not run locally because the Docker Desktop Linux daemon
was unavailable. A separate copy containing only the Dockerfile's runtime files
booted independently and passed campaign smoke/restore checks. CI retains the
read-only container/save-volume smoke checks.
Physical Windows 98SE/IE6 campaign acceptance, balance playtesting and production
deployment remain pending. MSHTML mode 7 is not a physical IE6 result.
