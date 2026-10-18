"""Import Kenney Casino Audio 1.1 and prepare legacy-friendly PCM copies.

Development only: soundfile==0.13.1, numpy==2.3.3. No runtime dependency.
Usage: python scripts/import-casino-audio.py downloaded-pack.zip
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import wave
import zipfile

import numpy as np
import soundfile as sf

SOURCE = 'https://kenney.nl/assets/casino-audio'
DOWNLOAD = 'https://kenney.nl/media/pages/assets/casino-audio/2472606a04-1721639069/kenney_casino-audio.zip'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def pcm22050(samples, rate):
    mono = samples.mean(axis=1)
    if rate != 22050:
        # Low-pass before downsampling, retaining the transient and avoiding aliasing.
        half = 48
        cutoff = min(10000 / rate, .45)
        index = np.arange(-half, half + 1)
        kernel = 2 * cutoff * np.sinc(2 * cutoff * index) * np.hanning(len(index))
        kernel /= kernel.sum()
        mono = np.convolve(mono, kernel, mode='same')
        output_count = max(1, round(len(samples) * 22050 / rate))
        mono = np.interp(np.arange(output_count) * rate / 22050, np.arange(len(mono)), mono)
    # Preserve the recording's level; do not normalize every small clink to full volume.
    return np.rint(np.clip(mono, -1, 32767 / 32768) * 32768).astype('<i2')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'assets/audio/kenney-casino')
    args = parser.parse_args()
    if args.output.exists():
        raise SystemExit('Choose a fresh import directory; existing audio is preserved.')
    original = args.output / 'original'
    wav_dir = args.output / 'wav'
    original.mkdir(parents=True)
    wav_dir.mkdir()
    manifest = {'schemaVersion': 1, 'pack': 'Casino Audio', 'version': '1.1',
        'creator': 'Kenney Vleugels (Kenney.nl)', 'sourceUrl': SOURCE, 'downloadUrl': DOWNLOAD,
        'sourceArchiveSha256': digest(args.archive.read_bytes()), 'license': 'CC0-1.0',
        'licenseUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
        'licenseFile': 'License.txt', 'attributionRequired': False,
        'credit': 'Casino sound effects: Kenney - Casino Audio (CC0 1.0 Universal).',
        'conversion': 'Original Vorbis decoded, stereo averaged to mono, low-pass filtered before resampling, quantized to signed 16-bit PCM at 22050 Hz. No loudness normalization or trimming.',
        'tools': {'pythonSoundfile': sf.__version__, 'libsndfile': sf.__libsndfile_version__, 'numpy': np.__version__},
        'playbackIntegrated': False, 'files': []}
    with zipfile.ZipFile(args.archive) as archive:
        assert archive.testzip() is None
        license_bytes = archive.read('License.txt')
        assert b'CC0' in license_bytes and b'Kenney' in license_bytes
        (args.output / 'License.txt').write_bytes(license_bytes)
        manifest['licenseSha256'] = digest(license_bytes)
        entries = sorted(n for n in archive.namelist() if n.startswith('Audio/') and n.endswith('.ogg'))
        assert len(entries) == 54
        for entry in entries:
            parts = PurePosixPath(entry).parts
            assert len(parts) == 2 and re.fullmatch(r'[a-z0-9-]+\.ogg', parts[1])
            payload = archive.read(entry)
            source = original / parts[1]
            source.write_bytes(payload)
            samples, rate = sf.read(source, dtype='float64', always_2d=True)
            assert samples.size and np.isfinite(samples).all()
            converted = pcm22050(samples, rate)
            destination = wav_dir / (source.stem + '.wav')
            with wave.open(str(destination), 'wb') as output:
                output.setparams((1, 2, 22050, len(converted), 'NONE', 'not compressed'))
                output.writeframes(converted.tobytes())
            manifest['files'].append({'original': 'original/' + source.name,
                'originalBytes': len(payload), 'originalSha256': digest(payload),
                'sourceSampleRate': rate, 'sourceChannels': samples.shape[1],
                'wav': 'wav/' + destination.name, 'wavBytes': destination.stat().st_size,
                'wavSha256': digest(destination.read_bytes()), 'sampleRate': 22050,
                'channels': 1, 'bitsPerSample': 16, 'frames': len(converted),
                'durationMs': round(len(converted) * 1000 / 22050),
                'peak': int(np.abs(converted.astype('int32')).max()),
                'rms': round(float(np.sqrt(np.mean(converted.astype('float64') ** 2))), 2)})
    (args.output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    # Development library only. select-casino-audio.py builds the small shipping pack.
    with zipfile.ZipFile(args.output / 'LIBRARY.ZIP', 'w', zipfile.ZIP_DEFLATED) as archive:
        for item in manifest['files']:
            archive.write(args.output / item['wav'], Path(item['wav']).name)
        archive.write(args.output / 'License.txt', 'LICENSE.TXT')
    print('Imported 54 original effects and 54 PCM WAV copies; original CC0 licence retained.')
    print('PCM WAV total: ' + str(sum(item['wavBytes'] for item in manifest['files'])) + ' bytes.')


if __name__ == '__main__':
    main()
