"""Build the code-native blue/gold email badges from Font Awesome brand SVGs.
Requires Inkscape on PATH. Existing photographic/generated images are not edited.
Font Awesome Free 6.7.2 artwork is licensed CC BY 4.0; see the included notice.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
from xml.etree import ElementTree as ET
import base64
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'images' / 'email-icons'
BRANDS = [('instagram', 'instagram'), ('facebook', 'facebook-f'), ('linkedin', 'linkedin-in'),
          ('youtube', 'youtube'), ('whatsapp-channel', 'whatsapp'), ('telegram', 'telegram'),
          ('threads', 'threads'), ('x', 'x-twitter'), ('google', 'google')]

def build(item):
    key, brand = item
    url = f'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.7.2/svgs/brands/{brand}.svg'
    with urlopen(url, timeout=30) as response:
        source = response.read()
    svg = ET.fromstring(source)
    x, y, w, h = map(float, svg.attrib['viewBox'].split())
    scale = min(49 / w, 49 / h)
    tx, ty = 48 - w * scale / 2 - x * scale, 48 - h * scale / 2 - y * scale
    shapes = ''.join('<path d="' + node.attrib['d'] + '"/>' for node in svg.iter() if node.tag.endswith('path'))
    badge = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">
<!-- Adapted from Font Awesome Free 6.7.2, Fonticons Inc., CC BY 4.0. -->
<defs><radialGradient id="blue" cx="33%" cy="17%" r="95%"><stop offset="0" stop-color="#185da1"/><stop offset=".55" stop-color="#07366e"/><stop offset="1" stop-color="#031d43"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="#ffe6a0"/><stop offset=".45" stop-color="#efc452"/><stop offset="1" stop-color="#b87d14"/></linearGradient></defs>
<circle cx="48" cy="48" r="45.5" fill="url(#blue)" stroke="#b98520" stroke-width="3"/>
<circle cx="48" cy="48" r="45" fill="none" stroke="url(#gold)" stroke-width="1.2"/>
<g fill="url(#gold)" transform="translate({tx:.5f} {ty:.5f}) scale({scale:.7f})">{shapes}</g></svg>'''
    (OUT / 'source').mkdir(parents=True, exist_ok=True)
    (OUT / 'source' / f'{key}.svg').write_text(badge)
    target = OUT / f'{key}.png'
    subprocess.run(['inkscape', str(OUT / 'source' / f'{key}.svg'), '--export-type=png', '--export-filename=' + str(target)], check=True, capture_output=True)
    data = target.read_bytes()
    return key, base64.b64encode(data).decode()

if __name__ == '__main__':
    results = list(ThreadPoolExecutor(max_workers=5).map(build, BRANDS))
    literal = '{' + ','.join('"' + key + '":"' + value + '"' for key, value in results) + '}'
    for name in ['integrations/Code.gs', 'integrations/newsletter/Code.gs']:
        path = ROOT / name
        text = path.read_text()
        start = text.index('function aiEmailIconData_() {')
        end = text.index('\nfunction aiEmailIconCid_', start)
        text = text[:start] + 'function aiEmailIconData_() {\n  return ' + literal + ';\n}\n' + text[end:]
        path.write_text(text)
    print('Created nine blue/gold PNG/SVG badges and updated both email script bundles.')
    print('Largest base64 icon:', max(len(value) for _, value in results))
