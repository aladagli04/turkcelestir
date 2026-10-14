# Türkçeleştir

Türkçe karakter olmadan (ya da Almanca/İngilizce klavyeyle) yazılmış metni, yazı kutusunda **sağ tıklayarak**
düzelten ücretsiz bir Chrome eklentisi.

> "Yarin aksam size ugrayacagim, cok selam soyle"
> → "Yarın akşam size uğrayacağım, çok selam söyle"

Forumlarda, Gmail'de, Reddit'te, YouTube yorumlarında, e-postada… yazı yazılan her kutuda çalışır.

## Ne yapar?

Yazı kutusunda sağ tıkla → **Türkçeleştir** → üç seçenek:

| Seçenek | Kısayol | Ne yapar |
|---|---|---|
| **Sadece Türkçe karakterler** | `Alt+T` | c/g/i/o/s/u → ç/ğ/ı/ö/ş/ü. Zaten yazılmış ü, ö, ş'ye dokunmaz. |
| **Karakter + büyük harf + noktalama** | `Alt+Y` | Ayrıca cümle başı büyük harf, boşluk/noktalama düzeni, sonda soru eki varsa `?`, ülke/şehir/dil adları (Almanya'da, İstanbul'a, Türkçe). |
| **Yapay zekâ ile tam düzelt** | `Alt+U` | Ayrıca virgül, cümle bölme ve küçük yazım hataları (bkz. aşağıda). |

- Metin **seçmezsen kutunun tamamı**, seçersen yalnız seçtiğin kısım düzelir.
- Beğenmezsen `Ctrl+Z` ile geri al.
- Web adresleri, e-postalar, @kullanıcı adları ve #etiketler olduğu gibi kalır. Gmail'de alıntılanan eski mesaja
  ve imzaya dokunulmaz.
- İşlemden sonra simgede kısa bir rozet çıkar: sayı = kaç yer düzeltildi, ✓ = zaten düzgündü, ! = yapılamadı
  (simgeye tıklayınca nedeni yazar).

## Kurulum

Eklenti Chrome Web Mağazası'nda **yok**; GitHub'dan elle kurulur (Chrome, Edge, Brave gibi Chromium tabanlı
tarayıcılarda çalışır):

1. Sağdaki **Releases** bölümünden son sürümün `turkcelestir-x.y.z.zip` dosyasını indir.
2. Zip'i kalıcı bir klasöre aç (ör. `Belgeler\turkcelestir`). **Bu klasörü silme**; eklenti oradan çalışır.
3. Chrome'da adres çubuğuna `chrome://extensions` yaz.
4. Sağ üstten **Geliştirici modu**nu aç.
5. **Paketlenmemiş öğe yükle**'ye bas ve açtığın klasörü (içinde `manifest.json` olan) seç.
6. İsteğe bağlı: araç çubuğundaki yapboz simgesinden Türkçeleştir'i **sabitle** (📌).

Chrome ara sıra "geliştirici modundaki eklentileri devre dışı bırak" diye uyarabilir; bu, mağaza dışından
kurulan her eklenti için gösterilir. **"Vazgeç / İptal"** diyerek eklentiyi açık tutabilirsin.

Kısayolları değiştirmek için: `chrome://extensions/shortcuts`.

### Güncelleme

Mağaza dışı kurulduğu için **kendiliğinden güncellenmez**:

1. Releases'ten yeni zip'i indir, aynı klasöre açıp eski dosyaların üzerine yaz.
2. `chrome://extensions` sayfasında Türkçeleştir'in **↻ (yenile)** düğmesine bas.

Yeni sürümlerden haberdar olmak için depoyu GitHub'da **Watch → Custom → Releases** ile takip edebilirsin.

## Yapay zekâ ile tam düzelt (deneysel)

Bu seçenek Chrome'un **bilgisayarın içinde çalışan** yerleşik yapay zekâsını (Gemini Nano) kullanır:

- **Ücretsizdir, metin bilgisayardan dışarı gitmez**, hesap/anahtar gerekmez.
- İlk kullanımdan önce model bir kez indirilmeli: simgeye tıkla → **Yapay zekâ denemesi** → **Modeli indir**
  (birkaç GB). Aynı sayfada kendi metinlerinle deneyebilirsin.
