# Gerçek Chrome ile eklenti denemeleri (puppeteer)

Kurulum (bir kez): bu klasörde `npm init -y && npm i puppeteer@24`
(puppeteer'in kendi Chrome'u inmeyebilir; betikler sistemdeki Chrome'u kullanır: `C:/Program Files/Google/Chrome/Application/chrome.exe`).
Çalıştırma: `node genel.js`, `node editorler.js`, `node popup.js`, `node yz-kontrol.js`. Geçici profil `profil/` içinde açılır (git dışı).

- `genel.js`: Google arama kutusu, tek kelime seçimi, iç içe iframe (başka köken).
- `editorler.js`: Lexical (Reddit tipi) editör, gölge DOM, GMX benzeri iç içe çerçeve.
- `popup.js`: açılır pencere ve izinler. `yz-kontrol.js`: Prompt API var mı (headless'ta model yok: "unavailable" normal).

UYARI: `genel.js` ve `editorler.js` eklentide "tüm siteler" izni sabitken yazıldı. Artık izin isteğe bağlı; betikler arka plandan
`calistir(...)` çağırdığı için activeTab verilmez ve enjeksiyon başarısız olur. Çalıştırmak için eklentinin geçici bir kopyasında
manifest'e `"host_permissions": ["<all_urls>"]` ekle ve betikteki EKLENTI yolunu o kopyaya çevir.
Sağ tık menüsü ve kısayollar headless'ta tetiklenemez; onlar gerçek Chrome'da elle denenir.
