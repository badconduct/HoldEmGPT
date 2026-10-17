import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'acorn';
import { newCampaign as createCampaign, enterTable, settleCampaign, houseStake, retryTable, validateCampaignSave, bossOpen } from '../lib/campaign.js';
import { casinos, characterFor, assetUrl } from '../lib/campaign-catalog.js';
import { newDeck } from '../lib/cards.js';
import { act, startHand, legal } from '../lib/game.js';
import { tableFinished } from '../lib/bankroll.js';
import { contextFor, decision, configuration } from '../lib/ai.js';
import { bossDecision } from '../lib/bosses.js';
import { createApp, stateXml } from '../server.js';
import { saveStore } from '../lib/save-store.js';
import { campaignPage } from '../lib/campaign-pages.js';
// Preserve coverage of pre-story v3 saves and their original invitation flow.
const newCampaign=profile=>createCampaign(profile,{story:false});
function finishKnownHand(session,settle=true,playerWins=true) {
  const g=session.game;
  const hands=['As Ad','Ks Kd','Qs Qd','Js Jd','Ts Td'].map(s=>s.split(' ')),runout='4d 2c 3h 7s 5d 8c 6d 9d'.split(' ');
  if(!playerWins)[hands[0],hands[1]]=[hands[1],hands[0]];
  g.players.forEach((p,i)=>p.cards=hands[i]);const used=[...hands.flat(),...runout];g.deck=newDeck().filter(c=>!used.includes(c)).concat(runout.slice().reverse());
  while(g.phase!=='complete')act(g,g.actor,'allin');
  assert.equal(g.players[0].stack,playerWins?5000:0);assert(tableFinished(g));
  if(settle)assert(settleCampaign(session));
}
const win=(session,settle=true)=>finishKnownHand(session,settle);
const lose=session=>finishKnownHand(session,true,false);
const saved=s=>({version:3,kind:'snapshot',game:s.game,wallet:s.wallet,campaign:s.campaign});
test('campaign completes 25 real table wins, gates bosses and pays cash independently of chips once',()=>{
  const s=newCampaign({name:'Mae',portrait:'mechanic'});
  assert.equal(s.wallet.cash,1000);assert.equal(s.game,null);assert.deepEqual(s.campaign.unlocked,[casinos[0].id]);
  assert.throws(()=>enterTable(s,casinos[1].id,'table-1'),/locked/);
  assert.throws(()=>enterTable(s,casinos[0].id,'boss'),/four/);
  for(const [index,casino] of casinos.entries()) {
    for(const table of casino.tables) {
      const before=s.wallet.cash,g=enterTable(s,casino.id,table.id);
      assert.equal(s.wallet.cash,before-table.entry);assert.equal(g.players.reduce((n,p)=>n+p.stack+p.total,0),5000);
      assert.equal(g.small,10);assert.equal(g.big,20);assert.equal(g.campaign.background,assetUrl(table.background));
      assert.equal(new Set(g.players.slice(1).map(p=>p.id)).size,4);
      assert(g.players.slice(1).every(p=>casino.regulars.some(n=>n.id===p.id) || table.id==='boss' && p.id===casino.boss.id));
      assert.equal(g.players.some(p=>p.id===casino.boss.id),table.id==='boss');
      assert.throws(()=>enterTable(s,casino.id,table.id),/current table/);
      win(s);assert.equal(s.wallet.cash,before+table.entry*4);
      assert.equal(settleCampaign(s),false);assert.equal(s.wallet.cash,before+table.entry*4);
      assert(s.campaign.cleared[casino.id].includes(table.id));
      validateCampaignSave(saved(s));
      if(table.id!=='boss')assert.equal(s.campaign.unlocked.length,index+1);
    }
    assert.equal(s.campaign.unlocked.length,Math.min(5,index+2));
  }
  assert.equal(s.wallet.cash,2326000);assert.equal(s.wallet.wins,25);assert(s.campaign.completed);
  const finale=campaignPage(new URL('http://test/result.html'),s).html;assert(finale.includes('Fortune Row Champion'));assert(!finale.includes('View the next destination'));
  enterTable(s,casinos[0].id,'boss');win(s);assert.equal(s.campaign.lastResult.awarded,false);assert.equal(s.campaign.unlocked.length,5);
});
test('a hand win and eliminating a boss alone do not clear or unlock a table',()=>{
  const s=newCampaign(),c=casinos[0];enterTable(s,c.id,'table-1');
  while(s.game.phase!=='complete')act(s.game,s.game.actor,'fold');
  assert.equal(settleCampaign(s),false);assert.deepEqual(s.campaign.cleared,{});assert.equal(s.wallet.cash,750);
  const cast=s.game.players.map(p=>p.id);startHand(s.game);assert.deepEqual(s.game.players.map(p=>p.id),cast);
  const s2=newCampaign();for(const t of c.tables.slice(0,4)){enterTable(s2,c.id,t.id);win(s2);}
  enterTable(s2,c.id,'boss');const g=s2.game,boss=g.players.find(p=>p.id===c.boss.id);boss.stack=0;g.phase='complete';g.actor=-1;
  assert.equal(settleCampaign(s2),false);assert.equal(s2.campaign.unlocked.length,1);
});

