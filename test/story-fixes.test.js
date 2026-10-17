import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { casinos } from '../lib/campaign-catalog.js';
import { newCampaign, enterTable, settleCampaign, validateCampaignSave } from '../lib/campaign.js';
import { buildCase, caseSetups, supportedSolutions } from '../lib/story-cases.js';
import { caseReferences, hotelReferences, weapons, storyCategories } from '../lib/story-catalog.js';
import { advanceStory, sceneToken, accuse } from '../lib/story.js';
import { campaignPage } from '../lib/campaign-pages.js';
import { newDeck } from '../lib/cards.js';
import { act } from '../lib/game.js';
import { createApp } from '../server.js';
import { configuration } from '../lib/ai.js';

const expected=[['last-cashout',0,1,'w3','weapon'],['velvet-alibi',1,2,'w2','receipt'],['wrong-hand',2,3,'w4','letter'],['borrowed-coat',3,4,'w5','clothing'],['last-departure',4,0,'w1','photo'],['quiet-suite',2,0,'w2','letter'],...Array.from({length:5},(_,i)=>['own-photograph-'+(i+1),i,(i+2)%5,'none','photo'])];
const domains={boss:caseReferences.map((r,i)=>[casinos[i].boss.id,r.signature+' / '+r.seal]),hotel:hotelReferences.map((r,i)=>[casinos[i].id,'the '+r.mark]),weapon:[...weapons.map(w=>[w.id,'the '+w.name.toLowerCase()]),['none','a posed figure with no fatal injury']]};
const subjects={boss:'The private-door account',hotel:'The incident doorway',weapon:'The injury or pose'};
// Read only printed comparison sentences and the public reference cards. No
// private predicate, authored claims, or declared solution selects candidates.
function readPrinted(item){
  const claims=[];
  for(const [key,subject] of Object.entries(subjects))for(const operator of ['matches','excludes']){
    const prefix=subject+' '+operator+' ',text=item.description[1],start=text.indexOf(prefix);if(start<0)continue;
    const tail=text.slice(start+prefix.length),next=tail.search(/ The (?:private-door account|incident doorway|injury or pose) (?:matches|excludes) /),clause=next<0?tail:tail.slice(0,next);
    const values=domains[key].filter(([,label])=>clause.includes(label)).map(([id])=>id);assert(values.length);
    claims.push({key,values,exclude:operator==='excludes'});
  }
  assert(claims.length);return claims;
}
const holds=(claims,answer)=>claims.every(c=>c.exclude?!c.values.includes(answer[c.key]):c.values.includes(answer[c.key]));
const candidates=casinos.flatMap(b=>casinos.flatMap(h=>domains.weapon.map(([weapon])=>({boss:b.boss.id,hotel:h.id,weapon}))));
const project=({boss,hotel,weapon})=>({boss,hotel,weapon});
function publicSolutions(exhibits,victim){
  const records=exhibits.map(e=>({source:casinos.find(c=>c.id===e.awardCasino).boss.id,claims:readPrinted(e)}));
  return candidates.filter(a=>(a.weapon==='none'||a.boss!==victim.bossId)&&records.every(r=>holds(r.claims,a)===(r.source!==a.boss)));
}
const permutations=a=>a.length?a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(t=>[x,...t])):[[]];
const snapshot=s=>structuredClone({version:3,kind:'snapshot',game:s.game,campaign:s.campaign,wallet:s.wallet});
const readScenes=s=>{while(s.campaign.story.scene)advanceStory(s,sceneToken(s.campaign.story));};
function win(s){
  const g=s.game,hands=['As Ad','Ks Kd','Qs Qd','Js Jd','Ts Td'].map(s=>s.split(' ')),runout='4d 2c 3h 7s 5d 8c 6d 9d'.split(' ');
  g.players.forEach((p,i)=>p.cards=hands[i]);const used=[...hands.flat(),...runout];g.deck=newDeck().filter(c=>!used.includes(c)).concat(runout.slice().reverse());
  while(g.phase!=='complete')act(g,g.actor,'allin');settleCampaign(s);
}
function finish(id){const s=newCampaign({name:'Same Reader',portrait:'pilot'},{caseId:id});readScenes(s);for(const c of casinos)for(const t of c.tables){enterTable(s,c.id,t.id);win(s);readScenes(s);}validateCampaignSave(snapshot(s));return s;}

