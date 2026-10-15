# HoldEmGPT — Last Seat on Fortune Row

A five-seat no-limit Texas Hold'em campaign through five fictional card rooms
in 1947. A modern Node server deals and enforces the rules; an HTML 4 / ES3
client uses XMLHTTP (including the IE6 ActiveX fallback). No browser framework,
JSON parser, fetch, canvas, SVG, modern CSS layout, or TLS is required by the client.

## The campaign

**Last Seat on Fortune Row** follows five fictional casinos across Las Vegas,
Hollywood, Mexico City, New York and postwar Paris in 1947. Each house has four
ordinary tables, a scripted boss, its own eight-person regular cast and five
unique table backgrounds. Ten cosmetic player characters are available.

Start with $1,000 cash. Win four whole tables to unlock the house boss, then win
its entire table to earn the next invitation. Passes include travel and a room,
are permanent, and survive losses. Cleared tables remain replayable.

| Casino | Ordinary cash entries | Boss entry |
| --- | --- | ---: |
| The Gilded Alibi / Las Vegas | $250 / $500 / $1,000 / $2,000 | $4,000 |
| The Marigold Star / Hollywood | $1,000 / $2,000 / $4,000 / $8,000 | $16,000 |
| Casa del Azahar / Mexico City | $2,500 / $5,000 / $10,000 / $20,000 | $40,000 |
| The Lantern Exchange / New York | $5,000 / $10,000 / $20,000 / $40,000 | $80,000 |
| Le Salon des Brumes / Paris | $10,000 / $20,000 / $40,000 / $80,000 | $160,000 |

Every entry buys **1,000 tournament chips** with **10/20 blinds**, independently
of the cash price. Winning the whole table pays five times its entry, including
the winner's contribution. A loss costs the entry. Hand wins only move chips.
The clean 25-win path ends at $2,326,000; this is arithmetic, not a difficulty
estimate. When cash cannot cover the cheapest table in the latest unlocked
house, a repeatable house stake restores four entries with no debt. A lost
table can also restart from its pre-entry checkpoint with a new shuffle.

[Story and flow](docs/V2-CONTENT-AND-FLOW.md), [cast](docs/V2-CAST.md),
[economy](docs/V2-CAMPAIGN-PLAN.md), [implementation checks](docs/V2-IMPLEMENTATION.md)
and [artwork](docs/V2-ARTWORK.md) document
the campaign. Runtime content lives in [content/v2/campaign.json](content/v2/campaign.json).
For an offline art/story walkthrough, run `node scripts/build-v2-content-preview.js`
and open `artifacts/v2-content/index.html` or `artifacts/v2-content/artwork.html`.

## Start

On the modern server computer, install Node 22.9+ (Node 24 recommended), then:

```text
git clone https://github.com/badconduct/HoldEmGPT.git
cd HoldEmGPT
npm ci
npm start
```

Open **http://localhost:3083/**. On the legacy computer open
`http://YOUR-SERVER-LAN-IP:3083/` over HTTP. The default bind address is
`0.0.0.0`; set `HOST=127.0.0.1` for access only from the server computer.
Allow port 3083 in the server firewall if needed. IE6 needs JavaScript and
XMLHTTP/ActiveX enabled. This is intended for a trusted LAN.

Choose **New Game**, enter a name (up to 32 printable characters), choose one
of ten portraits on two pages, and read your arrival story. The map initially
opens only Las Vegas. Select a casino and an affordable table. Your portrait
is cosmetic; all characters start with the same cash and rules.

The table remains a separate page. **Main Menu** and **Map** preserve the current
table; **Continue campaign** returns to it. Buying another entry is blocked until
the current table finishes. The result page records cash, stamps and invitations.
Winning a hand or eliminating a boss before the whole table ends is not a clear.

Use Fold, Check, Call, Raise or All In on your turn. A raise is the total street
wager. The server cryptographically shuffles a fresh 52-card deck each hand,
deals clockwise and burns before each community street. Minimum raises,
cumulative short all-ins, heads-up button rules, uncalled returns, side pots,
split pots and odd chips remain dealer-enforced. **Next Hand** keeps the table,
its seats and its independent memories. Blind amounts stay fixed.

**Original free play** on the main menu retains the original $3,000 bankroll,
$1,000 buy-in and $5,000 whole-table prize. Legacy saves resume those rules.

