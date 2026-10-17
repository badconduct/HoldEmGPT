import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { newCampaign, enterTable, settleCampaign, validateCampaignSave, campaignDestination, houseStake, retryTable } from '../lib/campaign.js';
import { casinos, avatars, assetUrl, representativeFor } from '../lib/campaign-catalog.js';
import { buildCase, caseSetups, supportedSolutions } from '../lib/story-cases.js';
import { advanceStory, accuse, sceneToken, successorVictim, recordTheory, collectedExhibits } from '../lib/story.js';
import { openingLetter } from '../lib/story-catalog.js';
import { prepareStoryTalk, storyTalkContext, commitStoryTalk } from '../lib/story-talk.js';
import { campaignPage } from '../lib/campaign-pages.js';
import { newDeck } from '../lib/cards.js';
import { act } from '../lib/game.js';
import { createApp, stateXml } from '../server.js';
import { configuration, contextFor, decision } from '../lib/ai.js';
import { publishQuote } from '../lib/table-talk.js';
const saved=s=>structuredClone({version:3,kind:'snapshot',game:s.game,campaign:s.campaign,wallet:s.wallet});
const page=(s,path)=>campaignPage(new URL('http://test'+path),s);
function readScenes(s) {
  while(s.campaign.story.scene) {
    const token=sceneToken(s.campaign.story);assert(advanceStory(s,token));
    assert.equal(advanceStory(s,token),false,'A repeated button advanced the scene twice');
    validateCampaignSave(saved(s));
  }
}
function win(s) {
  const g=s.game,hands=['As Ad','Ks Kd','Qs Qd','Js Jd','Ts Td'].map(s=>s.split(' ')),runout='4d 2c 3h 7s 5d 8c 6d 9d'.split(' ');
  g.players.forEach((p,i)=>p.cards=hands[i]);const used=[...hands.flat(),...runout];g.deck=newDeck().filter(c=>!used.includes(c)).concat(runout.slice().reverse());
  while(g.phase!=='complete')act(g,g.actor,'allin');
  assert.equal(g.players[0].stack,5000);assert(settleCampaign(s));assert.equal(settleCampaign(s),false);
}
function complete(s) {
  readScenes(s);
  for(const c of casinos)for(const table of c.tables) {
    enterTable(s,c.id,table.id);win(s);
    if(table.id==='boss') {
      assert.equal(s.campaign.story.collected.length,casinos.indexOf(c)+1);
      const before=s.wallet.cash;assert(page(s,'/story.html').html.includes('Open the Packet'));
      assert.throws(()=>enterTable(s,c.id,'table-1'),/story scene/);
      readScenes(s);assert.equal(s.wallet.cash,before);
    }
    validateCampaignSave(saved(s));
  }
  assert.equal(s.wallet.cash,2326000);assert.equal(campaignDestination(s),'/accuse.html');
}
test('all eleven authored cases have exactly one supported culprit, hotel and actual weapon with one false claim',()=>{
  const categories=new Set(),culprits=new Set(),truthByForm=new Map();
  for(const setup of caseSetups) {
    const s=newCampaign(undefined,{caseId:setup.id}),file=buildCase(s.campaign.story),solutions=supportedSolutions(file);
    assert.deepEqual(solutions,[{...file.solution,falseCategory:file.falseCategory}]);
    assert.equal(new Set(file.exhibits.map(e=>e.category)).size,5);assert.equal(new Set(file.exhibits.map(e=>e.awardCasino)).size,5);
    assert(file.exhibits.every(e=>e.description.length===2 && e.description.every(line=>line.length>30)));
    for(const e of file.exhibits){const truth=truthByForm.get(e.id) || new Set();truth.add(e.category!==file.falseCategory);truthByForm.set(e.id,truth);}
    categories.add(file.falseCategory);culprits.add(file.solution.boss);
  }
  assert.equal(categories.size,5);assert.equal(culprits.size,5);
  assert.equal(truthByForm.size,25,'Not every prepared illustration has a runtime case');
  for(const [id,truth] of truthByForm)if(truth.has(false))assert(truth.has(true),id+' is permanently marked false by its art form');
});
test('all cases play through 25 settled tables, five resumable reveals, the final answer and open-ended poker',()=>{
  for(const setup of caseSetups) {
    const s=newCampaign({name:'First Attempt',portrait:'pilot'},{caseId:setup.id});
    assert.throws(()=>enterTable(s,casinos[0].id,'table-1'),/story scene/);
    complete(s);
    const file=buildCase(s.campaign.story),before=s.wallet.cash;
    assert(page(s,'/accuse.html').html.includes('None - the death was staged'));
    assert(accuse(s,file.solution));assert.equal(accuse(s,{boss:'wrong'}),false);assert.equal(s.wallet.cash,before);
    readScenes(s);assert.equal(campaignDestination(s),'/map.html');
    const guilty=casinos.find(c=>c.boss.id===file.solution.boss);
    assert(page(s,'/casino.html?id='+guilty.id).html.includes('The owner is unavailable.'));
    enterTable(s,guilty.id,'boss');assert(!s.game.players.some(p=>p.id===guilty.boss.id));validateCampaignSave(saved(s));win(s);
    enterTable(s,casinos[0].id,'boss');win(s);assert.equal(s.campaign.story.collected.length,5);assert.equal(s.campaign.story.scene,null);
    assert.equal(s.campaign.lastResult.awarded,false);validateCampaignSave(saved(s));
  }
});
test('shared opening and ambiguous failure repeat the same letter; only a new campaign receives the fresh stake',()=>{
  const s=newCampaign({name:'Gone Before Dawn',portrait:'gambler'},{caseId:'last-cashout'});
  for(const avatar of avatars) {
    const other=newCampaign({name:'Someone',portrait:avatar.id},{caseId:'last-cashout'});
    advanceStory(other,sceneToken(other.campaign.story));const intro=page(other,'/intro.html').html;
    for(const line of openingLetter)assert(intro.includes(line));assert.equal(other.wallet.cash,1000);
  }
  complete(s);const before=s.wallet.cash;
  assert.throws(()=>accuse(s,{boss:'invented',hotel:casinos[0].id,weapon:'w1'}),/Choose/);assert.equal(s.wallet.cash,before);
  const correct=buildCase(s.campaign.story).solution,wrong={...correct,weapon:'w1'};assert(accuse(s,wrong));
  assert.equal(s.wallet.cash,0);assert.equal(accuse(s,correct),false);assert.equal(s.campaign.story.outcome,'lost');
  assert.throws(()=>houseStake(s),/story has ended/);assert.throws(()=>retryTable(s),/story has ended/);assert.throws(()=>enterTable(s,casinos[0].id,'table-1'),/story has ended/);
  advanceStory(s,sceneToken(s.campaign.story));const final=page(s,'/story.html').html;
  assert(final.includes('/images/story/suitcase.jpg'));assert(final.includes('One thousand dollars'));
  for(const line of openingLetter)assert(final.includes(line));assert(!final.includes('become the victim'));assert(!final.includes('cash: $1,000'));
  readScenes(s);assert.equal(campaignDestination(s),'/');assert(!page(s,'/').html.includes('Continue campaign'));
  const next=newCampaign({name:'New Arrival',portrait:'nurse'},{predecessor:successorVictim(s)});
  assert.equal(next.wallet.cash,1000);assert.equal(next.game,null);assert.equal(next.campaign.story.victim.name,'Gone Before Dawn');assert.equal(next.campaign.story.victim.portrait,assetUrl(avatars.find(a=>a.id==='gambler').portrait));
  assert.equal(buildCase(next.campaign.story).kind,'murder');validateCampaignSave(saved(next));
  assert.notEqual(newCampaign().campaign.story.victim.name,'Gone Before Dawn','A different player inherited the failure');
});
test('dead or apparently dead bosses have a scripted acting host and valid retry/save lineups',()=>{
  for(const id of ['velvet-alibi','borrowed-coat','own-photograph-1','own-photograph-3']) {
    const s=newCampaign(undefined,{caseId:id});readScenes(s);
    const c=casinos.find(c=>c.boss.id===s.campaign.story.victim.bossId);
    for(const casino of casinos) {
      for(const t of casino.tables) {
        const g=enterTable(s,casino.id,t.id);
        if(casino.id===c.id && t.id==='boss') {
          assert(!g.players.some(p=>p.id===c.boss.id));assert(g.players.some(p=>p.id===representativeFor(c.id).id));
          validateCampaignSave(saved(s));
        }
        win(s);readScenes(s);
      }
    }
  }
});
test('evidence and theory pages escape names and notes, hide uncollected clues and never export the solution',()=>{
  const s=newCampaign({name:'<script>name</script>',portrait:'tailor'},{caseId:'last-cashout'});
  const xml=stateXml(null,{mode:'local'},s),bag=page(s,'/evidence.html').html;
  assert(!xml.includes('caseId'));assert(!xml.includes('last-cashout'));assert(!xml.includes('solution'));assert(!xml.includes('nextVictim'));
  assert(!bag.includes('Examiner\'s signed conclusion'));assert.equal((bag.match(/Not collected/g)||[]).length,5);assert(!bag.includes('<script>name</script>'));
  recordTheory(s,{notes:'<img src=x onerror=alert(1)>',falseCategory:'weapon'});
  assert(page(s,'/evidence.html?section=notes').html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert(!page(s,'/evidence.html?section=notes').html.includes('<img src=x'));
  assert.throws(()=>recordTheory(s,{notes:'x'.repeat(501)}),/valid theory/);
  for(const mutate of [c=>c.story.caseId='missing',c=>c.story.victim.name='Changed',c=>c.story.collected=[casinos[0].id],c=>c.story.scene.panel=50,c=>c.story.outcome='won',c=>c.story.deliveryOrder.fill(casinos[0].id)]) {
    const bad=saved(s);mutate(bad.campaign);assert.throws(()=>validateCampaignSave(bad));
  }
});
test('story talk is sparse, uses only approved two-seat lines, expires with a hand and works with local bots',async()=>{
  const s=newCampaign(undefined,{caseId:'last-cashout'});readScenes(s);const g=enterTable(s,casinos[0].id,'table-1');
  prepareStoryTalk(g,{roll:()=>0,pick:()=>0});assert.equal(g.storyTalk.plan,null);
  for(const hand of [3,8]) {
    g.hand=hand;prepareStoryTalk(g,{roll:()=>0,pick:()=>0});const first=g.storyTalk.plan.first,second=g.storyTalk.plan.second;
    g.actor=first;const context=contextFor(g,first),state=JSON.parse(context.user);
    assert(state.storyTalk);assert(!context.user.includes('caseId'));assert(!context.user.includes('predicate'));assert(!context.user.includes('solution'));
    const local=await decision(g,first,configuration({AI_MODE:'local'}));assert(state.storyTalk.allowedLines.some(l=>l.id===local.storyLineId));
    const q=commitStoryTalk(g,first,'invented-confession');assert.equal(q.text,state.storyTalk.allowedLines[0].text);
    assert.equal(storyTalkContext(g,second).previousLine,q.text);
    const reply=commitStoryTalk(g,second,'bad-id');assert(reply.text);assert.equal(g.storyTalk.plan,null);
  }
  g.hand=13;prepareStoryTalk(g,{roll:()=>0,pick:()=>0});assert.equal(g.storyTalk.plan,null);assert.equal(g.storyTalk.count,2);
  const quote=publishQuote(g,1,{action:'call',say:'I killed the victim upstairs.',authorizedStory:true});assert(!quote.text.includes('killed'));
  const t=newCampaign();readScenes(t);const unfinished=enterTable(t,casinos[0].id,'table-1');unfinished.hand=3;
  prepareStoryTalk(unfinished,{roll:()=>0,pick:()=>0});commitStoryTalk(unfinished,unfinished.storyTalk.plan.first,'bad');unfinished.hand=4;
  prepareStoryTalk(unfinished,{roll:()=>0,pick:()=>0});assert.equal(unfinished.storyTalk.plan,null);assert.equal(unfinished.storyTalk.count,1);
});
test('HTTP story forms, save/load and terminal outcomes preserve lineage and keep private case files inaccessible',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'fortune-story-')),app=createApp(configuration({AI_MODE:'local'}),{saveDir:dir,turnDelay:0});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;let cookie='';
  async function request(path,body,{native=false}={}) {
    const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(native?{}:{'X-Holdem-Request':'1'}),'Content-Type':'application/x-www-form-urlencoded'},body,redirect:'manual'});
    cookie=r.headers.get('set-cookie')?.split(';')[0] || cookie;return {status:r.status,text:await r.text(),location:r.headers.get('location')};
  }
  try {
    let r=await request('/api/campaign/new','name=Old+Name&portrait=pilot');assert.equal(r.status,200);
    const recovery=/recoveryCode="([a-f0-9]{36})"/.exec(r.text)[1];
    r=await request('/intro.html');const token=/name="scene" value="([^"]+)"/.exec(r.text)[1],csrf=/name="csrf" value="([^"]+)"/.exec(r.text)[1];
    assert.equal((await request('/api/story/advance','scene='+encodeURIComponent(token),{native:true})).status,403);
    r=await request('/api/story/advance',new URLSearchParams({scene:token,csrf}).toString(),{native:true});assert.equal(r.status,303);assert.equal(r.location,'/intro.html');
    r=await request('/api/save','');const snapshot=/<save>([a-f0-9]{36})<\/save>/.exec(r.text)[1];
    r=await request('/api/load','code='+snapshot);assert.equal(r.status,200);
    let disk=JSON.parse(await readFile(join(dir,/recoveryCode="([a-f0-9]{36})"/.exec(r.text)[1]+'.json'),'utf8'));assert.equal(disk.campaign.story.scene.panel,1);
    for(const path of ['/lib/story-cases.js','/lib/story-dossiers.js','/lib/story-cases-v1.js','/docs/design/story-dossiers-v2.md','/docs/design/empty-chair-scenarios.json','/content/v3/story.json','/data/saves/'+recovery+'.json'])assert.equal((await request(path)).status,404);
    const fixture=newCampaign({name:'Old Name',portrait:'pilot'},{caseId:'last-cashout'});complete(fixture);
    const code='d'.repeat(36);await writeFile(join(dir,code+'.json'),JSON.stringify(saved(fixture)));
    assert.equal((await request('/api/load','code='+code)).status,200);
    const notebook=await request('/evidence.html?section=notes'),caseToken=/name="case" value="([^"]+)"/.exec(notebook.text)[1];
    const wrong={...buildCase(fixture.campaign.story).solution,weapon:'w1',confirm:'yes',case:caseToken};
    r=await request('/api/story/accuse',new URLSearchParams(wrong).toString());assert.equal(r.status,200);assert(r.text.includes('cash="0"'));assert(!r.text.includes('nextVictim'));
    assert.equal((await request('/api/next','')).status,400);assert.equal((await request('/api/campaign/stake','')).status,400);
    r=await request('/api/save','');const ended=/<save>([a-f0-9]{36})<\/save>/.exec(r.text)[1];
    cookie='';assert.equal((await request('/api/load','code='+ended)).status,200);
    r=await request('/api/campaign/new','name=New+Name&portrait=nurse');assert.equal(r.status,200);assert(r.text.includes('cash="1000"'));
    disk=JSON.parse(await readFile(join(dir,/recoveryCode="([a-f0-9]{36})"/.exec(r.text)[1]+'.json'),'utf8'));
    assert.equal(disk.campaign.story.victim.name,'Old Name');assert.equal(disk.campaign.story.victim.inherited,true);assert.equal(buildCase(disk.campaign.story).kind,'murder');
    cookie='';r=await request('/api/campaign/new','name=Separate&portrait=tailor');
    disk=JSON.parse(await readFile(join(dir,/recoveryCode="([a-f0-9]{36})"/.exec(r.text)[1]+'.json'),'utf8'));assert.notEqual(disk.campaign.story.victim.name,'Old Name');
  }finally{await new Promise(r=>app.close(r));await rm(dir,{recursive:true,force:true});}
});
