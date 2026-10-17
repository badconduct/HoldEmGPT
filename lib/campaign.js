import { randomBytes, randomInt } from 'node:crypto';
import { createGame } from './game.js';
import { tableFinished, cashOut } from './bankroll.js';
import { playerProfile } from './player-characters.js';
import { casinos, casinoFor, tableFor, characterFor, assetUrl } from './campaign-catalog.js';
import { newStory, awardEvidence, storyBoss, storyDestination, requireStoryPlay, validateStorySave, collectedExhibits } from './story.js';
import { validateStoryTalk } from './story-talk.js';
const copy=value=>structuredClone(value);
export function newCampaign(profile,{story=true,...storyOptions}={}) {
  return {game:null,wallet:{cash:1000,wins:0},campaign:{profile:playerProfile(profile),unlocked:[casinos[0].id],cleared:{},completed:false,houseStakes:0,recoveryCode:randomBytes(18).toString('hex'),checkpoint:null,lastResult:null,...(story?{story:newStory(storyOptions)}:{})}};
}
export const bossOpen=(campaign,casino)=>casino.tables.slice(0,4).every(t=>(campaign.cleared[casino.id] || []).includes(t.id));
export const activeTable=session=>!!session.game && !tableFinished(session.game);
export function campaignDestination(session) {
  if(session.game && (!session.campaign || activeTable(session))) return '/table.html';
  const destination=storyDestination(session.campaign?.story);if(destination)return destination;
  return session.campaign?'/map.html':'/';
}
function progress(c) {return copy({unlocked:c.unlocked,cleared:c.cleared,completed:c.completed,houseStakes:c.houseStakes});}
function requireCampaign(session) {if(!session.campaign) throw new Error('Start a campaign first.');return session.campaign;}
export function enterTable(session,casinoId,tableId,{lineup=null}={}) {
  const c=requireCampaign(session), casino=casinoFor(casinoId), table=tableFor(casinoId,tableId);
  requireStoryPlay(session);
  if(!casino || !table || !c.unlocked.includes(casinoId)) throw new Error('That casino is locked or unknown.');
  if(tableId==='boss' && !bossOpen(c,casino)) throw new Error('Win all four ordinary tables to unlock this boss.');
  if(activeTable(session)) throw new Error('Finish your current table first.');
  if(session.wallet.cash<table.entry) throw new Error('You cannot afford this entry. Try a cheaper table or request a house stake.');
  const storyResolvedAtEntry=c.story?.outcome==='won';
  const checkpoint={casinoId,tableId,wallet:copy(session.wallet),progress:progress(c),...(c.story?{storyResolvedAtEntry}:{})};
  let opponents;
  if(lineup) opponents=lineup.map(characterFor);
  else {
    const pool=casino.regulars.slice();
    for(let i=pool.length-1;i>0;i--) {const j=randomInt(i+1);[pool[i],pool[j]]=[pool[j],pool[i]];}
    opponents=tableId==='boss'?[...pool.filter(p=>p.portrait!==storyBoss(c,casino).portrait).slice(0,3),storyBoss(c,casino)]:pool.slice(0,4);
  }
  const game=createGame(c.profile,{opponents,shuffle:!lineup,campaign:{casinoId,tableId,entry:table.entry,prize:table.prize,background:assetUrl(table.background),settled:false,hostId:storyBoss(c,casino).id,...(c.story?{storyResolvedAtEntry}:{})}});
  if(c.story && !c.story.outcome)game.storyTalk={version:2,seenHand:0,count:0,lastHand:-10,plan:null,recent:[],log:[],categories:collectedExhibits(c.story).map(e=>e.category)};
  checkpoint.lineup=game.players.slice(1).map(p=>p.id);
  if(session.game) session.game.closed=true;
  session.wallet.cash-=table.entry;session.game=game;c.checkpoint=checkpoint;c.lastResult=null;
  return game;
}
export function settleCampaign(session) {
  const g=session.game,c=session.campaign;
  if(!c || !g?.campaign || g.campaign.settled || !tableFinished(g)) return false;
  cashOut(g,session.wallet);
  const {casinoId,tableId,prize}=g.campaign, casino=casinoFor(casinoId), won=g.players[0].stack>0;
  let awarded=false;
  if(won) {
    const cleared=c.cleared[casinoId] || (c.cleared[casinoId]=[]);
    if(!cleared.includes(tableId)) {cleared.push(tableId);awarded=tableId==='boss';}
    if(tableId==='boss') {
      if(awarded)awardEvidence(c,casinoId);
      if(casino.passAwards && !c.unlocked.includes(casino.passAwards)) c.unlocked.push(casino.passAwards);
      if(!casino.passAwards) c.completed=true;
    }
  }
  c.lastResult={gameId:g.id,casinoId,tableId,won,payout:won?prize:0,awarded};
  g.campaign.settled=true;return true;
}
export function houseStake(session) {
  const c=requireCampaign(session);
  requireStoryPlay(session);
  if(activeTable(session)) throw new Error('House stakes are available between tables.');
  const cheapest=casinoFor(c.unlocked[c.unlocked.length-1]).tables[0].entry;
  if(session.wallet.cash>=cheapest) throw new Error('You already have enough cash for the cheapest table.');
  const grant=cheapest*4-session.wallet.cash;
  if(!Number.isSafeInteger(c.houseStakes+grant)) throw new Error('House-stake accounting reached its supported limit.');
  session.wallet.cash+=grant;c.houseStakes+=grant;
}
export function retryTable(session) {
  const c=requireCampaign(session), point=c.checkpoint;
  requireStoryPlay(session);
  if(!point || activeTable(session) || !c.lastResult || c.lastResult.won) throw new Error('A checkpoint retry is available after losing a table.');
  if(session.game) session.game.closed=true;
  session.game=null;session.wallet=copy(point.wallet);Object.assign(c,copy(point.progress));
  return enterTable(session,point.casinoId,point.tableId,{lineup:point.lineup});
}
function validateProgress(c) {
  if(!Array.isArray(c.unlocked) || c.unlocked.length<1 || c.unlocked.length>5 || c.unlocked.some((id,i)=>id!==casinos[i].id)) throw new Error('Invalid saved invitations.');
  if(!c.cleared || typeof c.cleared!=='object' || Array.isArray(c.cleared) || !Number.isSafeInteger(c.houseStakes) || c.houseStakes<0 || typeof c.completed!=='boolean') throw new Error('Invalid saved progression.');
  for(const [id,cleared] of Object.entries(c.cleared)) {
    const casino=casinoFor(id);
    if(!casino || !c.unlocked.includes(id) || !Array.isArray(cleared) || new Set(cleared).size!==cleared.length || cleared.some(t=>!casino.tables.some(q=>q.id===t)) || (cleared.includes('boss') && !bossOpen(c,casino))) throw new Error('Invalid saved table stamps.');
  }
  for(const id of c.unlocked.slice(1)) if(!(c.cleared[casinos[casinos.findIndex(q=>q.id===id)-1].id] || []).includes('boss')) throw new Error('Invalid saved pass chain.');
  if(c.completed!==!!c.cleared[casinos[4].id]?.includes('boss')) throw new Error('Invalid saved completion.');
}
export function validateCampaignSave(saved) {
  const c=saved.campaign,g=saved.game;
  if(!c || !/^[a-f0-9]{36}$/.test(c.recoveryCode)) throw new Error('Invalid campaign save.');
  playerProfile(c.profile);validateProgress(c);
  const walletOK=w=>w && Number.isSafeInteger(w.cash) && w.cash>=0 && Number.isSafeInteger(w.wins) && w.wins>=0;
  if(!walletOK(saved.wallet)) throw new Error('Invalid saved bankroll.');
  if(c.checkpoint) {
    const p=c.checkpoint,casino=casinoFor(p.casinoId);
    validateProgress(p.progress);
    if(c.story && (typeof p.storyResolvedAtEntry!=='boolean' || p.storyResolvedAtEntry && c.story.outcome!=='won'))throw new Error('Invalid saved checkpoint story stage.');
    const boss=p.tableId==='boss',host=casino?storyBoss(c,casino,{resolved:!!p.storyResolvedAtEntry}):null;
    if(!walletOK(p.wallet) || !tableFor(p.casinoId,p.tableId) || !p.progress.unlocked.includes(p.casinoId) || !Array.isArray(p.lineup) || p.lineup.length!==4 || new Set(p.lineup).size!==4 || p.lineup.some(id=>!casino.regulars.some(n=>n.id===id) && !(boss && id===host.id)) || (boss && (!p.lineup.includes(host.id) || !bossOpen(p.progress,casino)))) throw new Error('Invalid saved checkpoint.');
  }
  if(g) {
    const t=tableFor(g.campaign?.casinoId,g.campaign?.tableId),casino=casinoFor(g.campaign?.casinoId);
    if(!t || !c.unlocked.includes(casino.id) || g.campaign.entry!==t.entry || g.campaign.prize!==t.prize || g.campaign.background!==assetUrl(t.background) || !Array.isArray(g.players) || g.players.length!==5) throw new Error('Invalid campaign table.');
    if(c.story && (typeof g.campaign.storyResolvedAtEntry!=='boolean' || g.campaign.storyResolvedAtEntry && c.story.outcome!=='won' || c.story.outcome==='won' && !g.campaign.storyResolvedAtEntry && !g.campaign.settled))throw new Error('Invalid saved table story stage.');
    const ids=g.players.slice(1).map(p=>p.id),boss=g.campaign.tableId==='boss',host=storyBoss(c,casino,{resolved:!!g.campaign.storyResolvedAtEntry});
    if(g.campaign.hostId && g.campaign.hostId!==host.id)throw new Error('Invalid saved host.');
    if(new Set(ids).size!==4 || ids.some(id=>!casino.regulars.some(p=>p.id===id) && !(boss && id===host.id)) || (boss && (!ids.includes(host.id) || !bossOpen(c,casino)))) throw new Error('Invalid saved cast.');
    if(g.players[0].name!==c.profile.name || g.players[0].portrait!==c.profile.portrait) throw new Error('Invalid saved identity.');
    if(typeof g.campaign.settled!=='boolean' || !!g.paid!==g.campaign.settled || (g.campaign.settled && !tableFinished(g))) throw new Error('Invalid saved settlement.');
  }
  if(c.lastResult) {
    const r=c.lastResult,t=tableFor(r.casinoId,r.tableId);
    if(!t || !g || !g.campaign.settled || r.gameId!==g.id || r.casinoId!==g.campaign.casinoId || r.tableId!==g.campaign.tableId || typeof r.won!=='boolean' || typeof r.awarded!=='boolean' || r.payout!==(r.won?t.prize:0) || (r.won && !(c.cleared[r.casinoId] || []).includes(r.tableId))) throw new Error('Invalid saved result.');
  } else if(g?.campaign.settled) throw new Error('Missing saved table result.');
  validateStorySave(saved);validateStoryTalk(g,c.story);return saved;
}
