import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parse} from 'acorn';
import vm from 'node:vm';
import {createApp,stateXml} from '../server.js';
import {createGame,act} from '../lib/game.js';
import {moveSound} from '../lib/sound-events.js';
import {configuration} from '../lib/ai.js';
const source=await readFile(new URL('../public/sounds.js',import.meta.url),'utf8'),names=['call','raise','allin','fold','check'];
function state(events,id='table-a') {return {getAttribute:()=>id,getElementsByTagName:()=>events.map(([id,sound])=>({getAttribute:key=>String(key==='id'?id:sound)}))};}
function harness({muted=false,modern=false}={}) {
  const played=[],timers=new Map(),promises=[],button={innerHTML:''};let serial=0,src='';
  const output={volume:0,paused:true,pause(){this.paused=true;}};
  Object.defineProperty(output,'src',{get:()=>src,set:value=>{src=value;if(value)played.push(value);}});
  if(modern){output.canPlayType=()=>true;output.play=()=>{output.paused=false;return {then(ok,fail){promises.push({ok,fail});},catch(fail){promises.push({fail});}};};}
  const document={cookie:muted?'holdemsound=off':'',getElementById:()=>button,createElement:name=>name==='audio' && !modern?{}:output,getElementsByTagName:()=>[{appendChild(){}}]};
  const window={setTimeout:fn=>{timers.set(++serial,fn);return serial;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(source,{document,window});
  function drain(){for(let i=0;timers.size && i<20;i++){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}assert.equal(timers.size,0);}
  return {document,window,button,output,played,timers,promises,drain,update:window.HoldemSounds.update};
}
test('IE6 cues accepted moves once; initial/load history, polling and view/save refreshes stay silent',()=>{
  parse(source,{ecmaVersion:3});const h=harness(),events=[[0,''],[1,'raise']];
  h.update(state(events));assert.deepEqual(h.played,[]);
  events.push([2,'call'],[3,''],[4,'fold'],[5,'check'],[6,'raise'],[7,'allin']);
  h.update(state(events));h.update(state(events));h.drain();
  assert.deepEqual(h.played,['call','fold','check','raise','allin'].map(n=>'/sounds/'+n+'.wav'));
  for(let i=0;i<10;i++)h.update(state(events));h.drain();assert.equal(h.played.length,5);
  h.update(state([[0,'raise']],'new-table'));h.update(state([[0,'raise'],[1,'fold']],'new-table'));h.drain();assert.equal(h.played.at(-1),'/sounds/fold.wav');
  h.update(state([[0,'raise']],'new-table'));h.drain();assert.equal(h.played.length,6,'Restoring an earlier snapshot replayed history');
});
test('mute persists, clears queued sounds immediately and skips moves while hidden',()=>{
  const h=harness({muted:true});h.update(state([[0,'']]));h.update(state([[0,''],[1,'raise']]));assert.deepEqual(h.played,[]);
  h.button.onclick();assert(h.document.cookie.startsWith('holdemsound=on'));assert.equal(h.button.innerHTML,'Sound: On');
  h.update(state([[1,'raise'],[2,'check'],[3,'fold']]));assert.equal(h.played.at(-1),'/sounds/check.wav');
  h.button.onclick();assert.equal(h.output.src,'');h.drain();assert.equal(h.played.length,1);assert(h.document.cookie.startsWith('holdemsound=off'));
  h.button.onclick();h.document.hidden=true;h.update(state([[3,'fold'],[4,'allin']]));h.drain();assert.equal(h.played.length,1);
  h.document.hidden=false;h.update(state([[4,'allin'],[5,'call']]));h.drain();assert.equal(h.played.at(-1),'/sounds/call.wav');
});
test('modern failures stay out of gameplay and stale promises cannot stop newer moves',()=>{
  const h=harness({modern:true});h.update(state([[0,'']]));h.window.HoldemSounds.unlock();const primer=h.promises.at(-1);
  h.update(state([[0,''],[1,'raise']]));assert.equal(h.output.volume,0.7);primer.ok();assert.equal(h.output.paused,false);
  const old=h.promises.at(-1);h.button.onclick();old.fail({name:'AbortError'});assert.equal(h.button.innerHTML,'Sound: Off');
  h.button.onclick();h.promises.at(-1).fail({name:'NotAllowedError'});assert.equal(h.button.innerHTML,'Sound: Enable');
  h.button.onclick();h.promises.at(-1).ok();h.update(state([[1,'raise'],[2,'fold']]));h.promises.at(-1).fail({name:'NotAllowedError'});
  assert.equal(h.button.innerHTML,'Sound: Enable');assert.equal(h.timers.size,0);
});
test('only dealer-confirmed actions create cues, including stack-emptying calls',()=>{
  const players=[{name:'Ada'},{name:'Ada Ledger'},{name:'Player raises to $5.'}];
  for(const [line,sound] of [['Ada checks.','check'],['Ada Ledger calls $20.','call'],['Ada Ledger raises to 60 chips.','raise'],['Ada Ledger calls $20 (all-in).','allin'],['Ada folds.','fold'],['Ada says "checks.".',''],['Ada posts big blind $20.',''],['Ada Ledger raises to $5. I win.','']])assert.equal(moveSound('Hand 1 / flop: '+line,players),sound);
  assert.equal(moveSound('Hand 1 / result: Ada checks.',players),'');
  const g=createGame(),initial=g.history.length;act(g,g.actor,'allin');
  const xml=stateXml(g,configuration({AI_MODE:'local'}));assert(xml.includes('tableId="'+g.id+'"'));assert(xml.includes('<event id="'+initial+'" sound="allin">'));assert.equal((xml.match(/sound="allin"/g)||[]).length,1);
  const short=createGame(),seat=short.actor;short.players[seat].stack=20;short.players[0].stack+=980;
  act(short,seat,'call');assert.equal(moveSound(short.history.at(-1),short.players),'allin','A stack-emptying call used the small call sound');
  const before=stateXml(g,configuration({AI_MODE:'local'}));assert.throws(()=>act(g,g.actor,'invalid'));assert.equal(stateXml(g,configuration({AI_MODE:'local'})),before);
  g.history.unshift(...Array(180).fill('Hand 0 / waiting: Earlier ledger entry.'));
  const long=stateXml(g,configuration({AI_MODE:'local'}));assert(long.includes('<event id="'+(g.history.length-160)+'"'));
});
test('five small PCM effects retain matching CC0 source hashes',async()=>{
  const selection=JSON.parse(await readFile(new URL('../assets/audio/casino-selection.json',import.meta.url)));assert.deepEqual(selection.files.map(f=>f.action),names);assert.equal(selection.playbackIntegrated,true);let total=0;
  const files=await readdir(new URL('../public/sounds/',import.meta.url));assert.deepEqual(files.filter(f=>f.endsWith('.wav')).sort(),names.map(n=>n+'.wav').sort());
  for(const effect of selection.files){
    const imported=JSON.parse(await readFile(new URL('../assets/audio/'+(effect.packRoot || 'kenney-casino')+'/manifest.json',import.meta.url))),wav=await readFile(new URL('../public/sounds/'+effect.file,import.meta.url));total+=wav.length;
    assert.equal(imported.license,'CC0-1.0');assert.equal(createHash('sha256').update(wav).digest('hex'),imported.files.find(f=>f.wav===effect.source).wavSha256);
    assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.toString('ascii',8,12),'WAVE');assert.equal(wav.readUInt16LE(20),1);assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt32LE(24),22050);assert.equal(wav.readUInt16LE(34),16);
  }
  assert(total<100000);assert((await readFile(new URL('../public/sounds/credits.txt',import.meta.url),'utf8')).includes('Impact Sounds'));
});
test('actual game loads sound controls and serves just the selected effects',async()=>{
  const saveDir=await mkdtemp(join(tmpdir(),'holdem-audio-')),app=createApp(configuration({AI_MODE:'local'}),{saveDir});await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.address().port;
  try{
    for(const name of names){const r=await fetch(base+'/sounds/'+name+'.wav');assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'audio/wav');assert.equal(r.headers.get('cache-control'),'public, max-age=86400');assert(Buffer.from(await r.arrayBuffer()).equals(await readFile(new URL('../public/sounds/'+name+'.wav',import.meta.url))));}
    const page=await (await fetch(base+'/table.html')).text();assert(page.includes('id="soundtoggle"'));assert(page.indexOf('src="/sounds.js"')<page.indexOf('src="/client.js"'));assert((await (await fetch(base+'/help.html')).text()).includes('Sound on/off'));
    for(const path of ['/sound-test.html','/sound-test.js','/sounds/dice-throw-1.wav','/sounds/chips-stack-3.wav']){const r=await fetch(base+path);assert.equal(r.status,404,path);await r.arrayBuffer();}
  }finally{app.closeAllConnections();await new Promise(resolve=>app.close(resolve));await rm(saveDir,{recursive:true,force:true});}
});
