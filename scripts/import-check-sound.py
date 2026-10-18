"""Development-only import of one CC0 wooden impact; uses the casino converter."""
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import wave
import zipfile

import soundfile as sf

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('casino', root / 'scripts/import-casino-audio.py')
converter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(converter)
destination = root / 'assets/audio/kenney-impact'
destination.mkdir(exist_ok=True)
digest = lambda data: hashlib.sha256(data).hexdigest()
archive_path = Path(sys.argv[1])
with zipfile.ZipFile(archive_path) as archive:
    original = archive.read('Audio/impactWood_light_000.ogg')
    license_bytes = archive.read('License.txt')
    assert b'CC0' in license_bytes and b'Kenney' in license_bytes
(destination / 'original').mkdir(exist_ok=True)
(destination / 'wav').mkdir(exist_ok=True)
source = destination / 'original/impactWood_light_000.ogg'
source.write_bytes(original)
(destination / 'License.txt').write_bytes(license_bytes)
samples, rate = sf.read(source, dtype='float64', always_2d=True)
pcm = converter.pcm22050(samples, rate)
wav_path = destination / 'wav/impactWood_light_000.wav'
with wave.open(str(wav_path), 'wb') as output:
    output.setparams((1, 2, 22050, len(pcm), 'NONE', 'not compressed'))
    output.writeframes(pcm.tobytes())
manifest = {'schemaVersion': 1, 'pack': 'Impact Sounds', 'version': '1.0',
    'creator': 'Kenney Vleugels (Kenney.nl)', 'sourceUrl': 'https://kenney.nl/assets/impact-sounds',
    'sourceArchiveSha256': digest(archive_path.read_bytes()), 'license': 'CC0-1.0',
    'licenseSha256': digest(license_bytes), 'conversion': converter.__doc__.splitlines()[0],
    'files': [{'original': 'original/' + source.name, 'originalSha256': digest(original),
        'sourceSampleRate': rate, 'sourceChannels': samples.shape[1],
        'wav': 'wav/' + wav_path.name, 'wavSha256': digest(wav_path.read_bytes()),
        'wavBytes': wav_path.stat().st_size, 'sampleRate': 22050, 'channels': 1,
        'bitsPerSample': 16, 'durationMs': round(len(pcm) * 1000 / 22050)}]}
manifest['conversion'] = 'Original Vorbis decoded; mono, low-pass resampled to 22050 Hz signed 16-bit PCM. No normalization or trimming.'
(destination / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(manifest['files'][0])
