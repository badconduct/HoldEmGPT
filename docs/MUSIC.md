# Midnight Ledger

An original quiet solo-piano MIDI composed for The Midnight Room. The asset is
`public/music/midnight-ledger.mid`; reproducible source is
`scripts/compose-piano.js` (`node scripts/compose-piano.js`).

- 32 bars in 4/4 at 76 BPM, about 101 seconds per loop.
- General MIDI acoustic grand piano, channel 1, small format-0 file.
- Gentle C-major lounge harmony with secondary dominants and borrowed minor
  chords, sparse lightly swung phrases, low note velocities and reduced channel
  volume. No percussion, vocals, samples, external music service, or borrowed
  melody.
- All notes end before the loop boundary; final dominant resolves into the
  opening tonic when repeated. Sustain is released and all notes switched off.

The main menu and table have Music On/Off controls. Native background sound
starts quietly on supported legacy browsers unless the saved cookie says Off.
Turning Off mutes immediately and clears the source. The preference is remembered
for a year. Moving between menu/table pages restarts the tune.

Playback uses Internet Explorer's `bgsound` object and `loop=-1`, documented in
[Microsoft's loop reference](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa703818(v=vs.85))
and [background-sound interface reference](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/platform-apis/aa704321(v=vs.85)).
The MIDI is HTTP-cached for one day. Modern browsers generally do not expose this
legacy sound object; on those browsers the button identifies MIDI and the file
can be opened through the Piano MIDI link instead of pretending audio is playing.

Binary MIDI structure, soft velocities, balanced note-on/off events, timing,
ES3 syntax, mute/unmute and remembered preferences are tested. Actual sound on
Windows 98/IE6 depends on the installed sound card/MIDI synthesizer and remains
unverified in this environment.