- **Güçlü bir bilgisayar gerekir** (Google'ın şartları: yeterli ekran kartı belleği ya da bol RAM, ~20 GB boş disk).
  Uygun değilse sayfa bunu söyler; diğer iki seçenek her bilgisayarda çalışır.
- Chrome bu modelde Türkçeyi **resmi olarak desteklemiyor**; denemelerde yine de iyi sonuç verdi. Bir Chrome
  güncellemesiyle davranışı değişebilir.
- **Model anlamı değiştiremez:** kelimeler her zaman senin metninden alınır. Modelden yalnız noktalama, büyük harf,
  1–2 harflik yazım düzeltmeleri (bior → bir) ve bitişik yazılmış kelimelerin ayrılması (yapamazmıyız → yapamaz
  mıyız) kabul edilir. Model kelime ekler, siler ya da başka kelime koyarsa o değişiklik atılır.
- Uzun bir paragraf birkaç saniye sürebilir; bu sırada simgede gri `…` görünür.

## Gizlilik ve izinler

- Eklenti **hiçbir veriyi hiçbir yere göndermez**; sunucusu yoktur, istatistik toplamaz.
- Sayfalara **yalnız sen menüye ya da kısayola bastığında** girer; arka planda metinlerini okumaz.
- İstenen izinler ve nedenleri:
  - `contextMenus`: sağ tık menüsü.
  - `scripting`, `activeTab`: tıkladığın yazı kutusunu düzeltebilmek için.
  - **Tüm siteler**: bazı e-posta servisleri (ör. GMX) yazı kutusunu başka bir alan adından gelen bir çerçevenin
    içinde gösteriyor; oraya girebilmek için gerekli. Yine yalnız sen istediğinde kullanılır.
  - `storage`: son işlemin sonucunu (simge penceresindeki "Son işlem" satırı) saklamak için; metnin kendisi saklanmaz.

Kaynak kodun tamamı bu depoda; istediğin gibi inceleyebilirsin.

## Bilinen sınırlar

- Kural tabanlı seçenekler (Alt+T, Alt+Y) virgülün yerini ve noktasız uzun metnin cümle sınırlarını bilemez;
  bunun için yapay zekâ seçeneği var.
- Soru işareti (Alt+Y) yalnız soru eki cümlenin son kelimesiyse eklenir ("mantıklı mı sizce" → eklenmez).
- Zengin editörlerde (Gmail, Reddit) geri almak birkaç `Ctrl+Z` gerektirebilir.
- Chrome'un kendi sayfalarında (`chrome://`) ve Web Mağazası'nda eklentiler çalışamaz.
- Tarayıcı dışındaki programlarda (Word, Outlook masaüstü vb.) çalışmaz.

Hata bulursan ya da yanlış düzeltilen bir metin görürsen **Issues** bölümünden bildirebilirsin; metni olduğu gibi
eklemen çok yardımcı olur.

## Katkıda bulunmak

Katkılar memnuniyetle karşılanır. Yapı:

- `eklenti/lib/turkce.js`: çekirdek; karakter düzeltme, kurallar, yapay zekâ çıktısını güvenle birleştirme, fark algoritması.
- `eklenti/lib/deasciifier.js`: Türkçe karakter algoritması (aşağıya bkz.).
- `eklenti/lib/yz.js`: Chrome yerleşik yapay zekâsı (Prompt API).
- `eklenti/icerik.js`: sayfadaki yazı kutusunu düzenler (textarea, input, contenteditable, Lexical, iframe).
- `eklenti/arka.js`: sağ tık menüsü, kısayollar, simge rozeti.
- `eklenti/ayarlar.html`: yapay zekâ deneme sayfası.
- `test/test.js`: `node test/test.js` ile çalışan testler; `test/deneme.html`: elle deneme sayfası.
- `tools/paketle.py`: sürüm zip'ini üretir (`python tools/paketle.py`); `tools/ikon.py`: ikonları üretir.

## Teşekkür ve lisans

Bu eklentinin temeli iki kişinin emeğine dayanıyor:

- **Deniz Yüret**: Türkçe karakter düzeltme algoritmasının sahibi
  ([turkish-mode for Emacs](https://github.com/emres/turkish-mode)).
- **Mustafa Emre Acer**: algoritmanın JavaScript çevirisi ve deasciifier.com
  ([meacer/deasciifier](https://github.com/meacer/deasciifier)).

İkisi de MIT lisanslı; lisans metni `eklenti/lib/LICENSE-deasciifier.txt` dosyasında.
Bu projenin geri kalanı da **MIT** lisanslıdır (`LICENSE`): dilediğin gibi kullanabilir, değiştirebilir,
dağıtabilirsin.

---

### English (short)

**Türkçeleştir** is a free Chrome extension that fixes Turkish text typed without Turkish characters
(e.g. on a German/US keyboard): right-click any text box → *Türkçeleştir*. It restores ç ğ ı ö ş ü (Deniz Yüret's
deasciifier), optionally fixes capitalization and punctuation with rules, and, experimentally, with Chrome's
on-device AI (Gemini Nano), which runs locally, is free, and can never change your words (only punctuation, casing,
small typos and word splits are accepted). No data leaves your computer. Install via *Load unpacked* from the
Releases zip. MIT licensed.
