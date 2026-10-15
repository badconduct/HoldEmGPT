import { randomInt, randomBytes } from 'node:crypto';
import { characters } from './characters.js';
import { playerProfile } from './player-characters.js';
import { newDeck, evaluate, compare, handNames } from './cards.js';
export const STARTING_STACK = 1000;
export function createGame(profile,{opponents=characters,campaign=null,shuffle=true}={}) {
  const player=playerProfile(profile);
  const pool = opponents.slice();
  if(pool.length<4 || new Set(pool.map(p=>p.id)).size!==pool.length) throw new Error('A table needs four distinct opponents.');
  if(shuffle) for (let i=pool.length-1; i>0; i--) { const j=randomInt(i+1); [pool[i],pool[j]]=[pool[j],pool[i]]; }
  const g = { id: randomBytes(16).toString('hex'), hand: 0, dealer: -1, small: 10, big: 20, phase: 'waiting', board: [], history: [], result: '', actor: -1, revision: 0,
    players: [{ id: 'you', ...player, stack: STARTING_STACK, memory: [] }, ...pool.slice(0,4).map(c => ({ id: c.id, name: c.name, stack: STARTING_STACK, memory: [] }))] };
  if(campaign) g.campaign={...campaign};
  startHand(g); return g;
}
export const tokenAmount=(g,n)=>g.campaign?n+' chips':'$'+n;
const live = g => g.players.map((p,i) => !p.folded && !p.out ? i : -1).filter(i=>i>=0);
const canAct = (g,i) => !g.players[i].folded && !g.players[i].out && g.players[i].stack > 0;
export function nextSeat(g, from, predicate) { for (let d=1; d<=g.players.length; d++) { const i=(from+d+g.players.length)%g.players.length; if (predicate(g.players[i],i)) return i; } return -1; }
function log(g,text) { g.history.push('Hand ' + g.hand + ' / ' + g.phase + ': ' + text); }
function pay(g,i,amount) { const p=g.players[i], n=Math.min(amount,p.stack); p.stack-=n; p.bet+=n; p.total+=n; return n; }
export function observationsFor(g) {return g.players.map((p,i)=>({seat:i,name:p.name,...(g.observations?.[i] || {hands:0,actions:0,checks:0,calls:0,raises:0,folds:0,allIns:0,allInHands:0,aggressiveShowdowns:0,shownHighCard:0})}));}
export function startHand(g) {
  if (!['waiting','complete'].includes(g.phase)) throw new Error('Finish this hand first.');
  if (g.hand && (g.players[0].stack === 0 || g.players.filter(p=>p.stack>0).length < 2)) throw new Error('This table is finished. Start a new game.');
  g.players.forEach(p=>{ p.out=p.stack===0; p.folded=p.out; p.cards=[]; p.bet=0; p.total=0; p.lastAction=p.out?'Eliminated':''; p.actionStreet='';p.actionHand=g.hand+1; });
  g.dealer=nextSeat(g,g.dealer,p=>!p.out); g.hand++; g.deck=newDeck(); g.burn=[]; g.board=[]; g.result=''; g.revealed=[]; g.pots=[];
  if(!g.observations)g.observations=observationsFor(g).map(({seat,name,...stats})=>stats);
  g.players.forEach((p,i)=>{if(!p.out)g.observations[i].hands++;});g.aggressors=[];
  g.phase='preflop'; g.currentBet=g.big; g.minRaise=g.big; g.acted={}; g.lastFaced={}; g.error='';
  const seats=g.players.filter(p=>!p.out).length;
  g.sb=seats===2?g.dealer:nextSeat(g,g.dealer,p=>!p.out); g.bb=nextSeat(g,g.sb,p=>!p.out);
  // Deal clockwise from the button, one card at a time.
  for(let n=0;n<2;n++) { let s=g.dealer; for(let j=0;j<seats;j++) { s=nextSeat(g,s,p=>!p.out); g.players[s].cards.push(g.deck.pop()); } }
  log(g,'New shuffled deck. '+g.players[g.dealer].name+' has the button.');
  log(g,g.players[g.sb].name+' posts small blind '+tokenAmount(g,pay(g,g.sb,g.small))+'.');
  log(g,g.players[g.bb].name+' posts big blind '+tokenAmount(g,pay(g,g.bb,g.big))+'.');
  g.pending=g.players.map((p,i)=>canAct(g,i)?i:-1).filter(i=>i>=0);
  g.actor=nextSeat(g,g.bb,(p,i)=>g.pending.includes(i)); g.revision++; advance(g);
}
export function legal(g,i=g.actor) {
  if (i<0 || g.actor!==i || !canAct(g,i) || g.phase==='complete') return null;
  const p=g.players[i], call=Math.max(0,g.currentBet-p.bet), max=p.bet+p.stack;
  // Cumulative short all-ins reopen action once a full raise has been faced.
  const reopened=!g.acted[i] || g.currentBet-(g.lastFaced[i]||0)>=g.minRaise;
  const opponent=g.players.some((q,j)=>j!==i && canAct(g,j));
  return { fold:true, check:call===0, call:Math.min(call,p.stack), toCall:call, min:g.currentBet+g.minRaise, max,
    raise:opponent && reopened && max>=g.currentBet+g.minRaise, allin:max<=g.currentBet || (opponent && reopened) };
}
export function act(g,i,action,amount) {
  const l=legal(g,i); if(!l) throw new Error('It is not this seat\'s turn.');
  const p=g.players[i], before=p.bet, oldBet=g.currentBet, street=g.phase; let text;
  if(action==='fold') { p.folded=true; text='folds'; }
  else if(action==='check') { if(!l.check) throw new Error('You must call or fold.'); text='checks'; }
  else if(action==='call') { if(!l.toCall) throw new Error('Nothing to call; check.'); text='calls '+tokenAmount(g,pay(g,i,l.call)); }
  else if(action==='raise' || action==='allin') {
    if(action==='allin') { if(!l.allin) throw new Error('Betting has not reopened.'); amount=l.max; }
    else if(!l.raise || !Number.isSafeInteger(amount) || amount<l.min || amount>l.max) throw new Error('Raise-to amount must be '+tokenAmount(g,l.min)+' to '+tokenAmount(g,l.max)+'.');
    const old=g.currentBet, oldWager=p.bet;
    pay(g,i,amount-p.bet);
    if(p.bet>old) {
      const size=p.bet-old; g.currentBet=p.bet;
      if(size>=g.minRaise) { g.minRaise=size; g.acted={}; g.lastFaced={}; }
      g.pending=g.players.map((q,j)=>j!==i && canAct(g,j) && (!g.acted[j] || q.bet<g.currentBet)?j:-1).filter(j=>j>=0);
    }
    text=p.bet>old?'raises to '+tokenAmount(g,p.bet):'calls '+tokenAmount(g,amount-oldWager);
  } else throw new Error('Unknown action.');
  p.lastAction=text+(p.stack===0?' (all-in)':''); log(g,p.name+' '+p.lastAction+'.');
  p.actionStreet=street;p.actionHand=g.hand;
  if(!g.observations)g.observations=observationsFor(g).map(({seat,name,...stats})=>stats);
  const stats=g.observations[i];stats.actions++;
  if(action==='fold')stats.folds++;else if(action==='check')stats.checks++;else if(p.bet>oldBet) {stats.raises++;if(!g.aggressors)g.aggressors=[];if(!g.aggressors.includes(i))g.aggressors.push(i);}else stats.calls++;
  const allIn=p.stack===0 && action!=='fold';
  if(allIn){stats.allIns++;if(stats.lastAllInHand!==g.hand){stats.allInHands++;stats.lastAllInHand=g.hand;}}
  g.lastPlay={seat:i,name:p.name,hand:g.hand,street,action:allIn?'allin':action,requestedAction:action,paid:p.bet-before,wager:p.bet,allIn};
  g.publicPlays=(g.publicPlays || []).concat(g.lastPlay).slice(-60);
  g.acted[i]=true; g.lastFaced[i]=g.currentBet; g.pending=g.pending.filter(j=>j!==i && canAct(g,j));
  g.actor=nextSeat(g,i,(q,j)=>g.pending.includes(j)); g.revision++; advance(g);
}
function advance(g) {
  if(live(g).length===1) return finish(g,false);
  const actionable=live(g).filter(i=>canAct(g,i));
  // A sole player with chips can only match an outstanding wager; no dry side bets.
  if(actionable.length<=1) {
    const i=actionable[0];
    if(i!==undefined) g.currentBet=Math.max(0,...live(g).filter(j=>j!==i).map(j=>g.players[j].bet));
    if(i!==undefined && g.players[i].bet<g.currentBet && g.pending.includes(i)) { g.actor=i; return; }
    g.pending=[];
  }
  if(g.pending.length) return;
  if(g.phase==='river') return finish(g,true);
  g.burn.push(g.deck.pop());
  const n=g.phase==='preflop'?3:1;
  for(let i=0;i<n;i++) g.board.push(g.deck.pop());
  g.phase=g.phase==='preflop'?'flop':g.phase==='flop'?'turn':'river';
  log(g,'Board: '+g.board.join(' ')+'.');
  g.players.forEach(p=>{p.bet=0;p.lastAction=p.out?'Eliminated':p.folded?'Folded':p.stack===0?'All-in':'';p.actionStreet='';p.actionHand=g.hand;}); g.currentBet=0; g.minRaise=g.big; g.acted={}; g.lastFaced={};
  g.pending=g.players.map((p,i)=>canAct(g,i)?i:-1).filter(i=>i>=0);
  g.actor=nextSeat(g,g.dealer,(p,i)=>g.pending.includes(i)); advance(g);
}
export function settlePots(g, showdown) {
  const levels=[...new Set(g.players.map(p=>p.total).filter(n=>n>0))].sort((a,b)=>a-b);
  let prev=0; const awards=Array(g.players.length).fill(0); g.pots=[];
  for(const level of levels) {
    const contributors=g.players.map((p,i)=>p.total>=level?i:-1).filter(i=>i>=0);
    const amount=(level-prev)*contributors.length; prev=level;
    if(contributors.length===1) { awards[contributors[0]]+=amount; g.pots.push({amount,winners:contributors,refund:true}); continue; }
    const eligible=contributors.filter(i=>!g.players[i].folded);
    let winners;
    if(!showdown) winners=live(g);
    else {
      let best=null; winners=[];
      for(const i of eligible) { const score=evaluate([...g.board,...g.players[i].cards]); const c=best?compare(score,best):1; if(c>0) {best=score; winners=[i];} else if(c===0) winners.push(i); }
    }
    if(!winners.length) throw new Error('Pot has no eligible winner.');
    const each=Math.floor(amount/winners.length); winners.forEach(i=>awards[i]+=each);
    let odd=amount%winners.length, s=g.dealer;
    while(odd>0) { s=nextSeat(g,s,(p,i)=>winners.includes(i)); awards[s]++; odd--; }
    g.pots.push({amount,winners,refund:false});
  }
  awards.forEach((n,i)=>g.players[i].stack+=n);
  return awards;
}
function finish(g,showdown) {
  g.revealed=showdown?live(g):[];
  const awards=settlePots(g,showdown);
  if(showdown && g.observations)for(const i of g.revealed)if(g.aggressors?.includes(i)){g.observations[i].aggressiveShowdowns++;if(evaluate([...g.board,...g.players[i].cards])[0]===0)g.observations[i].shownHighCard++;}
  const details=g.pots.map((pot,i)=> (pot.refund?'Uncalled return':i===0?'Main pot':'Side pot')+' '+tokenAmount(g,pot.amount)+': '+pot.winners.map(j=>g.players[j].name).join(' & '));
  if(showdown) for(const i of g.revealed) log(g,g.players[i].name+' shows '+g.players[i].cards.join(' ')+' ('+handNames[evaluate([...g.board,...g.players[i].cards])[0]]+').');
  g.result=details.join('. ')+'.'; log(g,g.result);
  g.players.forEach((p,i)=>{ if(!p.stack) p.lastAction='Eliminated'; p.lastAward=awards[i]; });
  g.phase='complete'; g.actor=-1; g.pending=[]; g.revision++;
  if(!g.players[0].stack) g.result+=' Your stack is gone. Start a new table to play again.';
  else if(g.players.filter(p=>p.stack>0).length===1) g.result+=' You won the table!';
}
export function view(g) {
  return { hand:g.hand, phase:g.phase, dealer:g.dealer, sb:g.sb, bb:g.bb, actor:g.actor, board:g.board.slice(), pot:g.phase==='complete'?0:g.players.reduce((n,p)=>n+p.total,0),
    result:g.result, history:g.history.slice(-160), revision:g.revision, legal:legal(g,0), canNext:g.phase==='complete' && g.players[0].stack>0 && g.players.filter(p=>p.stack>0).length>1,
    players:g.players.map((p,i)=>({id:p.id,name:p.name,portrait:i===0?(p.portrait || 'drifter'):p.id,stack:p.stack,bet:p.bet,total:p.total,folded:p.folded,out:p.out,lastAction:p.lastAction,actionStreet:p.actionStreet || '',actionHand:p.actionHand || 0,
      cards:i===0 || g.revealed.includes(i)?p.cards.slice():p.cards.map(()=> '??')})) };
}
