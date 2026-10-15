import test from 'node:test';
import assert from 'node:assert/strict';
import { randomInt } from 'node:crypto';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parse } from 'acorn';
import http from 'node:http';
import { newDeck, evaluate, compare } from '../lib/cards.js';
import { createGame, startHand, act, legal, settlePots, view } from '../lib/game.js';
import { contextFor, configuration } from '../lib/ai.js';
import { createApp, stateXml } from '../server.js';
import { playerCharacters } from '../lib/player-characters.js';
import { characters } from '../lib/characters.js';
import { newWallet, buyTable, cashOut, tableFinished } from '../lib/bankroll.js';
import { publishQuote, publishWins, safeQuote } from '../lib/table-talk.js';
const cards=s=>s.split(' ');
test('victory dialogue follows the final move, excludes uncalled returns and is emitted once',()=>{
  const g=createGame();act(g,3,'raise',100);
  let last;
  while(g.phase!=='complete') {last=g.actor;act(g,last,'fold');}
  publishQuote(g,last,{action:'fold',say:'I will sit this one out.'});
  assert.deepEqual(view(g).players[3].cards,['??','??'],'Uncontested winner revealed private cards');
  assert.equal(g.dialogue[0].kind,'move');const win=g.dialogue[1];assert.equal(win.seat,3);assert.equal(win.action,'win');assert.equal(win.kind,'result');assert.equal(win.amount,50);assert(win.text.includes('Collected $50.'));
  assert.equal(g.players[3].lastQuote.id,win.id);publishWins(g);assert.equal(g.dialogue.length,2);
  const split=createGame();split.phase='complete';split.pots=[{amount:3,winners:[1,2],refund:false},{amount:10,winners:[0],refund:true}];split.players[0].lastAward=10;split.players[1].lastAward=1;split.players[2].lastAward=2;
  publishWins(split);assert.deepEqual(split.dialogue.map(q=>q.seat),[1,2]);assert.deepEqual(split.dialogue.map(q=>q.amount),[1,2]);
});
test('public conversation follows legal actions, preserves latest quotes and rejects overt card disclosures',()=>{
  const g=createGame(), first=g.actor;assert.equal(first,3);act(g,first,'call');
  const q=publishQuote(g,first,{action:'call',say:'I will pay that fare.',memory:'secret equity estimate'});
  assert.equal(q.action,'call');assert.equal(q.street,'preflop');assert.equal(q.seat,first);
  const next=g.actor, context=JSON.parse(contextFor(g,next).user);
  assert.equal(context.latestQuotes[0].text,q.text);assert.equal(context.recentConversation[0].name,g.players[first].name);assert.equal(context.lastPlay.seat,first);assert.equal(context.observedPatterns[first].calls,1);assert(!JSON.stringify(context).includes('secret equity'));
  act(g,next,'call');const second=publishQuote(g,next,{action:'call',say:'Then I will keep you company.',replyToSeat:first});assert.equal(second.replyToSeat,first);
  assert.equal(g.dialogue.length,2);assert.equal(g.players[first].lastQuote.text,q.text);
  for(const text of ['I have pocket kings.','My cards are Ac and Kd.','I am bluffing.','A flush for me.','bad\u0000text'])assert.equal(safeQuote(text),'');
  const third=publishQuote(g,next,{action:'call',say:'I have pocket kings.'});assert(!third.text.includes('kings'));assert(third.text.length<=140);
  const xml=stateXml(g,{mode:'local'});assert(xml.includes('<quote'));assert(!xml.includes('secret equity'));assert(!xml.includes('pocket kings'));
});
test('public tendencies accumulate across hands and dialogue survives a save-shaped roundtrip',()=>{
  const g=createGame();act(g,3,'allin');publishQuote(g,3,{action:'allin',say:'Everything is committed.'});
  while(g.phase!=='complete')act(g,g.actor,'fold');
  const patterns=JSON.parse(contextFor(g,1).user).observedPatterns;assert.equal(patterns[3].allInHands,1);assert.equal(patterns[3].allIns,1);assert.equal(patterns[3].raises,1);assert.equal(patterns[3].hands,1);
  startHand(g);assert.equal(g.observations[3].hands,2);assert.equal(g.observations[3].allInHands,1);
  const restored=JSON.parse(JSON.stringify(g));assert.equal(restored.players[3].lastQuote.text,'Everything is committed.');assert.equal(restored.publicPlays[0].action,'allin');assert.equal(restored.observations[3].allInHands,1);
  const legacy=JSON.parse(JSON.stringify(g));delete legacy.observations;delete legacy.dialogue;delete legacy.publicPlays;legacy.players.forEach(p=>delete p.lastQuote);assert.deepEqual(JSON.parse(contextFor(legacy,1).user).recentConversation,[]);
});
test('bankroll buys in, cashes a won table exactly once, and grows across tables',()=>{
  const wallet=newWallet();assert.equal(wallet.cash,3000);
  const g=buyTable(wallet,null,{name:'Rae',portrait:'pilot'});assert.equal(wallet.cash,2000);assert.equal(g.players[0].stack,1000);
  assert.throws(()=>buyTable(wallet,g,{name:'Rae'}));assert.equal(wallet.cash,2000);
  const hands=['As Ad','Ks Kd','Qs Qd','Js Jd','Ts Td'].map(cards), runout=cards('4d 2c 3h 7s 5d 8c 6d 9d');
  g.players.forEach((p,i)=>p.cards=hands[i]);const used=[...hands.flat(),...runout];g.deck=newDeck().filter(c=>!used.includes(c)).concat(runout.slice().reverse());
  while(g.phase!=='complete')act(g,g.actor,'allin');
  assert(tableFinished(g));assert.equal(g.players[0].stack,5000);assert(cashOut(g,wallet));assert.equal(wallet.cash,7000);assert.equal(wallet.wins,1);
  assert.equal(cashOut(g,wallet),false);assert.equal(wallet.cash,7000);
  const second=buyTable(wallet,g,{name:'Rae',portrait:'pilot'});assert.equal(wallet.cash,6000);assert.equal(second.players[0].stack,1000);
  second.phase='complete';second.players[0].stack=0;assert(cashOut(second,wallet));assert.equal(wallet.cash,6000);assert.equal(wallet.wins,1);
  const third=buyTable(wallet,second,{name:'Rae'});assert.equal(wallet.cash,5000);assert.equal(third.players[0].stack,1000);
  assert.throws(()=>buyTable({cash:999,wins:0},null,{name:'Rae'}));
});
test('player selection validates names and portraits and escapes the public name',()=>{
  for(const c of playerCharacters) {const g=createGame({name:'  Rae   Mercer  ',portrait:c.id});assert.equal(g.players[0].name,'Rae Mercer');assert.equal(view(g).players[0].portrait,c.id);assert.equal(g.players[0].id,'you');}
  for(const profile of [{name:''},{name:'x'.repeat(33)},{name:'A\u0000B'},{portrait:'../rail'}]) assert.throws(()=>createGame(profile));
  const g=createGame({name:'Rae & "Ace"',portrait:'reporter'});assert(stateXml(g,{mode:'local'}).includes('name="Rae &amp; &quot;Ace&quot;"'));
  delete g.players[0].portrait;assert.equal(view(g).players[0].portrait,'drifter');
});
test('fresh deck has exactly 52 unique cards; cast has four distinct opponents',()=>{
  for(let n=0;n<30;n++) {const deck=newDeck();assert.equal(deck.length,52);assert.equal(new Set(deck).size,52);const g=createGame();assert.equal(new Set(g.players.map(p=>p.id)).size,5);assert.equal(g.deck.length,42);assert.equal(new Set(g.players.flatMap(p=>p.cards)).size,10);}
});
test('all nine hand classes, ace-low straight, kickers and best five of seven',()=>{
  const examples=['Ac Jd 9h 7s 3d','Ac Ad 9h 7s 3d','Ac Ad 9h 9s 3d','Ac Ad Ah 7s 3d','Ac 2d 3h 4s 5d','Ac Jc 9c 7c 3c','Ac Ad Ah 7s 7d','Ac Ad Ah As 3d','9c Tc Jc Qc Kc'];
  examples.forEach((s,i)=>assert.equal(evaluate(cards(s))[0],i));
  assert.deepEqual(evaluate(cards(examples[4])),[4,5]);
  assert(compare(evaluate(cards('Ac Ad Kh 7s 3d')),evaluate(cards('Ac Ad Qh Js 3d')))>0);
  assert.deepEqual(evaluate(cards('Ac Ad Ah Ks Kd Kh 2c')),[6,14,13]);
  assert.deepEqual(evaluate(cards('Ac Kc Qc Jc Tc 2h 3s')),[8,14]);
});
test('blind rotation, big blind option, four betting streets and chip conservation',()=>{
  const g=createGame();assert.equal(g.dealer,0);assert.equal(g.sb,1);assert.equal(g.bb,2);assert.equal(g.actor,3);
  while(g.phase==='preflop') {const l=legal(g);assert(l);act(g,g.actor,l.check?'check':'call');}
  assert.equal(g.board.length,3);assert.equal(g.actor,1);assert(g.players.every(p=>p.lastAction===''),'Previous street move labels persisted');
  while(g.phase!=='complete') act(g,g.actor,'check');
  assert.equal(g.board.length,5);assert.equal(g.burn.length,3);assert.equal(g.players.reduce((n,p)=>n+p.stack,0),5000);
  const before=g.dealer;startHand(g);assert.equal(g.dealer,(before+1)%5);
});
test('illegal and out-of-turn actions do not mutate the game',()=>{
  const g=createGame(), before=JSON.stringify(g);
  assert.throws(()=>act(g,0,'call'));assert.throws(()=>act(g,g.actor,'check'));assert.throws(()=>act(g,g.actor,'raise',21));assert.throws(()=>act(g,g.actor,'raise',Infinity));assert.equal(JSON.stringify(g),before);
});
test('short all-in does not reopen action, cumulative full raise does',()=>{
  const g=createGame();g.players[4].stack=25;g.players[0].stack=35;
  act(g,3,'call');act(g,4,'allin');act(g,0,'allin');act(g,1,'call');act(g,2,'call');
  assert.equal(g.actor,3);assert.equal(legal(g).raise,false);assert.equal(legal(g).allin,false);act(g,3,'call');
  assert.equal(g.phase,'flop');
  const h=createGame();h.players[4].stack=30;h.players[0].stack=40;
  act(h,3,'call');act(h,4,'allin');act(h,0,'allin');act(h,1,'call');act(h,2,'call');
  assert.equal(h.actor,3);assert.equal(legal(h).raise,true);
});
function fixture(totals,hands,board,folded=[]) {
  const g=createGame();g.board=cards(board);g.players.forEach((p,i)=>{p.stack=0;p.total=totals[i] || 0;p.folded=folded.includes(i) || !p.total;p.out=!p.total;p.cards=hands[i]?cards(hands[i]):[];});return g;
}
test('main pot, side pot, uncalled refund and folded contributions',()=>{
  const g=fixture([100,300,500,0,0],['As Ad','Ks Kd','Qs Qd'],'2c 3h 7s 8c 9d');
  assert.deepEqual(settlePots(g,true),[300,400,200,0,0]);
  const h=fixture([100,100,100,0,0],['As Ad','Ks Kd','Qs Qd'],'2c 3h 7s 8c 9d',[0]);
  assert.deepEqual(settlePots(h,true),[0,300,0,0,0]);
});
test('split pots give odd chip clockwise from button',()=>{
  const g=fixture([1,1,1,0,0],['2c 3c','4c 5c','6c 7c'],'Ah Kh Qh Jh Th',[2]);g.dealer=0;
  assert.deepEqual(settlePots(g,true),[1,2,0,0,0]);
});
test('all-ins run out the board and keep players eligible to win',()=>{
  const g=createGame();while(g.phase!=='complete') {assert(legal(g));act(g,g.actor,'allin');}
  assert.equal(g.board.length,5);assert.equal(g.revealed.length,5);assert(view(g).players.every(p=>!p.cards.includes('??')),'Showdown cards stayed concealed');assert.equal(g.players.reduce((n,p)=>n+p.stack,0),5000);
});
test('heads-up button is small blind; short big blind needs no dry side wager',()=>{
  const g=createGame();while(g.phase!=='complete') act(g,g.actor,'fold');
  g.players.forEach((p,i)=>p.stack=i===0?100:i===1?5:0);g.dealer=1;startHand(g);
  assert.equal(g.dealer,0);assert.equal(g.sb,0);assert.equal(g.bb,1);assert.equal(g.phase,'complete');assert.equal(g.players.reduce((n,p)=>n+p.stack,0),105);
  const h=createGame();while(h.phase!=='complete') act(h,h.actor,'fold');h.players.forEach((p,i)=>p.stack=i<2?100:0);h.dealer=1;startHand(h);assert.equal(h.actor,0);act(h,0,'call');act(h,1,'check');assert.equal(h.actor,1);
});
test('hundreds of randomized hands terminate and conserve every chip',()=>{
  for(let table=0;table<50;table++) {
    const g=createGame();
    for(let hand=0;hand<12;hand++) {
      let steps=0;
      while(g.phase!=='complete') {
        assert(++steps<500,'hand stalled');const l=legal(g);assert(l);const actions=['fold',l.check?'check':'call'];if(l.raise)actions.push('raise');if(l.allin)actions.push('allin');
        const action=actions[randomInt(actions.length)];act(g,g.actor,action,action==='raise'?Math.min(l.max,l.min+randomInt(100)):0);
        assert(g.players.every(p=>Number.isSafeInteger(p.stack) && p.stack>=0));
        assert.equal(g.players.reduce((n,p)=>n+p.stack+(g.phase==='complete'?0:p.total),0),5000);
      }
      assert.equal(g.players.reduce((n,p)=>n+p.stack,0),5000);
      if(g.players[0].stack===0 || g.players.filter(p=>p.stack>0).length<2)break;
      startHand(g);
    }
  }
});
test('browser and per-seat prompts exclude other cards, deck and private memories',()=>{
  const g=createGame();g.players.forEach((p,i)=>p.memory=['secret seat '+i]);
  for(let i=1;i<5;i++) {
    const context=contextFor(g,i), data=JSON.parse(context.user);assert.deepEqual(data.ownCards,g.players[i].cards);assert.deepEqual(data.privateMemory,g.players[i].memory);
    for(let j=0;j<5;j++) if(i!==j) {assert(!context.user.includes('secret seat '+j));assert(!context.user.includes('"'+g.players[j].cards[0]+'"'));}
    assert(!('deck' in data));assert(data.players.every(p=>!('cards' in p)));
  }
  const browser=view(g);assert(browser.players.slice(1).every(p=>p.cards.join(',')==='??,??'));const xml=stateXml(g,{mode:'local'});assert(!xml.includes('secret seat'));assert(!xml.includes('<deck>'));
});
test('legacy client parses as ES3 and all portraits are JPEGs',async()=>{
  parse(await readFile(new URL('../public/client.js',import.meta.url),'utf8'),{ecmaVersion:3});
  parse(await readFile(new URL('../public/lobby.js',import.meta.url),'utf8'),{ecmaVersion:3});
  for(const c of [...characters,...playerCharacters]) {const data=await readFile(new URL('../public'+c.portraitUrl,import.meta.url));assert.equal(data.readUInt16BE(0),0xffd8);assert(data.length>2000);}
});
test('HTTP sessions, request guards, save/load after restart and hidden state',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'holdem-test-')), config=configuration({AI_MODE:'local'});let app=createApp(config,{saveDir:dir});
  await new Promise(r=>app.listen(0,'127.0.0.1',r));let base='http://127.0.0.1:'+app.address().port;
  async function request(path,body,cookie) {const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Holdem-Request':'1',...(cookie?{Cookie:cookie}:{})},body});return {status:r.status,text:await r.text(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
  try {
    let r=await request('/api/state');const cookie=r.cookie;assert(r.text.includes('phase="waiting"'));
    r=await request('/api/new','name=Rae+Mercer&portrait=pilot',cookie);assert.equal(r.status,200);assert(r.text.includes('name="Rae Mercer" portrait="pilot"'));assert(r.text.includes('busy="1"'));assert.equal((r.text.match(/<card>\?\?<\/card>/g)||[]).length,8);
    const separate=await request('/api/state');assert(separate.text.includes('phase="waiting"'));
    const unsafe=await fetch(base+'/api/new',{method:'POST',headers:{Cookie:cookie}});assert.equal(unsafe.status,403);
    let tries=0;do {await new Promise(r=>setTimeout(r,100));r=await request('/api/state',undefined,cookie);assert(++tries<150);} while(r.text.includes('busy="1"'));
    assert(!r.text.includes('could not act'));const rev=Number(/revision="(\d+)"/.exec(r.text)[1]);
    assert.equal((await request('/api/new','name=&portrait=pilot',cookie)).status,400);
    assert.equal((await request('/api/new','name=Changed&portrait=unknown',cookie)).status,400);
    assert((await request('/api/state',undefined,cookie)).text.includes('name="Rae Mercer" portrait="pilot"'));
    const stale=await request('/api/action','action=fold&revision='+(rev-1),cookie);assert.equal(stale.status,400);
    const saved=await request('/api/save','',cookie);assert.equal(saved.status,200);const code=/<save>([a-f0-9]{36})<\/save>/.exec(saved.text)[1];
    const disk=JSON.parse(await readFile(join(dir,code+'.json'),'utf8'));const stack=disk.game.players[0].stack;assert.equal(disk.version,2);assert.equal(disk.wallet.cash,2000);
    await new Promise(r=>app.close(r));app=createApp(config,{saveDir:dir});await new Promise(r=>app.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+app.address().port;
    r=await request('/api/load','code='+code);assert.equal(r.status,200);assert(r.text.includes('stack="'+stack+'"'));assert(r.text.includes('name="Rae Mercer" portrait="pilot"'));assert(r.text.includes('cash="2000"'));assert(!r.text.includes('<memory>'));
    assert.equal((await request('/api/load','code=../../etc/passwd',r.cookie)).status,400);
    for(const c of characters) assert.equal((await request(c.portraitUrl)).status,200);
    assert.equal((await request('/table.html')).status,200);
    assert.equal((await request('/lobby.js')).status,200);
    for(const c of playerCharacters) assert.equal((await request(c.portraitUrl)).status,200);
    const portrait=await fetch(base+'/portraits/players/drifter.jpg');assert.equal(portrait.headers.get('cache-control'),'public, max-age=86400');
    const background=await fetch(base+'/images/table-room.jpg');assert.equal(background.status,200);assert.equal(background.headers.get('content-type'),'image/jpeg');assert.equal(background.headers.get('cache-control'),'public, max-age=86400');assert(Number(background.headers.get('content-length'))<100000);
    const music=await fetch(base+'/music/midnight-ledger.mid');assert.equal(music.status,200);assert.equal(music.headers.get('content-type'),'audio/midi');assert.equal(music.headers.get('cache-control'),'public, max-age=86400');assert(Number(music.headers.get('content-length'))<5000);assert.equal((await request('/music.js')).status,200);
    assert.equal((await request('/api/buy','',r.cookie)).status,400);
  } finally {await new Promise(r=>app.close(r));await rm(dir,{recursive:true,force:true});}
});
test('model failure pauses the same seat; retry gets only its private context',async()=>{
  const calls=[];let bad=true;
  const provider=http.createServer(async(req,res)=>{
    let body='';for await(const chunk of req)body+=chunk;
    const request=JSON.parse(body), context=JSON.parse(request.messages[1].content);calls.push(context);
    const d={action:bad?'raise':context.legal.check?'check':'call',amount:bad?-1:0,memory:'private plan for '+context.seat,say:context.recentConversation.length?'A fair price. I will stay in.':'Let us see where this goes.'};
    bad=false;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(d)}}]}));
  });
  await new Promise(r=>provider.listen(0,'127.0.0.1',r));
  const config=configuration({AI_MODE:'api',AI_API_FORMAT:'chat',AI_URL:'http://127.0.0.1:'+provider.address().port,AI_MODEL:'test',AI_TOKEN:'test'});
  const app=createApp(config);await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
  let cookie;
  async function request(path,body) {const r=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'X-Holdem-Request':'1',...(cookie?{Cookie:cookie}:{})},body});if(!cookie)cookie=r.headers.get('set-cookie')?.split(';')[0];return r.text();}
  async function idle() {let state;for(let n=0;n<100;n++){state=await request('/api/state');if(!state.includes('busy="1"'))return state;await new Promise(r=>setTimeout(r,50));}throw new Error('AI did not finish.');}
  try {
    await request('/api/new','');let state=await idle();assert(state.includes('Opponent could not act'));assert(state.includes('actor="3"'));assert.equal(calls.length,1);
    assert(!state.includes('private plan'));await request('/api/retry','');state=await idle();assert(!state.includes('Opponent could not act'));assert(state.includes('actor="0"'));
    assert.equal(calls[0].seat,calls[1].seat);assert.deepEqual(calls[0].ownCards,calls[1].ownCards);assert.equal(calls[0].publicHistory.length,calls[1].publicHistory.length);
    assert(calls.every(c=>c.players.every(p=>!('cards' in p) && !('memory' in p))));assert(calls.every(c=>c.privateMemory.length===0));assert(!state.includes('private plan'));
    assert.equal(calls[2].recentConversation.length,1);assert.equal(calls[2].latestQuotes.length,1);assert.equal(calls[2].recentConversation[0].text,'Let us see where this goes.');assert(state.includes('A fair price. I will stay in.'));
  } finally {await new Promise(r=>app.close(r));await new Promise(r=>provider.close(r));}
});
test('HTTP restores a table winner, prevents duplicate cashout, then buys in using saved cash',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'holdem-wallet-test-')), game=createGame({name:'Winner',portrait:'heiress'}), code='a'.repeat(36);
  game.phase='complete';game.actor=-1;game.result='Won the table.';game.players.forEach((p,i)=>{p.stack=i===0?5000:0;p.total=0;});
  await writeFile(join(dir,code+'.json'),JSON.stringify({version:2,game,wallet:{cash:2000,wins:0}}));
  const app=createApp(configuration({AI_MODE:'local'}),{saveDir:dir});await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;let cookie;
  async function post(path,body) {const r=await fetch(base+path,{method:'POST',headers:{'X-Holdem-Request':'1',...(cookie?{Cookie:cookie}:{})},body});if(!cookie)cookie=r.headers.get('set-cookie')?.split(';')[0];return {status:r.status,text:await r.text()};}
  try {
    let response=await post('/api/load','code='+code);assert(response.text.includes('cash="7000"'));assert(response.text.includes('canBuy="1"'));assert(response.text.includes('wins="1"'));
    response=await post('/api/save','');const newCode=/<save>([a-f0-9]{36})<\/save>/.exec(response.text)[1];
    response=await post('/api/load','code='+newCode);assert(response.text.includes('cash="7000"'));assert(response.text.includes('wins="1"'));
    response=await post('/api/buy','');assert.equal(response.status,200);assert(response.text.includes('cash="6000"'));assert(response.text.includes('name="Winner" portrait="heiress" stack="1000"'));
    assert.equal((await post('/api/buy','')).status,400);
  } finally {await new Promise(r=>app.close(r));await rm(dir,{recursive:true,force:true});}
});
