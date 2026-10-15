// Offline content review only. This does not modify the live game or save files.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
const content=JSON.parse(await readFile(join(root,'content/v2/campaign.json'),'utf8'));
const output=join(root,'artifacts/v2-content');
await mkdir(output,{recursive:true});
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const image=path=>'../../'+path;
const money=number=>'$'+number.toLocaleString('en-US');
const casinoLinks=content.casinos.map(c=>'<a href="'+c.id+'.html">'+escape(c.name)+'</a>').join(' &nbsp; ');
const footer='<div class="reviewnav"><a href="artwork.html">Artwork / 25 tables</a> &nbsp; <a href="bosses.html">Five bosses</a> &nbsp; <a href="index.html">Story flow</a> &nbsp; <a href="map.html">Travel map</a> &nbsp; <a href="cast.html">Cast catalog</a></div>';
function html(title,body,script='') {
  return '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">\n'+
    '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>'+escape(title)+' - Fortune Row Content Preview</title><link rel="stylesheet" type="text/css" href="../../public/style.css"><link rel="stylesheet" type="text/css" href="preview.css"></head>\n'+
    '<body><div id="page"><div class="eyebrow">CONTENT &amp; STORY PREVIEW</div><h1>'+escape(title)+'</h1>'+body+footer+'</div>'+script+'</body></html>\n';
}
const save=(file,body)=>writeFile(join(output,file),body,'utf8');
const portrait=(person,width=72,height=90)=>'<img src="'+image(person.portrait)+'" width="'+width+'" height="'+height+'" alt="'+escape(person.name || person.title)+'">';
await save('preview.css',`body { margin:0; padding:6px; background:#191813; color:#e4dcc9; font:13px Georgia,"Times New Roman",serif; }
#page { width:740px; margin:0 auto; }
h1 { margin:3px 0 8px; font:normal 24px Georgia,serif; color:#f0e4c6; }
h2 { margin:9px 0 6px; font:bold 14px Arial,sans-serif; color:#ecd198; }
p { margin:7px 0; line-height:1.4; }
a { color:#ecd198; }
button,.button { display:inline-block; padding:5px 10px; border:1px solid #ae8c4e; background:#d9c28b; color:#231e14; font:bold 12px Arial,sans-serif; text-decoration:none; cursor:pointer; }
input { padding:4px; background:#ebe2cd; border:1px solid #aa9367; font:14px Georgia,serif; }
.eyebrow,.fine { font:11px Arial,sans-serif; color:#aaa18b; }
.eyebrow { border-top:3px double #ae8c4e; padding-top:5px; }
.panel { border:1px solid #776241; background:#25231c; padding:12px; margin:8px 0; }
.reviewnav { padding:8px 0; font:11px Arial,sans-serif; border-top:1px solid #5f5436; margin-top:8px; }
.cards { width:740px; table-layout:fixed; }
.cards td { padding:7px; vertical-align:top; text-align:center; border:1px solid #5f5436; background:#25231c; }
.cards img { display:block; margin:0 auto 6px; border:1px solid #8e784c; }
.cards p { font:12px Georgia,serif; }
.scene { position:relative; width:740px; height:400px; zoom:1; }
.scene img { display:block; width:740px; height:400px; border:0; }
.maplabel { position:absolute; width:152px; padding:3px; background:#25231c; border:1px solid #ae8c4e; text-align:center; font:bold 11px/14px Arial,sans-serif; color:#f0dfb6; text-decoration:none; }
.locked { color:#b3a78c; border-color:#70674e; background:#292721; }
.boss { border-color:#ecd198; color:#ffe4a6; }
.prices { width:100%; border-collapse:collapse; margin:8px 0; }
.prices th,.prices td { padding:5px; border:1px solid #5f5436; text-align:left; }
.bossinfo td { vertical-align:top; padding:5px; }
.pass { width:480px; margin:12px auto; padding:20px; background:#e2d1aa; color:#30271d; border:3px double #ae8c4e; text-align:center; }
.pass h2 { color:#47361d; font:normal 24px Georgia,serif; }
`);

