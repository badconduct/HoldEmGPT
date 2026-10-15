# Fortune Row: cast and portrait catalog

Content and artwork for [Last Seat on Fortune Row](V2-CONTENT-AND-FLOW.md).
Generated from [the content definitions](../content/v2/campaign.json) by
`node scripts/build-v2-content-preview.js`. The server loads these profiles for the campaign.

The current campaign has 25 male and 15 female regulars, four male bosses and one female boss. Each casino draws from five men and three women. Player choices include six men and four women.

## Player characters

| Character | Background | Portrait |
| --- | --- | --- |
| The Drifter | You have carried your stake a long way. Fortune Row looks like a place where a stranger might finally make a name. | [drifter.jpg](../public/portraits/players/drifter.jpg) |
| The Heiress | The invitation has always been easy. Earning your own reputation is the part that interests you. | [heiress.jpg](../public/portraits/players/heiress-v2.jpg) |
| The Pilot | You have learned to read the conditions and choose your moment. Tonight the destination is yours. | [pilot.jpg](../public/portraits/players/pilot.jpg) |
| The Reporter | You came looking for a story. Somewhere along the way, you decided to become part of it. | [reporter.jpg](../public/portraits/players/reporter-v2.jpg) |
| The Crooner | You have worked the smaller stages and saved the tips. You are ready to see what the next room holds. | [crooner.jpg](../public/portraits/players/crooner.jpg) |
| The Mechanic | You saved your stake one repair at a time. A steady hand and a little patience have served you well. | [mechanic.jpg](../public/portraits/players/mechanic-v2.jpg) |
| The Dancer | You know how to hold a room's attention. Tonight you want a seat beyond the footlights. | [dancer.jpg](../public/portraits/players/dancer-v2.jpg) |
| The Tailor | You have dressed plenty of winners. Now you intend to find out how it feels to be one. | [tailor.jpg](../public/portraits/players/tailor.jpg) |
| The Night Nurse | Long shifts taught you patience and a calm face. The city has finally given you a night of your own. | [nurse.jpg](../public/portraits/players/nurse-v2.jpg) |
| The Gambler | You have played for small stakes in unfamiliar rooms. Fortune Row is the next step. | [gambler.jpg](../public/portraits/players/gambler.jpg) |

## The Gilded Alibi / Las Vegas, 1947

A discreet desert card room: dark walnut, shaded lamps, desert light at the shutters, and your first open door.

| Regular | Role | Playing style | Portrait |
| --- | --- | --- | --- |
| Silas "The Rail" Mercer | Railroad investor | Tight and patient | [rail.jpg](../public/portraits/rail.jpg) |
| Ruby Valentine | Lounge singer | Loose and aggressive | [ruby.jpg](../public/portraits/campaign/gilded-alibi/ruby-v2.jpg) |
| Dusty Bell | Desert prospector | Curious calling station | [dusty.jpg](../public/portraits/dusty.jpg) |
| Ada Ledger | House bookkeeper | Disciplined value player | [ada.jpg](../public/portraits/campaign/gilded-alibi/ada-v2.jpg) |
| Felix "Ace" Marlow | Stage magician | Tricky bluff artist | [ace.jpg](../public/portraits/ace.jpg) |
| Nell Nightingale | Night columnist | Observant counterpuncher | [nell.jpg](../public/portraits/campaign/gilded-alibi/nell-v2.jpg) |
| Jack "Iron" Doyle | Floor boss | Relentless pressure | [jack.jpg](../public/portraits/jack.jpg) |
| Wade "Coyote" Pritchard | Desert motorcoach operator | Cautious trap setter | [wade-pritchard.jpg](../public/portraits/campaign/gilded-alibi/wade-pritchard.jpg) |

**Boss: Victor "The House" Maddox / Desert bookmaker.** Value-led patience.

[Boss portrait](../public/portraits/campaign/gilded-alibi/victor-maddox.jpg). The authored policy brief and dialogue
triggers are in the content definitions; `lib/bosses.js` implements the server policies.

Arrival: Four tables first. Show me you can keep your seat, then we'll talk business.

Player wins the entire boss table: You earned this one fair and square. Take my card to the Marigold Star. Passage and a room are covered.

Reward: **Marigold Invitation**.
## The Marigold Star / Hollywood, 1947

A private supper club behind the studio gates, where polished manners and a well-told story can carry considerable weight.

