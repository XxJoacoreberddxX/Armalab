#!/usr/bin/env python3
"""Genera las 3 versiones de ArmaLab desde src/armalab.src.html:
   dist/artifact.html  -> fragmento para Claude (scripts por CDN)
   index.html          -> página completa para GitHub Pages (scripts por CDN)
   ArmaLab-offline.html-> página completa con Three.js embebido (anda sin internet)"""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
V = sys.argv[1] if len(sys.argv) > 1 else os.path.join(here, '..', 'vendor', 'package')
FILES = ['build/three.min.js', 'examples/js/controls/OrbitControls.js', 'examples/js/controls/TransformControls.js', 'examples/js/loaders/FontLoader.js']
src = open(os.path.join(here, 'src', 'armalab.src.html'), encoding='utf-8').read()
font = json.load(open(os.path.join(V, 'examples/fonts/helvetiker_bold.typeface.json')))
src = src.replace('/*FONT_JSON*/null', json.dumps(font, separators=(',', ':')))
cdn = ''.join(f'<script src="https://cdn.jsdelivr.net/npm/three@0.147.0/{f}"></script>\n' for f in FILES)
inline = ''.join('<script>\n' + open(os.path.join(V, f), encoding='utf-8').read() + '\n</script>\n' for f in FILES)
frag_cdn = src.replace('<!--THREE_SCRIPTS-->', cdn)
frag_off = src.replace('<!--THREE_SCRIPTS-->', inline)
def page(frag):
    head, rest = frag.split('<style>', 1); css, body = rest.split('</style>', 1)
    return ('<!doctype html>\n<html lang="es"><head><meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            '<meta name="description" content="ArmaLab: modelador 3D de manualidades con materiales de librería. Piezas, compras, paso a paso y plantillas 1:1.">\n'
            + head + '<style>' + css + '</style></head><body>' + body + '</body></html>\n')
os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
open(os.path.join(here, 'dist', 'artifact.html'), 'w', encoding='utf-8').write(frag_cdn)
open(os.path.join(here, 'index.html'), 'w', encoding='utf-8').write(page(frag_cdn))
open(os.path.join(here, 'ArmaLab-offline.html'), 'w', encoding='utf-8').write(page(frag_off))
print('ok', len(frag_cdn), len(frag_off))
