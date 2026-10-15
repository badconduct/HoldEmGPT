import { readFileSync } from 'node:fs';
export const campaignContent=JSON.parse(readFileSync(new URL('../content/v2/campaign.json',import.meta.url),'utf8'));
export const casinos=campaignContent.casinos;
export const avatars=campaignContent.avatars;
const people=new Map(casinos.flatMap(c=>[...c.regulars,c.boss]).map(p=>[p.id,{...p,title:p.role,portraitUrl:'/'+p.portrait.replace(/^public\//,'')}]));
export const characterFor=id=>people.get(id);
export const casinoFor=id=>casinos.find(c=>c.id===id);
export const tableFor=(casinoId,tableId)=>casinoFor(casinoId)?.tables.find(t=>t.id===tableId);
export const assetUrl=path=>'/'+path.replace(/^public\//,'');
export const campaignAssets=new Set([
  campaignContent.presentation.mapBackground,...casinos.flatMap(c=>[c.background,...c.tables.map(t=>t.background),...c.regulars.map(p=>p.portrait),c.boss.portrait]),...avatars.map(a=>a.portrait)
].map(assetUrl));