const publicAvatars=content.avatars.map(({id,title,description,arrival})=>({id,title,description,arrival}));
const previewScript=`(function () {
  var avatars=${JSON.stringify(publicAvatars)}, prefix='fortune-row-content|';
  function el(id) { return document.getElementById(id); }
  function setText(node,value) { if(!node)return;while(node.firstChild)node.removeChild(node.firstChild);node.appendChild(document.createTextNode(value)); }
  function profile() { var parts=String(window.name || '').split('|'), name='You', id='drifter', i;try{if(parts[0]==='fortune-row-content'){name=decodeURIComponent(parts[1] || 'You');id=parts[2] || 'drifter';}}catch(e){}for(i=0;i<avatars.length;i++)if(avatars[i].id===id)return {name:name,avatar:avatars[i]};return {name:name,avatar:avatars[0]}; }
  function store(name,id) { window.name=prefix+encodeURIComponent(name)+'|'+id; }
  window.previewChoose=function(id) { var p=profile();store(p.name,id);window.location.href='story.html';return false; };
  if(el('nameform')) { el('playername').value=profile().name==='You'?'':profile().name;el('nameform').onsubmit=function(){var name=el('playername').value.replace(/^\\s+|\\s+$/g,'').replace(/\\s+/g,' ');if(!name || name.length>32 || /[\\u0000-\\u001f\\u007f-\\u009f\\uD800-\\uDFFF\\uFFFE\\uFFFF]/.test(name)){setText(el('notice'),'Enter a name from 1 to 32 printable characters.');return false;}store(name,'drifter');window.location.href='characters-1.html';return false;}; }
  var p=profile(), greeting=el('arrival');if(greeting)setText(greeting,p.avatar.arrival);if(el('storyname'))setText(el('storyname'),p.name);if(el('chosenportrait')){el('chosenportrait').src='../../public/portraits/players/'+p.avatar.id+'.jpg';el('chosenportrait').alt=p.avatar.title;}if(el('chosenname'))setText(el('chosenname'),p.name+' / '+p.avatar.title);
}());\n`;
await save('preview.js',previewScript);
const script='<script type="text/javascript" src="preview.js"></script>';

await save('index.html',html(content.game.title,'<p>'+escape(content.game.subtitle)+'</p><div class="panel"><h2>NEW GAME</h2><p>Arrive with $1,000. Choose your name and character. Work through five houses, earn their invitations, and make Fortune Row remember you.</p><p><a class="button" href="name.html">New Game</a></p></div><p class="fine">Offline content walkthrough. Table play and progression are described here; this preview does not run poker or change your saved game.</p>'));
await save('name.html',html('What is your name?','<div class="panel"><p id="notice">A name worth putting on the guest list.</p><form id="nameform" action="characters-1.html" method="get"><p><label for="playername">Your name:</label> <input id="playername" type="text" name="name" size="28" maxlength="32"></p><p><button type="submit">Choose your character</button></p></form></div>',script));

for(let page=0;page<2;page++) {
  const choices=content.avatars.slice(page*5,page*5+5);
  const cards='<table class="cards" cellspacing="5" cellpadding="0" summary="Choose a cosmetic player portrait"><tr>'+choices.map(a=>'<td>'+portrait(a)+'<b>'+escape(a.title)+'</b><p>'+escape(a.description)+'</p><a class="button" href="story.html" onclick="return previewChoose(\''+a.id+'\')">Choose</a></td>').join('')+'</tr></table>';
  await save('characters-'+(page+1)+'.html',html('Choose your character','<p>Five faces at a time. Your character supplies a background; the cards are yours to play.</p>'+cards+'<p><a href="characters-'+(page?1:2)+'.html">'+(page?'Previous five characters':'More characters')+'</a> &nbsp; Page '+(page+1)+' of 2</p>',script));
}
const intro=content.onboarding.introParagraphs.map((paragraph,index)=>index===0?'<p id="arrival">'+escape(content.avatars[0].arrival)+'</p>':'<p>'+escape(paragraph).replace('{name}','<span id="storyname">You</span>')+'</p>').join('');
await save('story.html',html(content.onboarding.introTitle,'<div class="panel"><table cellpadding="0" cellspacing="6" summary="Your arrival"><tr><td><img id="chosenportrait" src="../../public/portraits/players/drifter.jpg" width="72" height="90" alt="The Drifter"></td><td><b id="chosenname">You / The Drifter</b><p>$1,000 starting cash. One open door.</p></td></tr></table>'+intro+'<p><a class="button" href="map.html">'+escape(content.onboarding.continueLabel)+'</a></p></div>',script));