test('the refreshed cast uses current bosses and rejects removed or out-of-casino saved profiles',()=>{
  for(const casino of casinos) {
    assert.equal(casino.regulars.filter(p=>p.gender==='man').length,5);
    assert.equal(casino.regulars.filter(p=>p.gender==='woman').length,3);
  }
  assert.equal(casinos.filter(c=>c.boss.gender==='man').length,4);
  const s=newCampaign(),casino=casinos[0];
  for(const t of casino.tables.slice(0,4)){enterTable(s,casino.id,t.id);win(s);}
  enterTable(s,casino.id,'boss');
  const lineup=s.game.players.slice(1).map(p=>p.id);
  validateCampaignSave(saved(s));
  assert(s.game.players.some(p=>p.id===casino.boss.id));
  assert(characterFor(casino.boss.id).scripted);
  lose(s);validateCampaignSave(saved(s));
  const result=campaignPage(new URL('http://test/result.html'),s).html;
  assert(result.includes(casino.boss.portrait.replace(/^public/,'')));
  assert(result.includes(casino.boss.name.replace(/"/g,'&quot;')));
  const restored=structuredClone(saved(s));restored.game.players[1].id=casinos[1].boss.id;
  assert.throws(()=>validateCampaignSave(restored),/cast/);
  restored.game.players[1].id='removed-cast-member';
  assert.throws(()=>validateCampaignSave(restored),/cast/);
  const invalidCheckpoint=structuredClone(saved(s));invalidCheckpoint.campaign.checkpoint.lineup[0]='removed-cast-member';
  assert.throws(()=>validateCampaignSave(invalidCheckpoint),/checkpoint/);
  retryTable(s);validateCampaignSave(saved(s));
  assert.deepEqual(s.game.players.slice(1).map(p=>p.id),lineup);
  win(s);enterTable(s,casino.id,'boss');
  assert(s.game.players.some(p=>p.id===casino.boss.id));
});
test('the planned loss cushions remain affordable and four opening losses can always recover',()=>{
  for(const scenario of [{every:1,boss:0,expected:1744750},{every:0,boss:2,expected:1726000}]) {
    const s=newCampaign();
    for(const casino of casinos)for(const table of casino.tables) {
      const losses=scenario.every+(table.id==='boss'?scenario.boss:0);
      for(let n=0;n<losses;n++){enterTable(s,casino.id,table.id);lose(s);}
      enterTable(s,casino.id,table.id);win(s);
    }
    assert.equal(s.wallet.cash,scenario.expected);assert.equal(s.campaign.houseStakes,0);assert(s.campaign.completed);
  }
  const s=newCampaign();for(let i=0;i<4;i++){enterTable(s,casinos[0].id,'table-1');lose(s);}
  assert.equal(s.wallet.cash,0);assert.deepEqual(s.campaign.cleared,{});houseStake(s);assert.equal(s.wallet.cash,1000);
});
test('loss recovery keeps progress; checkpoint retry restores pre-entry cash and seats with a new deck',()=>{
  const s=newCampaign();enterTable(s,casinos[0].id,'table-1');win(s);
  const before=s.wallet.cash;enterTable(s,casinos[0].id,'table-2');const previous=s.game,ids=previous.players.map(p=>p.id);
  previous.phase='complete';previous.players[0].stack=0;assert(settleCampaign(s));
  assert.equal(s.wallet.cash,before-500);assert(s.campaign.cleared[casinos[0].id].includes('table-1'));
  retryTable(s);assert.equal(s.wallet.cash,before-500);assert.deepEqual(s.game.players.map(p=>p.id),ids);assert.notEqual(s.game.id,previous.id);assert(previous.closed);
  assert.throws(()=>retryTable(s),/after losing/);
  s.game.phase='complete';s.game.players[0].stack=0;settleCampaign(s);s.wallet.cash=0;
  houseStake(s);assert.equal(s.wallet.cash,1000);assert.equal(s.campaign.houseStakes,1000);assert(s.campaign.cleared[casinos[0].id].includes('table-1'));
  assert.throws(()=>houseStake(s),/already/);
});
test('unaffordable entries, locked bosses and invalid identities do not charge the wallet',()=>{
  const s=newCampaign();assert.throws(()=>enterTable(s,casinos[0].id,'table-4'),/afford/);assert.equal(s.wallet.cash,1000);
  assert.throws(()=>enterTable(s,casinos[0].id,'boss'),/four/);assert.equal(s.wallet.cash,1000);
  assert.throws(()=>newCampaign({name:'',portrait:'gambler'}));assert.throws(()=>newCampaign({name:'Mae',portrait:'../ada'}));
  const bad=saved(s);bad.campaign.unlocked.push(casinos[1].id);assert.throws(()=>validateCampaignSave(bad),/pass chain/);
});
test('each boss uses its server policy in API mode and receives only its own private context',async()=>{
  const s=newCampaign();
  for(const casino of casinos) {
    for(const t of casino.tables.slice(0,4)){enterTable(s,casino.id,t.id);win(s);}
    const g=enterTable(s,casino.id,'boss'),i=g.players.findIndex(p=>p.id===casino.boss.id);g.actor=i;
    g.players.forEach((p,j)=>p.memory=[j===i?'boss own memory':'PRIVATE_OTHER_SEAT_'+j]);
    const context=contextFor(g,i),state=JSON.parse(context.user);
    assert.deepEqual(state.ownCards,g.players[i].cards);assert(!context.user.includes('PRIVATE_OTHER_SEAT'));assert(!context.user.includes('"deck"'));assert(!context.user.includes('"cards"'));
    const d=await decision(g,i,{mode:'api',url:'http://127.0.0.1:1/unreachable'});
    assert(legal(g,i)[d.action] || d.action==='call');assert(d.say && !d.say.includes('{amount}'));
    for(const equity of [0,.2,.7,.95])for(const roll of [.01,.5,.99]){
      const choice=bossDecision(state,characterFor(casino.boss.id),{equity,random:()=>roll});
      const clone=structuredClone(g);assert.doesNotThrow(()=>act(clone,i,choice.action,choice.amount));
    }
    win(s);
  }
});
test('atomic save queue keeps the newest autosave and snapshot remains independent',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'fortune-store-'));
  try {
    const store=saveStore(dir),code='a'.repeat(36),snapshot='b'.repeat(36);
    await Promise.all(Array.from({length:12},(_,n)=>store.write(code,{n})));
    assert.deepEqual(await store.read(code),{n:11});await store.write(snapshot,{n:11});await store.write(code,{n:12});assert.deepEqual(await store.read(snapshot),{n:11});
    await assert.rejects(store.read('../not-a-code'),/valid save/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('HTTP onboarding, gated entries, autosave/restart and manual snapshot branching work without exposing private state',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'fortune-http-')),config=configuration({AI_MODE:'local'});
  let app=createApp(config,{saveDir:dir,turnDelay:0}),base,cookie='';
  async function listen(){await new Promise(r=>app.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+app.address().port;}
  async function request(path,body){const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,...(body===undefined?{}:{'X-Holdem-Request':'1','Content-Type':'application/x-www-form-urlencoded'})},body});if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return {status:response.status,text:await response.text()};}
  async function idle(){for(let n=0;n<200;n++){const r=await request('/api/state');if(!r.text.includes('busy="1"'))return r;await new Promise(r=>setTimeout(r,10));}throw new Error('Table did not idle.');}
  try {
    await listen();let r=await request('/');assert(r.text.includes('Last Seat on Fortune Row'));assert(r.text.includes('href="/name.html"'));
    r=await request('/characters.html?name=Mae&page=2');assert.equal((r.text.match(/class="camp-portrait"/g)||[]).length,5);assert(r.text.includes('value="gambler"'));
    assert.equal((await request('/api/campaign/new','name=&portrait=gambler')).status,400);
    r=await request('/api/campaign/new','name=Mae&portrait=gambler');assert.equal(r.status,200);assert(r.text.includes('cash="1000"'));assert(r.text.includes('hand="0"'));
    const recovery=/recoveryCode="([a-f0-9]{36})"/.exec(r.text)[1];
    let disk=JSON.parse(await readFile(join(dir,recovery+'.json'),'utf8'));assert.equal(disk.version,3);assert.equal(disk.game,null);
    assert((await request('/intro.html')).text.includes('Mae / The Gambler'));
    for(let n=0;n<5;n++) {
      const page=await request(n<3?'/intro.html':'/story.html'),token=/name="scene" value="([^"]+)"/.exec(page.text)[1],scope=/name="case" value="([^"]+)"/.exec(page.text)[1];
      assert.equal((await request('/api/story/advance',new URLSearchParams({scene:token,case:scope}).toString())).status,200);
    }
    r=await request('/map.html');assert.equal((r.text.match(/class="camp-label"/g)||[]).length,1);assert.equal((r.text.match(/Invitation required/g)||[]).length,4);
    assert((await request('/casino.html?id='+casinos[1].id)).text.includes('Invitation required'));
    assert.equal((await request('/api/campaign/buy','casino='+casinos[1].id+'&table=table-1')).status,400);
    assert.equal((await request('/api/campaign/buy','casino='+casinos[0].id+'&table=boss')).status,400);
    const attempts=await Promise.all([request('/api/campaign/buy','casino='+casinos[0].id+'&table=table-1'),request('/api/campaign/buy','casino='+casinos[0].id+'&table=table-1')]);assert.equal(attempts.filter(r=>r.status===200).length,1);
    r=await idle();assert(r.text.includes('cash="750"'));assert.equal((r.text.match(/<card>\?\?<\/card>/g)||[]).length,8);assert(!r.text.includes('"privateMemory"'));assert(r.text.includes('chips'));
    const snapshotResponse=await request('/api/save','');const snapshot=/<save>([a-f0-9]{36})<\/save>/.exec(snapshotResponse.text)[1];
    disk=JSON.parse(await readFile(join(dir,recovery+'.json'),'utf8'));const cast=disk.game.players.map(p=>p.id),deck=disk.game.deck;
    for(const path of [disk.game.campaign.background,'/portraits/players/gambler.jpg','/campaign.js','/campaign.css'])assert.equal((await request(path)).status,200);
    assert.equal((await request('/content/v2/campaign.json')).status,404);assert.equal((await request('/data/saves/'+recovery+'.json')).status,404);
    await new Promise(r=>app.close(r));cookie='';app=createApp(config,{saveDir:dir,turnDelay:0});await listen();
    r=await request('/api/load','code='+recovery);assert.equal(r.status,200);assert(r.text.includes('cash="750"'));assert(r.text.includes('recoveryCode="'+recovery+'"'));await idle();
    disk=JSON.parse(await readFile(join(dir,recovery+'.json'),'utf8'));assert.deepEqual(disk.game.players.map(p=>p.id),cast);assert.deepEqual(disk.game.deck,deck);
    r=await request('/api/load','code='+snapshot);assert.equal(r.status,200);assert.notEqual(/recoveryCode="([a-f0-9]{36})"/.exec(r.text)[1],recovery);
    await idle();
    const winner=newCampaign({name:'Winner',portrait:'nurse'});enterTable(winner,casinos[0].id,'table-1');win(winner,false);
    const fixture='c'.repeat(36);await writeFile(join(dir,fixture+'.json'),JSON.stringify(saved(winner)));
    r=await request('/api/load','code='+fixture);assert(r.text.includes('cash="2000"'));assert(r.text.includes('wins="1"'));
    r=await request('/result.html');assert(r.text.includes('TABLE WON'));assert(r.text.includes('$1,250'));
    const paidSnapshot=await request('/api/save','');const paidCode=/<save>([a-f0-9]{36})<\/save>/.exec(paidSnapshot.text)[1];
    r=await request('/api/load','code='+paidCode);assert(r.text.includes('cash="2000"'));assert(r.text.includes('wins="1"'));
  }finally{await new Promise(r=>app.close(r));await rm(dir,{recursive:true,force:true});}
});
test('new campaign browser code is ES3 and pages escape names',async()=>{
  parse(await readFile(new URL('../public/campaign.js',import.meta.url),'utf8'),{ecmaVersion:3});
  const {campaignPage}=await import('../lib/campaign-pages.js');
  const s=newCampaign({name:'<b>Mae & Co</b>',portrait:'dancer'});
  const page=campaignPage(new URL('http://test/intro.html'),s).html;assert(page.includes('&lt;b&gt;Mae &amp; Co&lt;/b&gt;'));assert(!page.includes('<b>Mae & Co</b>'));
  const xml=stateXml(null,{mode:'local'},s);assert(xml.includes('campaign="1"'));assert(!xml.includes('checkpoint'));
});
test('loading a recovery code transfers ownership and prevents the old session spending that wallet',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'fortune-owner-')),app=createApp(configuration({AI_MODE:'local'}),{saveDir:dir,turnDelay:0});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
  async function request(path,body,cookie='') {
    const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Cookie:cookie,'X-Holdem-Request':'1','Content-Type':'application/x-www-form-urlencoded'},body});
    return {status:r.status,text:await r.text(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
  }
  try {
    const first=await request('/api/campaign/new','name=Mae&portrait=gambler'),code=/recoveryCode="([a-f0-9]{36})"/.exec(first.text)[1];
    const second=await request('/api/load','code='+code);assert.equal(second.status,200);assert(second.text.includes('cash="1000"'));
    const old=await request('/api/state',undefined,first.cookie);assert(old.text.includes('campaign="0"'));
    const denied=await request('/api/campaign/buy','casino=gilded-alibi&table=table-1',first.cookie);assert.equal(denied.status,400);
    const current=await request('/api/state',undefined,second.cookie);assert(current.text.includes('campaign="1"'));assert(current.text.includes('cash="1000"'));
  }finally{await new Promise(r=>app.close(r));await rm(dir,{recursive:true,force:true});}
});