test('all four truthful exhibits are necessary under the public supplier and victim rules in every new assignment',()=>{
  let assignments=0,omissions=0;
  for(const [id,boss,hotel,weapon,falseCategory] of expected){
    const s=newCampaign(undefined,{caseId:id}),story=s.campaign.story,answer={boss:casinos[boss].boss.id,hotel:casinos[hotel].id,weapon};assert.equal(story.version,4);
    for(const rest of permutations(casinos.filter((_,i)=>i!==boss).map(c=>c.id))){
      const order=rest.slice();order.splice(storyCategories.findIndex(c=>c.id===falseCategory),0,casinos[boss].id);story.deliveryOrder=order;
      validateCampaignSave(snapshot(s));const file=buildCase(story),truths=file.exhibits.filter(e=>e.category!==falseCategory);
      assert(file.exhibits.every(e=>readPrinted(e).some(c=>c.key==='hotel')),'A missing room check must not identify the fake');
      assert.deepEqual(publicSolutions(file.exhibits,story.victim),[answer]);
      assert.deepEqual(supportedSolutions(file),[{...answer,falseCategory}]);
      assert.deepEqual(candidates.filter(a=>truths.every(e=>holds(readPrinted(e),a))),[answer],'Four truths must solve even without treating the fake as true');
      for(const omitted of truths){
        const remaining=file.exhibits.filter(e=>e!==omitted),possible=publicSolutions(remaining,story.victim);
        assert(possible.length>1,id+' redundant '+omitted.category);assert(possible.some(a=>a.boss===answer.boss&&a.weapon===weapon&&a.hotel!==answer.hotel),'A different hotel must survive');omissions++;
      }
      for(let mask=0;mask<32;mask++){
        const subset=file.exhibits.filter((_,i)=>mask&(1<<i)),possible=publicSolutions(subset,story.victim);
        assert.deepEqual(supportedSolutions(file,{exhibits:subset}).map(project),possible);
        if(subset.filter(e=>e.category!==falseCategory).length<4)assert(possible.length>1,id+' solved without all four truths');
      }
      assignments++;
    }
  }
  assert.equal(assignments,264);assert.equal(omissions,1056);
});

test('first-packet reflections do not narrate conclusions about unreceived exhibits, including historical puzzles',()=>{
  const routes=[['borrowed-coat',['receipt','weapon','photo','clothing','letter']],['velvet-alibi',['letter','receipt','photo','weapon','clothing']],['last-departure',['letter','weapon','receipt','clothing','photo']],['quiet-suite',['receipt','weapon','letter','photo','clothing']]];
  for(const version of [3,4])for(const [caseId,route] of routes){
    const s=newCampaign(undefined,{caseId,version});s.campaign.story.deliveryOrder=storyCategories.map(c=>casinos[route.indexOf(c.id)].id);readScenes(s);
    for(const t of casinos[0].tables){enterTable(s,casinos[0].id,t.id);win(s);}advanceStory(s,sceneToken(s.campaign.story));advanceStory(s,sceneToken(s.campaign.story));
    const html=campaignPage(new URL('http://test/story.html'),s).html;
    assert(!/second seal impression|borrowed hat|coat-check impression a name|finally pointed to the same door|stained tag a second reading/.test(html));
    assert.equal(s.campaign.story.collected.length,1);validateCampaignSave(snapshot(s));
  }
});