## Opponents

Bosses always use authored server policies and contextual dialogue, regardless
of model mode. Ordinary tables draw four different regulars from the casino's
pool; boss tables draw three and its fixed boss. The cast and seat order stay
with a table through hands, view switching and saves. Checkpoint retries retain
that lineup while dealing fresh cards.

Default `AI_MODE=local` runs independent server strategy bots with distinct
aggression, looseness and bluff frequencies. They estimate equity by sampling
unknown cards from their own information, never from the dealer's actual deck
or opponents' private hands. Local bots require no credentials.

To use a model, copy `.env.example` to `.env` and choose one connection:

```dotenv
AI_MODE=codex
AI_MODEL=default
CODEX_COMMAND=codex
AI_TIMEOUT_MS=180000
```

Authenticate the installed Codex CLI under the server's account with
`codex login`. Optional `CODEX_JS_PATH` points to its JS entry on Windows;
`AI_REASONING` selects a supported reasoning effort. Each decision is an
ephemeral, tool-disabled call with an independent character prompt and memory.

```dotenv
AI_MODE=api
AI_API_FORMAT=chat
AI_URL=https://YOUR-PROVIDER/v1/chat/completions
AI_MODEL=YOUR-MODEL
AI_TOKEN=YOUR-TOKEN
AI_TIMEOUT_MS=60000
```

`AI_URL` is the complete compatible POST endpoint. `AI_API_FORMAT=responses`
uses the Responses text format instead. Credentials and HTTPS calls stay on the
modern server. Restart after configuration changes. API/CLI failures and illegal
decisions pause the same seat for **Retry Opponent**; they never silently switch
to local bots.

`AI_TOKEN_FILE` reads a server-side credential file and takes precedence over
`AI_TOKEN`. Neither setting is required for an unauthenticated local provider.
Authenticated calls use bearer authentication. No credential goes to the client,
model prompt, save file or container image. The app does not retrieve credentials
through SSH or depend on a particular network, gateway, hostname or model alias.

