// Author/reviewer paper packets. Never copied to the runtime container.
import { writeFile } from 'node:fs/promises';
import { newStory } from '../lib/story.js';
import { buildCase, caseSetups, supportedSolutions, evidenceSourceRule } from '../lib/story-cases.js';
import { casinos } from '../lib/campaign-catalog.js';
import { caseReferences, hotelReferences, storyCategories } from '../lib/story-catalog.js';
const packets=['# The Empty Chair: house-supplied evidence dossiers','','Read the records before opening [the separate solutions](story-solutions-v4.md). These packets reproduce the complete HTML comparison text and witnessed source labels, without private predicates or a visible guilty flag. They are ready for a fresh reader; automated consistency checks do not establish human difficulty.','','The established private-door account identifies the responsible host: the sole visitor alone with the victim in a genuine killing, or the arranger of a staged scene. Exactly one exhibit has an incorrect comparison. A true shortlist preserves all remaining alternatives, not multiple visitors. The other four exhibits must all hold. Every necessary fact is supplied as text.','',evidenceSourceRule,'','Each case has 24 possible delivery assignments. These packets show one fixed valid assignment. Each of the four truthful records supplies an indispensable incident-room exclusion. Omitting any one leaves another hotel possible, even after identifying the false supplier. The final accusation requires all five deliveries and names the exhibit set aside.','','## Reliable reference cards','',...casinos.map((c,i)=>'- '+c.boss.name+': '+caseReferences[i].detail+' '+c.name+' / House mark: '+hotelReferences[i].mark+'.'),'','Weapon alternatives: pocket revolver; pearl-handled opener with a brass collar; brass ashtray; silk curtain cord; heavy champagne bottle; or no fatal injury in a posed figure. A gunshot must fit a projectile; a narrow stab must fit a blade; a blunt blow can fit the ashtray or bottle; strangulation must fit a cord. Damaged copied reports may retain alternative readings.',''];
const solutions=['# House-supplied dossier solutions — spoilers','','Story rules version 4. Each complete set has one supported answer, and its false exhibit comes from the responsible boss\'s house. All four truthful records are necessary, including under the witnessed supplier rule. All five deliveries are required to file the final accusation, which also names the rejected exhibit. This is a consistency guarantee, not a measure of entertainment or natural poker campaign duration.',''];
const timing=[];
for(const [index,setup] of caseSetups.entries()){
  const story=newStory({caseId:setup.id}),order=setup.order.filter(id=>id!==setup.falseCategory);
  order.splice(setup.boss,0,setup.falseCategory);
  story.deliveryOrder=storyCategories.map(c=>casinos[order.indexOf(c.id)].id);
  const file=buildCase(story),number=index+1;
  packets.push('## Packet '+number+': '+file.title,'','Reported victim: '+story.victim.name+'.','',file.premise,'');
  for(const casino of casinos){const e=file.exhibits.find(e=>e.awardCasino===casino.id);packets.push('### '+casino.city+': '+e.name,'','Supplied under '+casino.boss.name+'\'s authority at '+casino.name+'. Source witnessed by the circuit clerk.','',...e.description.flatMap(t=>[t,'']));}
  packets.push('Your account: responsible host ______; incident hotel ______; actual weapon or staged death ______; exhibit set aside ______.','Which exhibit fails, and which comparisons establish that?','');
  const prefixes=casinos.map((_,i)=>supportedSolutions(file,{exhibits:file.exhibits.filter(e=>casinos.findIndex(c=>c.id===e.awardCasino)<=i)}).length);
  const omissions=file.exhibits.filter(e=>e.category!==file.falseCategory).map(omit=>({omitted:omit.category,answers:supportedSolutions(file,{exhibits:file.exhibits.filter(e=>e!==omit)}).length}));
  if(omissions.some(x=>x.answers<2))throw new Error(setup.id+' has redundant truthful evidence');
  timing.push({case:setup.id,fullAnswers:supportedSolutions(file).length,prefixAnswerCounts:prefixes,firstDeductionAfterHouse:prefixes.indexOf(1)+1,truthfulOmissions:omissions});
  solutions.push('## Packet '+number+': '+file.title,'',file.explanation,'',file.motive,'',file.proof,'',file.closing,'');
}
await writeFile(new URL('../docs/design/story-dossiers-v4.md',import.meta.url),packets.join('\n').trimEnd()+'\n');
await writeFile(new URL('../docs/design/story-solutions-v4.md',import.meta.url),solutions.join('\n').trimEnd()+'\n');
console.log(JSON.stringify(timing,null,2));
