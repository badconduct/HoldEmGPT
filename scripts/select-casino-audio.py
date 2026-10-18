"""Build the five-effect gameplay pack using only Python's standard library."""
import hashlib
import argparse
import json
from pathlib import Path
import re
import shutil
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('--native-root', type=Path, help='Optional native checkout receiving the same selection and notices.')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
audio = root / 'assets/audio/kenney-casino'
selection = json.loads((root / 'assets/audio/casino-selection.json').read_text())
manifest = json.loads((audio / 'manifest.json').read_text())
known = {item['wav']: item for item in manifest['files']}
assert 1 <= len(selection['files']) <= 5
assert len({item['file'] for item in selection['files']}) == len(selection['files'])
notices = (root / 'THIRD_PARTY_NOTICES.txt').read_text().replace('\r\n', '\n').replace('\n', '\r\n').encode('ascii')
license_bytes = (audio / 'License.txt').read_bytes()
assert hashlib.sha256(license_bytes).hexdigest() == manifest['licenseSha256']
public = root / 'public/sounds'
public.mkdir(parents=True, exist_ok=True)
payload = {}
total = 0
index = ['FORTUNE ROW - GAME SOUND EFFECTS', '', 'Kenney - Casino Audio and Impact Sounds (CC0).', '']
for item in selection['files']:
    assert re.fullmatch(r'(call|raise|allin|fold|check)\.wav', item['file'])
    assert item['file'] == item['action'] + '.wav'
    pack = item.get('packRoot', 'kenney-casino')
    assert pack in ('kenney-casino', 'kenney-impact')
    source_root = root / 'assets/audio' / pack
    source_manifest = json.loads((source_root / 'manifest.json').read_text())
    expected = next(f for f in source_manifest['files'] if f['wav'] == item['source'])
    data = (source_root / item['source']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == expected['wavSha256']
    (public / item['file']).write_bytes(data)
    payload[item['file']] = data
    total += len(data)
    index.append(item['file'] + ' <- ' + Path(item['source']).name + ' / ' + item['description'])
index += ['', 'Only these five effects ship. The full library is development source material.',
          'PCM WAV: 22050 Hz, signed 16-bit, mono. Triggered by accepted poker moves.', '']
impact = root / 'assets/audio/kenney-impact'
impact_manifest = json.loads((impact / 'manifest.json').read_text())
impact_license = (impact / 'License.txt').read_bytes()
assert hashlib.sha256(impact_license).hexdigest() == impact_manifest['licenseSha256']
payload['IMPACT.TXT'] = impact_license
payload.update({'LICENSE.TXT': license_bytes, 'NOTICES.TXT': notices,
                'SOUNDS.TXT': '\r\n'.join(index).encode('ascii')})
with zipfile.ZipFile(audio / 'AUDIO.ZIP', 'w', zipfile.ZIP_DEFLATED) as archive:
    for name, data in payload.items():
        info = zipfile.ZipInfo(name, date_time=(2000, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, data)
(public / 'credits.txt').write_bytes(notices)
if args.native_root:
    native = args.native_root.resolve()
    native_audio = native / 'assets/audio/kenney-casino'
    assert (native / 'src/platform/win32/table.c').is_file(), 'Expected a native game checkout.'
    assert (native_audio / 'manifest.json').read_bytes() == (audio / 'manifest.json').read_bytes(), 'Native import must match the web audio library.'
    shutil.copyfile(root / 'assets/audio/casino-selection.json', native / 'assets/audio/casino-selection.json')
    shutil.copyfile(audio / 'AUDIO.ZIP', native_audio / 'AUDIO.ZIP')
    shutil.copyfile(root / 'THIRD_PARTY_NOTICES.txt', native / 'THIRD_PARTY_NOTICES.txt')
    shutil.copytree(impact, native / 'assets/audio/kenney-impact', dirs_exist_ok=True)
    print('Native selection, archive and notices synchronized.')
print('Selected ' + str(len(selection['files'])) + ' WAVs, ' + str(total) + ' bytes total.')
