import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, basename } from 'node:path';
import { newCampaign, enterTable, settleCampaign, validateCampaignSave } from '../lib/campaign.js';
import { casinos, assetUrl, avatars } from '../lib/campaign-catalog.js';
import { advanceStory, sceneToken, storyHouseLine, storyBoss, accuse } from '../lib/story.js';
import { buildCase, caseSetups, supportedSolutions } from '../lib/story-cases.js';
import { caseReferences, hotelReferences, weapons } from '../lib/story-catalog.js';
import { storyTopics, storyTalkContext, commitStoryTalk, prepareStoryTalk, validateStoryTalk } from '../lib/story-talk.js';
import { safeQuote, publishQuote } from '../lib/table-talk.js';
import { newDeck } from '../lib/cards.js';
import { act } from '../lib/game.js';
import { createApp } from '../server.js';
import { configuration } from '../lib/ai.js';
const snapshot=s=>structuredClone({version:3,kind:'snapshot',game:s.game,campaign:s.campaign,wallet:s.wallet});
function readScenes(s){while(s.campaign.story.scene)advanceStory(s,sceneToken(s.campaign.story));}
function win(s){
  const g=s.game,hands=['As Ad','Ks Kd','Qs Qd','Js Jd','Ts Td'].map(s=>s.split(' ')),runout='4d 2c 3h 7s 5d 8c 6d 9d'.split(' ');
  g.players.forEach((p,i)=>p.cards=hands[i]);const used=[...hands.flat(),...runout];g.deck=newDeck().filter(c=>!used.includes(c)).concat(runout.slice().reverse());
  while(g.phase!=='complete')act(g,g.actor,'allin');settleCampaign(s);
}
function finish(id,version=2){
  const s=newCampaign({name:'Revision Reader',portrait:'pilot'},{caseId:id,version});readScenes(s);
  for(const c of casinos)for(const t of c.tables){enterTable(s,c.id,t.id);win(s);readScenes(s);validateCampaignSave(snapshot(s));}
  return s;
}
const expected={
  'last-cashout':[0,1,'w3','weapon'],'velvet-alibi':[1,2,'w2','receipt'],'wrong-hand':[2,3,'w4','letter'],
  'borrowed-coat':[3,4,'w5','clothing'],'last-departure':[4,0,'w1','photo'],'quiet-suite':[2,0,'w2','letter'],
  'own-photograph-1':[0,2,'none','photo'],'own-photograph-2':[1,3,'none','photo'],'own-photograph-3':[2,4,'none','photo'],
  'own-photograph-4':[3,0,'none','photo'],'own-photograph-5':[4,1,'none','photo']
};
// Blind oracle: parse ONLY the rendered comparison sentences and public reference
// cards. It does not read record.claims, exhibit.predicate or file.solution.
const printedDomains={
  boss:caseReferences.map((r,i)=>[casinos[i].boss.id,r.signature+' / '+r.seal]),
  hotel:hotelReferences.map((r,i)=>[casinos[i].id,r.mark]),
  weapon:[...weapons.map(w=>[w.id,w.name.toLowerCase()]),['none','a posed figure with no fatal injury']]
};
const subjects={boss:'The private-door account',hotel:'The incident doorway',weapon:'The injury or pose'};
function readPrintedClaim(exhibit){
  const text=exhibit.description[1],result={};
  for(const [key,subject] of Object.entries(subjects))for(const operator of ['matches','excludes']){
    const prefix=subject+' '+operator+' ',start=text.indexOf(prefix);if(start<0)continue;
    const tail=text.slice(start+prefix.length),next=tail.search(/ The (?:private-door account|incident doorway|injury or pose) (?:matches|excludes) /),chunk=next<0?tail:tail.slice(0,next);
    const field=key+(operator==='excludes'?'Not':'');
    result[field]=printedDomains[key].filter(([,label])=>chunk.includes(label)).map(([id])=>id);
    assert(result[field].length>0,'Unreadable comparison: '+text);
  }
  assert(Object.keys(result).length>0);return result;
}
const candidates=casinos.flatMap(b=>casinos.flatMap(h=>printedDomains.weapon.map(([weapon])=>({boss:b.boss.id,hotel:h.id,weapon}))));
const holds=(claim,answer)=>Object.entries(claim).every(([key,values])=>key.endsWith('Not')?!values.includes(answer[key.slice(0,-3)]):values.includes(answer[key]));
function solvePrinted(claims){return candidates.filter(answer=>{
  const wrong=claims.filter(claim=>!holds(claim,answer)).length;
  return claims.length===5?wrong===1:wrong<=1;
});}

