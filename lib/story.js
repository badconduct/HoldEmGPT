import { randomBytes, randomInt } from 'node:crypto';
import { casinos, avatars, assetUrl, representativeFor } from './campaign-catalog.js';
import { chooseCase, buildCase } from './story-cases.js';
import { storyCategories } from './story-catalog.js';
import { playerProfile } from './player-characters.js';
const copy=value=>structuredClone(value);
const fail=()=>{throw new Error('Invalid saved story.');};
export function newStory(options={}) {
  const assignment=chooseCase(options);
  const deliveryOrder=casinos.map(c=>c.id);
  for(let i=deliveryOrder.length-1;i>0;i--){const j=randomInt(i+1);[deliveryOrder[i],deliveryOrder[j]]=[deliveryOrder[j],deliveryOrder[i]];}
  return {version:1,id:randomBytes(16).toString('hex'),...assignment,deliveryOrder,predecessor:options.predecessor?copy(options.predecessor):null,collected:[],acknowledged:[],scene:{id:'opening',panel:0},outcome:null,submission:null,nextVictim:null,theory:{boss:'',hotel:'',weapon:'',falseCategory:'',notes:''}};
}
export const storyFor=session=>session.campaign?.story || null;
export const storyLost=session=>storyFor(session)?.outcome==='lost';
export function storyBoss(campaign,casino,{resolved=campaign.story?.outcome==='won'}={}) {
  const story=campaign.story;
  const absent=story?.victim.bossId===casino.boss.id || resolved && story && buildCase(story).solution.boss===casino.boss.id;
  return absent?representativeFor(casino.id):casino.boss;
}
export const scenePanels=id=>id==='opening'||id.startsWith('evidence:')||id==='failure'?3:2;
function pendingScene(story) {
  for(const id of ['opening','briefing',...story.collected.map(c=>'evidence:'+c),...(story.outcome?[story.outcome==='won'?'success':'failure']:[])])if(!story.acknowledged.includes(id))return id;
  return null;
}
export function storyDestination(story) {
  if(!story)return null;
  if(story.scene)return story.scene.id==='opening'?'/intro.html':'/story.html';
  if(story.outcome==='lost')return '/';
  if(!story.outcome && story.collected.length===5)return '/accuse.html';
  return null;
}
export function advanceStory(session,token) {
  const story=storyFor(session);
  if(!story)throw new Error('This campaign has no case file.');
  if(!story.scene || token!==sceneToken(story))return false;
  if(story.scene.panel+1<scenePanels(story.scene.id))story.scene.panel++;
  else {
    story.acknowledged.push(story.scene.id);
    const id=pendingScene(story);story.scene=id?{id,panel:0}:null;
  }
  return true;
}
export const sceneToken=story=>story.scene?story.id+':'+story.scene.id+':'+story.scene.panel:'';
export function awardEvidence(campaign,casinoId) {
  const story=campaign.story;
  if(!story || story.collected.includes(casinoId))return false;
  if(story.outcome)throw new Error('This case has ended.');
  if(casinos[story.collected.length]?.id!==casinoId)throw new Error('Evidence must follow the casino route.');
  story.collected.push(casinoId);
  if(!story.scene)story.scene={id:pendingScene(story),panel:0};
  return true;
}
export function collectedExhibits(story) {
  if(!story)return [];
  const file=buildCase(story);
  return story.collected.map(id=>file.exhibits.find(e=>e.awardCasino===id));
}
export function requireStoryPlay(session) {
  const story=storyFor(session);
  if(!story)return;
  if(story.outcome==='lost')throw new Error('This story has ended. Start a new character from the main menu.');
  if(story.scene)throw new Error('Finish the current story scene before entering a table.');
  if(!story.outcome && story.collected.length===5)throw new Error('Review your evidence and finish the accusation first.');
}
export function validAccusation(answer,{allowEmpty=false}={}) {
  return answer && (allowEmpty && answer.boss==='' || casinos.some(c=>c.boss.id===answer.boss)) &&
    (allowEmpty && answer.hotel==='' || casinos.some(c=>c.id===answer.hotel)) &&
    (allowEmpty && answer.weapon==='' || ['w1','w2','w3','w4','w5','none'].includes(answer.weapon));
}
export function recordTheory(session,values) {
  const story=storyFor(session);
  if(!story || story.outcome)throw new Error('A working case is required.');
  const theory={boss:values.boss || '',hotel:values.hotel || '',weapon:values.weapon || '',falseCategory:values.falseCategory || '',notes:values.notes || ''};
  if(!validAccusation(theory,{allowEmpty:true}) || theory.falseCategory && !storyCategories.some(c=>c.id===theory.falseCategory) || typeof theory.notes!=='string' || theory.notes.length>500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\uD800-\uDFFF]/.test(theory.notes))throw new Error('Enter a valid theory with notes up to 500 characters.');
  story.theory=theory;
}
export function accuse(session,answer) {
  const story=storyFor(session);
  if(!story)throw new Error('This campaign has no case file.');
  if(story.outcome)return false;
  if(story.scene || story.collected.length!==5 || !session.campaign.completed)throw new Error('Collect and inspect all five evidence deliveries first.');
  if(!validAccusation(answer))throw new Error('Choose a boss, a hotel and a weapon or staged death.');
  const solution=buildCase(story).solution;
  story.submission={boss:answer.boss,hotel:answer.hotel,weapon:answer.weapon};
  story.outcome=Object.keys(solution).every(k=>solution[k]===answer[k])?'won':'lost';
  if(story.outcome==='lost') {
    session.wallet.cash=0;
    const p=session.campaign.profile;
    story.nextVictim={name:p.name,portrait:assetUrl(avatars.find(a=>a.id===p.portrait).portrait),source:story.id};
    if(session.game)session.game.closed=true;
  }
  story.scene={id:story.outcome==='won'?'success':'failure',panel:0};return true;
}
export function successorVictim(session) {
  const story=storyFor(session);
  return story?.outcome==='lost'?copy(story.nextVictim):null;
}
export function validateStorySave(saved) {
  const story=saved.campaign.story;if(!story)return;
  if(story.version!==1 || !/^[a-f0-9]{32}$/.test(story.id) || !Array.isArray(story.collected) || !Array.isArray(story.acknowledged) || !story.victim)fail();
  if(!Array.isArray(story.deliveryOrder) || story.deliveryOrder.length!==5 || new Set(story.deliveryOrder).size!==5 || story.deliveryOrder.some(id=>!casinos.some(c=>c.id===id)))fail();
  const predecessor=story.predecessor;
  if(predecessor) {
    const a=avatars.find(a=>assetUrl(a.portrait)===predecessor.portrait);
    if(!a || !/^[a-f0-9]{32}$/.test(predecessor.source))fail();
    playerProfile({name:predecessor.name,portrait:a.id});
  }
  const expected=chooseCase({caseId:story.caseId,predecessor});
  if(JSON.stringify(story.victim)!==JSON.stringify(expected.victim))fail();
  const awards=casinos.filter(c=>saved.campaign.cleared[c.id]?.includes('boss')).map(c=>c.id);
  if(JSON.stringify(story.collected)!==JSON.stringify(awards))fail();
  const order=['opening','briefing',...story.collected.map(c=>'evidence:'+c),...(story.outcome?[story.outcome==='won'?'success':'failure']:[])];
  if(story.acknowledged.some((id,i)=>id!==order[i]) || story.acknowledged.length>order.length)fail();
  const pending=pendingScene(story);
  if(pending?(!story.scene || story.scene.id!==pending || !Number.isInteger(story.scene.panel) || story.scene.panel<0 || story.scene.panel>=scenePanels(pending)):story.scene!==null)fail();
  if(![null,'won','lost'].includes(story.outcome))fail();
  if(story.outcome) {
    if(!saved.campaign.completed || !validAccusation(story.submission))fail();
    const solution=buildCase(story).solution,won=Object.keys(solution).every(k=>solution[k]===story.submission[k]);
    if((story.outcome==='won')!==won)fail();
    if(!won) {
      const avatar=avatars.find(a=>a.id===saved.campaign.profile.portrait);
      const next={name:saved.campaign.profile.name,portrait:assetUrl(avatar.portrait),source:story.id};
      if(saved.wallet.cash!==0 || JSON.stringify(story.nextVictim)!==JSON.stringify(next))fail();
    } else if(story.nextVictim!==null)fail();
  } else if(story.submission!==null || story.nextVictim!==null)fail();
  const fake={campaign:{story:{...story,outcome:null}}};
  recordTheory(fake,story.theory);
}
