# Sürüm zip'ini üretir: python tools/paketle.py  ->  dist/turkcelestir-<sürüm>.zip
# Zip'in içinde tek klasör (turkcelestir/) ve eklenti dosyaları olur; kullanıcı açıp "Paketlenmemiş öğe yükle" ile seçer.
import json, os, zipfile

kok = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
eklenti = os.path.join(kok, 'eklenti')
surum = json.load(open(os.path.join(eklenti, 'manifest.json'), encoding='utf-8'))['version']
os.makedirs(os.path.join(kok, 'dist'), exist_ok=True)
hedef = os.path.join(kok, 'dist', f'turkcelestir-{surum}.zip')

with zipfile.ZipFile(hedef, 'w', zipfile.ZIP_DEFLATED) as z:
    for klasor, _, dosyalar in os.walk(eklenti):
        for d in sorted(dosyalar):
            yol = os.path.join(klasor, d)
            z.write(yol, os.path.join('turkcelestir', os.path.relpath(yol, eklenti)))
    z.write(os.path.join(kok, 'LICENSE'), 'turkcelestir/LICENSE')
    z.write(os.path.join(kok, 'README.md'), 'turkcelestir/README.md')
print(hedef, os.path.getsize(hedef) // 1024, 'KB')
