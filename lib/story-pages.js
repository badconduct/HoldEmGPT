import { casinos, casinoFor, avatars, assetUrl } from './campaign-catalog.js';
import { openingLetter, storyCategories, weapons, sceneImages, deliveryScenes, caseReferences, hotelReferences } from './story-catalog.js';
import { buildCase } from './story-cases.js';
import { collectedExhibits, sceneToken, scenePanels, storyDestination, validAccusation } from './story.js';
const esc=v=>String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const p=text=>'<p>'+esc(text)+'</p>';
const image=(src,w,h,alt)=>'<img src="'+esc(src)+'" width="'+w+'" height="'+h+'" alt="'+esc(alt)+'">';
const still=(src,alt)=>'<div class="story-still">'+image(src,740,250,alt)+'</div>';
const letter=()=>'<div class="story-letter">'+openingLetter.map(p).join('')+'</div>';
const arrival=id=>'/images/story/arrival-'+(casinos.findIndex(c=>c.id===id)+1)+'.jpg';
export const storyPagePaths=['/story.html','/evidence.html','/accuse.html','/case-review.html'];
export function storyPage(url,s,{html,post,link}) {
  const story=s.campaign?.story;
  if(!story)return {redirect:s.campaign?'/map.html':'/'};
  const path=url.pathname,profile=s.campaign.profile;
  const badge='<p class="fine">'+esc(profile.name)+' / '+esc(avatars.find(a=>a.id===profile.portrait).title)+'</p>';
  const returnTo=s.game && !s.game.paid?'/table.html':storyDestination(story) || '/map.html';
  const bagLink=()=>link('/evidence.html','Evidence Bag');
  const inspect=item=>'<table class="story-object" cellpadding="8" cellspacing="0" summary="Evidence illustration and readable record"><tr><td class="story-object-image">'+image(item.image,240,160,item.name+' illustration')+'<p class="fine">Object illustration. Read the attached record.</p></td><td><h2>'+esc(item.name)+'</h2>'+item.description.map(p).join('')+'</td></tr></table>';
  const reveal=id=>{
    const index=casinos.findIndex(c=>c.id===id),scene=deliveryScenes[index],item=collectedExhibits(story).find(e=>e.awardCasino===id);
    if(!item)return null;
    return {scene,item,index};
  };
  if(path==='/intro.html' || path==='/story.html') {
    const replay=url.searchParams.get('replay'),old=replay?reveal(replay):null;
    if(replay && !old)return {redirect:'/evidence.html'};
    const id=old?'evidence:'+replay:story.scene?.id;
    if(!id)return {redirect:storyDestination(story) || (story.outcome==='lost'?'/':'/map.html')};
    const panel=old?Math.max(0,Math.min(2,Number(url.searchParams.get('panel')) || 0)):story.scene.panel;
    let title='The Empty Chair',body='',label='Continue';
    if(id==='opening') {
      title='A seat at the beginning';body=still(sceneImages.suitcase,'An open suitcase holding cash and a folded letter');
      body+=panel===0?p('A suitcase waited on the bed. Inside were one thousand dollars and a folded letter.'):panel===1?letter():p('No signature. Enough money to get started. You closed the suitcase.');
      label=panel===0?'Read the Letter':panel===1?'Close the Suitcase':'Begin';
    } else if(id==='briefing') {
      title='The empty chair';
      body=still(sceneImages.corridor,'An empty hotel corridor after the reception');
      if(panel===0)body+='<table cellpadding="8" cellspacing="0" summary="The reported victim"><tr><td>'+image(story.victim.portrait,72,90,'Portrait of '+story.victim.name)+'</td><td><h2>'+esc(story.victim.name)+'</h2>'+p('A death had been reported after a private reception attended by the five house bosses. The papers named this guest. The houses kept playing.')+'</td></tr></table>';
      else body+=p('Your letter brought you into a circuit with something to hide. The clerk who retained the reception records warned that one of five exhibits had been substituted. Exactly one. Nobody could agree which.')+p('The reliable access summary is important: in a genuine killing, exactly one visiting host was alone with the victim during the fatal interval, 11:15-11:30 p.m. Nobody else entered. The records disagree on the visitor and the hotel. If the death was staged, identify the host who arranged it instead.')+p('Win the four ordinary tables and the boss in each house. Their records will give you four true accounts and one false claim. Compare them to identify the responsible boss, the hotel and the actual weapon. Table chatter may help you think, but every necessary fact will be in your Evidence Bag.');
      label=panel===1?'Go to the Map':'Read the Briefing';
    } else if(id.startsWith('evidence:')) {
      const current=old || reveal(id.slice(9));
      if(!current)return {redirect:'/map.html'};
      const {scene,item,index}=current;title=scene.title;
      body=panel===1?inspect(item):still(arrival(item.awardCasino),casinoFor(item.awardCasino).name+' after closing');
      if(panel===0)body+=p(scene.arrival)+'<div class="story-speech"><b>'+esc(scene.speaker)+'</b>'+p(scene.line)+'</div>';
      else if(panel===1)body+=p('Received: '+item.name+'. This exhibit is saved in your Evidence Bag.');
      else body+=p(scene.reflection)+'<p>'+link('/evidence.html?item='+item.id,'Inspect this exhibit in the bag')+'</p>';
      label=panel===0?'Open the Packet':panel===1?'Keep the Record':index===4?'Review the Complete Dossier':'Continue to the Next House';
    } else if(id==='success') {
      title=panel===0?'The account is settled':'The open circuit';
      body=still(arrival(casinos[4].id),'The Salon des Brumes after the final account');
      const file=buildCase(story);
      body+=panel===0?p(file.explanation)+p(file.motive)+p(file.closing):p('Your name was clear. Your winnings were still yours. Downstairs, the house was opening another table.')+p('Cash retained: $'+s.wallet.cash.toLocaleString('en-US')+'. All five houses remain open.');
      label=panel===0?'Continue':'Return to Open Circuit';
    } else if(id==='failure') {
      title=panel===2?'The End':'One last departure';
      body=still(panel===0?sceneImages.corridor:sceneImages.suitcase,panel===0?'An empty corridor with a light at the far end':'A suitcase with one thousand dollars and the same folded letter');
      body+=panel===0?p('The room had gone quiet. Downstairs, someone was dealing another hand.'):panel===1?p('A suitcase. One thousand dollars. A letter.')+letter():'<p class="story-end">The End.</p>';
      label=panel===2?'Continue to Main Menu':'Continue';
    }
    const controls=old?'<p>'+(panel>0?link('/story.html?replay='+replay+'&panel='+(panel-1),'Previous')+' &nbsp; ':'')+(panel<2?link('/story.html?replay='+replay+'&panel='+(panel+1),'Continue')+' &nbsp; ':'')+bagLink()+'</p>':post('/api/story/advance',{scene:sceneToken(story)},label)+(id==='failure'?'':'<p>'+bagLink()+'</p>');
    return html(title,badge+'<div class="story-page">'+body+'<div class="story-controls">'+controls+'<p class="fine">'+(old?'Replay / ':'')+'Panel '+(panel+1)+' of '+scenePanels(id)+'</p></div></div>',s);
  }
  if(path==='/evidence.html') {
    const items=collectedExhibits(story),selected=items.find(e=>e.id===url.searchParams.get('item')) || (!url.searchParams.has('item')?items[0]:null);
    let body=badge+p(items.length+' of 5 case exhibits collected. Exactly one of the completed set makes a false core claim. A real object can be falsely attributed.');
    body+='<table class="story-bag" cellpadding="5" cellspacing="0" summary="Five evidence slots"><tr><th>Category</th><th>Collected item</th><th>Inspect</th></tr>'+storyCategories.map(cat=>{
      const e=items.find(item=>item.category===cat.id);
      return '<tr><td>'+esc(cat.name)+'</td><td>'+(e?image(e.thumb,72,48,e.name)+' '+esc(e.name):'Not collected')+'</td><td>'+(e?link('/evidence.html?item='+e.id,'Inspect'):'Waiting for a house record')+'</td></tr>';
    }).join('')+'</table>';
    if(selected)body+='<div class="panel">'+inspect(selected)+'<p>Collected after '+esc(casinoFor(selected.awardCasino).name)+'. '+link('/story.html?replay='+selected.awardCasino,'Replay the evidence scene')+'</p></div>';
    body+='<div class="panel"><h2>PERSONAL EFFECTS</h2>'+p('The suitcase and its starting cash are the beginning of your story. The letter is separate from the five case exhibits; rereading it does not change your cash.')+letter()+'</div>';
    body+='<div class="panel"><h2>REFERENCE CARDS</h2>'+p('The five hosts attended the same private circuit reception. Each could have travelled to any of the five hotels. A receipt can record another house; its heading alone does not prove where the incident occurred. These reference facts are reliable.')+p('Established access reconstruction: if a murder occurred, exactly one visiting host was alone with the victim throughout the fatal interval, 11:15-11:30 p.m.; no third person entered. That visitor is responsible. A mere hotel arrival is insufficient: compare the enclosed room-access records. In a staged death, identify the host who arranged the false death.')+'<table class="camp-prices" summary="Suspect reference cards"><tr><th>Host</th><th>House</th><th>Known correspondence</th></tr>'+casinos.map((c,i)=>'<tr><td>'+esc(c.boss.name)+'</td><td>'+esc(c.name)+'</td><td>'+esc(caseReferences[i].detail)+'</td></tr>').join('')+'</table><table class="camp-prices" summary="Hotel reference cards"><tr><th>Hotel</th><th>Reception records</th></tr>'+casinos.map((c,i)=>'<tr><td>'+esc(c.name+' / '+c.city)+'</td><td>'+esc(hotelReferences[i].detail)+'</td></tr>').join('')+'</table>'+p('Weapon reference: pocket revolver; pearl-handled letter opener; brass desk ashtray; silk curtain cord; heavy champagne bottle. Use the enclosed examination findings, not the appearance of an illustration, to distinguish the actual weapon from a planted object. In a staged death the actual weapon is None.')+'</div>';
    if(!story.outcome) {
      const theory=story.theory;
      const form='<label for="theoryboss">Responsible boss</label> '+select('boss','theoryboss',casinos.map(c=>[c.boss.id,c.boss.name]),theory.boss)+'<br><label for="theoryhotel">Hotel</label> '+select('hotel','theoryhotel',casinos.map(c=>[c.id,c.name]),theory.hotel)+'<br><label for="theoryweapon">Actual weapon</label> '+select('weapon','theoryweapon',[...weapons.map(w=>[w.id,w.name]),['none','None - the death was staged']],theory.weapon)+'<br><label for="theoryfalse">Suspected false category</label> '+select('falseCategory','theoryfalse',storyCategories.map(c=>[c.id,c.name]),theory.falseCategory)+'<br><label for="theorynotes">Notes (500 characters)</label><br><textarea id="theorynotes" name="notes" rows="4" cols="65">'+esc(theory.notes)+'</textarea>';
      body+='<div class="panel"><h2>WORKING THEORY</h2>'+p('These are your notes, not confirmed facts. Saving a theory is not an accusation.')+post('/api/story/theory',{},'Save Theory').replace('<button',form+'<p><button').replace('</button>','</button></p>')+'</div>';
    }
    body+='<p>'+link(returnTo,'Return to '+(returnTo==='/'?'Main Menu':returnTo==='/table.html'?'Table':returnTo.includes('accuse')?'Accusation':returnTo.includes('story')||returnTo.includes('intro')?'Story':'Map'))+(items.length===5 && !story.outcome?' &nbsp; '+link('/accuse.html','Prepare Accusation'):'')+'</p>';
    return html('Evidence Bag',body,s);
  }
  if(path==='/accuse.html') {
    if(story.outcome)return {redirect:storyDestination(story) || '/case-review.html'};
    if(story.scene)return {redirect:storyDestination(story)};
    if(story.collected.length!==5)return html('The dossier is incomplete',p('Collect the five boss-table records before making your accusation.')+'<p>'+bagLink()+' &nbsp; '+link('/map.html','Return to Map')+'</p>',s);
    const values=Object.fromEntries(['boss','hotel','weapon'].map(k=>[k,url.searchParams.get(k) || story.theory[k] || '']));
    const review=url.searchParams.get('review')==='1' && validAccusation(values);
    let body=p('All five exhibits are collected. Select the responsible boss, the hotel and the actual weapon. If no murder occurred, select the staged-death option.')+'<p>'+bagLink()+'</p>';
    if(review) {
      body+='<div class="panel"><h2>REVIEW YOUR ACCUSATION</h2>'+p('Responsible: '+casinos.find(c=>c.boss.id===values.boss).boss.name)+p('Hotel: '+casinoFor(values.hotel).name)+p('Actual weapon: '+(values.weapon==='none'?'None - the death was staged':weapons.find(w=>w.id===values.weapon).name))+p('A wrong accusation ends this character\'s story and forfeits their cash. You may return to your evidence or save before confirming.')+post('/api/story/accuse',{...values,confirm:'yes'},'Confirm Final Accusation')+'<p>'+link('/accuse.html?'+new URLSearchParams(values),'Change Selections')+'</p></div>';
    } else {
      body+='<form method="get" action="/accuse.html"><div class="panel"><input type="hidden" name="review" value="1"><p><label for="accuseboss">Responsible boss</label><br>'+select('boss','accuseboss',casinos.map(c=>[c.boss.id,c.boss.name]),values.boss)+'</p><p><label for="accusehotel">Crime hotel</label><br>'+select('hotel','accusehotel',casinos.map(c=>[c.id,c.name]),values.hotel)+'</p><p><label for="accuseweapon">Actual weapon</label><br>'+select('weapon','accuseweapon',[...weapons.map(w=>[w.id,w.name]),['none','None - the death was staged']],values.weapon)+'</p><p><button type="submit">Review Accusation</button></p></div></form>';
    }
    return html('The final account',body,s);
  }
  if(path==='/case-review.html') {
    if(!story.outcome || story.scene)return {redirect:storyDestination(story) || '/evidence.html'};
    if(url.searchParams.get('reveal')!=='yes')return html('Closed case',p('This review reveals the complete solution and the false exhibit.')+'<p>'+link('/case-review.html?reveal=yes','Reveal Case Solution')+' &nbsp; '+link('/','Main Menu')+'</p>',s);
    const file=buildCase(story);
    return html('Closed case: '+file.title,p(file.explanation)+p(file.motive)+'<p>'+link('/evidence.html','Read the five records')+' &nbsp; '+link(story.outcome==='won'?'/map.html':'/',story.outcome==='won'?'Return to Open Circuit':'Main Menu')+'</p>',s);
  }
  return null;
}
function select(name,id,options,value) {
  return '<select name="'+name+'" id="'+id+'"><option value="">Choose...</option>'+options.map(([key,label])=>'<option value="'+esc(key)+'"'+(key===value?' selected="selected"':'')+'>'+esc(label)+'</option>').join('')+'</select>';
}
