// GPL-3.0-only. Offline authoring tool; never imported by the game server.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const content = JSON.parse(await readFile(join(root, 'content/v2/campaign.json'), 'utf8'));
const houses = content.casinos.map((c, index) => ({ index, id: c.id, name: c.name,
  short: ['Gilded Alibi', 'Marigold Star', 'Casa del Azahar', 'Lantern Exchange', 'Salon des Brumes'][index],
  city: c.city, boss: { id: c.boss.id, name: c.boss.name,
    short: ['Victor', 'Vincent', 'Celeste', 'Leon', 'Marcel'][index] } }));
assert.equal(houses.length, 5);
const categories = [
  { id: 'weapon', label: 'Weapon', prefix: 'W', variants: [
    'Pocket revolver', 'Pearl-handled letter opener', 'Brass desk ashtray', 'Silk curtain cord', 'Heavy champagne bottle'] },
  { id: 'receipt', label: 'Receipt', prefix: 'R', variants: houses.map(h => h.short + ' cashout') },
  { id: 'photo', label: 'Photograph', prefix: 'P', variants: [
    'Private-suite photograph', 'Closed-card-room photograph', 'Service-corridor photograph',
    'Hotel-balcony photograph', 'Rear-stairwell photograph'] },
  { id: 'letter', label: 'Letter', prefix: 'L', variants: [
    'Blackmail demand', 'Private meeting invitation', 'Debt-settlement letter', 'Personal warning', 'Travel instructions'] },
  { id: 'clothing', label: 'Clothing', prefix: 'C', variants: [
    'Dinner jacket', 'Single glove', 'Silk scarf', 'Felt hat', "Bellboy's uniform coat"] }
];
const motives = [
  'The victim is preparing to expose diverted circuit winnings.',
  'The victim is threatening to reveal a damaging private arrangement.',
  'The victim intends to sell records identifying people the boss protects.',
  'The victim has discovered a second set of casino accounts.',
  'The victim is about to expose how introductions are traded for private favors.'
];
const mod = n => ((n % 5) + 5) % 5;
const pad = n => String(n).padStart(3, '0');

// A balanced placeholder assignment of the 25 reusable art forms. This is an
// asset assignment code, NOT a forensic rule or completed narrative proof.
// Each distinct boss/hotel pair differs in >=4 slots, allowing an independent
// enumeration below to check one-error matching of the references themselves.
const baseline = (boss, hotel) => categories.map((_, slot) =>
  mod(boss + (slot + 1) * hotel + slot * slot));
const ref = (slot, variant) => categories[slot].prefix + (variant + 1);
const asset = (slot, variant) => ({ id: ref(slot, variant), category: categories[slot].id,
  variant: variant + 1, name: categories[slot].variants[variant] });

