# Eklenti ikonlarını üretir: python tools/ikon.py
# Kırmızı degrade zemin, üstte hafif parlama, gölgeli beyaz "ğ" (Georgia Bold).
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

hedef = os.path.join(os.path.dirname(__file__), '..', 'eklenti', 'ikon')
FONT = 'C:/Windows/Fonts/georgiab.ttf'
UST, ALT = (255, 66, 56), (168, 4, 20)


def ikon(boyut):
    b = boyut * 4  # büyük çiz, küçült (yumuşak kenar)
    zemin = Image.new('RGBA', (b, b))
    px = zemin.load()
    for y in range(b):
        for x in range(b):
            t = (x * 0.35 + y * 0.65) / b
            px[x, y] = tuple(int(UST[i] + (ALT[i] - UST[i]) * t) for i in range(3)) + (255,)
    maske = Image.new('L', (b, b), 0)
    ImageDraw.Draw(maske).rounded_rectangle((0, 0, b - 1, b - 1), radius=b * 22 // 100, fill=255)
    im = Image.new('RGBA', (b, b), (0, 0, 0, 0))
    im.paste(zemin, (0, 0), maske)

    parla = Image.new('RGBA', (b, b), (0, 0, 0, 0))
    ImageDraw.Draw(parla).ellipse((-b * 0.2, -b * 0.75, b * 1.2, b * 0.45), fill=(255, 255, 255, 38))
    parla.putalpha(Image.composite(parla.getchannel('A'), Image.new('L', (b, b), 0), maske))
    im = Image.alpha_composite(im, parla)

    font = ImageFont.truetype(FONT, int(b * 0.80))
    golge = Image.new('RGBA', (b, b), (0, 0, 0, 0))
    ImageDraw.Draw(golge).text((b / 2, b * 0.465), 'ğ', font=font, fill=(90, 0, 10, 140), anchor='mm')
    im = Image.alpha_composite(im, golge.filter(ImageFilter.GaussianBlur(b * 0.012)))
    ImageDraw.Draw(im).text((b / 2, b * 0.44), 'ğ', font=font, fill='white', anchor='mm')
    return im.resize((boyut, boyut), Image.LANCZOS)


for boyut in (16, 32, 48, 128):
    ikon(boyut).save(os.path.join(hedef, f'{boyut}.png'))
print('tamam')
