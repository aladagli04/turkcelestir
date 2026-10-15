# Sürüm paketlerini üretir: python tools/paketle.py
#   dist/turkcelestir-<sürüm>.zip        GitHub Releases: içinde turkcelestir/ klasörü (elle açılıp yüklenir)
#   dist/turkcelestir-magaza-<sürüm>.zip Chrome Web Store: manifest.json zip'in kökünde olmalı
import json, os, zipfile

kok = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
eklenti = os.path.join(kok, 'eklenti')
surum = json.load(open(os.path.join(eklenti, 'manifest.json'), encoding='utf-8'))['version']
os.makedirs(os.path.join(kok, 'dist'), exist_ok=True)


def dosyalar():
    for klasor, _, adlar in os.walk(eklenti):
        for d in sorted(adlar):
            yol = os.path.join(klasor, d)
            yield yol, os.path.relpath(yol, eklenti).replace(os.sep, '/')


def yaz(hedef, ust_klasor):
    with zipfile.ZipFile(hedef, 'w', zipfile.ZIP_DEFLATED) as z:
        for yol, goreli in dosyalar():
            z.write(yol, (ust_klasor + '/' + goreli) if ust_klasor else goreli)
        if ust_klasor:
            z.write(os.path.join(kok, 'LICENSE'), ust_klasor + '/LICENSE')
            z.write(os.path.join(kok, 'README.md'), ust_klasor + '/README.md')
    print(hedef, os.path.getsize(hedef) // 1024, 'KB')


yaz(os.path.join(kok, 'dist', f'turkcelestir-{surum}.zip'), 'turkcelestir')
yaz(os.path.join(kok, 'dist', f'turkcelestir-magaza-{surum}.zip'), None)
