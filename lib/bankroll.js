import { createGame, STARTING_STACK } from './game.js';
export const STARTING_CASH = 3000;
export const BUY_IN = STARTING_STACK;
export const newWallet = () => ({ cash:STARTING_CASH, wins:0 });
export function tableFinished(g) { return !!g && g.phase==='complete' && (g.players[0].stack===0 || g.players.filter(p=>p.stack>0).length===1); }
export function cashOut(g,wallet) {
  if(!tableFinished(g) || g.paid) return false;
  const payout=g.campaign?(g.players[0].stack>0?g.campaign.prize:0):g.players[0].stack;
  if(!Number.isSafeInteger(wallet.cash+payout)) throw new Error('Bankroll reached its supported limit.');
  wallet.cash+=payout; if(payout>0) wallet.wins++;
  g.paid=true; g.revision++;
  g.result+=payout>0?' Table payout $'+payout+' added to your bankroll.':' The $'+(g.campaign?.entry || BUY_IN)+' buy-in was lost.';
  return true;
}
export function buyTable(wallet,previous,profile) {
  if(previous && (!tableFinished(previous) || !previous.paid)) throw new Error('Finish this table before buying into another.');
  if(wallet.cash<BUY_IN) throw new Error('You need $1,000 to buy in. Load a save or start a new game.');
  const game=createGame(profile); wallet.cash-=BUY_IN; return game;
}