Optionally set `AI_MODELS_URL` to your provider's complete models-list URL to
verify authentication and the configured model at startup. Omit it for providers
without this endpoint; the first decision then tests the connection. Both URLs
preserve your provider's path prefix and query parameters. Redirects are rejected
so credentials cannot be forwarded to a different endpoint. Restart after changes.
The supported formats are compatible text-only
[Chat Completions and Responses](https://developers.openai.com/api/docs/guides/migrate-to-responses#1-update-generation-endpoints).
Other API protocols require an adapter; compatibility is not a claim that every
model will reliably follow the poker JSON contract.

Each character receives its own system prompt, its own two cards, the public
board, seat stacks, legal options, up to 160 public history entries and its own
12 most recent strategy memories. Opponent cards and memories are excluded.
The dealer validates the selected action before changing the game. Private
memory and raw model responses never go to the browser.

## Table talk and learning

The compact RPG dialogue box shows a character portrait, name, move and short
public quote after their legal action is applied. Quotes arrive in the same
model response as the move, with no extra inference call. A short scrolling
transcript displays every player move (including yours), blind posting, and
dealer step from the verified public ledger, labeled by hand, street and action.
Dealer dividers mark when the flop, turn and river begin a new betting round.
Quotes attach to their actual move even if the server records the next street
before publishing the remark. The scrolling window starts at 130 pixels and
adjusts between 96 and 180 pixels for the available browser height. It follows
new messages unless you have scrolled up. Each
character's latest line for the current hand also appears in a fixed-height
quote strip above and outside their player box; hover for its complete text.
The space is reserved even when empty, so new quotes do not resize the player
boxes. History also records public dialogue.

Move labels beneath seats show only the current betting street and clear when
the next street starts. Folded and all-in status remain visible for skipped
seats; the next hand resets the labels before its blinds. The transcript keeps
the full recent action history even when the seat labels clear.

Hand winners receive distinct in-character victory lines after settlement,
including their contested-pot award. Shared and side-pot winners each receive a
line; returning an uncalled bet never triggers a victory. Victory lines use
character-specific text without another model request. The transcript displays
the dealer's settlement alongside them. Older running dealers are supported by
deriving display-only winner lines from their public settlement, avoiding a
restart that would interrupt the current game.

Characters receive each seat's latest quote, ten recent conversation lines,
the last play, sixty recent structured plays, public hand history, and cumulative
table statistics. These include hands observed, checks/calls/folds/raises,
all-in actions and distinct all-in hands, and publicly revealed high-card
showdowns after aggression. They also retain their own twelve private strategy
memories. Prompts ask them to respond to relevant speech/actions, avoid random
stock lines, and revise reads based on evidence and sample size. Frequent all-ins
can suggest loose aggression; they do not prove bluffing. A short-stack all-in
call is recorded separately from a raise. Only actual public showdowns update
revealed-strength statistics. Local bots make a small calling adjustment after
at least four observed hands with frequent all-ins; model opponents decide how
to use the evidence themselves.

Conversation, observations and private memory persist across hands and save/load
within the same table. A fresh table resets these reads for its new cast. This is
contextual adaptation, not model training. Quotes are untrusted table talk and
can be misleading; they must not override rules or the supplied legal options.

The server rejects overt rank/suit/private-strategy disclosures and substitutes
an action-appropriate line in that character's voice for empty or rejected
quotes. This conservative text filter is not a guarantee against every possible
semantic disclosure. No private memories are published.

## Save and resume

Campaigns automatically save after entry and each action/result. Keep the private
**recovery code** shown on the map/menu or in the table's Save panel: it restores
the latest campaign, cash, stamps, invitations, cast, memories and current hand
after a browser or server restart. A recovery code has one active session;
loading it elsewhere transfers the campaign to that session.

**Save** writes a separate immutable snapshot and displays its own 36-character
code. Loading that snapshot starts a separate recovery code, preserving the old
campaign's later autosaves. Checkpoint retry is available after a table loss; it
restores pre-entry cash/progress and creates a fresh deck, retaining the cast.

Saves live on the modern server under `data/saves/`; `SAVE_DIR` overrides that
directory. Writes use temporary files and atomic renames. Keep codes private
and back up the save volume. In-memory sessions expire after 24 hours without
activity; stored snapshots and campaign autosaves remain loadable.

Version 3 stores campaigns. Version 1/2 saves continue as original free-play
games; version 1 receives the original $2,000 reserve bankroll. Free-play games
still require manual saves. No real cash, account system or tamper-proof
leaderboard is involved.

## Legacy performance

**Music: On / Off** controls an original quiet solo-piano MIDI, "Midnight Ledger",
on the original free-play menu and table. The roughly 101-second tune loops through native
legacy background sound and remembers your setting. Its file is under 5 KB. The reported silent MIDI playback remains unresolved; no new soundtrack is included.
Unsupported browsers show **Music: MIDI**, with an Open Piano MIDI link in Help
and on the main menu. See `docs/MUSIC.md` for the composition and playback details.

The **View: Perspective / View: Classic** button beside Save, History and Help
switches between a 740 x 300 period table scene and the compact row layout.
The choice is remembered in a browser cookie. Perspective is the initial default;
an unavailable background falls back to Classic. The player sits at the lower
right, opponents follow clockwise around the table, community cards sit in the
middle and hole cards sit on the felt beside their seats. Card backs change
instantly to faces at showdown using the dealer's visibility rules; an
uncontested win exposes no opponent cards. Your own cards stay visible.
The background is one cached opaque JPEG with no canvas, transforms, SVG,
alpha transparency or image animation. See `docs/TABLE-ARTWORK.md` for the
generated artwork and its prompt.

The two views have separate, stable HTML layouts. Switching only shows or hides
them; it does not reposition the same table cells, reload the page, or send a
game action. Both stay synchronized with the dealer. Portraits and names use
fixed table cells, quotes reserve their own space, and card backs use an ASCII
pattern that does not depend on an extra symbol font.
Cards use block frames in ordinary HTML table cells so their four borders do
not depend on IE6 inline text layout. Face-up cards use the same frames.

The layout is 740 pixels wide for 800 x 600 screens. The table has a compact
header, smaller portraits/cards, cash display, betting controls, and one latest
action line. Help, History, and the saved code open only when requested. Character
styles remain available as name tooltips. The table loads no player-picker images.

All 55 portraits are baseline, opaque 160 x 200 JPEGs. Original files are
12–17 KB; the 42 new portraits are about 10–12 KB each.
The picker initially loads five portraits (about 65 KB); the active table uses
four opponent portraits plus the chosen player portrait. Campaign tables are
740 x 300 baseline JPEGs at 31–38 KB each; map/room pages load their own
740 x 400 image, never the entire collection. JPEG responses have
one-day HTTP caching and an Expires header. The client polls only while opponents
are acting and skips all table DOM rebuilding when the state is unchanged. On
your turn and between hands, polling stops. No game analysis runs on the legacy
computer; it renders bounded XML state and ordinary HTML controls.

## Cast

| Character | Style |
| --- | --- |
| Silas “The Rail” Mercer | Tight and patient |
| Ruby Valentine | Loose and aggressive |
| Dusty Bell | Curious calling station |
| Ada Ledger | Disciplined value player |
| Felix “Ace” Marlow | Tricky bluff artist |
| Nell Nightingale | Observant counterpuncher |
| Jack “Iron” Doyle | Relentless pressure |
| Pearl Beaumont | Cautious trap setter |

These are fictional occupational archetypes. Modern Hold'em rules are used;
the setting is atmosphere rather than a historical reconstruction. All portrait
assets are opaque JPEGs suitable for IE6; see `docs/ARTWORK.md` for provenance.

## Verify

```text
npm run check
```

Tests cover hand ranking, dealing, betting, all-ins, pot settlement, random
full-table chip conservation, repeated bankroll payouts/buy-ins, private context isolation, HTTP sessions and
saves, repeated view switching with cards/quotes intact, and ES3 parsing of the client. Actual IE6 rendering and a live configured
model connection require testing on those systems.

`node scripts/live-check.js` exercises the running API-mode server with real
opponent decisions, an all-in hand and a server-disk save restored into a new
session. It makes model calls and creates one save snapshot.

`CHECK_URL` selects a different running server for the live check.
`node scripts/smoke-check.js` checks page identity, game setup, hidden cards,
opponent dialogue and saves in either local or API mode. It also creates a save.

## Containers and hosting

The Dockerfile uses a digest-pinned Node 24 base, runs as UID/GID 1000 and
includes only application code, compressed assets and the license. Environment
files, saved games, logs, tests and workstation artifacts are excluded from the
build context. The image supports local bots and compatible API providers;
Codex CLI mode requires a separately installed and authenticated CLI.

For a standalone local installation with Docker Compose:

```text
docker compose up --build -d
```

The included manifest binds port 3083 to loopback, mounts a named data volume,
and uses a read-only root, resource limits and rotated logs. To reach it from a
legacy LAN computer, explicitly change the published address to your server's
LAN address. Keep legacy HTTP access on a trusted network. For API mode, add
your own environment configuration and mount a credential file read-only at
the path specified by `AI_TOKEN_FILE`. Avoid putting a token in an image or
Compose manifest. Bind-mounted data must be writable by UID/GID 1000.

`GET /healthz` reports process readiness without allocating a game session.
When `AI_MODELS_URL` is configured, startup must pass that check before listening.
Health does not prove that the next inference will succeed. An inference failure
pauses that opponent for Retry.

For a reverse proxy, forward the original Host header. Set `PUBLIC_ORIGIN` to
the exact external origin, such as `https://poker.example.com`, and
`COOKIE_SECURE=true` for HTTPS. For IE6 over HTTP, leave secure cookies disabled.
There is no user account system or inference rate limiting: put access controls
and request limits in front of an Internet-facing installation.

The GitHub workflow tests the application, scans for secrets, builds and runs
the restricted container, and verifies save persistence after recreation. Main
branch builds publish that exact tested image to the repository owner's GHCR
namespace with a commit tag and recorded digest. Deployment is a separate step;
pin a reviewed digest and back up the data volume before changing versions.
Active, unsaved sessions are in memory and reset when the process restarts.

## License and artwork

GPL-3.0-only; see [LICENSE](LICENSE). The optional Codex adapter was adapted
from [ChessGPT](https://github.com/badconduct/ChessGPT), under the same license.
Portraits and the table scene are generated fictional artwork; provenance and
prompts are in `docs/`. The piano MIDI is an original composition, with its
reproducible source in `scripts/compose-piano.js`. Project assets are included
under the repository license. No third-party music samples or reference
photographs are distributed.
