# Kelime sıklığı sözlüğünü üretir: python tools/sozluk.py <tr_full.txt>
# Kaynak: hermitdave/FrequencyWords, content/2018/tr/tr_full.txt (OpenSubtitles 2018, CC-BY-SA-4.0).
# Çıktı: eklenti/lib/sozluk.txt — alfabetik, önek kodlu; her satır:
#   [ortak önek uzunluğu: 0-9a-z] [kalan harfler] [sıklık sınıfı: chr(48 + floor(2*log2(sayı)))]
import io, math, os, re, sys

ESIK = 5  # en az bu kadar geçen kelimeler (daha azı "hiç görülmemiş" sayılır)
HARF = re.compile(r'^[a-zçğıöşüâîû]+$')
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

kelimeler = []
for satir in io.open(sys.argv[1], encoding='utf-8'):
    p = satir.split()
    if len(p) == 2 and int(p[1]) >= ESIK and HARF.match(p[0]):
        kelimeler.append((p[0], int(p[1])))
kelimeler.sort()

UZ = '0123456789abcdefghijklmnopqrstuvwxyz'
cikti, onceki = [], ''
for k, c in kelimeler:
    n = 0
    while n < min(len(k), len(onceki), len(UZ) - 1) and k[n] == onceki[n]:
        n += 1
    cikti.append(UZ[n] + k[n:] + chr(48 + int(2 * math.log2(c))))
    onceki = k

yol = os.path.join(KOK, 'eklenti', 'lib', 'sozluk.txt')
io.open(yol, 'w', encoding='utf-8', newline='\n').write('\n'.join(cikti) + '\n')
print('%d kelime, %.1f MB -> %s' % (len(kelimeler), os.path.getsize(yol) / 1e6, yol))