| Regular | Role | Playing style | Portrait |
| --- | --- | --- | --- |
| Frankie Bellhop | Hotel bell captain | Patient value player | [frankie-bellhop.jpg](../public/portraits/campaign/marigold-star/frankie-bellhop.jpg) |
| Della Marigold | Studio contract player | Cautious trap setter | [della-marigold.jpg](../public/portraits/campaign/marigold-star/della-marigold-v2.jpg) |
| Calvin "Cadillac" Price | Motorcar salesman | Loose pressure player | [calvin-price.jpg](../public/portraits/campaign/marigold-star/calvin-price.jpg) |
| June "Jukebox" Jansen | Club vocalist | Playful selective bluffer | [june-jukebox.jpg](../public/portraits/campaign/marigold-star/june-jukebox-v2.jpg) |
| Walt Greer | Studio garage proprietor | Tight and steady | [walt-greer.jpg](../public/portraits/campaign/marigold-star/walt-greer.jpg) |
| Ruth "Lucky" Lane | All-night diner owner | Optimistic caller | [ruth-lane.jpg](../public/portraits/campaign/marigold-star/ruth-lane-v2.jpg) |
| Otis Reed | House bandleader | Position-minded counterpuncher | [otis-reed.jpg](../public/portraits/campaign/marigold-star/otis-reed.jpg) |
| Eddie "Splice" Kovacs | Studio film editor | Disciplined small-pot specialist | [eddie-kovacs.jpg](../public/portraits/campaign/marigold-star/eddie-kovacs.jpg) |

**Boss: Vincent "Velvet" Vale / The Headliner.** Measured theatrical bluffs.

[Boss portrait](../public/portraits/campaign/marigold-star/vincent-vale.jpg). The authored policy brief and dialogue
triggers are in the content definitions; `lib/bosses.js` implements the server policies.

Arrival: Win over the room first. I do not share the final chorus with just anyone.

Player wins the entire boss table: You have earned the next room. Take this card to Casa del Azahar in Mexico City; Celeste will be expecting you.

Reward: **Azahar Guest Card**.
## Casa del Azahar / Mexico City, 1947

An elegant courtyard club of carved wood, pale plaster and deep shadow, where a patient host lets the conversation reveal the room.

| Regular | Role | Playing style | Portrait |
| --- | --- | --- | --- |
| Tomás Valera | Travel columnist | Observant counterpuncher | [tomas-valera.jpg](../public/portraits/campaign/casa-azahar/tomas-valera.jpg) |
| Lucía Robles | Boutique proprietor | Loose and aggressive | [lucia-robles.jpg](../public/portraits/campaign/casa-azahar/lucia-robles-v2.jpg) |
| Rafael "Atlas" Acosta | Airline captain | Tight and patient | [rafael-acosta.jpg](../public/portraits/campaign/casa-azahar/rafael-acosta.jpg) |
| Inés Montoya | Club pianist | Patient trap setter | [ines-montoya.jpg](../public/portraits/campaign/casa-azahar/ines-montoya-v2.jpg) |
| Felipe Salcedo | Civil engineer | Analytical value player | [felipe-salcedo.jpg](../public/portraits/campaign/casa-azahar/felipe-salcedo.jpg) |
| Nora Beltrán | Radio producer | Measured opportunist | [nora-beltran.jpg](../public/portraits/campaign/casa-azahar/nora-beltran-v2.jpg) |
| Benito "Benny" Luna | Club dancer | Curious caller | [benito-luna.jpg](../public/portraits/campaign/casa-azahar/benito-luna.jpg) |
| Arturo "El Toro" Salgado | Retired boxer and fight promoter | Structured semi-bluffer | [arturo-salgado.jpg](../public/portraits/campaign/casa-azahar/arturo-salgado.jpg) |

**Boss: Celeste Varela / The Hostess.** Position and controlled traps.

[Boss portrait](../public/portraits/campaign/casa-azahar/celeste-varela.jpg). The authored policy brief and dialogue
triggers are in the content definitions; `lib/bosses.js` implements the server policies.

Arrival: Make yourself comfortable. Four tables will tell us whether you are ready for a more private invitation.

Player wins the entire boss table: You have been a gracious guest and a difficult opponent. This letter introduces you at the Lantern Exchange in New York.

Reward: **Lantern Letter**.
## The Lantern Exchange / New York, 1947

A Manhattan private club above the late-night streets, where measured offers, small pressures and long memories shape the game.

