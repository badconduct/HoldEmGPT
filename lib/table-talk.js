import { characterFor } from './campaign-catalog.js';
import { tokenAmount } from './game.js';
// Speech is public flavor, not a reliable signal about private hand strength.
const voices={
  rail:{check:'No need to rush the train.',fold:'That fare is too steep for me.',call:'I will pay the fare.',raise:'The price of passage just went up.',allin:'The whole venture is on the line.'},
  ruby:{check:'A quiet bar before the next chorus.',fold:'I will sit this number out.',call:'I can keep up with that tempo.',raise:'Let us turn up the music.',allin:'One last grand finale.'},
  dusty:{check:'No digging fee? I will take a look.',fold:'That trail costs more than I care to spend.',call:'I will follow that trail a little farther.',raise:'Time to put a little more in the ground.',allin:'Every last dollar in the poke.'},
  ada:{check:'No additional expense. Proceed.',fold:'That price does not suit my ledger.',call:'I will meet the posted price.',raise:'The figures have changed. Your decision.',allin:'My entire balance is committed.'},
  ace:{check:'A pause can be part of the act.',fold:'I will leave this act to you.',call:'Let us see where this act goes.',raise:'A little more suspense for the audience.',allin:'The curtain is up. Everything is committed.'},
  nell:{check:'Nothing new for the headline yet.',fold:'I will watch this story from the sidelines.',call:'I will stay for the next chapter.',raise:'Now there is a development worth watching.',allin:'The entire edition rides on this.'},
  jack:{check:'Your move.',fold:'I am stepping aside.',call:'I will meet that.',raise:'The price is higher now.',allin:'Everything. Your decision.'},
  pearl:{check:'A little patience costs nothing.',fold:'I will decline at that price.',call:'Very well. I will join you.',raise:'Shall we make this more interesting?',allin:'I have committed the entire account.'}
};
export const victoryLines={rail:'A profitable journey.',ruby:'That deserves an encore.',dusty:'Found a little gold after all.',ada:'Profit recorded. Account settled.',ace:'And that concludes the act.',nell:'There is my headline.',jack:'I will take that pot.',pearl:'A most agreeable conclusion.'};
export function fallbackQuote(g,i,action) {
  const voice=voices[g.players[i].id] || voices.jack;
  const previous=(g.dialogue || []).slice(-1)[0];
  const stats=g.observations?.[previous?.seat];
  if(previous && previous.seat!==i && previous.action==='allin') {
    if(stats?.allInHands>=2) return action==='fold'?'Another entire stack? I am sitting this one out.':'The whole stack again? I will judge the price, not the speech.';
    if(action==='call') return 'The whole stack? I will meet your wager.';
    if(action==='fold') return 'The whole stack? I will leave that contest to you.';
  }
  return voice[action] || voice.check;
}
export function safeQuote(text) {
  if(typeof text!=='string') return '';
  text=text.trim();
  if(!text || text.length>140 || /[\u0000-\u001f\u007f-\u009f\uD800-\uDFFF\uFFFE\uFFFF]/.test(text)) return '';
  // Reject overt card/strategy disclosures. This is conservative, not a semantic proof.
  if(/\b(?:[2-9TJQKA][cdhs]|aces?|kings?|queens?|jacks?|tens?|nines?|eights?|sevens?|sixes?|fives?|fours?|threes?|twos?|deuces?|hearts?|diamonds?|spades?|clubs?|flush|straight|full house|nuts)\b/i.test(text)) return '';
  if(/\b(?:I (?:have|hold|drew|flopped)|my (?:cards|hole|pair|hand is|strategy|plan)|I(?: am|'m) bluffing)\b/i.test(text)) return '';
  return text;
}
export function publishQuote(g,i,d) {
  const action=g.lastPlay?.seat===i?g.lastPlay.action:d.action;
  const text=safeQuote(d.say) || fallbackQuote(g,i,action);
  const target=Number.isInteger(d.replyToSeat) && d.replyToSeat!==i && g.players[d.replyToSeat] && (g.dialogue || []).some(q=>q.seat===d.replyToSeat)?d.replyToSeat:null;
  const quote={id:(g.talkSequence || 0)+1,seat:i,name:g.players[i].name,portrait:g.players[i].id,hand:g.hand,street:g.lastPlay?.street || g.phase,action,text,replyToSeat:target,kind:'move'};
  g.talkSequence=quote.id;g.dialogue=(g.dialogue || []).concat(quote).slice(-20);g.players[i].lastQuote=quote;
  g.history.push('Hand '+quote.hand+' / '+quote.street+': '+quote.name+' says "'+text+'".');
  g.revision++;publishWins(g);return quote;
}
export function publishWins(g) {
  if(g.phase!=='complete' || g.winTalkHand===g.hand || !g.pots?.length)return;
  g.winTalkHand=g.hand;
  const winners=[...new Set(g.pots.filter(p=>!p.refund).flatMap(p=>p.winners))];
  for(const i of winners) {
    const p=g.players[i], returned=g.pots.filter(pot=>pot.refund && pot.winners.includes(i)).reduce((n,pot)=>n+pot.amount,0), won=(p.lastAward || 0)-returned;
    if(won<=0)continue;
    const line= i===0?'The pot is yours.':(characterFor(p.id)?.dialogue?.handWin || victoryLines[p.id] || 'The pot comes my way.');
    const text=line+' Collected '+tokenAmount(g,won)+'.';
    const quote={id:(g.talkSequence || 0)+1,seat:i,name:p.name,portrait:i===0?'players/'+(p.portrait || 'drifter'):p.id,hand:g.hand,street:'result',action:'win',text,replyToSeat:null,kind:'result',amount:won};
    g.talkSequence=quote.id;g.dialogue=(g.dialogue || []).concat(quote).slice(-20);p.lastQuote=quote;
    g.history.push('Hand '+g.hand+' / result: '+p.name+' says "'+text+'".');g.revision++;
  }
}
export function latestQuotes(g) {return g.players.map((p,i)=>p.lastQuote?{...p.lastQuote,seat:i}:null).filter(Boolean);}
