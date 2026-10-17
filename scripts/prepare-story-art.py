"""Prepare small, baseline JPEG derivatives from locally generated originals.

Usage: python scripts/prepare-story-art.py --sources artifacts/story-art-sources.json
The private source manifest maps asset IDs to image paths. Originals are left
in place. This tool resizes/crops exports; it does not synthesize or paint art.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = {'w': 'weapon', 'r': 'receipt', 'p': 'photo', 'l': 'letter', 'c': 'clothing'}

def export(source, target, size, fit=False, quality=80):
    with Image.open(source) as original:
        rgb = original.convert('RGB')
        image = ImageOps.fit(rgb, size, method=Image.Resampling.LANCZOS) if fit else ImageOps.pad(rgb, size, method=Image.Resampling.LANCZOS, color=(25, 24, 19))
        image.save(target, 'JPEG', quality=quality, optimize=True, progressive=False)
    data = target.read_bytes()
    return {'file': str(target.relative_to(ROOT)).replace('\\', '/'), 'width': size[0], 'height': size[1], 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sources', type=Path, required=True)
    args = parser.parse_args()
    sources = json.loads(args.sources.read_text(encoding='utf-8'))
    destination = ROOT / 'public/images/story'
    destination.mkdir(parents=True, exist_ok=True)
    outputs = []
    for prefix, category in CATEGORIES.items():
        for index in range(1, 6):
            key = f'{prefix}{index}'
            source = sources[key]
            outputs.append(export(source, destination / f'{category}-{index}.jpg', (240, 160)))
            outputs.append(export(source, destination / f'{category}-{index}-thumb.jpg', (72, 48), quality=78))
    outputs.append(export(sources['suitcase'], destination / 'suitcase.jpg', (740, 250)))
    outputs.append(export(sources['corridor'], destination / 'corridor.jpg', (740, 250), fit=True))
    outputs.append(export(sources['rook'], destination / 'rook.jpg', (72, 90), fit=True, quality=85))
    campaign = json.loads((ROOT / 'content/v2/campaign.json').read_text(encoding='utf-8'))
    for index, casino in enumerate(campaign['casinos'], start=1):
        outputs.append(export(ROOT / casino['background'], destination / f'arrival-{index}.jpg', (740, 250), fit=True))
    manifest = {'generator': 'Built-in image_gen; one original per evidence form and story subject.', 'processing': 'Baseline JPEG exports; no essential text baked into images.', 'assets': outputs}
    (ROOT / 'docs/design/story-artwork.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'files': len(outputs), 'totalBytes': sum(row['bytes'] for row in outputs), 'largestBytes': max(row['bytes'] for row in outputs)}))

if __name__ == '__main__':
    main()
