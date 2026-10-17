import { randomInt } from 'node:crypto';
import { characterFor } from './campaign-catalog.js';
import { validateStoryTalk as validateFirstDraft } from './story-talk-v1.js';
// Each question owns its compatible replies. No model or fallback can mix intents.
export const storyTopics=[
  {id:'guest-list',category:null,exchanges:[
    ['Everyone remembers that reception differently.',['I would sooner read the original records.','A retained copy is less sociable, and more useful.','Memory improves after the newspapers arrive.']],
    ['Ever try to remember who left a room first?',['Often. I would still check the door record.','Memory is a poor night porter.','I would trust a record made that night.']],
    ['The guest list must have travelled farther than we have.',['Copies travel cheaply. Originals less so.','Then I would ask which copy it is.','Every desk seems to keep a different copy.']]
  ]},
  {id:'upstairs',category:null,exchanges:[
    ['Did you hear the story about upstairs that night?',['Only whispers. Nothing I would swear to.','I heard a story. I did not see it happen.','A story is not a signed account.']],
    ['Any truth to that upstairs rumor?',['Nothing I can establish.','I would rather compare the retained records.','Not on my word. I was not a witness.']],
    ['People are still whispering about the reception.',['They seldom whisper the source.','I prefer a paper with a date on it.','Let them whisper. Keep the originals.']]
  ]},
  {id:'paper',category:'receipt',exchanges:[
    ['You kept that cashout slip?',['Worth keeping until its marks agree with another record.','I would compare the damaged mark before trusting the heading.','A second impression might narrow the reading.']],
    ['Does a paying desk tell you where a key was used?',['Not by its heading alone. Read the retained location mark.','A counterfoil can be routed through another house.','I would compare the doorway records.']],
    ['Funny how a little paper can follow you.',['Best find out which account it actually names.','And which marks it leaves uncertain.','The copy made that night may matter most.']]
  ]},
  {id:'picture',category:'photo',exchanges:[
    ['A photograph never tells the whole story.',['Its caption and its source need checking too.','I would compare the report with the other records.','A print can be genuine while its caption is wrong.']],
    ['Do you believe everything in a photograph?',['I would want to know where the print came from.','I would read the comparisons before choosing one explanation.','A picture is a record to compare, not a verdict.']],
    ['Someone chose what that picture would show.',['And someone else wrote the caption.','The original source would be useful.','I would compare it with a record kept before it circulated.']]
  ]},
  {id:'letter',category:'letter',exchanges:[
    ['Do you recognise a letter by its seal?',['Only if enough of the mark survives.','I would compare it with the reference card.','A damaged mark may leave more than one reading.']],
    ['People put a great deal of trust in initials.',['Best compare the possible readings with another record.','An initial is a start, not a whole name.','I would keep both readings until something narrows them.']],
    ['A letter can carry more than one sort of mark.',['A route stamp may answer a different question from a signature.','Read what the attachment actually claims.','Compare like with like: an account or a doorway.']]
  ]},
  {id:'coat',category:'clothing',exchanges:[
    ['A coat does not tell you who wore it.',['The account on its tag needs a separate comparison.','Nor does its owner automatically identify its wearer.','Best read whether the report identifies an account or a physical trace.']],
    ['Ever leave a hat at the wrong hotel?',['More often than I care to admit.','Once was quite enough. I keep the claim ticket now.','Enough to doubt the address on a hat.']],
    ['I suppose every garment has a story.',['Its trace and its label may answer different questions.','I would read the retained comparison, not invent one.','The useful part is what another record can confirm.']]
  ]},
  {id:'object',category:'weapon',exchanges:[
    ['Finding an object does not tell you how it was used.',['The injury comparison has to agree.','I would keep the recovered object and the claimed method separate.','Another tracing might narrow the possible methods.']],
    ['A damaged tracing can leave more than one reading.',['Then keep the alternatives until another comparison helps.','Separate shortlists may have one reading in common.','Certainty is expensive. A comparison costs less.']],
    ['Would you trust one examiner by itself?',['Not with a disputed exhibit in the file.','I would compare the independent records.','I would check which claims can all hold together.']]
  ]}
];
function topicFor(id){return storyTopics.find(t=>t.id===id);}
function upgrade(t){
  if(t.version!==1)return;
  // Old delivered dialogue remains in the table history. An old pending exchange
  // expires; changing its wording halfway through would misrepresent that record.
  Object.assign(t,{version:2,plan:null,log:[],recent:t.recent.filter(id=>topicFor(id))});
}
export function prepareStoryTalk(g,{roll=()=>randomInt(1000000)/1000000,pick=n=>randomInt(n)}={}) {
  const talk=g.storyTalk;if(!talk)return;upgrade(talk);if(talk.seenHand===g.hand)return;
  talk.seenHand=g.hand;talk.plan=null;
  if(g.hand<3 || talk.count>=2 || g.hand-talk.lastHand<5 || roll()>=.1)return;
  const seats=g.players.map((p,i)=>i>0 && !p.folded && !p.out && p.stack>0 && !characterFor(p.id)?.scripted?i:-1).filter(i=>i>0);
  if(seats.length<2)return;
  const pool=storyTopics.filter(t=>(!t.category || talk.categories.includes(t.category)) && !talk.recent.includes(t.id));if(!pool.length)return;
  const first=seats.splice(pick(seats.length),1)[0],second=seats[pick(seats.length)],topic=pool[pick(pool.length)];
  talk.plan={topic:topic.id,first,second,asked:false,question:null,questionIndex:null};
}
export function storyTalkContext(g,i) {
  const talk=g.storyTalk,plan=talk?.plan;if(!plan || talk.version!==2 || talk.seenHand!==g.hand)return null;
  const role=!plan.asked && i===plan.first?'question':plan.asked && i===plan.second?'answer':null;if(!role)return null;
  const topic=topicFor(plan.topic),lines=role==='question'?topic.exchanges.map(q=>q[0]):topic.exchanges[plan.questionIndex][1];
  return {topic:topic.id,role,previousLine:role==='answer'?plan.question:null,replyToSeat:role==='answer'?plan.first:plan.second,
    permission:'General comparison advice about a collected record; no witness testimony or suspect attribution.',
    allowedLines:lines.map((text,n)=>({id:topic.id+'-'+role+'-'+(role==='answer'?plan.questionIndex+'-':'')+n,text}))};
}
export function commitStoryTalk(g,i,lineId) {
  const context=storyTalkContext(g,i);if(!context)return null;
  const selected=context.allowedLines.find(l=>l.id===lineId),line=selected || context.allowedLines[0],talk=g.storyTalk,plan=talk.plan;
  const index=context.allowedLines.indexOf(line);
  talk.log.push({hand:g.hand,seat:i,topic:context.topic,role:context.role,lineId:line.id,text:line.text,fallback:!selected,questionIndex:context.role==='question'?index:plan.questionIndex});talk.log=talk.log.slice(-8);
  if(context.role==='question'){talk.count++;talk.lastHand=g.hand;talk.recent.push(plan.topic);plan.asked=true;plan.question=line.text;plan.questionIndex=index;}
  else talk.plan=null;
  return {text:line.text,replyToSeat:context.replyToSeat};
}
export function validateStoryTalk(g,story) {
  const t=g?.storyTalk;if(!t)return;if(t.version===1)return validateFirstDraft(g,story);
  const bad=()=>{throw new Error('Invalid saved story conversation.');};
  if(!story || t.version!==2 || !Array.isArray(t.categories) || new Set(t.categories).size!==t.categories.length || t.categories.some(c=>!['weapon','receipt','photo','letter','clothing'].includes(c)) || !Number.isInteger(t.seenHand) || t.seenHand<0 || t.seenHand>g.hand || !Number.isInteger(t.count) || t.count<0 || t.count>2 || !Number.isInteger(t.lastHand) || t.lastHand>g.hand || !Array.isArray(t.recent) || t.recent.length>2 || t.recent.some(id=>!topicFor(id)) || !Array.isArray(t.log) || t.log.length>4)bad();
  for(const row of t.log){
    const topic=topicFor(row.topic),q=topic?.exchanges[row.questionIndex];
    if(!q || !Number.isInteger(row.questionIndex) || !['question','answer'].includes(row.role) || !Number.isInteger(row.hand) || row.hand<3 || row.hand>g.hand || !Number.isInteger(row.seat) || row.seat<1 || row.seat>4 || topic.category && !t.categories.includes(topic.category))bad();
    const lines=row.role==='question'?[q[0]]:q[1],prefix=topic.id+'-'+row.role+'-';
    if(!lines.includes(row.text) || row.lineId!==(row.role==='question'?prefix+row.questionIndex:prefix+row.questionIndex+'-'+q[1].indexOf(row.text)))bad();
  }
  if(t.plan){
    const p=t.plan,topic=topicFor(p.topic);
    if(!topic || topic.category && !t.categories.includes(topic.category) || ![p.first,p.second].every(i=>Number.isInteger(i)&&i>0&&i<5&&!characterFor(g.players[i].id)?.scripted) || p.first===p.second || typeof p.asked!=='boolean' || (p.asked?!Number.isInteger(p.questionIndex) || topic.exchanges[p.questionIndex]?.[0]!==p.question:p.question!==null || p.questionIndex!==null))bad();
  }
}