function buildRow(boss, hotel, falseSlot, kind) {
  const person = houses[boss].boss, place = houses[hotel];
  const staged = kind === 'staged-death';
  const pair = boss * 5 + hotel;
  const genuine = baseline(boss, hotel), shown = genuine.slice();
  const mutation = 1 + ((boss + hotel + falseSlot + (staged ? 1 : 0)) % 4);
  shown[falseSlot] = mod(genuine[falseSlot] + mutation);
  const id = (staged ? 'S' + pad(pair + 1) : 'M' + pad(pair * 5 + falseSlot + 1));
  // A real boss victim also appears in some ordinary cases. An apparently dead
  // boss is therefore not an identity-based guarantee of the staging twist.
  const bossVictim = !staged && (pair + falseSlot) % 3 === 0;
  const victim = staged ? { id: person.id, name: person.name, alive: true }
    : bossVictim ? { ...houses[(boss + 1 + hotel % 4) % 5].boss, alive: false }
      : { id: 'elias-rook', name: 'Elias Rook', alive: false };
  const accused = houses[(boss + 1 + hotel % 4) % 5].boss;
  const normalReceiptHouse = houses[genuine[1]], shownReceiptHouse = houses[shown[1]];
  const receiptTiming = staged ? 'the morning after the alleged death' : 'before the gathering';
  const recipient = staged ? { name: 'a private travel agent' } : victim;

  const exhibits = categories.map((category, slot) => {
    const falseItem = slot === falseSlot;
    let claim, correction, inspection;
    if (slot === 0) {
      claim = staged
        ? `This ${asset(slot, shown[slot]).name.toLowerCase()} was recovered at ${place.short}; it was not used in a fatal attack.`
        : `This ${asset(slot, shown[slot]).name.toLowerCase()} was used in the fatal attack at ${place.short}.`;
      correction = falseItem
        ? `The displayed object was planted as the weapon. The actual weapon was a ${asset(slot, genuine[slot]).name.toLowerCase()}.`
        : 'The recovered object and its described use/state are genuine.';
      inspection = falseItem
        ? 'Author a visible mismatch between the claimed weapon and independent scene/garment details.'
        : staged ? 'The object is a real prop; its recorded state must not falsely assert a killing.'
          : 'Author scene-compatible traces and an explicit connection that other genuine exhibits corroborate.';
    } else if (slot === 1) {
      claim = `A ${shownReceiptHouse.short} cashout identifies ${person.short} ${receiptTiming}.`;
      correction = falseItem
        ? `The house attribution on the slip was altered. The real transaction occurred at ${normalReceiptHouse.short}.`
        : `The transaction at ${normalReceiptHouse.short} is genuine; it is not automatically the crime location.`;
      inspection = falseItem
        ? 'Author a checkable seal/record discrepancy using supplied reference cards and other exhibits.'
        : staged ? 'Corroborate the date AND the recipient identity; a name alone does not prove survival.'
          : 'Supply transaction time, identifying details and its relation to the gathering without assuming impossible travel.';
    } else if (slot === 2) {
      claim = `The ${asset(slot, shown[slot]).name.toLowerCase()} depicts ${victim.name} dead at the original crime site.`;
      correction = falseItem
        ? staged ? `${person.short} is alive. This is a staged scene at ${place.short}, not a death.`
          : `The supplied image is a substitute scene; the genuine site is the ${asset(slot, genuine[slot]).name.toLowerCase()} at ${place.short}.`
        : `The photographed death scene at ${place.short} is genuine.`;
      inspection = falseItem
        ? staged ? 'Author a photographed staging discrepancy corroborated by the real escape documents and recovered prop.'
          : 'Author a location/scene inconsistency against independently supplied details, not a pixel-generation accident.'
        : 'Supply readable room identifiers, chronology and scene observations; do not print an unsupported culprit label.';
    } else if (slot === 3) {
      const writer = falseItem ? accused : person;
      claim = `The ${asset(slot, shown[slot]).name.toLowerCase()} was written by ${writer.name} for ${recipient.name}.`;
      correction = falseItem
        ? `The attribution to ${accused.short} is forged; ${person.short} arranged it.`
        : `The document and attribution to ${person.short} are genuine.`;
      inspection = falseItem
        ? 'Author an attribution inconsistency that the reader can verify from the provided handwriting/house references.'
        : staged ? 'Its contents must support a preplanned departure without requiring an optional confession.'
          : 'Supply a relationship or meeting detail that combines with other exhibits; motive alone is not conviction.';
    } else {
      const wearer = falseItem ? accused : person;
      claim = `The ${asset(slot, shown[slot]).name.toLowerCase()} connects ${wearer.name} to the ${staged ? 'escape' : 'scene'}.`;
      correction = falseItem
        ? `Its attribution to ${accused.short} as the attacker's garment is planted; ${person.short} is responsible.`
        : `The garment connection to ${person.short} is genuine.`;
      inspection = falseItem
        ? 'Author a visible alteration/attribution mismatch corroborated by scene details; no unseen laboratory result.'
        : staged ? 'Supply an identity/route connection that corroborates the later transaction.'
          : 'Supply distinctive, inspectable details that agree with the genuine scene.';
    }
    const awardHouse = houses[(slot + boss + hotel + (staged ? 1 : 0)) % 5];
    return { ...asset(slot, shown[slot]), genuineReferenceId: ref(slot, genuine[slot]),
      false: falseItem, awardCasinoId: awardHouse.id, claim, authorCorrection: correction,
      requiredAuthoring: inspection, detailedClueAuthored: false };
  });
  return { id, kind, culpritId: person.id, culprit: person.name, culpritShort: person.short,
    locationId: place.id, location: place.name, city: place.city, victim,
    actualWeapon: staged ? null : asset(0, genuine[0]),
    apparentWeapon: asset(0, shown[0]), falseCategory: categories[falseSlot].id,
    motive: staged ? 'The boss stages a death to disappear with circuit funds and frame the player.' : motives[boss],
    exhibits,
    rewardOrder: houses.map(h => ({ casinoId: h.id,
      exhibitId: exhibits.find(e => e.awardCasinoId === h.id).id,
      category: exhibits.find(e => e.awardCasinoId === h.id).category })),
    absentBossId: houses.some(h => h.boss.id === victim.id) ? victim.id : null,
    houseRepresentativeRequired: houses.some(h => h.boss.id === victim.id),
    narrativeProofValidated: false };
}

