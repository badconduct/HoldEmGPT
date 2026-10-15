import { randomInt } from 'node:crypto';
import { ranks, evaluate, compare } from './cards.js';
// This function accepts a restricted public state, never the dealer's deck or other hole cards.
export function estimateEquity(state,samples=100) {
  const own=state.ownCards,board=state.board;
  const remaining=[...'cdhs'].flatMap(s=>[...ranks].map(r=>r+s)).filter(c=>!own.includes(c) && !board.includes(c));
  const opponents=state.players.filter(p=>p.seat!==state.seat && !p.folded && !p.out).length;
  let equity=0;
  for(let t=0;t<samples;t++) {
    const deck=remaining.slice(),draw=()=>deck.splice(randomInt(deck.length),1)[0];
    const community=board.slice();while(community.length<5)community.push(draw());
    const score=evaluate([...own,...community]);let ties=1,lost=false;
    for(let j=0;j<opponents;j++) {const c=compare(evaluate([draw(),draw(),...community]),score);if(c>0)lost=true;if(c===0)ties++;}
    if(!lost)equity+=1/ties;
  }
  return equity/samples;
}
