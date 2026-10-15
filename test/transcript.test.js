import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

function node(tag,attrs={},text='',children=[]) {
  return {tag,text,getAttribute:key=>key in attrs?String(attrs[key]):null,getElementsByTagName(name){const found=[];for(const c of children){if(c.tag===name)found.push(c);found.push(...c.getElementsByTagName(name));}return found;}};
}

test('ActiveX client orders dialogue and preserves both tables across repeated view switches',async()=>{
  const source=await readFile(new URL('../public/client.js',import.meta.url),'utf8'), page=await readFile(new URL('../public/table.html',import.meta.url),'utf8');
  const elements={};for(const m of page.matchAll(/id="([^"]+)"/g)){assert(!elements[m[1]],'Duplicate page ID '+m[1]);elements[m[1]]={innerHTML:'',style:{display:'none'},disabled:false,value:'',scrollHeight:200,scrollTop:80,clientHeight:130,focus(){},select(){}};}
  const names=['Rae','Ruby Valentine','Silas "The Rail" Mercer','Ada Ledger','Pearl Beaumont'], ids=['you','ruby','rail','ada','pearl'];
  const players=names.map((name,i)=>node('player',{seat:i,id:ids[i],name,portrait:i===0?'pilot':ids[i],stack:900,bet:i===1?120:0,folded:[0,2,4].includes(i)?1:0,out:0,style:'Public style',action:'calls $50'},'',(i===0?['Ah','Kd']:['??','??']).map(c=>node('card',{},c))));
  const events=[
    'Hand 2 / preflop: New shuffled deck. Ruby Valentine has the button.',
    'Hand 2 / preflop: Silas "The Rail" Mercer posts small blind $10.',
    'Hand 2 / preflop: Ada Ledger posts big blind $20.',
    'Hand 2 / preflop: Pearl Beaumont calls $20.',
    'Hand 2 / preflop: Rae calls $20.',
    'Hand 2 / preflop: Ruby Valentine calls $20.',
    'Hand 2 / preflop: Silas "The Rail" Mercer calls $10.',
    'Hand 2 / preflop: Ada Ledger raises to $50.',
    'Hand 2 / preflop: Pearl Beaumont folds.',
    'Hand 2 / preflop: Rae folds.',
    'Hand 2 / preflop: Ruby Valentine calls $30.',
    'Hand 2 / preflop: Silas "The Rail" Mercer folds.',
    'Hand 2 / flop: Board: 2c 3d 4h.',
    'Hand 2 / flop: Ruby Valentine checks.',
    'Hand 2 / flop: Ada Ledger raises to $50.',
    'Hand 2 / flop: Ruby Valentine calls $50.',
    'Hand 2 / turn: Board: 2c 3d 4h 5s.',
    'Hand 2 / flop: Ruby Valentine says "Fifty for another verse. <script>noise</script>".',
    'Hand 2 / turn: Ruby Valentine raises to $120.',
    'Hand 2 / turn: Ruby Valentine says "My next verse costs more.".'
  ];
  const quotes=[node('quote',{id:1,seat:1,name:names[1],hand:2,street:'flop',action:'call'},'Fifty for another verse. <script>noise</script>'),node('quote',{id:2,seat:1,name:names[1],hand:2,street:'turn',action:'raise'},'My next verse costs more.')];
  const game=node('game',{revision:10,hand:2,phase:'turn',actor:3,dealer:1,sb:2,bb:3,busy:1,cash:2000,wins:0,pot:300,canNext:0,canBuy:0},'',[
    node('status',{},'Ada Ledger is thinking...'),node('save'),node('result'),node('error'),node('board',{},'',['2c','3d','4h','5s'].map(c=>node('card',{},c))),node('players',{},'',players),node('history',{},'',events.map(e=>node('event',{},e))),node('dialogue',{},'',quotes)
  ]);
  const doc={documentElement:game,getElementsByTagName:name=>name==='game'?[game]:game.getElementsByTagName(name)};
  const programs=[];
  function ActiveXObject(program) {programs.push(program);return {readyState:0,status:200,responseXML:doc,open(){},setRequestHeader(){},abort(){},send(){this.readyState=4;this.onreadystatechange();}};}
  const browserDocument={getElementById:id=>{assert(elements[id],'Missing page control '+id);return elements[id];}};
  const browserWindow={setTimeout(){return 1;},clearTimeout(){},location:{},confirm(){return false;}};
  vm.runInNewContext(source,{document:browserDocument,ActiveXObject,window:browserWindow});
  const html=elements.talklog.innerHTML;
  assert.deepEqual(programs,['Msxml2.XMLHTTP']);
  assert(html.includes('<b>Dealer:</b> Shuffles a fresh deck and deals hole cards. Ruby Valentine has the button.'));
  assert(html.includes('Posts small blind $10.'));assert(html.includes('Posts big blind $20.'));
  assert(html.includes('<b>Player (Rae):</b> Calls $20.'));assert(html.includes('<b>Player (Rae):</b> Folds.'));
  assert(html.includes('<b>Ruby Valentine:</b> Calls $30.'));
  const quoteAt=html.indexOf('Fifty for another verse.'), turnAt=html.indexOf('deals the TURN'), raiseAt=html.indexOf('Raises to $120.');
  assert(quoteAt>=0 && quoteAt<turnAt && turnAt<raiseAt,'Street transition or quote order was lost');
  assert.equal(html.split('Fifty for another verse.').length-1,1,'Quote duplicated');
  assert(html.includes('&lt;script&gt;noise&lt;/script&gt;'));assert(!html.includes('<script>'));
  assert(elements.quote1.innerHTML.includes('My next verse costs more.'));assert(!elements.seat1.innerHTML.includes('My next verse costs more.'));
  assert(elements.seat1.innerHTML.includes('<div class="action">raises to $120'),'Current turn move was cleared');
  assert(elements.seat3.innerHTML.includes('<div class="action"></div>'),'Flop move survived into the turn');
  assert(elements.seat2.innerHTML.includes('<div class="action">Folded</div>'),'Fold status was lost');
  assert.equal(elements.talklog.scrollTop,200);
  const scene=Object.fromEntries(Object.entries(elements).filter(([id])=>/^(p?(?:seat|holes|quote)[0-4]|p?board|p?pot|p?handlabel)$/.test(id)).map(([id,e])=>[id,e.innerHTML]));
  for(let i=0;i<5;i++) {
    assert.equal(elements['pseat'+i].innerHTML,elements['seat'+i].innerHTML);
    assert.equal(elements['pholes'+i].innerHTML,elements['holes'+i].innerHTML);
    assert.equal(elements['pquote'+i].innerHTML,elements['quote'+i].innerHTML);
    assert.equal((elements['pholes'+i].innerHTML.match(/class="card/g)||[]).length,2);
  }
  assert.equal(elements.pholes2.style.visibility,'hidden');
  assert.equal(elements.pholes0.style.visibility,'visible','Player cannot see their own folded cards');
  assert.equal((elements.pboard.innerHTML.match(/class="card/g)||[]).length,4);
  elements.amount.value='321';
  for(let i=0;i<10;i++) {
    elements.viewtoggle.onclick();assert.equal(elements.classicview.style.display,'block');assert.equal(elements.perspectiveview.style.display,'none');assert.equal(elements.viewtoggle.innerHTML,'View: Classic');
    elements.viewtoggle.onclick();assert.equal(elements.classicview.style.display,'none');assert.equal(elements.perspectiveview.style.display,'block');assert.equal(elements.viewtoggle.innerHTML,'View: Perspective');
    for(const [id,html] of Object.entries(scene))assert.equal(elements[id].innerHTML,html,'Switch lost '+id);
    assert.equal(elements.amount.value,'321','Switch lost a pending raise amount');
  }
  assert.deepEqual(programs,['Msxml2.XMLHTTP'],'Switching view issued a game request');
  browserDocument.cookie='holdemview=classic';
  vm.runInNewContext(source,{document:browserDocument,ActiveXObject,window:browserWindow});
  assert.equal(elements.classicview.style.display,'block','Saved classic preference was ignored');
  assert.equal(elements.perspectiveview.style.display,'none');
  elements.roomimage.onerror();assert.equal(elements.classicview.style.display,'block');
});
