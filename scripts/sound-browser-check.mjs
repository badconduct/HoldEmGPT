// Exercise the real table UI against disposable saved tables, without an LLM.
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';
import {createApp} from '../server.js';
import {configuration} from '../lib/ai.js';
import {createGame,act} from '../lib/game.js';
import {newWallet} from '../lib/bankroll.js';
const saveDir=await mkdtemp(join(tmpdir(),'fortune-sound-browser-'));
const app=createApp(configuration({AI_MODE:'local'}),{saveDir,turnDelay:100});
await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
let browser;const report=[];
try {
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:800,height:600}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.addInitScript(()=>{
    window.cuePlays=[];const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
      const cue=this.id==='turnsound' && this.volume>0?{name:this.getAttribute('src'),decoded:false}:null;
      if(cue)window.cuePlays.push(cue);
      const result=play.apply(this,arguments);
      if(cue && result)result.then(()=>{cue.decoded=this.readyState>=2;},()=>{cue.failed=true;});
      return result;
    };
  });
  for(const [index,action] of ['call','raise','allin','fold','check'].entries()) {
    const game=createGame({name:'Audio Player',portrait:'pilot'});
    act(game,3,'call');act(game,4,'call');
    if(action==='check') {
      act(game,0,'call');act(game,1,'call');act(game,2,'check');
      for(const seat of [1,2,3,4])act(game,seat,'check');
    }
    const code=String(index+1).padStart(36,'0');
    await writeFile(join(saveDir,code+'.json'),JSON.stringify({version:2,kind:'snapshot',game,wallet:newWallet()}));
    const load=await context.request.post(base+'/api/load',{headers:{'X-Holdem-Request':'1'},form:{code}});assert.equal(load.status(),200);
    await page.goto(base+'/table.html');await page.waitForFunction(()=>document.getElementById('notice').innerText==='Your turn.');
    assert.equal(await page.evaluate(()=>window.cuePlays.length),0,'Loading a table replayed history');
    if(action==='raise')await page.locator('#amount').fill('60');
    await page.locator('#'+action).click();
    await page.waitForFunction(name=>window.cuePlays.some(p=>p.name==='/sounds/'+name+'.wav' && p.decoded),action);
    assert.equal(await page.evaluate(()=>window.cuePlays[0].name),'/sounds/'+action+'.wav');
    // Wait until the table has consumed all bot replies and queued audio.
    await page.waitForFunction(()=>!document.getElementById('save').disabled);
    await page.waitForFunction(()=>{
      const audio=document.getElementById('turnsound');
      if(audio.ended){if(!window.audioQuietSince)window.audioQuietSince=Date.now();return Date.now()-window.audioQuietSince>500;}
      window.audioQuietSince=0;return false;
    },null,{timeout:15000});
    const cues=await page.evaluate(()=>window.cuePlays.slice());assert(cues.length>1,'No opponent move made a sound');assert(cues.every(p=>p.decoded && !p.failed));
    const before=cues.length;
    for(let i=0;i<10;i++)await page.locator('#viewtoggle').click();
    await page.locator('#save').click();await page.waitForFunction(()=>document.getElementById('savepanel').style.display==='block');
    assert.equal(await page.evaluate(()=>window.cuePlays.length),before,'View/save replayed sounds');
    const dimensions=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));assert(dimensions.width<=dimensions.viewport);
    report.push({action,decodedCues:cues.length,viewSwitches:10,saveReplayed:false});
  }
  // Muted moves and a reload must remain quiet; this is a normal table button.
  await page.locator('#soundtoggle').click();assert.equal(await page.locator('#soundtoggle').innerText(),'Sound: Off');
  await page.reload();await page.waitForFunction(()=>document.getElementById('pseat0').innerText.indexOf('Audio Player')!==-1);
  assert.equal(await page.locator('#soundtoggle').innerText(),'Sound: Off');
  const fold=page.locator('#fold');if(await fold.isEnabled()){await fold.click();await page.waitForTimeout(2000);}
  assert.equal(await page.evaluate(()=>window.cuePlays.length),0,'Muted/reloaded table played sounds');assert.deepEqual(errors,[]);
  await mkdir('artifacts/audio-game-check',{recursive:true});await page.screenshot({path:'artifacts/audio-game-check/table-800.png',fullPage:true});
  await writeFile('artifacts/audio-game-check/report.json',JSON.stringify({checks:report,muteSurvivedReload:true,errors},null,2)+'\n');
  console.log(JSON.stringify({checks:report,muteSurvivedReload:true,errors}));await context.close();
} finally {
  if(browser)await browser.close();app.closeAllConnections();await new Promise(r=>app.close(r));await rm(saveDir,{recursive:true,force:true});
}
