import { avatars } from './campaign-catalog.js';
// Player avatars are cosmetic; they never change the rules or reveal a playing style.
export const playerCharacters = avatars.map(({id,title})=>({id,title}));
export function playerProfile({name='You',portrait='drifter'}={}) {
  if(typeof name!=='string' || /[\u0000-\u001f\u007f-\u009f\uD800-\uDFFF\uFFFE\uFFFF]/.test(name)) throw new Error('Enter a name using printable characters.');
  name=name.trim().replace(/\s+/g,' ');
  if(!name || name.length>32) throw new Error('Enter a name from 1 to 32 characters.');
  if(!playerCharacters.some(c=>c.id===portrait)) throw new Error('Choose one of the player characters.');
  return {name,portrait};
}
