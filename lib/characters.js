import { casinos, assetUrl } from './campaign-catalog.js';
// Free play shares the current Las Vegas roster with the campaign.
export const characters=casinos[0].regulars.map(character=>({...character,title:character.role,portraitUrl:assetUrl(character.portrait)}));