const mapPositions=content.presentation.mapLabelPositions;
await save('map.html',html('The invitation circuit / 1947','<p>Cash: $1,000 &nbsp; / &nbsp; Invitations earned: 0 &nbsp; / &nbsp; Las Vegas is open.</p><div class="scene"><img src="'+image(content.presentation.mapBackground)+'" width="740" height="400" alt="Las Vegas, Hollywood, Mexico City, New York and Paris on a vintage travel chart">'+content.casinos.map((c,i)=>'<'+(i?'span':'a href="'+c.id+'.html"')+' class="maplabel'+(i?' locked':'')+'" title="'+escape(c.name)+'" style="left:'+mapPositions[i][0]+'px;top:'+mapPositions[i][1]+'px">'+escape(c.city)+'<br>'+(i?'Invitation required':'OPEN')+'</'+(i?'span':'a')+'>').join('')+'</div><p class="fine">Only the first house is open at the beginning. Earned invitations include passage and a room.</p>'));

for(const casino of content.casinos) {
  const labels=[['Table 1',93,202],['Table 2',488,202],['Table 3',93,325],['Table 4',488,325],['BOSS TABLE',291,130]];
  const room='<div class="scene"><img src="'+image(casino.background)+'" width="740" height="400" alt="'+escape(casino.name)+' interior, four ordinary tables and one boss table">'+labels.map((label,index)=>'<a class="maplabel'+(index===4?' boss':'')+'" style="left:'+label[1]+'px;top:'+label[2]+'px" href="'+casino.id+'-'+casino.tables[index].id+'.html">'+label[0]+'<br>'+money(casino.entries[index])+'</a>').join('')+'</div>';
  const prices='<table class="prices" summary="Proposed table entries and cash prizes"><tr><th>Table artwork</th><th>Entry</th><th>Whole-table prize</th><th>Availability</th></tr>'+casino.entries.map((entry,index)=>'<tr><td><a href="'+casino.id+'-'+casino.tables[index].id+'.html">'+(index===4?'Boss table':'Table '+(index+1))+'</a></td><td>'+money(entry)+'</td><td>'+money(entry*5)+'</td><td>'+(index===4?'Win all four ordinary tables first':'Available when affordable')+'</td></tr>').join('')+'</table>';
  const boss='<h2 id="boss">'+escape(casino.boss.name)+' / '+escape(casino.boss.role)+'</h2><table class="bossinfo" cellspacing="0" cellpadding="0" summary="Casino boss"><tr><td>'+portrait(casino.boss,96,120)+'</td><td><p><b>'+escape(casino.boss.policy.signature)+'</b></p><p>'+escape(casino.boss.greeting)+'</p><p>Boss table: the boss, three randomly drawn regulars, and you.</p><p><a href="pass-'+casino.order+'.html">Read the boss-defeat and pass-award scene</a></p></td></tr></table>';
  const roster='<h2>THE REGULARS</h2><p>Each new ordinary table draws four of these eight players. That lineup stays until the table ends.</p><table class="cards" cellpadding="0" cellspacing="5" summary="Eight regular opponents">'+[0,4].map(start=>'<tr>'+casino.regulars.slice(start,start+4).map(person=>'<td>'+portrait(person,80,100)+'<b>'+escape(person.name)+'</b><p>'+escape(person.role)+'</p><p class="fine">'+escape(person.style)+'</p></td>').join('')+'</tr>').join('')+'</table>';
  await save(casino.id+'.html',html(casino.name+' / '+casino.city+', 1947','<p>'+escape(casino.description)+'</p>'+room+prices+boss+roster));
  const reward=casino.passReward;
  await save('pass-'+casino.order+'.html',html(casino.order===5?'Your name on Fortune Row':'An invitation earned','<p class="fine">Story scene after winning the entire boss table.</p><div class="panel"><p><b>'+escape(casino.boss.name)+':</b> '+escape(casino.boss.defeatLine)+'</p></div><div class="pass"><p>'+escape(casino.order===5?'THE FIVE HOUSES RECOGNIZE':'PERSONAL INVITATION')+'</p><h2>'+escape(reward.title)+'</h2><p>'+escape(casino.order===5?'Five houses cleared. The Row knows your name.':'Admit the bearer to '+content.casinos[casino.order].name+'.')+'</p><p>Earned. Permanent. Yours.</p></div><p>'+escape(casino.order===5?'Your campaign is complete. Cleared houses remain available for another game.':'The next casino opens on the map. Your earlier invitations and table wins remain recorded.')+'</p><p><a href="'+(casino.order===5?'cast.html':content.casinos[casino.order].id+'.html')+'">'+(casino.order===5?'Visit the cast catalog':'Preview the next house')+'</a></p>'));
}

