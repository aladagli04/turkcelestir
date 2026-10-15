# Gerçek kullanım ekran görüntülerini 1280x800 mağaza ölçüsüne yerleştirir (sol başlık, sağda görüntü).
# Kullanım: python tools/magaza-gmail.py <menu.png> <sonuc.png>
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1280, 800
F = 'C:/Windows/Fonts/'

def zemin():
    z = Image.new('RGB', (W, H)); px = z.load()
    for y in range(H):
        for x in range(W):
            t = (x * 0.35 + y * 0.65) / (W * 0.35 + H * 0.65)
            px[x, y] = tuple(int(a + (b - a) * t) for a, b in zip((230, 10, 24), (140, 5, 16)))
    return z

def sar(metin, font, genislik, d):
    satirlar, cur = [], ''
    for kelime in metin.split():
        deneme = (cur + ' ' + kelime).strip()
        if d.textlength(deneme, font=font) <= genislik: cur = deneme
        else: satirlar.append(cur); cur = kelime
    satirlar.append(cur)
    return satirlar

def uret(kaynak, cikti, baslik, alt, temizle=None):
    im = Image.open(kaynak).convert('RGB')
    if temizle:
        ImageDraw.Draw(im).rectangle(temizle, fill='white')
    yuk = 720
    im = im.resize((round(im.width * yuk / im.height), yuk), Image.LANCZOS)
    tuval = zemin()
    d = ImageDraw.Draw(tuval)
    x0 = W - im.width - 40
    # golge + beyaz kenar
    golge = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(golge).rounded_rectangle((x0, 40 + 12, x0 + im.width, 40 + yuk + 12), 16, fill=(0, 0, 0, 120))
    tuval.paste(Image.new('RGB', (W, H), 'black'), (0, 0), golge.filter(ImageFilter.GaussianBlur(18)).getchannel('A'))
    maske = Image.new('L', im.size, 0); ImageDraw.Draw(maske).rounded_rectangle((0, 0, im.width, im.height), 16, fill=255)
    tuval.paste(im, (x0, 40), maske)
    d = ImageDraw.Draw(tuval)
    kol = x0 - 40 - 56
    fb = ImageFont.truetype(F + 'segoeuib.ttf', 40); fa = ImageFont.truetype(F + 'segoeui.ttf', 22); fk = ImageFont.truetype(F + 'segoeui.ttf', 20)
    b_sat = sar(baslik, fb, kol, d); a_sat = sar(alt, fa, kol, d)
    toplam = 30 + len(b_sat) * 50 + 18 + len(a_sat) * 32
    y = (H - toplam) // 2
    d.text((56, y), 'Türkçeleştir', font=fk, fill=(255, 215, 215)); y += 30
    for s in b_sat: d.text((56, y), s, font=fb, fill='white'); y += 50
    y += 18
    for s in a_sat: d.text((56, y), s, font=fa, fill=(255, 235, 235)); y += 32
    tuval.save(cikti)
    print(cikti, tuval.size)

menu, sonuc = sys.argv[1], sys.argv[2]
uret(menu, 'magaza/3-sag-tik.png', 'Yazı kutusuna sağ tıkla, Türkçeleştir\'i seç.',
     'Üç seçenek: yalnız Türkçe karakterler, karakter + büyük harf + noktalama ya da yapay zekâ ile tam düzeltme. Kısayol da var.')
uret(sonuc, 'magaza/4-yapay-zeka.png', 'Yapay zekâ seçeneği: bitişik kelimeyi bile ayırır.',
     'Chrome\'un kendi modeli, bilgisayarında çalışır; metnin dışarı çıkmaz. Birkaç saniye sürebilir. (Deneysel)',
     temizle=(150, 208, 800, 255))
