# Eklenti ikonlarını üretir: python tools/ikon.py
from PIL import Image, ImageDraw, ImageFont
import os

hedef = os.path.join(os.path.dirname(__file__), '..', 'eklenti', 'ikon')
for boyut in (16, 32, 48, 128):
    b = boyut * 4  # büyük çiz, küçült (yumuşak kenar)
    im = Image.new('RGBA', (b, b), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, b - 1, b - 1), radius=b // 5, fill=(227, 10, 23, 255))
    font = ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf', int(b * 0.78))
    d.text((b / 2, b * 0.40), 'ğ', font=font, fill='white', anchor='mm')
    im.resize((boyut, boyut), Image.LANCZOS).save(os.path.join(hedef, f'{boyut}.png'))
print('tamam')
