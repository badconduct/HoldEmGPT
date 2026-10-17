// Server-only case rules. Version 1 is retained for already-issued review saves.
import { randomInt } from 'node:crypto';
import { casinos, assetUrl } from './campaign-catalog.js';
import { formFor, caseReferences, hotelReferences, sceneImages, storyCategories } from './story-catalog.js';
import * as firstDraft from './story-cases-v1.js';
import { dossiers } from './story-dossiers.js';
export const caseSetups=dossiers;
const weaponIds=['w1','w2','w3','w4','w5','none'];
const person=i=>casinos[i].boss;
const shortMark=i=>caseReferences[i].signature+' / '+caseReferences[i].seal;
const door=i=>'the '+hotelReferences[i].mark;
const method=id=>id==='none'?'a posed figure with no fatal injury':'the '+formFor(id).name.toLowerCase();
const labels={boss:shortMark,hotel:door,weapon:method};
const valueFor=(dimension,value)=>dimension==='boss'?person(value).id:dimension==='hotel'?casinos[value].id:value;
export function chooseCase({predecessor=null,caseId=null,version=2}={}) {
  if(version===1)return firstDraft.chooseCase({predecessor,caseId});
  if(version!==2)throw new Error('Unknown story version.');
  let setup;
  if(caseId)setup=dossiers.find(c=>c.id===caseId && (!predecessor || c.kind!=='staged'));
  else {
    const kind=predecessor || randomInt(5)!==0?'murder':'staged',boss=randomInt(5);
    const pool=dossiers.filter(c=>c.kind===kind && c.boss===boss);setup=pool[randomInt(pool.length)];
  }
  if(!setup)throw new Error('Unknown or incompatible story case.');
  const victimBoss=setup.victimBoss===undefined?null:person(setup.victimBoss);
  const victim=predecessor?{name:predecessor.name,portrait:predecessor.portrait,bossId:null,inherited:true}:victimBoss?{name:victimBoss.name,portrait:assetUrl(victimBoss.portrait),bossId:victimBoss.id,inherited:false}:{name:'Elias Rook',portrait:sceneImages.rook,bossId:null,inherited:false};
  return {caseId:setup.id,victim};
}
function deliveryOrders(caseId) {
  const setup=dossiers.find(c=>c.id===caseId);if(!setup)throw new Error('Unknown story case.');
  const first=setup.order,second=[first[1],first[0],first[3],first[2],first[4]];
  return [first,second].map(order=>storyCategories.map(c=>casinos[order.indexOf(c.id)].id));
}
export function deliveryOrderFor(caseId,version=2) {
  if(version===1){const order=casinos.map(c=>c.id);for(let i=4;i>0;i--){const j=randomInt(i+1);[order[i],order[j]]=[order[j],order[i]];}return order;}
  return deliveryOrders(caseId)[randomInt(2)].slice();
}
export function validDeliveryOrder(story) {
  return story.version===1 || deliveryOrders(story.caseId).some(order=>JSON.stringify(order)===JSON.stringify(story.deliveryOrder));
}
function clauseText(dimension,values,operator) {
  const ordered=values.slice().sort((a,b)=>dimension==='weapon'?weaponIds.indexOf(a)-weaponIds.indexOf(b):a-b);
  const readings=ordered.map(labels[dimension]),subject={boss:'The private-door account',hotel:'The incident doorway',weapon:'The injury or pose'}[dimension];
  return subject+(operator==='exclude'?' excludes ':' matches ')+(readings.length===1?readings[0]:readings.slice(0,-1).join(', ')+' or '+readings.at(-1))+'.';
}
export function buildCase(story) {
  if(story.version===1)return firstDraft.buildCase(story);
  const setup=dossiers.find(c=>c.id===story.caseId);if(!setup)throw new Error('Unknown story case.');
  const victim=story.victim.name,boss=person(setup.boss),hotel=casinos[setup.hotel];
  const substitute=text=>text.replaceAll('{victim}',victim);
  const exhibits=setup.records.map((record,index)=>({...formFor(setup.forms[index]),...(record.category==='photo'?{image:'/images/story/photo-'+setup.forms[index].slice(1)+'-v2.jpg',thumb:'/images/story/photo-'+setup.forms[index].slice(1)+'-v2-thumb.jpg'}:{}),awardCasino:story.deliveryOrder[index],
    description:[substitute(record.observation),record.claims.map(([key,values,operator])=>clauseText(key,values,operator)).join(' ')+' '+substitute(record.attachment)],
    predicate:Object.fromEntries(record.claims.map(([key,values,operator])=>[key+(operator==='exclude'?'Not':''),values.map(v=>valueFor(key,v))])),hintTopic:record.hint || record.category}));
  const solution={boss:boss.id,hotel:hotel.id,weapon:setup.weapon};
  const explanation=setup.kind==='staged'?boss.name+' arranged the apparent death at '+hotel.name+'. There was no murder weapon. '+setup.reconstruction:boss.name+' killed '+victim+' at '+hotel.name+' using '+method(setup.weapon)+'. '+setup.reconstruction;
  const closing=setup.kind==='staged'?boss.name+' was found alive. The retained comparisons and financial instructions exposed the scheme. The circuit withdrew the notice bearing your name.':'The complete dossier went to the investigators in '+hotel.city+'. '+boss.name+' was arrested; the forged courier instruction was withdrawn. You were no longer the convenient stranger in their account.';
  const reflections=Array.isArray(setup.reflections)?Object.fromEntries(setup.order.map((category,index)=>[category,setup.reflections[index]])):setup.reflections;
  const inheritedPapers={'last-cashout':'the reserve audit','velvet-alibi':'the studio contracts','wrong-hand':'the protection-fund copies','borrowed-coat':'the duplicate exchange accounts','last-departure':'the bank and travel letters','quiet-suite':'the disputed charity receipts'};
  const premise=story.victim.inherited?victim+' had kept '+inheritedPapers[setup.id]+' after a failed accusation. A courier notice now claims you removed those papers after the reception. It uses your name, although you have only just arrived.':substitute(setup.premise);
  return {id:setup.id,title:setup.title,kind:setup.kind,solution,falseCategory:setup.falseCategory,exhibits,premise,motive:substitute(setup.motive),explanation,closing,reflections,proof:setup.proof};
}
export function matchesExhibit(exhibit,answer) {
  return Object.entries(exhibit.predicate).every(([key,value])=>key.endsWith('Not')?!value.includes(answer[key.slice(0,-3)]):Array.isArray(value)?value.includes(answer[key]):answer[key]===value);
}
export function supportedSolutions(file,{exhibits=file.exhibits,complete=exhibits.length===5}={}) {
  const candidates=[];
  for(const c of casinos)for(const h of casinos)for(const weapon of weaponIds) {
    const answer={boss:c.boss.id,hotel:h.id,weapon},falseItems=exhibits.filter(e=>!matchesExhibit(e,answer));
    if(complete?falseItems.length===1:falseItems.length<=1)candidates.push({...answer,...(complete?{falseCategory:falseItems[0].category}:{})});
  }
  return candidates;
}
