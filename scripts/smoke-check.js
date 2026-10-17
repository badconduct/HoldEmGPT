// Uses a disposable session. Save codes remain in the optional local state file.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const base=process.env.CHECK_URL || 'http://127.0.0.1:3083';
let cookie='';
async function request(path,body) {
  const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'X-Holdem-Request':'1','Content-Type':'application/x-www-form-urlencoded',...(cookie?{Cookie:cookie}:{})},body,signal:AbortSignal.timeout(15000)});
  if(!cookie)cookie=response.headers.get('set-cookie')?.split(';')[0] || '';
  const text=await response.text();assert.equal(response.status,200,'Action failed: '+path);return text;
}
const attr=(xml,key)=>new RegExp('\\b'+key+'="([^"]*)"').exec(xml)?.[1];
async function idle() {
  for(let n=0;n<600;n++) {
    const xml=await request('/api/state');
    if(attr(xml,'busy')==='0') {assert(!xml.includes('Opponent could not act'),'Opponent failure');return xml;}
    await new Promise(r=>setTimeout(r,1000));
  }
  throw new Error('Opponents did not finish.');
}
const health=await fetch(base+'/healthz');assert.equal(health.status,200);assert.equal((await health.json()).service,'holdemgpt');
const page=await (await fetch(base+'/')).text();assert(page.includes('Last Seat on Fortune Row'));assert(page.includes('href="/name.html"'));
if(process.argv.includes('--restore')) {
  assert(process.env.SMOKE_STATE_FILE,'SMOKE_STATE_FILE is required to restore');
  const saved=JSON.parse(await readFile(process.env.SMOKE_STATE_FILE,'utf8'));
  for(const code of [saved.recoveryCode,saved.code]) {
    await request('/api/load','code='+code);const xml=await idle();
    assert.equal(attr(xml,'cash'),saved.cash);assert.equal(attr(xml,'hand'),saved.hand);assert.equal(attr(xml,'campaign'),'1');assert(xml.includes('name="Deployment Check" portrait="pilot"'));
  }
  console.log('Campaign autosave and manual snapshot restored after recreation.');
} else {
  let xml=await request('/api/campaign/new','name=Deployment+Check&portrait=pilot');assert.equal(attr(xml,'cash'),'1000');assert.equal(attr(xml,'hand'),'0');
  const recoveryCode=attr(xml,'recoveryCode');assert(/^[a-f0-9]{36}$/.test(recoveryCode));
  assert((await request('/intro.html')).includes('Deployment Check / The Pilot'));
  for(let n=0;n<5;n++) {
    const scene=await request(n<3?'/intro.html':'/story.html'),token=/name="scene" value="([^"]+)"/.exec(scene)?.[1];assert(token);
    await request('/api/story/advance','scene='+encodeURIComponent(token));
  }
  const map=await request('/map.html');assert.equal((map.match(/class="camp-label"/g)||[]).length,1);
  xml=await request('/api/campaign/buy','casino=gilded-alibi&table=table-1');assert.equal(attr(xml,'cash'),'750');
  if(process.env.CHECK_MODE)assert.equal(attr(xml,'mode'),process.env.CHECK_MODE);
  xml=await idle();assert.equal(attr(xml,'actor'),'0');assert.equal((xml.match(/<card>\?\?<\/card>/g)||[]).length,8);assert(xml.includes('<quote'));
  assert(!xml.includes('privateMemory') && !xml.includes('AI_TOKEN'));
  const cash=attr(xml,'cash'), hand=attr(xml,'hand');
  const saved=await request('/api/save',''), code=/<save>([a-f0-9]{36})<\/save>/.exec(saved)?.[1];assert(code);
  if(process.env.SMOKE_STATE_FILE)await writeFile(process.env.SMOKE_STATE_FILE,JSON.stringify({code,recoveryCode,cash,hand}),{mode:0o600});
  cookie='';xml=await request('/api/load','code='+code);assert.equal(attr(xml,'cash'),cash);assert(xml.includes('name="Deployment Check" portrait="pilot"'));
  console.log('Campaign flow, independent opponent dialogue, hidden cards and save/load passed.');
}
// Drain every response so the HTTP pool can release its sockets on all hosts.
for(const path of ['/table.html','/campaign.js','/campaign.css','/portraits/players/pilot.jpg','/portraits/campaign/gilded-alibi/ada-v2.jpg','/images/table-room.jpg','/images/campaign/gilded-alibi/table-1.jpg','/music/midnight-ledger.mid','/.env']) {
  const response=await fetch(base+path,{signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,path==='/.env'?404:200);await response.arrayBuffer();
}