test('printed dossiers independently solve all cases and every exhibit remains necessary',()=>{
  const ordinaryVictims=new Set(),stagedVictims=new Set();
  for(const setup of caseSetups){
    const s=newCampaign(undefined,{caseId:setup.id}),story=s.campaign.story,file=buildCase(story),claims=file.exhibits.map(readPrintedClaim);
    const [boss,hotel,weapon,falseCategory]=expected[setup.id],answer={boss:casinos[boss].boss.id,hotel:casinos[hotel].id,weapon};
    assert.deepEqual(solvePrinted(claims),[answer],setup.id+' printed clues');
    assert.deepEqual(supportedSolutions(file),[{...answer,falseCategory}]);
    for(let mask=1;mask<31;mask++){
      const selected=claims.filter((_,i)=>mask&(1<<i));
      assert(solvePrinted(selected).length>1,setup.id+' resolves too soon: '+mask);
    }
    assert.equal(file.exhibits.filter((_,i)=>!holds(claims[i],answer)).length,1);
    for(const e of file.exhibits)assert(!/generated at the table|tiny detail in the illustration|send the circular saying I died|no fatal wound/i.test(e.description.join(' ')));
    assert(file.premise.includes('you') || /your/i.test(file.premise));assert(file.proof.length>80);assert(file.motive.length>80);
    if(story.victim.bossId)(setup.kind==='murder'?ordinaryVictims:stagedVictims).add(story.victim.bossId);
    if(setup.kind==='murder')for(const claim of claims)assert(!claim.boss?.includes(story.victim.bossId),'Victim is their own visitor in '+setup.id);
    for(let n=0;n<12;n++){
      const replay=newCampaign(undefined,{caseId:setup.id}),bad=snapshot(replay);
      [bad.campaign.story.deliveryOrder[0],bad.campaign.story.deliveryOrder[4]]=[bad.campaign.story.deliveryOrder[4],bad.campaign.story.deliveryOrder[0]];
      assert.throws(()=>validateCampaignSave(bad),/Invalid saved story/);
      validateCampaignSave(snapshot(replay));
    }
  }
  assert.deepEqual(ordinaryVictims,stagedVictims,'A victim portrait permanently reveals staging');
  for(const setup of caseSetups.filter(c=>c.kind==='murder')){
    const predecessor={name:'Former Guest',portrait:assetUrl(avatars.find(a=>a.id==='nurse').portrait),source:'a'.repeat(32)};
    const s=newCampaign({name:'New Reader',portrait:'pilot'},{caseId:setup.id,predecessor}),file=buildCase(s.campaign.story);
    assert(file.premise.includes('Former Guest'));assert(file.premise.includes('failed accusation'));assert(!file.premise.includes('circuit auditor'));
    if(setup.id==='borrowed-coat')assert(file.motive.includes('Former Guest'));
    validateCampaignSave(snapshot(s));
  }
});

test('historical first-draft saves retain their victims, solutions and completed route',()=>{
  for(const setup of caseSetups){
    const s=finish(setup.id,1),before=buildCase(s.campaign.story).solution;
    assert.equal(s.campaign.story.version,1);validateCampaignSave(snapshot(s));
    assert(accuse(s,before));readScenes(s);validateCampaignSave(snapshot(s));
  }
});

test('public boss travel and result lines respect reported deaths and cleared cases',()=>{
  for(const setup of caseSetups){
    const s=newCampaign(undefined,{caseId:setup.id});
    for(const casino of casinos){
      const host=storyBoss(s.campaign,casino),line=storyHouseLine(s.campaign,casino,host,'defeat');
      assert(!line.includes('will be expecting you'));assert(!line.includes('Celeste'));
      if(casino.passAwards===casinos.find(c=>c.boss.id===s.campaign.story.victim.bossId)?.id)assert(line.includes('acting steward'));
      assert(!line.includes(casinos[setup.boss].boss.name),'Hidden culprit leaked in travel dialogue');
    }
  }
  const s=finish('velvet-alibi'),file=buildCase(s.campaign.story);accuse(s,file.solution);readScenes(s);
  for(const c of casinos)assert.equal(storyHouseLine(s.campaign,c,storyBoss(s.campaign,c),'defeat'),'A fair win. The house will honour it.');
});