const rows = [];
for (let boss = 0; boss < 5; boss++) for (let hotel = 0; hotel < 5; hotel++) {
  for (let slot = 0; slot < 5; slot++) rows.push(buildRow(boss, hotel, slot, 'murder'));
  rows.push(buildRow(boss, hotel, 2, 'staged-death'));
}

// Coverage and declared-world checks, independent of the presentation. These
// do not certify physical evidence, witness prose or human puzzle fairness.
assert.equal(rows.length, 150);
assert.equal(new Set(rows.map(r => r.id)).size, 150);
const coverage = { bosses: {}, hotels: {}, falseCategories: {}, variants: {} };
for (const row of rows) {
  assert.equal(row.exhibits.length, 5);
  assert.equal(new Set(row.exhibits.map(e => e.category)).size, 5);
  assert.equal(row.exhibits.filter(e => e.false).length, 1);
  assert.equal(row.exhibits.find(e => e.false).category, row.falseCategory);
  assert.equal(new Set(row.exhibits.map(e => e.awardCasinoId)).size, 5);
  if (row.kind === 'murder') {
    assert.notEqual(row.victim.id, row.culpritId);
    assert.equal(row.victim.alive, false);
    assert(row.actualWeapon);
  } else {
    assert.equal(row.falseCategory, 'photo');
    assert.equal(row.victim.id, row.culpritId);
    assert.equal(row.victim.alive, true);
    assert.equal(row.actualWeapon, null);
    assert.equal(row.exhibits[0].false, false);
  }
  const observed = row.exhibits.map(e => e.id);
  const matchingPairs = [];
  for (let b = 0; b < 5; b++) for (let h = 0; h < 5; h++) {
    const expected = baseline(b, h).map((v, slot) => ref(slot, v));
    if (expected.filter((v, slot) => v !== observed[slot]).length === 1)
      matchingPairs.push([houses[b].boss.id, houses[h].id]);
  }
  assert.deepEqual(matchingPairs, [[row.culpritId, row.locationId]], 'Ambiguous abstract asset assignment ' + row.id);
  for (const [key, value] of [['bosses', row.culpritId], ['hotels', row.locationId], ['falseCategories', row.falseCategory]])
    coverage[key][value] = (coverage[key][value] || 0) + 1;
  for (const e of row.exhibits) {
    assert.equal(e.false, e.id !== e.genuineReferenceId);
    coverage.variants[e.id] = (coverage.variants[e.id] || 0) + 1;
  }
}
assert.equal(rows.filter(r => r.kind === 'murder').length, 125);
assert.equal(rows.filter(r => r.kind === 'staged-death').length, 25);
assert(Object.values(coverage.bosses).every(n => n === 30));
assert(Object.values(coverage.hotels).every(n => n === 30));
assert.equal(Object.keys(coverage.variants).length, 25);
assert.deepEqual(Object.values(coverage.falseCategories).sort((a, b) => a - b), [25, 25, 25, 25, 50]);

