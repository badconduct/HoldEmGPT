import { readFileSync } from 'node:fs';
export const campaignContent=JSON.parse(readFileSync(new URL('../content/v2/campaign.json',import.meta.url),'utf8'));
export const casinos=campaignContent.casinos;
export const avatars=campaignContent.avatars;
const people=new Map(casinos.flatMap(c=>[...c.regulars,c.boss]).map(p=>[p.id,{...p,title:p.role,portraitUrl:'/'+p.portrait.replace(/^public\//,'')}]));
const representatives=casinos.map(c=>({...c.boss,id:c.id+'-steward',name:c.regulars[0].name,role:'Acting house host',title:'Acting house host',portrait:c.regulars[0].portrait,portraitUrl:'/'+c.regulars[0].portrait.replace(/^public\//,''),prompt:'You are the acting house steward. The owner is absent. Discuss the current poker wager only; do not claim to know what happened to the owner.',greeting:'The owner is unavailable. I am authorized to play for the house.',defeatLine:'The house acknowledges your win.'}));
for(const p of representatives)people.set(p.id,p);
export const representativeFor=id=>representatives.find(p=>p.id===id+'-steward');
export const characterFor=id=>people.get(id);
export const casinoFor=id=>casinos.find(c=>c.id===id);
export const tableFor=(casinoId,tableId)=>casinoFor(casinoId)?.tables.find(t=>t.id===tableId);
export const assetUrl=path=>'/'+path.replace(/^public\//,'');
export const campaignAssets=new Set([
  campaignContent.presentation.titleBackground,campaignContent.presentation.mapBackground,...casinos.flatMap(c=>[c.background,...c.tables.map(t=>t.background),...c.regulars.map(p=>p.portrait),c.boss.portrait]),...avatars.map(a=>a.portrait)
].map(assetUrl));
