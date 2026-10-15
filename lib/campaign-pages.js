import { campaignContent as content, casinos, casinoFor, avatars, assetUrl } from './campaign-catalog.js';
import { bossOpen, activeTable, campaignDestination } from './campaign.js';
import { playerProfile } from './player-characters.js';
export const campaignPagePaths=new Set(['/','/index.html','/name.html','/characters.html','/intro.html','/map.html','/casino.html','/result.html','/invitations.html','/help.html']);
const esc=v=>String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'$'+n.toLocaleString('en-US');
const portrait=(person,w=72,h=90)=>'<img class="camp-portrait" src="'+assetUrl(person.portrait)+'" width="'+w+'" height="'+h+'" alt="'+esc(person.name || person.title)+'">';
const link=(url,text)=>'<a href="'+esc(url)+'">'+esc(text)+'</a>';
function post(action,fields,label,disabled=false) {
  return '<form class="campaignpost" method="post" action="'+action+'"><div>'+Object.entries(fields).map(([k,v])=>'<input type="hidden" name="'+k+'" value="'+esc(v)+'">').join('')+'<button type="submit"'+(disabled?' disabled="disabled"':'')+'>'+esc(label)+'</button></div></form>';
}
function html(title,body,s) {
  const c=s.campaign;
  const toolbar='<div class="camp-toolbar">'+link('/','Main Menu')+(c?' &nbsp; '+link('/map.html','Map')+' &nbsp; '+link('/invitations.html','Invitations'):'')+(s.game || c?' &nbsp; <button type="button" id="campaignsave">Save</button>':'')+' &nbsp; '+link('/help.html','Help')+'</div>';
  const recovery=c?'<div class="camp-recovery"><label for="recoverycode">Recovery code (latest autosave):</label> <input id="recoverycode" type="text" size="36" readonly="readonly" value="'+c.recoveryCode+'"><p>Keep this private code to load your latest progress after a restart.</p></div>':'';
  return {html:'<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">\n<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title>'+esc(title)+' - Fortune Row</title><link rel="stylesheet" type="text/css" href="/style.css"><link rel="stylesheet" type="text/css" href="/campaign.css"></head><body><div id="room"><div id="masthead"><h1>'+esc(title)+'</h1></div>'+toolbar+'<div id="notice">'+(c?esc(c.profile.name)+' &nbsp; / &nbsp; Cash '+money(s.wallet.cash):'Five houses. One way to make your name.')+'</div>'+body+'<div class="panel" id="campaignsavepanel" style="display:none"><label for="snapshotcode">Snapshot saved. Keep this code:</label> <input id="snapshotcode" type="text" size="36" readonly="readonly"><p class="fine">Snapshot codes restore this point. Your recovery code keeps the latest autosave.</p></div>'+recovery+'<div id="footer">1947 &nbsp; / &nbsp; Play tokens only &nbsp; / &nbsp; '+link('/name.html','New Game')+'</div></div><script type="text/javascript" src="/campaign.js"></script></body></html>'};
}
export function campaignPage(url,s) {
  const path=url.pathname,c=s.campaign;
  if(path==='/' || path==='/index.html') {
    const resume=s.game || c?'<p class="camp-resume">'+link(campaignDestination(s),c?'Continue campaign':'Resume free-play table')+'</p>':'';
    const art='<div class="camp-title-art"><img src="'+assetUrl(content.presentation.titleBackground)+'" width="'+content.presentation.titleScene[0]+'" height="'+content.presentation.titleScene[1]+'" alt="'+esc('The five house bosses: '+casinos.map(c=>c.boss.name).join(', '))+'"></div>';
    const load=post('/api/load',{},'Load').replace('<button','<label class="fine" for="loadcode">Save or recovery code:</label><input id="loadcode" name="code" type="text" size="28" maxlength="36"> <button');
    return html(content.game.title,art+'<table class="camp-menu" cellpadding="0" cellspacing="0" summary="Start or load a game"><tr><td class="camp-menu-new"><p><a class="camp-button" href="/name.html">New Game</a></p>'+resume+'<p class="fine">Start with $1,000. Make your name.</p></td><td class="camp-menu-load"><h2>LOAD GAME</h2>'+load+'</td></tr></table><p class="camp-menu-footer fine">Las Vegas &nbsp; / &nbsp; Hollywood &nbsp; / &nbsp; Mexico City &nbsp; / &nbsp; New York &nbsp; / &nbsp; Paris<br>'+link('/freeplay.html','Original free play')+'</p>',s);
  }
  if(path==='/name.html') return html('A name for the guest list','<div class="panel"><form method="get" action="/characters.html"><p><label for="playername">Your name:</label> <input id="playername" name="name" type="text" size="28" maxlength="32" value="'+esc(c?.profile.name || 'You')+'"></p><p><button type="submit">Choose Character</button></p></form><p class="fine">A new campaign replaces this session. Keep your recovery code to return to your previous campaign.</p></div>',s);
  if(path==='/characters.html') {
    const name=playerProfile({name:url.searchParams.has('name')?url.searchParams.get('name'):'You'}).name,page=url.searchParams.get('page')==='2'?1:0;
    const choices=avatars.slice(page*5,page*5+5).map(a=>'<td>'+portrait(a)+'<b>'+esc(a.title)+'</b><p>'+esc(a.description)+'</p>'+post('/api/campaign/new',{name,portrait:a.id},'Choose')+'</td>').join('');
    return html('Choose your character','<p>'+esc(name)+' / all characters start with $1,000.</p><table class="camp-choices" cellpadding="6" cellspacing="4" summary="Five player portraits"><tr>'+choices+'</tr></table><p>'+link('/characters.html?name='+encodeURIComponent(name)+'&page='+(page?1:2),page?'Previous five characters':'More characters')+' &nbsp; Page '+(page+1)+' of 2</p>',s);
  }
  if(path==='/help.html')return html('House rules','<div class="panel"><p>Start with $1,000 cash. Choose an affordable table in Las Vegas. Every table gives you 1,000 chips and 10/20 blinds. Chip stacks and wagers are separate from your cash.</p><p>Win an entire table to receive five times its entry fee. Four ordinary table wins unlock that casino\'s boss. Win the entire boss table to earn a permanent invitation to the next house. Passage and a room are included.</p><p>Losses keep your stamps and invitations. When you cannot afford the cheapest table in your latest house, request a house stake from the map. A lost table can also be retried from its pre-entry checkpoint with a fresh shuffle.</p><p>Your recovery code loads the latest autosave. Save creates a separate snapshot code. Loading a snapshot starts a separate recovery code so your later progress stays available through the original code. Keep your codes private.</p><p>Loading an original version 1 or 2 save resumes its original free-play game.</p></div>',s);
  if(!c)return {redirect:s.game?'/table.html':'/'};
  if(path==='/intro.html') {
    const a=avatars.find(a=>a.id===c.profile.portrait),story=content.onboarding.introParagraphs.map(t=>'<p>'+esc(t.replace('{arrival}',a.arrival).replace('{name}',c.profile.name))+'</p>').join('');
    return html(content.onboarding.introTitle,'<div class="panel"><table cellpadding="4" cellspacing="0" summary="Your arrival"><tr><td>'+portrait(a)+'</td><td><b>'+esc(c.profile.name)+' / '+esc(a.title)+'</b><p>$1,000 starting cash. One open door.</p></td></tr></table>'+story+'<p><a class="camp-button" href="/map.html">'+esc(content.onboarding.continueLabel)+'</a></p></div>',s);
  }
  if(path==='/map.html') {
    const labels=casinos.map((casino,i)=>{
      const open=c.unlocked.includes(casino.id),pos=content.presentation.mapLabelPositions[i];
      return '<'+(open?'a href="/casino.html?id='+casino.id+'"':'span')+' class="camp-label'+(open?'':' camp-locked')+'" style="left:'+pos[0]+'px;top:'+pos[1]+'px" title="'+esc(casino.name)+'">'+esc(casino.city)+'<br>'+(open?'OPEN':'Invitation required')+'</'+(open?'a':'span')+'>';
    }).join('');
    const cheapest=casinoFor(c.unlocked[c.unlocked.length-1]).tables[0].entry;
    const recovery=!activeTable(s) && s.wallet.cash<cheapest?'<div class="panel"><p>The house offers a fresh stake of '+money(cheapest*4)+'. Your stamps and invitations are safe.</p>'+post('/api/campaign/stake',{},'Accept House Stake')+'</div>':'';
    return html(c.completed?'Fortune Row Champion':'The invitation circuit','<p>'+ (activeTable(s)?link('/table.html','Resume your table'):'Choose an open house.')+'</p>'+(c.completed?'<p>You have won all five houses. Every casino remains open for another game.</p>':'')+'<div class="camp-scene"><img src="'+assetUrl(content.presentation.mapBackground)+'" width="740" height="400" alt="Five-city travel chart">'+labels+'</div>'+recovery,s);
  }
  if(path==='/casino.html') {
    const casino=casinoFor(url.searchParams.get('id'));
    if(!casino || !c.unlocked.includes(casino.id))return html('Invitation required','<p>This house is not open to you yet. Win the previous boss table to earn its invitation.</p><p>'+link('/map.html','Return to Map')+'</p>',s);
    const positions=[[93,202],[488,202],[93,325],[488,325],[291,130]],cleared=c.cleared[casino.id] || [];
    const enabled=t=>!activeTable(s) && s.wallet.cash>=t.entry && (t.id!=='boss' || bossOpen(c,casino));
    const labels=casino.tables.map((t,i)=>'<div class="camp-label'+(enabled(t)?'':' camp-locked')+'" style="left:'+positions[i][0]+'px;top:'+positions[i][1]+'px">'+post('/api/campaign/buy',{casino:casino.id,table:t.id},t.name+' / '+money(t.entry),!enabled(t))+(cleared.includes(t.id)?'<span>WON</span>':t.id==='boss' && !bossOpen(c,casino)?'<span>Win four tables first</span>':s.wallet.cash<t.entry?'<span>Need more cash</span>':'')+'</div>').join('');
    const recommended=casino.tables.slice(0,4).find(t=>!cleared.includes(t.id) && s.wallet.cash>=t.entry);
    const rows=casino.tables.map(t=>'<tr><td>'+esc(t.name)+'</td><td>'+money(t.entry)+'</td><td>'+money(t.prize)+'</td><td>'+(cleared.includes(t.id)?'WON':t.id==='boss' && !bossOpen(c,casino)?'Win four tables first':s.wallet.cash<t.entry?'Need more cash':'Open')+'</td></tr>').join('');
    return html(casino.name+' / '+casino.city,'<p>'+esc(casino.description)+'</p>'+(recommended?'<p class="fine">Recommended: '+esc(recommended.name)+' / '+money(recommended.entry)+'</p>':'')+(activeTable(s)?'<p>'+link('/table.html','Finish your current table before buying another entry.')+'</p>':'')+'<div class="camp-scene"><img src="'+assetUrl(casino.background)+'" width="740" height="400" alt="Four ordinary tables and a boss table">'+labels+'</div><table class="camp-prices" summary="Table entries and prizes"><tr><th>Table</th><th>Cash entry</th><th>Whole-table prize</th><th>Progress</th></tr>'+rows+'</table><p class="fine">Every table starts with 1,000 chips and 10/20 blinds. Cash prizes are paid for winning the entire table.</p><table cellpadding="5" cellspacing="0" summary="House boss"><tr><td>'+portrait(casino.boss)+'</td><td><b>'+esc(casino.boss.name)+'</b><p>'+esc(casino.boss.greeting)+'</p></td></tr></table><p>'+link('/map.html','Return to Map')+'</p>',s);
  }
  if(path==='/result.html') {
    const result=c.lastResult;
    if(!result)return {redirect:activeTable(s)?'/table.html':'/map.html'};
    const casino=casinoFor(result.casinoId),table=casino.tables.find(t=>t.id===result.tableId),boss=table.id==='boss';
    let text='<p>'+esc(casino.name)+' / '+esc(table.name)+'</p><div class="panel"><h2>'+(result.won?'TABLE WON':'THE HOUSE TAKES THIS ONE')+'</h2><p>'+(result.won?'Cash prize '+money(result.payout)+' has been paid.':'Your entry was lost. Your previous stamps and invitations are safe.')+'</p><p>Cash now: '+money(s.wallet.cash)+'</p></div>';
    if(boss)text+='<table cellpadding="5" cellspacing="0" summary="Boss result"><tr><td>'+portrait(casino.boss,96,120)+'</td><td><b>'+esc(casino.boss.name)+'</b><p>'+esc(result.won?casino.boss.defeatLine:casino.boss.dialogue.tableWin)+'</p></td></tr></table>';
    if(result.awarded)text+='<div class="camp-pass"><h2>'+esc(casino.passReward.title)+'</h2><p>'+(casino.passAwards?'Your next house is open. Passage and a room are included.':'Five houses won. The circuit knows your name.')+'</p><p>This award is permanent.</p></div>';
    if(!result.won && c.checkpoint)text+='<p>Or restore your cash and progress from before this table. The same cast will play a freshly shuffled game.</p>'+post('/api/campaign/restart',{},'Retry from Checkpoint');
    text+='<p>'+link('/casino.html?id='+casino.id,'Return to '+casino.name)+' &nbsp; '+link('/map.html',result.awarded && casino.passAwards?'View the next destination':'Return to Map')+'</p>';
    return html(result.won && c.completed?'Fortune Row Champion':'Table result',text,s);
  }
  const invitations=casinos.filter(casino=>(c.cleared[casino.id] || []).includes('boss')).map(casino=>'<li><b>'+esc(casino.passReward.title)+'</b> / '+(casino.passAwards?link('/casino.html?id='+casino.passAwards,casinoFor(casino.passAwards).name):'Fortune Row Champion')+'</li>').join('');
  return html('Your invitations',invitations?'<ul>'+invitations+'</ul><p>Passes are permanent. Travel and rooms are included.</p>':'<p>Win the first boss table to earn your first invitation.</p>',s);
}