await save('cast.html',html('The houses and their players','<p>Forty regulars, five boss characters, and ten player characters. One 1947 setting.</p><div class="panel">'+content.casinos.map(c=>'<p><a href="'+c.id+'.html">'+escape(c.name)+'</a> / '+escape(c.city)+' / Boss: '+escape(c.boss.name)+'</p>').join('')+'</div><p>'+casinoLinks+'</p><p><a href="characters-1.html">Browse the ten player characters</a></p>'));
const castMarkdown=['# Fortune Row: cast and portrait catalog','',
  'Content and artwork for [Last Seat on Fortune Row](V2-CONTENT-AND-FLOW.md).',
  'Generated from [the content definitions](../content/v2/campaign.json) by',
  '`node scripts/build-v2-content-preview.js`. The server loads these profiles for the campaign.',
  '', 'The current campaign has 25 male and 15 female regulars, four male bosses and one female boss. Each casino draws from five men and three women. Player choices include six men and four women.',
  '', '## Player characters', '', '| Character | Background | Portrait |', '| --- | --- | --- |',
  ...content.avatars.map(a=>'| '+a.title+' | '+a.description+' | ['+a.id+'.jpg](../'+a.portrait+') |'), ''];
for(const c of content.casinos) {
  castMarkdown.push('## '+c.name+' / '+c.city+', 1947','',c.description,'',
    '| Regular | Role | Playing style | Portrait |','| --- | --- | --- | --- |',
    ...c.regulars.map(p=>'| '+p.name+' | '+p.role+' | '+p.style+' | ['+p.id+'.jpg](../'+p.portrait+') |'),'',
    '**Boss: '+c.boss.name+' / '+c.boss.role+'.** '+c.boss.policy.signature+'.',
    '', '[Boss portrait](../'+c.boss.portrait+'). The authored policy brief and dialogue',
    'triggers are in the content definitions; `lib/bosses.js` implements the server policies.',
    '', 'Arrival: '+c.boss.greeting,'', 'Player wins the entire boss table: '+c.boss.defeatLine,'',
    'Reward: **'+c.passReward.title+'**.');
}
castMarkdown.push('', '## Artwork provenance', '',
  'The built-in imagegen tool supplied the original 1947 set and the individual cast refresh.',
  '[Original prompts](artwork/v2-1947-prompts.json) and [refresh prompts](artwork/cast-refresh-1947-prompts.json) record the style references and each distinct face.',
  'The refresh replaces 27 portraits and the title collage. Current portraits remain opaque',
  '160 x 200 baseline JPEGs. Superseded profiles and images have been removed;',
  'campaign and free-play tables use the current cast. Player portraits are cosmetic.',
  'PNG masters and export records remain under ignored `artifacts/cast-refresh-1947/`.', '');
