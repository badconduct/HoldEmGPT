// Exercises the running server and real configured opponents. No credentials or private cards are logged.
import assert from 'node:assert/strict';
const base=process.env.CHECK_URL || 'http://127.0.0.1:3083';let cookie='';
async function request(path,body) {
  const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'X-Holdem-Request':'1','Content-Type':'application/x-www-form-urlencoded',...(cookie?{Cookie:cookie}:{})},body,signal:AbortSignal.timeout(15000)});
  if(!cookie)cookie=response.headers.get('set-cookie')?.split(';')[0] || '';
  const xml=await response.text();assert.equal(response.status,200,'Server action failed: '+path);return xml;
}
const attr=(xml,key)=>new RegExp('\\b'+key+'="([^"]*)"').exec(xml)?.[1];
async function idle() {
  for(let n=0;n<360;n++) {
    const xml=await request('/api/state');
    if(attr(xml,'busy')==='0') {assert(!xml.includes('Opponent could not act'),'Real AI decision failed');return xml;}
    await new Promise(r=>setTimeout(r,1000));
  }
  throw new Error('Opponents did not finish before the spot-check deadline.');
}
assert.equal((await fetch(base+'/')).status,200);
let xml=await request('/api/campaign/new','name=Spot+Check&portrait=pilot');assert.equal(attr(xml,'mode'),'api');assert.equal(attr(xml,'cash'),'1000');
xml=await request('/api/campaign/buy','casino=gilded-alibi&table=table-1');assert.equal(attr(xml,'cash'),'750');
xml=await idle();console.log('Configured API opponents reached the player turn.');
assert(xml.includes('<quote'),'No public character dialogue was returned');
for(const q of xml.matchAll(/<quote[^>]*name="([^"]*)"[^>]*>([^<]*)<\/quote>/g))console.log(q[1]+': '+q[2]);
assert.equal(attr(xml,'actor'),'0');xml=await request('/api/action','action=allin&revision='+attr(xml,'revision'));
xml=await idle();assert.equal(attr(xml,'phase'),'complete');console.log('Live all-in hand reached settlement without an AI or dealer error.');
const cash=attr(xml,'cash'), save=await request('/api/save',''), code=/<save>([a-f0-9]{36})<\/save>/.exec(save)?.[1];assert(code);
cookie='';xml=await request('/api/load','code='+code);assert.equal(attr(xml,'cash'),cash);assert(xml.includes('name="Spot Check" portrait="pilot"'));
console.log('Server-disk save/load restored bankroll and character in a new browser session.');
