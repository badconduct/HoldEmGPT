// Four independent incident-room exclusions make every truthful exhibit matter,
// including after the false packet's witnessed source identifies its supplier.
// Older saves continue to use their original dossier modules.
import { dossiers as previous } from './story-dossiers-v3.js';
import { casinos } from './campaign-catalog.js';

const observations={
  'last-cashout':[
    'A revolver was wrapped in an examiner\'s sheet. The sheet calls the dark mark in the scene print a fatal gunshot entry wound. No projectile or spent case accompanies it.',
    'The cashier retained the private-door deposit counterfoil. Overlapping seal edges leave a sunburst or an orange blossom as the visitor\'s account. The deposit covered the reserve audit meeting.',
    'The scene examiner reports a fatal blunt blow to the head. The broad injury tracing permits the brass ashtray or the heavy bottle. The surviving print shows a covered figure beside an overturned chair.',
    'An unsigned threat demands the reserve originals. Its appointment carbon preserves V. M. / sunburst or L. L. / lantern for the private-door account. The courier instruction bearing your name is cited as the way to remove the audit.',
    'The dinner jacket lining caught polished brass from the striking object. The comparison permits the desk ashtray or the brass collar beneath the pearl opener\'s handle. Neither the brass alone nor the injury outline alone names the object.'
  ],
  'velvet-alibi':[
    'The opener was kept beside a tracing of a deep, narrow injury, permitting a blade or projectile. The retained equipment-issue slip cancels the V. M. account before the private door opened.',
    'A private reception deposit was routed through an outside cashier. A fresh annotation gives V. M. / sunburst or M. D. / heron as the private visitor\'s account. The annotation claims attendance, not merely ownership of an account.',
    'The examiner reports a fatal injury at the throat. The damaged collar detail could be a narrow blade cut or a cord-pressure mark. The copied report retains a neck wound or strangulation as the two possible causes.',
    'A private invitation demands the original studio pledge before the other houses see the contracts. Its appointment impression permits V. V. / star or V. M. / sunburst for the private-door account.',
    'The visitor\'s scarf was checked with a coat at the private entrance. The porter retained a star-shaped seal or a lantern-shaped seal; the worn centre prevents a single reading.'
  ],
  'wrong-hand':[
    'The curtain cord was retained with a narrow neck tracing permitting a cut or a ligature. The equipment-issue slip cancels V. V. before admission; that account did not use the private door.',
    'A protection-fund deposit released the private-door key. Its wet seal could be an orange blossom or a star. The cashier kept both readings instead of expanding the damaged mark into a guessed name.',
    'The examiner attributes death to force at the throat. A curved pressure bruise permits a tightened cord or the curved brass rim of the desk ashtray. The tracing does not identify its material.',
    'A warning threatens to publish the protection accounts and names you as courier. Its added appointment line attributes the private-door account to V. V. / star or L. L. / lantern.',
    'A single glove was held at the private entrance under the visitor\'s account. Its duplicate label permits C. V. / blossom or M. D. / heron. The keeper did not identify a face.'
  ],
  'borrowed-coat':[
    'A heavy bottle was kept beside a broad injury tracing permitting heavy glass or a brass impact. The equipment-deposit slip cancels V. V. before the private door opened.',
    'The cashier copied the private-door deposit seal onto the reserve ledger. Its outline permits L. L. / lantern or V. V. / star. The original and duplicate reserve sale disagree by the missing parcel\'s value.',
    'The examiner reports a fatal head wound. The small, deep impact could be a blow from the bottle lip or a projectile entry. The copied scale is incomplete; the separate broad-impact tracing remains important.',
    'A debt-settlement letter threatens to send both reserve-sale ledgers to the circuit. Its appointment carbon permits L. L. / lantern or C. V. / blossom for the private visitor\'s account.',
    'A felt hat was left with the porter. Its fitting-card attachment attributes the visitor\'s checked account to V. M. / sunburst or V. V. / star. The attachment claims an account identification, not a face.'
  ],
  'last-departure':[
    'The revolver was sealed with an intact projectile comparison establishing a fatal gunshot. A locked-case checkout permits M. D. / heron or V. M. / sunburst for the visitor\'s account.',
    'The room-key deposit was entered under M. D. / heron or V. V. / star. The cashier retained both readings of the visitor\'s seal. The paying desk need not be the hotel where the key was used.',
    'The scene report records a fatal gunshot. Its added visitor caption names V. M. / sunburst or C. V. / blossom as the private-door account. The supplied print has no original negative; its account attribution must be tested against the retained records.',
    'The travel instructions order the bank letters collected before departure. Your name was added to the courier line in different ink. A retained dispatch carbon records which hotel branch could not receive the private appointment.',
    'A bellboy coat was checked under the visitor\'s account, rather than issued to an identified employee. The return label permits M. D. / heron or C. V. / blossom.'
  ],
  'quiet-suite':[
    'The opener came with a narrow collar tracing permitting a blade or cord. The retained case-issue counterfoil cancels M. D. before admission; that account did not use the private door.',
    'A charity-account payment released the private-door deposit. Its rubbed seal permits C. V. / blossom or M. D. / heron. The ledger also records creditor payments disguised as charitable distributions.',
    'The examiner reports a fatal penetrating wound. Its copied outline permits a narrow stab wound or a projectile entry. The uncertain edge must be checked against the separate collar tracing.',
    'The blackmail demand refers to unsigned charity accounts and names you as courier. An added attendance sheet attributes the private-door account to V. V. / star or M. D. / heron.',
    'The visitor\'s scarf was kept with a duplicate entrance tag. Its stained mark permits C. V. / blossom or L. L. / lantern. It records an account used at the entrance, not a manufacturer or an identified face.'
  ]
};
const locationChecks={
  weapon:house=>'The evidence clerk retained the incident-room recovery docket. Its key-series test rules out '+house+'. The other four hotels shared the surviving part of the series.',
  receipt:house=>'The room-key deposit carbon has a retained cancellation punch. It rules out '+house+' as the incident hotel. The paying desk\'s printed heading is a separate fact.',
  photo:house=>'The surviving border comparison rules out '+house+'\'s doorway mark. The other four marks remain possible; the room furniture and illustrative print do not identify a hotel.',
  letter:house=>'The original appointment\'s dispatch carbon cancels '+house+' as the incident hotel. It does not select between the four remaining branches.',
  clothing:house=>'The reception wardrobe docket carries a retained room-allocation stitch. Its comparison rules out '+house+' as the incident hotel; all four other houses used the surviving stitch.'
};
const reconstructions={
  'last-cashout':'The gunshot sheet disagrees with both the broad-impact tracing and the brass caught in the jacket. That sheet must be false. The two physical comparisons share only the ashtray. The retained account impressions meet at Maddox, whose house supplied the substituted sheet.',
  'velvet-alibi':'The receipt annotation allows Maddox or Duvall. Maddox contradicts the cancelled issue slip and the scarf docket; Duvall contradicts the invitation and scarf docket. Either needs two other false exhibits, so the receipt is false. The remaining account readings meet at Vale. The deep-injury and collar-line comparisons share only the letter opener.',
  'wrong-hand':'The warning names Vale or Lark. Vale contradicts both the cancellation and glove label; Lark contradicts both the deposit and glove label. The warning is false. The remaining account readings meet at Varela. The narrow neck tracing and curved pressure mark share only the curtain cord.',
  'borrowed-coat':'The hat attachment names Maddox or Vale. Maddox contradicts both retained account impressions; Vale contradicts the appointment letter and cancellation. The hat attribution is false. The intact accounts meet at Lark. The broad-impact and small edge-mark comparisons share only the heavy bottle.',
  'last-departure':'The scene caption names Maddox or Varela. Maddox contradicts both the deposit and coat accounts; Varela contradicts both the deposit and locked-case accounts. The caption is false. The retained accounts meet at Duvall, and the intact projectile comparison establishes the revolver.',
  'quiet-suite':'The added attendance sheet names Vale or Duvall. Vale contradicts both account impressions; Duvall contradicts the scarf tag and cancellation. The attendance sheet is false. The remaining accounts meet at Varela. Blade-or-cord and blade-or-projectile comparisons share only the letter opener.'
};
export const safeReflections={
  weapon:'You kept the object beside its examination sheet. Possession and use were different questions.',
  receipt:'The cashier had preserved a transaction rather than a verdict. You kept the carbon with its attachments.',
  photo:'A print, a caption and a report shared one envelope. You kept their claims available for comparison.',
  letter:'The paper carried a claim about that night. You put it away without turning its author into a witness.',
  clothing:'The garment and its docket stayed together. Their account marks still needed to be tested.'
};

