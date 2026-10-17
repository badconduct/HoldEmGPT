import { randomInt } from 'node:crypto';
import { characterFor } from './campaign-catalog.js';
const topics=[
  {id:'guest-list',category:null,question:['Everyone remembers that reception differently.','Ever try to remember who left a room first?','The guest list must have travelled farther than we have.'],answer:['I would sooner read the original records.','Memory improves after the newspapers arrive.','People remember what suits them.']},
  {id:'upstairs',category:null,question:['Did you hear the story about upstairs that night?','Any truth to that upstairs rumor?','People are still whispering about the reception.'],answer:['Only whispers. Nothing I would swear to.','I do not think so. Rumor travels cheaply.','I would rather see a record than repeat a rumor.']},
  {id:'paper',category:'receipt',question:['You kept that cashout slip?','Do you ever throw away a receipt?','Funny how a little paper can follow you.'],answer:['Paper has a better memory than most people.','I keep the copies. Habit, you understand.','A signature is worth a second look.']},
  {id:'picture',category:'photo',question:['A photograph never tells the whole story.','Do you believe everything in a photograph?','Someone chose what that picture would show.'],answer:['There is usually something outside the frame.','I would read what came with it.','A picture and its caption are two different things.']},
  {id:'letter',category:'letter',question:['Do you recognize a letter by its seal?','People put a great deal of trust in initials.','You can learn a little from old correspondence.'],answer:['I read the signature twice.','Sometimes the attachment says more than the letter.','I would compare it with something I knew was genuine.']},
  {id:'coat',category:'clothing',question:['A coat does not tell you who wore it.','Ever leave a hat at the wrong hotel?','I suppose every garment has a story.'],answer:['The claim on the label still needs checking.','More often than I care to admit.','Best ask who identified it, and how.']}
];
export function prepareStoryTalk(g,{roll=()=>randomInt(1000000)/1000000,pick=n=>randomInt(n)}={}) {
  const talk=g.storyTalk;if(!talk || talk.seenHand===g.hand)return;
  talk.seenHand=g.hand;talk.plan=null;
  if(g.hand<3 || talk.count>=2 || g.hand-talk.lastHand<5 || roll()>=.1)return;
  const seats=g.players.map((p,i)=>i>0 && !p.folded && !p.out && p.stack>0 && !characterFor(p.id)?.scripted?i:-1).filter(i=>i>0);
  if(seats.length<2)return;
  const pool=topics.filter(t=>(!t.category || talk.categories.includes(t.category)) && !talk.recent.includes(t.id));
  if(!pool.length)return;
  const first=seats.splice(pick(seats.length),1)[0],second=seats[pick(seats.length)],topic=pool[pick(pool.length)];
  talk.plan={topic:topic.id,first,second,asked:false,question:null};
}
export function storyTalkContext(g,i) {
  const talk=g.storyTalk,plan=talk?.plan;
  if(!plan || talk.seenHand!==g.hand)return null;
  const role=!plan.asked && i===plan.first?'question':plan.asked && i===plan.second?'answer':null;
  if(!role)return null;
  const topic=topics.find(t=>t.id===plan.topic);
  return {topic:topic.id,role,previousLine:role==='answer'?plan.question:null,replyToSeat:role==='answer'?plan.first:plan.second,
    allowedLines:topic[role].map((text,n)=>({id:topic.id+'-'+role+'-'+n,text}))};
}
export function commitStoryTalk(g,i,lineId) {
  const context=storyTalkContext(g,i);if(!context)return null;
  const selected=context.allowedLines.find(l=>l.id===lineId),line=selected || context.allowedLines[0],talk=g.storyTalk,plan=talk.plan;
  const row={hand:g.hand,seat:i,topic:context.topic,role:context.role,lineId:line.id,text:line.text,fallback:!selected};
  talk.log.push(row);talk.log=talk.log.slice(-8);
  if(context.role==='question') {talk.count++;talk.lastHand=g.hand;talk.recent.push(plan.topic);plan.asked=true;plan.question=line.text;}
  else talk.plan=null;
  return {text:line.text,replyToSeat:context.replyToSeat};
}
export function validateStoryTalk(g,story) {
  const t=g?.storyTalk;if(!t)return;
  const bad=()=>{throw new Error('Invalid saved story conversation.');};
  if(!story || t.version!==1 || !Array.isArray(t.categories) || t.categories.some(c=>!['weapon','receipt','photo','letter','clothing'].includes(c)) || !Number.isInteger(t.seenHand) || t.seenHand<0 || t.seenHand>g.hand || !Number.isInteger(t.count) || t.count<0 || t.count>2 || !Number.isInteger(t.lastHand) || t.lastHand>g.hand || !Array.isArray(t.recent) || t.recent.length>2 || t.recent.some(id=>!topics.some(q=>q.id===id)) || !Array.isArray(t.log) || t.log.length>8)bad();
  for(const row of t.log) {
    const topic=topics.find(q=>q.id===row.topic);
    if(!topic || !['question','answer'].includes(row.role) || !Number.isInteger(row.hand) || row.hand<3 || row.hand>g.hand || !Number.isInteger(row.seat) || row.seat<1 || row.seat>4 || !topic[row.role].includes(row.text) || topic[row.role][Number(row.lineId?.split('-').at(-1))]!==row.text)bad();
  }
  if(t.plan) {
    const p=t.plan,topic=topics.find(q=>q.id===p.topic);
    if(!topic || topic.category && !t.categories.includes(topic.category) || ![p.first,p.second].every(i=>Number.isInteger(i) && i>0 && i<5 && !characterFor(g.players[i].id)?.scripted) || p.first===p.second || typeof p.asked!=='boolean' || (p.asked?!topic.question.includes(p.question):p.question!==null))bad();
  }
}