await writeFile(join(root,'docs/V2-CAST.md'),castMarkdown.join('\n'),'utf8');
function cards(faces) {
  return '<table class="handcards" cellpadding="0" cellspacing="0" summary="Sample cards"><tr>'+faces.map(face=>'<td><div class="card'+(face==='back'?' back':face.red?' red':'')+'">'+(face==='back'?'<span class="backpattern">+ +<br>+ +</span>':face.rank+'<br>'+face.suit)+'</div></td>').join('')+'</tr></table>';
}
function seat(index,person) {
  const human=index===0;
  return '<div id="pspot'+index+'" class="seatspot"><div id="pquote'+index+'" class="seatquote"></div><div id="pseat'+index+'" class="'+(human?'human':'seat')+'"><div class="name"'+(human?' id="chosenname"':'')+' title="'+escape(person.name || person.title)+'">'+escape(person.name || 'You')+'</div><table class="seatinfo" cellpadding="0" cellspacing="0" summary="Portrait and chips"><tr><td class="facecell"><img'+(human?' id="chosenportrait"':'')+' class="portrait" src="'+image(person.portrait)+'" width="32" height="40" alt="'+escape(person.name || person.title)+'"></td><td><div class="stack">1,000</div><div class="badge">'+(human?'D':'chips')+'</div></td></tr></table><div class="action"></div></div><div id="pholes'+index+'" class="holes">'+cards(human?[{rank:'Q',suit:'&spades;'},{rank:'7',suit:'&diams;',red:true}]:['back','back'])+'</div></div>';
}
for(const casino of content.casinos) {
  for(const [index,table] of casino.tables.entries()) {
    const people=table.kind==='boss'?[casino.regulars[0],casino.regulars[2],casino.boss,casino.regulars[5]]:Array.from({length:4},(_,seatIndex)=>casino.regulars[(index*2+seatIndex)%8]);
    const navigation='<div class="navigation"><a href="'+casino.id+'.html">Back to '+escape(casino.city)+'</a> &nbsp; '+casino.tables.map(t=>'<a href="'+casino.id+'-'+t.id+'.html">'+escape(t.name)+'</a>').join(' &nbsp; ')+'</div>';
    const sample='<div id="tableview"><div id="perspectiveview"><div id="tableart"><img id="roomimage" src="'+image(table.background)+'" width="740" height="300" alt="'+escape(casino.city+' / '+table.name)+' empty 1947 poker table"></div>'+people.map((person,seatIndex)=>seat(seatIndex+1,person)).join('')+'<div id="pfelt"><div id="phandlabel">TABLE ART PREVIEW</div><div id="pboard">'+cards([{rank:'2',suit:'&clubs;'},{rank:'10',suit:'&hearts;',red:true},{rank:'K',suit:'&spades;'}])+'</div><div id="ppot">SAMPLE CARDS</div></div>'+seat(0,content.avatars[0])+'</div></div>';
    await save(casino.id+'-'+table.id+'.html',html(casino.city+' / '+table.name,navigation+'<p class="fine">'+escape(casino.name)+' / 1947 / Entry '+money(table.entry)+' / Prize '+money(table.prize)+'</p>'+sample+'<p><a href="'+image(table.background)+'">Open empty table artwork</a></p><p class="fine">Sample seats and cards show the original layout. This is an artwork preview.</p>',script));
  }
}
const bossCards='<table class="cards" cellspacing="5" cellpadding="0" summary="Five static boss portraits"><tr>'+content.casinos.map(c=>'<td><a href="'+c.id+'-boss.html">'+portrait(c.boss)+'</a><b>'+escape(c.boss.name)+'</b><p class="fine">'+escape(c.city)+'</p></td>').join('')+'</tr></table>';
const artworkLinks='<table class="prices" summary="Five cities and twenty-five unique table backgrounds"><tr><th>City / club</th><th>Room</th><th>Four regular tables and boss</th></tr>'+content.casinos.map(c=>'<tr><td>'+escape(c.city)+'<br>'+escape(c.name)+'</td><td><a href="'+c.id+'.html">Room</a></td><td>'+c.tables.map(t=>'<a href="'+c.id+'-'+t.id+'.html">'+(t.kind==='boss'?'Boss':t.id.replace('table-',''))+'</a>').join(' &nbsp; ')+'</td></tr>').join('')+'</table>';
await save('artwork.html',html('1947 / five cities, twenty-five tables','<p>Original noir table design and sepia portraits, carried through one international journey.</p>'+bossCards+artworkLinks+'<p><a href="map.html">View the new travel map</a> &nbsp; <a href="bosses.html">View all five full-size boss portraits</a></p>'));
const bossRows=[0,3].map(start=>'<tr>'+content.casinos.slice(start,start+3).map(c=>'<td>'+portrait(c.boss,160,200)+'<b>'+escape(c.boss.name)+'</b><p>'+escape(c.city)+' / '+escape(c.boss.role)+'</p><p><a href="'+image(c.boss.portrait)+'">Portrait JPEG</a> &nbsp; <a href="'+c.id+'-boss.html">Boss table</a></p></td>').join('')+(start===3?'<td></td>':'')+'</tr>').join('');
await save('bosses.html',html('Five house bosses / 1947','<table class="cards" cellspacing="5" cellpadding="0" summary="Five individual static bosses">'+bossRows+'</table>'));
console.log('Built 44 offline review pages, including 25 table previews and five static bosses.');