export const dossiers=previous.map((original,caseIndex)=>{
  const setup=structuredClone(original);
  setup.records.forEach((record,i)=>{
    record.claims=record.claims.filter(([key])=>key!=='hotel');
    if(observations[setup.id])record.observation=observations[setup.id][i];
    record.attachment=record.category==='receipt'?'A paying desk is not automatically the incident hotel.':record.category==='photo'?'The complete doorway is not legible in the retained copy. Judge the readable account and injury comparisons, not the illustrative room.':'The attachment concerns the private meeting during 11:15-11:30, not an ordinary purchase or someone\'s usual possessions.';
  });
  // The false print now misattributes the visitor, rather than furnishing an
  // extra location constraint that would make a truthful exclusion redundant.
  if(setup.id==='last-departure'){
    setup.records[2].claims=[['boss',[0,2]],['weapon',['w1']]];
    setup.records[1].claims=[['boss',[4,1]]];
    setup.proof='Either visitor named by the supplied caption needs two other exhibits to be false. The retained account records agree on Duvall.';
    setup.motive='Duvall intended to leave with the missing circuit funds. The victim had retained the bank and travel instructions. A substituted visitor caption and a false courier order shifted suspicion toward other accounts.';
  }
  const truthful=setup.records.filter(r=>r.category!==setup.falseCategory),otherHotels=casinos.map((_,i)=>i).filter(i=>i!==setup.hotel);
  truthful.forEach((record,i)=>{
    const excluded=otherHotels[(i+caseIndex)%4];
    record.claims.push(['hotel',[excluded],'exclude']);
    record.attachment+=' '+locationChecks[record.category](casinos[excluded].name);
  });
  // The forged packet also contains a room check, falsely excluding the actual
  // hotel. Its layout must not announce which exhibit is false. The false core
  // account/method assertion remains false for any competing hotel, so this
  // extra claim cannot replace a missing truthful exclusion.
  const forged=setup.records.find(r=>r.category===setup.falseCategory);
  forged.claims.push(['hotel',[setup.hotel],'exclude']);
  forged.attachment+=' '+locationChecks[forged.category](casinos[setup.hotel].name);
  setup.reflections={...safeReflections};
  const exclusions=truthful.map(r=>{const index=r.claims.find(([key,,op])=>key==='hotel'&&op==='exclude')[1][0];return casinos[index].name;});
  setup.reconstruction=reconstructions[setup.id] || setup.reconstruction;
  setup.reconstruction+=' The four truthful incident-room checks separately exclude '+exclusions.slice(0,-1).join(', ')+' and '+exclusions.at(-1)+'. Only '+casinos[setup.hotel].name+' remains. Each exclusion removes a different competing hotel.';
  setup.proof=setup.proof.replace('shared account, recovery doorway and posed figure','shared account and posed figure').replace('both account readings and the doorway description must be true','both account readings and all retained room checks must be true');
  setup.proof+=' All four truthful room checks are needed: without any one of them, the hotel it excludes remains a possible crime scene.';
  return setup;
});
