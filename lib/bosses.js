import { randomInt } from 'node:crypto';
import { estimateEquity } from './equity.js';
const policies={
  comptroller:{value:.62,bluff:.025,size:.5,trap:0,margin:.10},
  headliner:{value:.56,bluff:.14,size:.55,trap:.12,margin:.08},
  jetsetter:{value:.58,bluff:.08,size:.6,trap:.28,margin:.07},
  tempo:{value:.51,bluff:.18,size:.32,trap:.04,margin:.09},
  tycoon:{value:.57,bluff:.10,size:.65,trap:.12,margin:.06}
};
export function bossDecision(state,character,{random=()=>randomInt(1000000)/1000000,equity=estimateEquity(state)}={}) {
  const p=policies[character.policy.id];if(!p)throw new Error('Unknown boss policy.');
  const l=state.legal,me=state.players[state.seat],opponents=state.players.filter(p=>p.seat!==state.seat && !p.folded && !p.out);
  const anchor=state.street==='preflop'?(state.bigBlindSeat ?? state.dealer):state.dealer;
  const order=state.players.filter(p=>!p.out && !p.folded).slice().sort((a,b)=>(((a.seat-anchor+5)%5)||5)-(((b.seat-anchor+5)%5)||5));
  const late=order.findIndex(p=>p.seat===state.seat)>=Math.max(0,order.length-2);
  const recent=state.recentPlays.slice().reverse().find(p=>p.seat!==state.seat && (p.action==='raise' || p.allIn));
  const read=recent && state.observedPatterns[recent.seat];
  let bluff=p.bluff,margin=p.margin;
  if(character.policy.id==='jetsetter' && !late) {bluff*=.3;margin+=.035;}
  if(character.policy.id==='tycoon' && read?.hands>=8 && read.actions>=15) {
    if(read.calls/read.actions>.45) bluff*=.3;
    if(read.folds/read.actions>.55) bluff*=1.4;
    if(read.allInHands/read.hands>.35) margin-=.025;
  }
  if(opponents.length>1)bluff/=opponents.length;
  const roll=random(),trap=l.check && equity>.7 && roll<p.trap;
  let action='fold',amount=0;
  if(!trap && l.raise && (equity>p.value+(state.street==='preflop' && !late ? .03 : 0) || roll<bluff)) {
    action='raise';amount=Math.min(l.max,Math.max(l.min,me.wager+l.toCall+Math.round(state.pot*p.size)));
  } else if(l.check)action='check';
  else if(equity>=l.call/(state.pot+l.call || 1)+margin && (l.call<=me.stack*.5 || equity>.58))action='call';
  const actual=action==='raise' && amount===l.max?'allin':action;
  const line=actual==='allin'?'Everything is committed. Your decision.':character.dialogue[action];
  return {action,amount,memory:'Public-policy decision: '+action+' on '+state.street+'.',say:line.replace(/\{amount\}/g,(action==='raise'?amount:l.call)+' chips'),replyToSeat:null};
}
