// Public presentation data only. Case solutions live in story-cases.js.
export const openingLetter=['A seat has been reserved for you at The Gilded Alibi.','Bring the enclosed stake. Come alone.'];
export const storyCategories=[['weapon','Recovered weapon'],['receipt','Cashout receipt'],['photo','Scene photograph'],['letter','Written letter'],['clothing','Clothing']].map(([id,name])=>({id,name}));
const forms={
  weapon:['Pocket revolver','Pearl-handled letter opener','Brass desk ashtray','Silk curtain cord','Heavy champagne bottle'],
  receipt:['Gilded Alibi cashout','Marigold Star cashout','Casa del Azahar cashout','Lantern Exchange cashout','Salon des Brumes cashout'],
  photo:['Private suite photograph','Closed card room photograph','Service corridor photograph','Hotel balcony photograph','Rear stairwell photograph'],
  letter:['Blackmail demand','Private meeting invitation','Debt-settlement letter','Personal warning','Travel instructions'],
  clothing:['Dinner jacket','Single glove','Silk scarf','Felt hat','Bellboy uniform coat']
};
export const evidenceForms=storyCategories.flatMap(({id:category},slot)=>forms[category].map((name,i)=>({id:'wrplc'[slot]+(i+1),category,name,image:'/images/story/'+category+'-'+(i+1)+'.jpg',thumb:'/images/story/'+category+'-'+(i+1)+'-thumb.jpg'})));
export const formFor=id=>evidenceForms.find(f=>f.id===id);
export const weapons=evidenceForms.filter(f=>f.category==='weapon');
export const sceneImages={suitcase:'/images/story/suitcase.jpg',corridor:'/images/story/corridor.jpg',rook:'/images/story/rook.jpg'};
export const storyAssets=new Set([...Object.values(sceneImages),...evidenceForms.flatMap(f=>[f.image,f.thumb]),...Array.from({length:5},(_,i)=>'/images/story/arrival-'+(i+1)+'.jpg'),...Array.from({length:5},(_,i)=>['/images/story/photo-'+(i+1)+'-v2.jpg','/images/story/photo-'+(i+1)+'-v2-thumb.jpg']).flat()]);
export const caseReferences=[
  {seal:'a sunburst',signature:'V. M.',detail:'Maddox signs with a broad, square M and uses a sunburst seal.'},
  {seal:'a five-point star',signature:'V. V.',detail:'Vale joins his two V initials and uses a five-point star seal.'},
  {seal:'an orange blossom',signature:'C. V.',detail:'Varela leaves a gap between C and V and uses an orange-blossom seal.'},
  {seal:'a lantern',signature:'L. L.',detail:'Lark underlines both L initials and uses a lantern seal.'},
  {seal:'a heron',signature:'M. D.',detail:'Duvall curls the final D and uses a heron seal.'}
];
export const hotelReferences=[
  {room:'Suite 214',detail:'Suite 214 has a sunburst door plate and striped desert awnings.',mark:'sunburst door plate'},
  {room:'Card Room B',detail:'Card Room B has a star-patterned door plate and a piano alcove.',mark:'star-patterned door plate'},
  {room:'East balcony',detail:'The east balcony has an orange-blossom tile border beside its doorway.',mark:'orange-blossom tile border'},
  {room:'Service corridor 4',detail:'Service corridor 4 has a lantern-shaped door plate and a freight lift.',mark:'lantern-shaped door plate'},
  {room:'Rear stairwell',detail:'The rear stairwell has a heron door plate and a narrow frosted window.',mark:'heron door plate'}
];
export const deliveryScenes=[
  {title:'The night cashier',speaker:'Night cashier',arrival:'The last chips had been counted. At the cashier\'s window, an envelope waited beneath your receipt.',line:'Someone paid to have this kept until you won. No name. Just instructions.',reflection:'The first piece was yours. Whatever it meant, the next house might have the record to match it.'},
  {title:'A messenger after midnight',speaker:'Studio messenger',arrival:'Outside the Marigold Star, a messenger leaned against a delivery bicycle. The parcel in his hand was meant for you.',line:'The address is right. That is all I am paid to know.',reflection:'Hollywood could make anything look convincing. You kept the record, and the question of who wanted you to see it.'},
  {title:'The courtyard exchange',speaker:'House clerk',arrival:'The courtyard had emptied. A house clerk set a sealed packet on the fountain ledge without offering a handshake.',line:'This was held with the reception papers. Compare it with what you already have.',reflection:'You put it beside the earlier exhibits. A paper trail could cross an ocean more easily than a witness.'},
  {title:'The night office',speaker:'Records clerk',arrival:'The Lantern Exchange kept one office light burning. A clerk unlocked a drawer and slid its contents across the desk.',line:'A copy was requested before the original disappeared. Read the attachments too.',reflection:'One more account of that night. The trouble was deciding which account could not be true.'},
  {title:'The last delivery',speaker:'House secretary',arrival:'At the Salon des Brumes, the secretary laid a final packet beside your four earlier exhibits.',line:'That is everything the five houses retained. What you make of it is your responsibility.',reflection:'Five exhibits. Four true accounts and one false claim. You had enough to name the person, the hotel and what really happened.'}
];