function fields(html,action){
  const form=[...html.matchAll(/<form\b[^>]*action="([^"]+)"[^>]*>([\s\S]*?)<\/form>/g)].find(m=>m[1]===action);assert(form,'Missing form '+action);
  return Object.fromEntries([...form[2].matchAll(/name="([^"]+)" value="([^"]*)"/g)].map(m=>[m[1],m[2]]));
}
test('native scene forms reject a reloaded snapshot branch and set-aside choices persist without grading early',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'fortune-fixes-')),app=createApp(configuration({AI_MODE:'local'}),{saveDir:dir,turnDelay:0});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;let cookie='';
  async function request(path,values,native=false){const r=await fetch(base+path,{method:values?'POST':'GET',headers:{Cookie:cookie,...(native?{}:{'X-Holdem-Request':'1'}),'Content-Type':'application/x-www-form-urlencoded'},body:values?new URLSearchParams(values):undefined,redirect:'manual'});cookie=r.headers.get('set-cookie')?.split(';')[0]||cookie;return {status:r.status,text:await r.text(),location:r.headers.get('location')};}
  const active=async()=>{const state=await request('/api/state'),code=/recoveryCode="([a-f0-9]{36})"/.exec(state.text)[1];return JSON.parse(await readFile(join(dir,code+'.json'),'utf8'));};
  try{
    const opening=newCampaign(),complete=finish('last-cashout');
    for(const [code,s] of [['a'.repeat(36),opening],['b'.repeat(36),complete]])await writeFile(join(dir,code+'.json'),JSON.stringify(snapshot(s)));
    await request('/api/load',{code:'a'.repeat(36)});const old=fields((await request('/intro.html')).text,'/api/story/advance');
    await request('/api/load',{code:'a'.repeat(36)});const before=await active();
    assert.equal((await request('/api/story/advance',old,true)).status,400);assert.deepEqual(await active(),before);
    const fresh=fields((await request('/intro.html')).text,'/api/story/advance');assert.notEqual(fresh.case,old.case);
    assert.equal((await request('/api/story/advance',fresh,true)).status,303);assert.equal((await active()).campaign.story.scene.panel,1);
    assert.equal((await request('/api/story/advance',fresh,true)).status,303);assert.equal((await active()).campaign.story.scene.panel,1);
    assert.equal((await request('/api/story/set-aside',{case:fresh.case,category:'weapon'})).status,400,'Uncollected exhibit was accepted');
    await request('/api/load',{code:'b'.repeat(36)});
    let bag=await request('/evidence.html?item=p2'),form=fields(bag.text,'/api/story/set-aside');
    assert.equal((await request('/api/story/set-aside',form,true)).status,303);
    const marked=await active();assert.equal(marked.campaign.story.theory.falseCategory,'photo');assert.equal(marked.campaign.story.outcome,null);assert.equal(marked.wallet.cash,2326000);validateCampaignSave(marked);
    assert((await request('/evidence.html')).text.includes('Set aside (your theory)'));
    const saved=await request('/api/save',{}),code=/<save>([a-f0-9]{36})<\/save>/.exec(saved.text)[1];await request('/api/load',{code});
    assert.equal((await active()).campaign.story.theory.falseCategory,'photo');
    form=fields((await request('/evidence.html?item=p2')).text,'/api/story/set-aside');assert.equal(form.category,'photo');assert.equal(form.restore,'yes');
    const oldRestore={...form};
    assert.equal((await request('/api/story/set-aside',form,true)).status,303);assert.equal((await active()).campaign.story.theory.falseCategory,'');
    const markWeapon=fields((await request('/evidence.html?item=w1')).text,'/api/story/set-aside');
    assert.equal((await request('/api/story/set-aside',markWeapon,true)).status,303);
    assert.equal((await request('/api/story/set-aside',oldRestore,true)).status,400,'A stale restore cleared a different chosen exhibit');
    assert.equal((await active()).campaign.story.theory.falseCategory,'weapon');
    const selection=fields((await request('/accuse.html')).text,'/accuse.html'),solution=buildCase(complete.campaign.story).solution,unchanged=await active();
    assert.equal((await request('/api/story/accuse',{...selection,...solution,falseCategory:'',confirm:'yes'})).status,400);assert.deepEqual(await active(),unchanged);
    assert.equal((await request('/api/story/accuse',{...selection,...solution,falseCategory:'receipt',confirm:'yes'})).status,400);assert.deepEqual(await active(),unchanged);
    const review=await request('/accuse.html?'+new URLSearchParams({...selection,...solution}));assert.equal(review.status,200);assert(review.text.includes('Case concerns: Vincent'));assert(review.text.includes('Set aside as false: Pocket revolver'));
    const changePath=/href="([^"]+)">Change Selections<\/a>/.exec(review.text)[1].replaceAll('&amp;','&');
    const changed=await request(changePath);assert.equal(changed.status,200);assert.equal(fields(changed.text,'/accuse.html').case,selection.case);assert(changed.text.includes('value="weapon" selected="selected"'));
    const confirmation=fields(review.text,'/api/story/accuse');assert.equal((await request('/api/story/accuse',confirmation,true)).status,303);
    const ended=await active();assert.equal(ended.campaign.story.outcome,'won');assert.equal(ended.campaign.story.submission.falseCategory,'weapon');assert.equal(ended.campaign.story.theory.falseCategory,'weapon');assert.equal(ended.wallet.cash,2326000);validateCampaignSave(ended);
    assert.equal((await request('/api/story/set-aside',{case:confirmation.case,category:'photo'})).status,400);
  }finally{await new Promise(r=>app.close(r));await rm(dir,{recursive:true,force:true});}
});