| Regular | Role | Playing style | Portrait |
| --- | --- | --- | --- |
| Gloria "Goldie" Gaines | Music promoter | Broad-range aggressor | [gloria-gaines.jpg](../public/portraits/campaign/lantern-exchange/gloria-gaines-v2.jpg) |
| Stan Sloane | Radio technician | Analytical and tight | [stan-sloane.jpg](../public/portraits/campaign/lantern-exchange/stan-sloane.jpg) |
| Carmen Cielo | Theatre wardrobe designer | Tricky selective bluffer | [carmen-cielo.jpg](../public/portraits/campaign/lantern-exchange/carmen-cielo-v2.jpg) |
| Reggie Darden | Private-club doorman | Patient pressure player | [reggie-darden.jpg](../public/portraits/campaign/lantern-exchange/reggie-darden.jpg) |
| Paula Fox | Night reporter | Price-conscious caller | [paula-fox.jpg](../public/portraits/campaign/lantern-exchange/paula-fox-v2.jpg) |
| Morris "Mo" Morrow | Garment broker | Disciplined value player | [morris-morrow.jpg](../public/portraits/campaign/lantern-exchange/morris-morrow.jpg) |
| Frank "Ferry" Callahan | Harbor tugboat captain | Cautious trap setter | [frank-callahan.jpg](../public/portraits/campaign/lantern-exchange/frank-callahan.jpg) |
| Dean Drake | Night-shift taxi driver | Loose optimistic caller | [dean-drake.jpg](../public/portraits/campaign/lantern-exchange/dean-drake.jpg) |

**Boss: Leon Lark / The Operator.** Frequent small pressure.

[Boss portrait](../public/portraits/campaign/lantern-exchange/leon-lark.jpg). The authored policy brief and dialogue
triggers are in the content definitions; `lib/bosses.js` implements the server policies.

Arrival: Four results first. Then we can discuss what your next move is worth.

Player wins the entire boss table: You earned the next introduction. Le Salon des Brumes is expecting you in Paris. Do not let the journey rush your judgment.

Reward: **Brumes Invitation**.
## Le Salon des Brumes / Paris, 1947

A restored private salon in postwar Paris: tall windows, quiet elegance and a final invitation that has travelled a long way.

| Regular | Role | Playing style | Portrait |
| --- | --- | --- | --- |
| Blaise Bisset | Private banker | Tight analytical player | [blaise-bisset.jpg](../public/portraits/campaign/salon-des-brumes/blaise-bisset.jpg) |
| Roxane Renaud | Supper-club hostess | Loose aggressive bluffer | [roxane-renaud.jpg](../public/portraits/campaign/salon-des-brumes/roxane-renaud-v2.jpg) |
| Théo Klein | Antique dealer | Tricky pressure player | [theo-klein.jpg](../public/portraits/campaign/salon-des-brumes/theo-klein.jpg) |
| Diane Delorme | Telephone engineer | Patient counterpuncher | [diane-delorme.jpg](../public/portraits/campaign/salon-des-brumes/diane-delorme-v2.jpg) |
| Victor Perrin | Property restorer | Cautious trap setter | [victor-perrin.jpg](../public/portraits/campaign/salon-des-brumes/victor-perrin.jpg) |
| Camille Navarre | Fashion photographer | Observant opportunist | [camille-navarre.jpg](../public/portraits/campaign/salon-des-brumes/camille-navarre-v2.jpg) |
| Lucien Lenoir | Chauffeur | Friendly curious caller | [lucien-lenoir.jpg](../public/portraits/campaign/salon-des-brumes/lucien-lenoir.jpg) |
| Gaston "Le Zinc" Roussel | Cafe keeper and racecourse regular | Measured semi-bluffer | [gaston-roussel.jpg](../public/portraits/campaign/salon-des-brumes/gaston-roussel.jpg) |

**Boss: Marcel "Le Patron" Duvall / Montmartre cabaret proprietor.** Adapts to observed habits.

[Boss portrait](../public/portraits/campaign/salon-des-brumes/marcel-duvall.jpg). The authored policy brief and dialogue
triggers are in the content definitions; `lib/bosses.js` implements the server policies.

Arrival: Four tables to meet the room. Then bring your best story to my table.

Player wins the entire boss table: Five houses, all settled. Keep the last invitation: the Row will know your name wherever you sit.

Reward: **Fortune Row Champion**.

## Artwork provenance

The built-in imagegen tool supplied the original 1947 set and the individual cast refresh.
[Original prompts](artwork/v2-1947-prompts.json) and [refresh prompts](artwork/cast-refresh-1947-prompts.json) record the style references and each distinct face.
The refresh replaces 27 portraits and the title collage. Current portraits remain opaque
160 x 200 baseline JPEGs. Superseded profiles and images have been removed;
campaign and free-play tables use the current cast. Player portraits are cosmetic.
PNG masters and export records remain under ignored `artifacts/cast-refresh-1947/`.