const report = { schemaVersion: 1, status: 'offline-design-mapping-not-runtime-cases',
  scope: 'one-bundle-for-each-boss-hotel-false-category-setup-plus-photo-false-staging',
  interpretation: 'Five exhibits per campaign, one per category, exactly one false.',
  counts: { bosses: 5, hotels: 5, categories: 5, variants: 25,
    murderSetups: 125, stagedDeathSetups: 25, total: 150 },
  validation: { coveragePassed: true, singleFalseExhibitPassed: true,
    abstractAssetPairMatchingPassed: true, narrativeProofValidated: false,
    note: 'Item references are uniquely matched against an artificial assignment code. This is NOT proof that the documents/images tell a uniquely solvable story; timestamps, comparisons and narrative exclusion rules are still unauthored.' },
  coverage, houses, categories: categories.map((c, slot) => ({ ...c,
    variants: c.variants.map((_, variant) => asset(slot, variant)) })), scenarios: rows };

const md = text => String(text).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');
const itemText = e => `${e.id} ${e.name}${e.false ? ' [FALSE]' : ''}`;
const title = r => r.kind === 'murder' ? 'Murder' : 'Staged death';
const cols = r => [r.id, title(r), r.culpritShort, `${r.location} / ${r.city}`,
  r.victim.name, r.actualWeapon ? r.actualWeapon.name : 'None: no killing',
  ...r.exhibits.map(itemText)];
const headers = ['Case', 'Event', 'Responsible boss', 'Actual hotel', 'Victim',
  'Actual weapon', ...categories.map(c => c.label)];
let markdown = `# Empty Chair: all 150 scenario assignments\n\nGenerated by scripts/build-v3-case-matrix.mjs. Author-only solutions; not deployed game content.\n\n`;
markdown += `125 murder setups (5 bosses x 5 hotels x 5 false categories) + 25 staged-death setups (5 bosses x 5 hotels, photograph false). Each row assigns five exhibits; [FALSE] marks the one false claim. This covers the high-level setups with one proposed bundle each, not every possible permutation of all 25 exhibit forms.\n\n`;
markdown += `**Validation scope:** complete coverage, exactly one false item per row and unique boss/hotel matching of abstract item references passed. These references use an artificial assignment pattern. Real clue wording, evidence comparisons and murder-versus-staging deduction remain unvalidated. Do not turn the pattern itself into a player puzzle.\n\n`;
markdown += `Object names identify reusable art forms, not the complete clue. See the accompanying JSON for each claim, correction, award location and required writing. The ordinary murder rows include false photographs too, so a false photo does not automatically mean a staged death.\n\n`;
markdown += `The [evidence flow and endings specification](V3-EVIDENCE-FLOW-AND-ENDINGS.md) defines the 25 image briefs, reveal scenes, bag and three-answer finale (responsible boss, hotel, actual weapon or staged death). Success retains cash and opens continued poker; failure forfeits this campaign's cash and makes its protagonist the next linked campaign's victim. Successor-victim cases require validated motive/description adaptations; these base rows are not completed scripts for that rule.\n\n`;
markdown += `Every character opens with a suitcase, exactly $1,000 and the same fixed letter. A failed ending ambiguously closes on those same objects, then The End and the main menu. The next-victim link is revealed later in the next campaign's case briefing, not announced in the ending. The closing suitcase does not credit the failed character's wallet.\n\n`;
markdown += `## Exhibit reference key\n\n| ID | Category | Form |\n| --- | --- | --- |\n`;
for (let slot = 0; slot < 5; slot++) for (let variant = 0; variant < 5; variant++) {
  const a = asset(slot, variant); markdown += `| ${a.id} | ${categories[slot].label} | ${a.name} |\n`;
}
for (const house of houses) {
  markdown += `\n## ${house.boss.name}\n\n| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n`;
  for (const row of rows.filter(r => r.culpritId === house.boss.id)) markdown += `| ${cols(row).map(md).join(' | ')} |\n`;
}
markdown += `\n## Interpretation and remaining work\n\n- A staged death has no actual murder weapon; its recovered prop is genuine. Only the photo's death claim is false.\n- Receipts can be from another house. Their cashout location is not automatically the crime location.\n- Exhibit awards are distributed one per casino; their source house does not identify the culprit or forgery author.\n- Boss-victim cases require a house representative at the poker table. This is not implemented in the current game.\n- [FALSE] may mean altered attribution or an inaccurate core claim rather than a physically nonexistent object.\n- Case creation must preserve its assignments through retry/save/load. Dialogue is optional and never supplies a required sixth clue.\n- The 150 rows are coverage targets, not 150 finished scripts. Complete and human-test at least one paper case before turning the whole catalog into game content.\n`;

