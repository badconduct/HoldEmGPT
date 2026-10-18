// Derive cues only from the dealer's accepted public action ledger. Quotes,
// blinds and arbitrary player names cannot create a cue by mentioning a move.
export function moveSound(event, players) {
  const match = /^Hand [0-9]+ \/ (?:preflop|flop|turn|river): (.*)$/.exec(event);
  if (!match) return '';
  const names = players.map(p => p.name).sort((a,b) => b.length-a.length);
  const name = names.find(n => match[1].startsWith(n+' '));
  if (!name) return '';
  const action = match[1].slice(name.length+1);
  if (action === 'folds.') return 'fold';
  if (action === 'checks.') return 'check';
  const wager = /^(calls|raises to) (?:\$[0-9]+|[0-9]+ chips)( \(all-in\))?\.$/.exec(action);
  return wager ? wager[2] ? 'allin' : wager[1] === 'calls' ? 'call' : 'raise' : '';
}
