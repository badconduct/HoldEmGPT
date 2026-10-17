// Server-only authored first-pass cases. Never serve this module or its predicates.
import { randomInt } from 'node:crypto';
import { casinos, assetUrl } from './campaign-catalog.js';
import { formFor, caseReferences, hotelReferences, sceneImages } from './story-catalog.js';
const motives=[
  'The victim had copied a ledger showing money diverted from the circuit prize reserve.',
  'The victim held contracts proving that circuit winnings were being used to settle private studio debts.',
  'The victim had kept the original accounts of a protection fund that had become a private fortune.',
  'The victim had discovered a second set of exchange accounts and meant to sell the discrepancy.',
  'The victim carried letters linking missing circuit funds to a planned departure from Paris.'
];
const murderSetups=[
  {id:'last-cashout',title:'The Last Cashout',boss:0,hotel:1,weapon:'w3',falseCategory:'weapon',forms:['w1','r2','p2','l1','c1']},
  {id:'velvet-alibi',title:'The Velvet Alibi',boss:1,hotel:2,weapon:'w2',falseCategory:'receipt',victimBoss:2,forms:['w2','r4','p4','l2','c3']},
  {id:'wrong-hand',title:'A Letter in the Wrong Hand',boss:2,hotel:3,weapon:'w4',falseCategory:'letter',forms:['w4','r4','p3','l4','c2']},
  {id:'borrowed-coat',title:'The Borrowed Coat',boss:3,hotel:4,weapon:'w5',falseCategory:'clothing',victimBoss:4,forms:['w5','r5','p5','l3','c4']},
  {id:'last-departure',title:'The Last Departure',boss:4,hotel:0,weapon:'w1',falseCategory:'photo',forms:['w1','r1','p2','l5','c5']},
  {id:'quiet-suite',title:'A Quiet Suite',boss:2,hotel:0,weapon:'w2',falseCategory:'letter',forms:['w2','r1','p1','l1','c3']}
];
const stagedSetups=casinos.map((c,i)=>({id:'own-photograph-'+(i+1),title:'The Guest in the Photograph',boss:i,hotel:(i+2)%5,weapon:'none',kind:'staged',falseCategory:'photo',victimBoss:i,forms:['w'+(i+1),'r'+((i+3)%5+1),'p'+[1,2,4,3,5][(i+2)%5],'l'+(i+1),'c'+(i+1)]}));
export const caseSetups=[...murderSetups,...stagedSetups];
export function chooseCase({predecessor=null,caseId=null}={}) {
  let setup;
  if(caseId)setup=(predecessor?murderSetups:caseSetups).find(c=>c.id===caseId);
  else {
    const pool=predecessor || randomInt(5)!==0?murderSetups:stagedSetups,boss=randomInt(casinos.length);
    const variants=pool.filter(c=>c.boss===boss);setup=variants[randomInt(variants.length)];
  }
  if(!setup)throw new Error('Unknown or incompatible story case.');
  const person=setup.victimBoss===undefined?null:casinos[setup.victimBoss].boss;
  const victim=predecessor?{name:predecessor.name,portrait:predecessor.portrait,bossId:null,inherited:true}:person?{name:person.name,portrait:assetUrl(person.portrait),bossId:person.id,inherited:false}:{name:'Elias Rook',portrait:sceneImages.rook,bossId:null,inherited:false};
  return {caseId:setup.id,victim};
}
const claim=(...pairs)=>Object.fromEntries(pairs);
export function buildCase(story) {
  const setup=caseSetups.find(c=>c.id===story.caseId);
  if(!setup)throw new Error('Unknown story case.');
  const staged=setup.kind==='staged',boss=casinos[setup.boss].boss,hotel=casinos[setup.hotel];
  const alternate=[1,2,3,4].map(step=>(setup.boss+step)%5).find(i=>casinos[i].boss.id!==story.victim.bossId),other=casinos[alternate].boss;
  const wrongHotel=casinos[(setup.hotel+1)%5],ref=caseReferences[setup.boss],room=hotelReferences[setup.hotel],victim=story.victim.name;
  const actual=formFor(setup.weapon),substitute=formFor(setup.forms[0]);
  const solution={boss:boss.id,hotel:hotel.id,weapon:setup.weapon};
  const culpritMark=ref.signature+' / '+ref.seal;
  const commonClaim=claim(['boss',boss.id],['hotel',hotel.id]);
  const weaponClaim=staged?claim(['weapon','none'],['hotel',hotel.id]):claim(['weapon',setup.falseCategory==='weapon'?substitute.id:actual.id],['hotel',hotel.id]);
  const weaponText=staged?[
    'Recovery record: '+substitute.name+' was found at '+hotel.name+', '+room.room+'.',
    'Examination: this object caused no injury. The accompanying examination found no fatal wound; the material on the scene props is theatrical pigment. The recovered object is a prop, not a murder weapon.'
  ]:[
    'Recovery record: '+substitute.name+' was recovered at '+hotel.name+', '+room.room+'.',
    'Examiner\'s signed conclusion: the fatal injury to '+victim+' was caused by '+substitute.name.toLowerCase()+'. The object is retained with this record.'
  ];
  const receiptFalse=setup.falseCategory==='receipt';
  const receiptBoss=receiptFalse?other:boss,receiptHotel=receiptFalse?wrongHotel:hotel;
  const receiptText=staged?[
    'Counterfoil: '+boss.name+' personally collected a reserved cashout at '+casinos[Number(setup.forms[1].slice(1))-1].name+' three days after the reported death. Two clerks checked the customer\'s identity against the circuit thumbprint register; their signed comparison is attached.',
    'The customer released the private reception-area key deposit for '+hotel.name+', '+room.room+', and asked that the departure be kept off the guest circular. This is a later transaction, not the location of the apparent death.'
  ]:[
    'Reception-night cashout: '+receiptBoss.name+' signed in person at '+receiptHotel.name+' at 11:15 p.m., five minutes before the incident.',
    'The attached key log identifies this customer as the sole visitor admitted to '+victim+'\'s private reception area, '+(receiptFalse?hotelReferences[(setup.hotel+1)%5].room:room.room)+', from 11:15 until 11:30 p.m. It records no other entrant during that interval.'
  ];
  const photoFalse=setup.falseCategory==='photo';
  const photoHotel=photoFalse&&!staged?wrongHotel:hotel;
  const photoText=staged?[
    'Scene report supplied with the photograph: '+victim+' died at '+hotel.name+', '+room.room+', at 11:20 p.m.',
    'The report attributes the death to '+substitute.name.toLowerCase()+'. The photograph and identification sheet were supplied together; no independent witness to the death is named.'
  ]:[
    'Scene and medical report: '+victim+' died at '+photoHotel.name+', '+(photoFalse?hotelReferences[(setup.hotel+1)%5].room:room.room)+', at 11:20 p.m.',
    'Medical comparison: the fatal injury uniquely matches '+actual.name.toLowerCase()+', not any of the other four objects listed on the weapon reference card. The enclosed examiner\'s comparison, rather than a tiny detail in the illustration, supplies this finding.'
  ];
  const letterFalse=setup.falseCategory==='letter';
  const letterBoss=letterFalse?other:boss,letterRef=caseReferences[letterFalse?alternate:setup.boss];
  const letterLead={l1:'You have kept the original accounts long enough. Bring them, or I send your private dealings to every house.',l2:'I request a private meeting before the reception ends.',l3:'The outstanding account must be settled in person before we close the books.',l4:'This is your warning: keep those papers out of circulation until we have spoken.',l5:'Before your departure, collect the original papers. Your route begins with a private meeting.'}[setup.forms[3]];
  const stageLead={l1:'Follow these instructions, or your part in the missing accounts goes to the papers.',l2:'Come alone to arrange a private departure.',l3:'Settle my departure account according to these instructions.',l4:'Keep this warning private: nobody must mistake our arrangement for an actual killing.',l5:'These are the instructions for my departure.'}[setup.forms[3]];
  const letterText=staged?[
    'Transcript: "'+stageLead+' Prepare the departure from '+hotel.name+'. Send the circular saying I died in '+room.room+'. Use the costume for the photograph. Release my funds after the circular has gone out. There must be no victim."',
    'The original bears '+ref.signature+' and '+ref.seal+' seal. The enclosed handwriting comparison identifies '+boss.name+' as its author. These are instructions written before the apparent death, not a confession generated at the table.'
  ]:[
    'Transcript: "'+letterLead+' Meet me alone at '+hotel.name+', '+room.room+', at 11:20. Bring the original accounts. We will settle this before the others leave."',
    'The letter to '+victim+' bears '+letterRef.signature+' and '+letterRef.seal+' seal. The attached handwriting comparison identifies '+letterBoss.name+' as the author; the appointment clerk\'s retained copy identifies the author as the sole visitor present with the victim throughout 11:15-11:30 p.m.'
  ];
  const clothingFalse=setup.falseCategory==='clothing',clothingBoss=clothingFalse?other:boss;
  const clothingText=staged?[
    'Wardrobe docket: '+formFor(setup.forms[4]).name+' was hired by '+boss.name+' as part of a complete stage costume for the reception at '+hotel.name+'. The hire slip bears '+culpritMark+'.',
    'Return inventory: wax, stage pigment and a padded body form were returned with the garment. The wardrobe attendant\'s statement identifies the customer leaving alive after the alleged death; there was no injured person in the costume.'
  ]:[
    'Garment identification: '+formFor(setup.forms[4]).name+' is attributed to '+clothingBoss.name+'. The enclosed fitting card and the porter\'s signed comparison support that attribution.',
    'The porter\'s attached account identifies this wearer as the sole visitor with the victim at '+hotel.name+', '+room.room+', during 11:15-11:30 p.m. The laboratory attachment matches traces on the garment to '+actual.name.toLowerCase()+'.'
  ];
  const predicates=[weaponClaim,
    staged?{...commonClaim,weapon:'none'}:claim(['boss',receiptBoss.id],['hotel',receiptHotel.id]),
    claim(['hotel',photoHotel.id],['weapon',staged?substitute.id:actual.id]),
    staged?{...commonClaim,weapon:'none'}:claim(['boss',letterBoss.id],['hotel',hotel.id]),
    staged?{...commonClaim,weapon:'none'}:claim(['boss',clothingBoss.id],['hotel',hotel.id],['weapon',actual.id])];
  const texts=[weaponText,receiptText,photoText,letterText,clothingText];
  const exhibits=setup.forms.map((id,i)=>({...formFor(id),awardCasino:story.deliveryOrder[i],description:texts[i],predicate:predicates[i]}));
  const explanation=staged?
    boss.name+' arranged an apparent death at '+hotel.name+'. The death claim in the photograph\'s report is false. The unused prop, verified later cashout, advance instructions and costume return establish a staged disappearance. There was no murder weapon.':
    boss.name+' killed '+victim+' at '+hotel.name+' using '+actual.name.toLowerCase()+'. The false claim belongs to the '+setup.falseCategory+' exhibit. The other four records independently agree on the responsible person, location and actual weapon; their comparisons exclude the contradictory record.';
  const closing=staged?boss.name+' was found alive and taken into custody to answer for the disappearance scheme. The false death had bought time, but the retained records ended it.':'The dossier reached the investigators in '+hotel.city+'. '+boss.name+' was taken into custody. The house could dispute a rumor; it could not explain away the four matching records.';
  return {id:setup.id,title:setup.title,kind:staged?'staged':'murder',solution,falseCategory:setup.falseCategory,exhibits,explanation,closing,motive:story.victim.inherited?'After the victim\'s failed accusation, their retained papers threatened another house. '+motives[setup.boss]:motives[setup.boss]};
}
export function supportedSolutions(file) {
  const candidates=[];
  for(const c of casinos)for(const h of casinos)for(const weapon of ['w1','w2','w3','w4','w5','none']) {
    const answer={boss:c.boss.id,hotel:h.id,weapon};
    const falseItems=file.exhibits.filter(e=>!Object.entries(e.predicate).every(([key,value])=>answer[key]===value));
    if(falseItems.length===1)candidates.push({...answer,falseCategory:falseItems[0].category});
  }
  return candidates;
}
