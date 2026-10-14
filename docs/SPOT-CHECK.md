# Spot check — 2026-10-14

## Legacy client and images

- Client parses as ECMAScript 3; XMLHTTP has both Msxml2 and Microsoft ActiveX fallbacks.
- HTML 4 table layout and opaque JPEGs; no fetch, client JSON parsing, canvas, SVG, grid or flexbox.
- Every portrait inspected on disk: 160 x 200 pixels, 12,172 to 16,583 bytes.
- Portrait responses now use one-day Cache-Control and Expires headers.
- Polling stops on the player's turn, on errors, and between hands. Unchanged state skips table DOM rebuilding, preventing repeated image element replacement.
- Actual IE6 rendering and timing on the Pentium III have not been measured in this environment.

## Cash and repeated play

- Fresh game: $3,000 cash minus a $1,000 table buy-in leaves $2,000 reserve cash and $1,000 in table chips.
- Winning the five-player table adds its $5,000 payout once, bringing cash to $7,000. Buying into another table leaves $6,000 cash and a fresh $1,000 stack.
- Losing a table forfeits the buy-in; another buy-in is available if reserve cash is at least $1,000.
- New Game explicitly resets the bankroll; Buy Into Next Table retains accumulated cash and player identity.
- Unit and HTTP checks cover payout duplication, repeat buy-in, insufficient funds, and restoring a paid winner before rebuying.

## Saves

- Save Game writes a versioned JSON snapshot to the server's local `data/saves/` directory using an atomic rename.
- Snapshots include cash, win count, table state, player name/portrait, and independent private character memories. API credentials are not included.
- The main page Load Game field accepts the displayed save code; a fresh session can load it after a server/computer restart.
- Older version 1 saves remain loadable with a $2,000 reserve cash balance.
- Live API smoke check successfully saved an all-in hand and restored it into a new browser session; automated tests also restore after restarting the HTTP server.

## API and boot

- A configured remote compatible API was tested with a server-side credential.
- Deployment configuration and credentials are excluded from the public source.
- Startup models-list verification is optional and uses an explicitly configured URL. Live opponent decisions use non-streaming Chat Completions with system/user messages and bearer authentication.
- Real model opponents reached the player turn; an all-in hand settled without an AI/dealer error.
- `npm run check`: 17 checks passed, including randomized chip conservation, private-card isolation, and ES3 syntax.
- Server started on port 3083; stdout/stderr are in ignored `artifacts/server.log` and `artifacts/server-error.log`.

## Dialogue and opponent reads

- Added a compact RPG dialogue panel using ordinary HTML tables and ES3 timers. No typewriter animation or additional model call.
- Quotes play in order, with speaker portrait, action and hand/street context. Latest quotes also appear in the public history.
- Each character receives latest per-seat quotes, recent conversation, last play, sixty public actions and cumulative table statistics. Private strategy memories remain separate.
- Dialogue and observations persist across hands and saves; a fresh table starts a fresh set of reads.
- Overt card/strategy disclosures receive contextual fallback dialogue; the filter is not a semantic privacy proof.
- All 19 automated checks passed. Fake-provider integration confirms the next character receives the prior public quote after its legal move.
- Live API hand passed: after the player shoved, Jack said “You shoved the door open. I’m walking through.” while going all-in. Nell then folded with “The whole stack? I will leave that contest to you.” addressed to Jack.
- The live save contained conversation and structured observations for all five seats, and restored successfully into a new session. Server stderr remained empty.

## Perspective view

- Generated and visually inspected an empty monochrome period table scene; final image is an opaque 740 x 300 JPEG, 32,859 bytes, in `public/images/table-room.jpg`.
- Added a Perspective/Classic toggle beside Save, History and Help. Its cookie remembers the view. Tests confirm switching does not issue a game request.
- Four opponents follow clockwise around the table from the player's lower-right seat. Cards are independent HTML elements on the tabletop; community cards are centered.
- Existing dealer visibility rules remain enforced. Tests confirm an uncontested winner keeps both cards hidden and showdown participants reveal their cards. Your own cards remain visible after folding.
- Uses positioned divs inside a shared table layout, no positioned table cells, CSS transforms, SVG, canvas or animated flips. Cards change face instantly.
- All 21 checks passed. Restart authorized with no game to preserve; the new server serves both the page and cached background successfully in API mode, with an empty error log.
- The browser preview plugin was unavailable, so integrated visual rendering and actual IE6/Pentium III testing remain unverified.

## Piano soundtrack

- Composed "Midnight Ledger", an original 32-bar solo-piano loop at 76 BPM, about 101 seconds, 2,884 bytes as a format-0 General MIDI file.
- Added Music On/Off on menu and table with a remembered cookie. Supported native background sound uses infinite looping and quiet volume; Off mutes and clears the source.
- Unsupported browsers expose the MIDI download/open link and do not claim to be playing sound.
- All 23 checks passed, including MIDI header/timing, soft velocities, balanced notes, mute/unmute, cookie restoration, unsupported-browser behavior, and cached audio/midi serving.
- Actual playback and tone on Windows 98/IE6 remain unverified; they depend on the machine's MIDI synthesizer. Composition source and official playback references are in `docs/MUSIC.md`.