const esc = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const options = values => values.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
const htmlRows = rows.map(r => `<tr class="scenario" data-case="${r.id}" data-boss="${esc(r.culpritId)}" data-hotel="${esc(r.locationId)}" data-kind="${esc(r.kind)}" data-false="${esc(r.falseCategory)}">${cols(r).map((cell, i) => `<td${i >= 6 && r.exhibits[i - 6].false ? ' class="false"' : ''}>${i === 0 ? `<a href="#detail-${r.id}">${esc(cell)}</a>` : esc(cell)}</td>`).join('')}</tr>`).join('\n');
const detailRows = rows.map(r => `<div class="case-detail" id="detail-${r.id}"><h3>${r.id}: ${esc(r.culpritShort)} / ${esc(r.location)}</h3><p>${esc(r.motive)}</p><ol>${r.exhibits.map(e => `<li><b>${esc(e.id + ': ' + e.name)}${e.false ? ' [FALSE]' : ''}</b><br>Claim: ${esc(e.claim)}<br>Author truth: ${esc(e.authorCorrection)}<br>Writing needed: ${esc(e.requiredAuthoring)}<br>Award after: ${esc(houses.find(h => h.id === e.awardCasinoId).name)}</li>`).join('')}</ol></div>`).join('\n');
const html = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><title>Empty Chair: 150-case design matrix</title>
<style type="text/css">body{font-family:Arial,sans-serif;background:#f4f0e6;color:#211d16;margin:16px;font-size:13px}h1{font-size:23px}p{max-width:1100px;line-height:1.5}.filters{background:#e2d6bb;padding:10px;margin:12px 0}.filters label{margin-right:12px;white-space:nowrap}table{border-collapse:collapse;width:100%;background:white}th,td{border:1px solid #bbb09a;padding:6px;vertical-align:top;text-align:left}th{background:#342f26;color:#fff}.false{background:#ffe1d9;font-weight:bold}.case-detail{border-top:1px solid #b7aa8b;margin-top:18px;padding-top:8px}.case-detail li{margin-bottom:12px;line-height:1.5}.notice{border:2px solid #866638;padding:10px;background:#fff7db}.key td{padding:4px}.key{max-width:750px}</style></head><body>
<h1>The Empty Chair: 150 scenario assignments</h1><p>Author-only draft: 125 murders + 25 staged deaths. One bundle per responsible-boss / hotel / false-category setup. Each row has one item from every evidence category and exactly one false claim.</p>
<p class="notice"><b>Checked:</b> coverage, five slots, one false item, and abstract reference matching. <b>Still needed:</b> actual clues, timestamps, evidence comparisons, story logic and human solvability review. The assignment pattern is an authoring placeholder, not the player-facing deduction system. No runtime game behavior is changed.</p>
<div class="filters"><form action="#" onsubmit="return false"><p>
<label>Boss <select id="boss" onchange="filterRows()"><option value="">All</option>${options(houses.map(h => [h.boss.id, h.boss.short]))}</select></label>
<label>Hotel <select id="hotel" onchange="filterRows()"><option value="">All</option>${options(houses.map(h => [h.id, h.short]))}</select></label>
<label>Event <select id="kind" onchange="filterRows()"><option value="">All</option><option value="murder">Murder</option><option value="staged-death">Staged death</option></select></label>
<label>False item <select id="false" onchange="filterRows()"><option value="">All</option>${options(categories.map(c => [c.id, c.label]))}</select></label>
<label>Find <input id="query" type="text" size="18" onkeyup="filterRows()"></label><input type="button" value="Reset" onclick="resetFilters()"></p><p><b id="count">150 scenarios</b></p></form></div>
<p>W = weapon, R = receipt, P = photograph, L = letter, C = clothing. A genuine receipt may be from another hotel. Staged deaths have no actual murder weapon. Dialogue is optional. <a href="#key">Reference key</a> | <a href="#details">Claims, corrections and award order</a></p>
<table summary="All scenario and exhibit assignments"><thead><tr>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody id="matrix">${htmlRows}</tbody></table>
<h2 id="key">25 exhibit forms</h2><table class="key" summary="Exhibit reference key"><tr><th>ID</th><th>Category</th><th>Form</th></tr>${categories.flatMap((c, slot) => c.variants.map((_, variant) => { const a = asset(slot, variant); return `<tr><td>${a.id}</td><td>${esc(c.label)}</td><td>${esc(a.name)}</td></tr>`; })).join('')}</table>
<h2 id="details">Per-case claims and writing requirements</h2><p>The same filters apply below. These are authoring briefs, not completed player-facing evidence.</p>${detailRows}
<script type="text/javascript">
function filterRows(){var ids=['boss','hotel','kind','false'],values=[],i,j,rows=document.getElementById('matrix').getElementsByTagName('tr'),query=document.getElementById('query').value.toLowerCase(),shown=0,ok,text;
for(i=0;i<ids.length;i++){values[i]=document.getElementById(ids[i]).value;}
for(i=0;i<rows.length;i++){ok=true;for(j=0;j<ids.length;j++){if(values[j]&&rows[i].getAttribute('data-'+ids[j])!==values[j]){ok=false;}}
text=(typeof rows[i].textContent==='string'?rows[i].textContent:rows[i].innerText).toLowerCase();if(query&&text.indexOf(query)<0){ok=false;}
rows[i].style.display=ok?'':'none';document.getElementById('detail-'+rows[i].getAttribute('data-case')).style.display=ok?'':'none';if(ok){shown++;}}
document.getElementById('count').innerHTML=shown+' of 150 scenarios';}
function resetFilters(){var ids=['boss','hotel','kind','false'],i;for(i=0;i<ids.length;i++){document.getElementById(ids[i]).selectedIndex=0;}document.getElementById('query').value='';filterRows();}
</script></body></html>`;

await mkdir(join(root, 'docs/design'), { recursive: true });
await mkdir(join(root, 'artifacts/v3-empty-chair'), { recursive: true });
await writeFile(join(root, 'docs/design/empty-chair-scenarios.json'), JSON.stringify(report, null, 2) + '\n');
await writeFile(join(root, 'docs/V3-EMPTY-CHAIR-ALL-SCENARIOS.md'), markdown);
await writeFile(join(root, 'artifacts/v3-empty-chair/case-matrix.html'), html);
console.log(JSON.stringify({ result: 'design-matrix-generated', ...report.counts,
  validation: report.validation, falseCategoryCounts: coverage.falseCategories,
  html: 'artifacts/v3-empty-chair/case-matrix.html',
  markdown: 'docs/V3-EMPTY-CHAIR-ALL-SCENARIOS.md',
  json: 'docs/design/empty-chair-scenarios.json' }, null, 2));