test('each story reply is restricted to its question, including every fallback and saved continuation',()=>{
  const s=newCampaign();readScenes(s);const g=enterTable(s,casinos[0].id,'table-1');g.hand=3;
  for(const topic of storyTopics)for(let questionIndex=0;questionIndex<topic.exchanges.length;questionIndex++){
    g.storyTalk={version:2,seenHand:3,count:0,lastHand:-10,plan:{topic:topic.id,first:1,second:2,asked:false,question:null,questionIndex:null},recent:[],log:[],categories:['weapon','receipt','photo','letter','clothing']};
    const question=storyTalkContext(g,1).allowedLines[questionIndex];commitStoryTalk(g,1,question.id);
    const restored=structuredClone(g);validateStoryTalk(restored,s.campaign.story);
    const context=storyTalkContext(restored,2);assert.equal(context.previousLine,question.text);
    assert.deepEqual(context.allowedLines.map(l=>l.text),topic.exchanges[questionIndex][1]);
    for(const line of [...context.allowedLines,question])assert.equal(safeQuote(line.text),line.text);
    const fallback=commitStoryTalk(restored,2,'wrong-intent-answer-0');assert.equal(fallback.text,topic.exchanges[questionIndex][1][0]);
    validateStoryTalk(restored,s.campaign.story);assert.equal(restored.storyTalk.plan,null);
  }
  g.storyTalk={version:1,seenHand:3,count:1,lastHand:3,plan:{topic:'guest-list',first:1,second:2,asked:true,question:'Everyone remembers that reception differently.'},recent:['guest-list'],log:[],categories:[]};
  validateStoryTalk(g,s.campaign.story);prepareStoryTalk(g);assert.equal(g.storyTalk.version,2);assert.equal(g.storyTalk.count,1);assert.equal(g.storyTalk.plan,null);
  assert.notEqual(publishQuote(g,1,{action:'call',say:'Maddox shot Rook in Suite 214.'}).text,'Maddox shot Rook in Suite 214.');
});

test('stale native and scripted forms cannot accuse or overwrite another case or snapshot branch',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'fortune-revision-')),app=createApp(configuration({AI_MODE:'local'}),{saveDir:dir,turnDelay:0});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;let cookie='';
  async function request(path,values,{native=false}={}){
    const response=await fetch(base+path,{method:values?'POST':'GET',headers:{Cookie:cookie,...(native?{}:{'X-Holdem-Request':'1'}),'Content-Type':'application/x-www-form-urlencoded'},body:values?new URLSearchParams(values):undefined,redirect:'manual'});
    cookie=response.headers.get('set-cookie')?.split(';')[0] || cookie;return {status:response.status,text:await response.text(),location:response.headers.get('location')};
  }
  const fields=(html,action)=>Object.fromEntries([...html.match(new RegExp('<form class="campaignpost"[^>]*action="'+action+'"[\\s\\S]*?</form>'))[0].matchAll(/name="([^"]+)" value="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  try{
    const a=finish('last-cashout'),b=finish('quiet-suite'),aCode='a'.repeat(36),bCode='b'.repeat(36);
    await writeFile(join(dir,aCode+'.json'),JSON.stringify(snapshot(a)));await writeFile(join(dir,bCode+'.json'),JSON.stringify(snapshot(b)));
    await request('/api/load',{code:aCode});
    const review=await request('/accuse.html?'+new URLSearchParams({...buildCase(a.campaign.story).solution,review:'1'}));
    const oldAccuse=fields(review.text,'/api/story/accuse'),oldTheory=fields((await request('/evidence.html?section=notes')).text,'/api/story/theory');
    await request('/api/load',{code:bCode});const before=(await request('/api/state')).text;
    assert.equal((await request('/api/story/accuse',oldAccuse,{native:true})).status,400);
    assert.equal((await request('/api/story/theory',{...oldTheory,notes:'Old case overwritten'})).status,400);
    assert.equal((await request('/api/state')).text,before,'Rejected stale form mutated active case');
    await request('/api/load',{code:aCode});const sameCaseBefore=(await request('/api/state')).text;
    assert.equal((await request('/api/story/accuse',oldAccuse)).status,400,'Old snapshot branch was still accepted');
    assert.equal((await request('/api/state')).text,sameCaseBefore);
    const current=fields((await request('/accuse.html?'+new URLSearchParams({...buildCase(a.campaign.story).solution,review:'1'}))).text,'/api/story/accuse');
    assert.equal((await request('/api/story/accuse',{...current,case:''})).status,400);
    const accepted=await request('/api/story/accuse',current,{native:true});assert.equal(accepted.status,303);assert.equal(accepted.location,'/story.html');
    const completed=(await request('/api/state')).text;assert(completed.includes('cash="2326000"'));
    assert.equal((await request('/api/story/accuse',current)).status,200);assert.equal((await request('/api/state')).text,completed);
  }finally{
    await new Promise(r=>app.close(r));
    if(dirname(resolve(dir))===resolve(tmpdir()) && basename(dir).startsWith('fortune-revision-'))await rm(dir,{recursive:true,force:true});
  }
});
