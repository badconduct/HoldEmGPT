// Version 3 adds readable cause-of-death reports. Keep version 2 records intact
// for saves issued before the house-supplied false-evidence rule.
import { dossiers as previous } from './story-dossiers.js';

const sceneReports={
  'last-cashout':'The scene examiner reports a fatal blow to the head: a broad, crushing wound from a heavy blunt object. The covered figure lies beside an overturned chair. The injury tracing allows the brass ashtray or the heavy bottle, rather than the gunshot claimed on the revolver sheet. A piano alcove and star-shaped plate fix the doorway.',
  'velvet-alibi':'The scene examiner reports a fatal injury at the throat. The balcony print shows the covered figure against a low tiled wall. The copied collar detail is damaged: its thin line could be a narrow blade cut or a cord-pressure mark. The report therefore retains a neck wound or strangulation as the two possible causes; it does not certify which one occurred.',
  'wrong-hand':'The scene examiner attributes death to force applied at the throat. The corridor print preserves a curved pressure bruise where the collar slipped. The damaged tracing permits a cord tightened around the neck or the curved brass rim of the ashtray pressed against it. Compare the shape with the separate close tracing; a pressure mark alone does not identify the object.',
  'borrowed-coat':'The scene examiner reports a fatal head wound. The stairwell print catches a small, deep impact at the edge of the covered figure. Its copied outline could be a concentrated blow from the bottle lip or a gunshot entry wound; the scale is missing. The report leaves both readings open until the separate broad-impact tracing can be checked.',
  'last-departure':'The scene report describes a fatal gunshot wound, with a projectile retained for the separate sealed comparison. Its supplied caption places the incident at the star-patterned doorway or the orange-blossom doorway. The archivist retained both written attributions, despite the missing negative. A convincing injury description does not make the caption reliable.',
  'quiet-suite':'The scene examiner reports a fatal penetrating wound. The suite print shows the covered figure beside a desk. Its copied injury outline is a small, deep puncture, compatible with a narrow stab wound or a gunshot entry wound. The uncertain edge must be compared with the separate collar tracing before choosing between blade and bullet.'
};
const fatalMethods={w1:'a gunshot wound',w2:'a stab wound from a narrow blade',w3:'a fatal blow from a brass rim',w4:'strangulation with a cord',w5:'a fatal blow from heavy glass'};

export const dossiers=previous.map(original=>{
  const setup=structuredClone(original),photo=setup.records.find(r=>r.category==='photo');
  if(setup.kind==='murder') {
    photo.observation=sceneReports[setup.id];
    if(setup.id==='last-departure')photo.claims.push(['weapon',['w1']]);
  } else {
    const methods=photo.claims.find(([key])=>key==='weapon')[1];
    photo.observation='The scene report records a death and lists '+methods.map(id=>fatalMethods[id]).join(' or ')+' as the possible fatal methods. The circulated print shows a covered figure. Its retained label also supplies a visitor-account shortlist. No original negative accompanies the report.';
    setup.reflections.clothing='The wardrobe tracing left an injury and a dressed form as alternatives. You kept both readings beside the other records.';
  }
  return setup;
});

export const causeOfDeath={
  w1:'a fatal gunshot wound',w2:'a fatal stab wound from the narrow letter-opener blade',
  w3:'a fatal blunt-force head injury from the brass ashtray',w4:'fatal strangulation with the curtain cord',
  w5:'a fatal head injury from a blow with the heavy bottle',none:'a posed figure, with no fatal injury and no murder weapon'
};
