// Isolated automated UI regression test; never attaches to an existing browser.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, dirname, basename } from 'node:path';
import { createApp } from '../server.js';
import { configuration } from '../lib/ai.js';
import { openingLetter } from '../lib/story-catalog.js';
const dir=await mkdtemp(join(tmpdir(),'fortune-browser-')),codesPath=join(dir,'codes.json'),output=resolve('artifacts/story-browser');
execFileSync(process.execPath,['scripts/story-preview.mjs','--save-dir',dir,'--codes-file',codesPath],{stdio:'pipe'});
const fixtures=JSON.parse(await readFile(codesPath,'utf8')),code=label=>fixtures.find(f=>f.label===label).code;
const app=createApp(configuration({AI_MODE:'local'}),{saveDir:dir,turnDelay:0});
await new Promise(r=>app.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.address().port;
await mkdir(output,{recursive:true});let browser;const report=[];
try {
  browser=await chromium.launch({headless:true});
  for(const viewport of [{width:800,height:600},{width:1024,height:768}]) {
    const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await context.route('**/*',route=>route.request().url().startsWith(base+'/')?route.continue():route.abort());
    async function go(path){await page.goto(base+path,{waitUntil:'load'});}
    async function click(label){await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.getByRole('button',{name:label,exact:true}).click()]);}
    async function load(label){await go('/');await page.locator('#loadcode').fill(code(label));await click('Load');}
    async function check(label,{screenshot=true}={}) {
      const dimensions=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
      assert(dimensions.document<=dimensions.viewport,label+' has horizontal overflow: '+JSON.stringify(dimensions));
      const images=await page.locator('img').evaluateAll(nodes=>nodes.map(n=>({src:n.getAttribute('src'),loaded:n.complete && n.naturalWidth>0,width:n.width,height:n.height,naturalWidth:n.naturalWidth,naturalHeight:n.naturalHeight})));
      assert(images.every(n=>n.loaded),label+' has a missing image: '+JSON.stringify(images.filter(n=>!n.loaded)));
      const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(ids.length,new Set(ids).size,label+' has duplicate IDs');
      assert.deepEqual(errors,[],label+' has browser exceptions');
      if(screenshot)await page.screenshot({path:join(output,viewport.width+'-'+label+'.png'),fullPage:true});
      report.push({viewport,label,images:images.length,horizontalOverflow:false});
    }
    await load('Opening');await check('opening');await click('Read the Letter');
    for(const line of openingLetter)assert((await page.locator('.story-letter').innerText()).includes(line));
    await click('Close the Suitcase');await click('Begin');await check('briefing');await click('Read the Briefing');assert((await page.locator('.story-page').innerText()).includes('courier notice'));assert((await page.locator('.story-page').innerText()).includes('responsible boss supplied the one false exhibit'));await check('briefing-rules');await click('Go to the Map');
    assert.equal(await page.locator('a.camp-label').count(),1);
    await load('First evidence reveal');await check('evidence-contact');assert((await page.locator('.story-page').innerText()).includes('Supplied under Victor'));await click('Open the Packet');await check('evidence-closeup');
    await click('Keep the Record');await click('Continue to the Next House');
    await go('/evidence.html');assert.equal(await page.getByText('Not collected',{exact:true}).count(),4);await check('evidence-bag-one');
    await go('/evidence.html?section=notes');await page.locator('#theorynotes').fill('Compare the receipt with the signature.');await click('Save Theory');assert.equal(await page.locator('#theorynotes').inputValue(),'Compare the receipt with the signature.');await check('notebook');
    await go('/evidence.html?section=references');await check('reference-cards');
    await load('Complete dossier and accusation');await go('/evidence.html');assert.equal(await page.getByText('Not collected',{exact:true}).count(),0);await check('evidence-bag-five');
    await go('/evidence.html?item=p2');assert.equal(await page.locator('.story-object img').getAttribute('src'),'/images/story/photo-2-v2.jpg');await check('scene-print');
    await go('/evidence.html?item=w1');await click('Set Aside This Exhibit');
    assert((await page.locator('.story-bag').innerText()).includes('Set aside (your theory)'));await check('set-aside-exhibit');
    await go('/accuse.html');assert.equal(await page.locator('#accusefalse').inputValue(),'weapon');
    const stale=await context.newPage(),staleSelection=await context.newPage();
    async function fillAnswer(target,boss='victor-maddox',hotel='marigold-star',weapon='w3',falseCategory='weapon'){
      await target.goto(base+'/accuse.html');await target.locator('#accuseboss').selectOption(boss);await target.locator('#accusehotel').selectOption(hotel);await target.locator('#accuseweapon').selectOption(weapon);await target.locator('#accusefalse').selectOption(falseCategory);
    }
    await fillAnswer(stale);await Promise.all([stale.waitForNavigation({waitUntil:'load'}),stale.getByRole('button',{name:'Review Accusation',exact:true}).click()]);
    await fillAnswer(staleSelection);
    await load('Staged-death dossier');const beforeStale=await (await page.request.get(base+'/api/state')).text();
    const [rejectedSelection]=await Promise.all([staleSelection.waitForNavigation({waitUntil:'load'}),staleSelection.getByRole('button',{name:'Review Accusation',exact:true}).click()]);
    assert.equal(rejectedSelection.status(),400);assert((await staleSelection.locator('body').innerText()).includes('another saved campaign'));
    assert.equal(await (await page.request.get(base+'/api/state')).text(),beforeStale,'Stale selection changed the loaded campaign');await staleSelection.close();
    await stale.getByRole('button',{name:'Confirm Final Accusation',exact:true}).click();
    await stale.waitForFunction(()=>document.getElementById('notice').innerText.indexOf('another saved campaign')!==-1);
    assert.equal(await (await page.request.get(base+'/api/state')).text(),beforeStale,'Stale tab changed the loaded campaign');
    await stale.close();await check('stale-tab-preserves-cash');
    await load('Complete dossier and accusation');
    await go('/accuse.html');await page.locator('#accuseboss').selectOption('victor-maddox');await page.locator('#accusehotel').selectOption('marigold-star');await page.locator('#accuseweapon').selectOption('w3');await page.locator('#accusefalse').selectOption('weapon');
    await click('Review Accusation');await check('accusation-review');await click('Confirm Final Accusation');await check('success');await click('Continue');await click('Return to Open Circuit');
    assert.equal(await page.locator('a.camp-label').count(),5);
    await go('/casino.html?id=gilded-alibi');await click('Table 1 / $250');await page.waitForFunction(()=>document.getElementById('notice').innerText==='Your turn.');
    const before=await (await page.request.get(base+'/api/state')).text();
    await page.locator('#evidencebag').click();await page.waitForURL('**/evidence.html');await check('bag-during-table');
    const after=await (await page.request.get(base+'/api/state')).text();assert.equal(/revision="([^"]+)"/.exec(after)[1],/revision="([^"]+)"/.exec(before)[1],'Reading evidence advanced the player turn');
    await load('Staged-death dossier');await page.locator('#accuseboss').selectOption('marcel-duvall');await page.locator('#accusehotel').selectOption('marigold-star');await page.locator('#accuseweapon').selectOption('none');await page.locator('#accusefalse').selectOption('photo');await click('Review Accusation');await click('Confirm Final Accusation');assert((await page.locator('.story-page').innerText()).includes('There was no murder weapon.'));
    await load('Ambiguous failed ending');await click('Continue');await check('ambiguous-ending');
    for(const line of openingLetter)assert((await page.locator('.story-letter').innerText()).includes(line));
    await click('Continue');assert((await page.locator('.story-end').innerText()).includes('The End'));await click('Continue to Main Menu');
    assert.equal(await page.getByRole('link',{name:'Continue campaign',exact:true}).count(),0);
    await page.getByRole('link',{name:'New Game',exact:true}).first().click();await page.locator('#playername').fill('New Reviewer');await click('Choose Character');await clickFirstChoose();
    await click('Read the Letter');await click('Close the Suitcase');await click('Begin');assert((await page.locator('.story-page').innerText()).includes('Review Player'));await check('successor-victim');
    async function clickFirstChoose(){await Promise.all([page.waitForNavigation({waitUntil:'load'}),page.getByRole('button',{name:'Choose',exact:true}).first().click()]);}
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:800,height:600},javaScriptEnabled:false}),page=await context.newPage();
  await page.goto(base+'/');await page.locator('#loadcode').fill(code('Opening'));await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Load',exact:true}).click()]);
  await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Read the Letter',exact:true}).click()]);
  assert((await page.locator('.story-letter').innerText()).includes(openingLetter[0]));
  await page.goto(base+'/');await page.locator('#loadcode').fill(code('Complete dossier and accusation'));await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Load',exact:true}).click()]);
  await page.goto(base+'/evidence.html?section=notes');await page.locator('#theorynotes').fill('Native form comparison note.');await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Save Theory',exact:true}).click()]);assert.equal(await page.locator('#theorynotes').inputValue(),'Native form comparison note.');
  await page.goto(base+'/accuse.html');await page.locator('#accuseboss').selectOption('victor-maddox');await page.locator('#accusehotel').selectOption('marigold-star');await page.locator('#accuseweapon').selectOption('w3');await page.locator('#accusefalse').selectOption('weapon');
  await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Review Accusation',exact:true}).click()]);await Promise.all([page.waitForNavigation(),page.getByRole('button',{name:'Confirm Final Accusation',exact:true}).click()]);assert((await page.locator('.story-page').innerText()).includes('Victor'));await context.close();
  await writeFile(join(output,'report.json'),JSON.stringify({checks:report,nativeFormsWithoutScript:true,browser:'Chromium; no IE6 emulation claimed'},null,2)+'\n');
  console.log('Browser story checks passed: '+report.length+' page/viewport checks, both endings, live-table evidence access, and native forms without script. Screenshots: artifacts/story-browser/');
} finally {
  if(browser)await browser.close();await new Promise(r=>app.close(r));
  if(dirname(resolve(dir))===resolve(tmpdir()) && basename(dir).startsWith('fortune-browser-'))await rm(dir,{recursive:true,force:true});
}
