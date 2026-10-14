# Türkçeleştir

Türkçe karakter olmadan (ya da Almanca klavyeyle) yazılmış metni sağ tıkla düzelten Chrome eklentisi.

- **Sadece Türkçe karakterler** (`Alt+T`): c/g/i/o/s/u → ç/ğ/ı/ö/ş/ü. Zaten yazılmış ü/ö/ş'ye dokunmaz.
- **Karakter + büyük harf + noktalama** (`Alt+Y`): ayrıca cümle başı büyük harf, boşluk/noktalama düzeni,
  sonda soru eki varsa `?`, ülke/şehir/dil adları (Almanya'da, Türkçe, İstanbul'a).
- Seçim varsa yalnız seçili kısım, yoksa kutunun tamamı. `Ctrl+Z` ile geri alınır.
- Çevrimdışı çalışır; metin hiçbir yere gönderilmez. İzinler: `contextMenus`, `scripting`, `activeTab`
  (sayfaya yalnız menüye/kısayola basınca girer).
- Adresler, e-postalar, @kullanıcı ve #etiketler korunur. Gmail'de alıntılanan eski mesaj ve imza düzeltilmez.

## Kurulum (geliştirici modu)
1. Chrome'da `chrome://extensions` aç, sağ üstten **Geliştirici modu**nu aç.
2. **Paketlenmemiş öğe yükle** → `D:\Projects\turkcelestir\eklenti` klasörünü seç.
3. Kısayolları değiştirmek için: `chrome://extensions/shortcuts`.

Kodu değiştirince `chrome://extensions` sayfasında eklentinin yenile (↻) düğmesine bas.

## Yapı
- `eklenti/lib/deasciifier.js` — Deniz Yüret'in Emacs Türkçe eklentisinden Mustafa Emre Acer'in JS çevirisi
  (deasciifier.com; npm `deasciifier` paketi, README'de MIT). Yalnız son satır (module.exports) değiştirildi.
- `eklenti/lib/turkce.js` — çekirdek: karakter düzeltme, kurallar, fark (Myers) algoritması.
- `eklenti/icerik.js` — sayfadaki kutuyu (textarea/input/contenteditable) düzenler.
- `eklenti/arka.js` — sağ tık menüsü, kısayollar, simge rozeti (düzeltilen yer sayısı).
- `test/test.js` — `node test/test.js`; `test/deneme.html` — elle deneme sayfası.
- `tools/ikon.py` — ikonları üretir.

## Bilinen sınırlar
- Virgül yerini ve noktasız uzun metnin cümle sınırlarını kurallar bilemez (bunun için ileride yapay zekâ seçeneği).
- Soru işareti yalnız soru eki cümlenin son kelimesiyse eklenir ("mantıklı mı sizce" → eklenmez).
- Zengin editörlerde (Gmail) geri alma birkaç `Ctrl+Z` gerektirebilir.
- Mağazaya koymadan önce deasciifier.js lisansı kaynağından teyit edilmeli.
