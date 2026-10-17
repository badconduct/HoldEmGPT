// Author/reviewer paper packets. Never copied to the runtime container.
import { writeFile } from 'node:fs/promises';
import { newStory } from '../lib/story.js';
import { buildCase, caseSetups, supportedSolutions } from '../lib/story-cases.js';
import { casinos } from '../lib/campaign-catalog.js';
import { caseReferences, hotelReferences, storyCategories } from '../lib/story-catalog.js';
const packets=['# The Empty Chair: revised paper dossiers','','Read the records before opening [the separate solutions](story-solutions-v2.md). These packets reproduce the complete HTML comparison text, without private predicates or a visible guilty flag. They are ready for a fresh reader; automated consistency checks do not establish human difficulty.','','The established private-door account identifies the responsible host: the sole visitor alone with the victim in a genuine killing, or the arranger of a staged scene. Exactly one exhibit has an incorrect comparison. A true shortlist preserves all remaining alternatives, not multiple visitors. The other four exhibits must all hold. Every necessary fact is supplied as text.','','## Reliable reference cards','',...casinos.map((c,i)=>'- '+c.boss.name+': '+caseReferences[i].detail+' '+c.name+' / '+hotelReferences[i].detail),'','Weapon alternatives: pocket revolver; pearl-handled opener with a brass collar; brass ashtray; silk curtain cord; heavy champagne bottle; or no fatal injury in a posed figure.',''];
const solutions=['# Revised dossier solutions — spoilers','','Version 2. Each complete set has one supported answer. Every proper subset leaves alternatives under the one-false rule. This is a logic guarantee, not a measure of entertainment or natural poker campaign duration.',''];
const timing=[];
for(const [index,setup] of caseSetups.entries()){
  const story=newStory({caseId:setup.id});story.deliveryOrder=storyCategories.map(c=>casinos[setup.order.indexOf(c.id)].id);
  const file=buildCase(story),number=index+1;
  packets.push('## Packet '+number+': '+file.title,'','Reported victim: '+story.victim.name+'.','',file.premise,'');
  for(const casino of casinos){const e=file.exhibits.find(e=>e.awardCasino===casino.id);packets.push('### '+casino.city+': '+e.name,'',...e.description.flatMap(t=>[t,'']));}
  packets.push('Your account: responsible host ______; incident hotel ______; actual weapon or staged death ______.','Which exhibit fails, and which comparisons establish that?','');
  const partial=[];for(let mask=1;mask<31;mask++)partial.push(supportedSolutions(file,{exhibits:file.exhibits.filter((_,i)=>mask&(1<<i))}).length);
  timing.push({case:setup.id,fullAnswers:supportedSolutions(file).length,smallestPartialAnswerCount:Math.min(...partial),properSubsetsChecked:30});
  solutions.push('## Packet '+number+': '+file.title,'',file.explanation,'',file.motive,'',file.proof,'',file.closing,'');
}
await writeFile(new URL('../docs/design/story-dossiers-v2.md',import.meta.url),packets.join('\n').trimEnd()+'\n');
await writeFile(new URL('../docs/design/story-solutions-v2.md',import.meta.url),solutions.join('\n').trimEnd()+'\n');
console.log(JSON.stringify(timing,null,2));
