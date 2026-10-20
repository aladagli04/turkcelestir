// Arka plan: sağ tık menüsü ve klavye kısayolları.
// Sayfalara sürekli betik eklenmez; yalnız kullanıcı istediğinde o sekmeye enjekte edilir (activeTab).

importScripts('lib/deasciifier.js', 'lib/turkce.js', 'lib/yz.js', 'lib/sozluk.js');

// Kelime sözlüğü (2,8 MB) ilk istekte yüklenir; service worker uyuyunca bellekten çıkar.
var sozlukSozu = null;
function sozluk() {
  if (!sozlukSozu) {
    sozlukSozu = fetch(chrome.runtime.getURL('lib/sozluk.txt')).then(function (c) { return c.text(); })
      .then(TurkceSozluk.yukle);
    sozlukSozu.catch(function () { sozlukSozu = null; });
  }
  return sozlukSozu;
}

var BASLIK = { karakter: 'Sadece Türkçe karakterler', tam: 'Karakter + büyük harf + noktalama',
  yz: 'Yapay zekâ ile tam düzelt (Chrome yerleşik)' };
var MODLAR = ['karakter', 'tam', 'yz'];

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({ id: 'kok', title: 'Türkçeleştir', contexts: ['editable'] });
    chrome.contextMenus.create({ id: 'karakter', parentId: 'kok', title: BASLIK.karakter, contexts: ['editable'] });
    chrome.contextMenus.create({ id: 'tam', parentId: 'kok', title: BASLIK.tam, contexts: ['editable'] });
    chrome.contextMenus.create({ id: 'yz', parentId: 'kok', title: BASLIK.yz, contexts: ['editable'] });
  });
});

chrome.contextMenus.onClicked.addListener(function (bilgi, sekme) {
  if (MODLAR.indexOf(bilgi.menuItemId) >= 0) {
    calistir(sekme, bilgi.menuItemId, 'menu', { frameIds: [bilgi.frameId || 0] });
  }
});

chrome.commands.onCommand.addListener(function (komut, sekme) {
  if (MODLAR.indexOf(komut) >= 0) calistir(sekme, komut, 'kisayol', { allFrames: true });
});

async function calistir(sekme, mod, kaynak, cerceve) {
  if (!sekme || sekme.id == null) return;
  var hedef = Object.assign({ tabId: sekme.id }, cerceve);
  if (mod === 'yz') rozet(sekme.id, '…', true);
  try {
    await chrome.scripting.executeScript({ target: hedef, files: ['lib/deasciifier.js', 'lib/turkce.js', 'icerik.js'] });
    var sonuclar = await chrome.scripting.executeScript({
      target: hedef,
      func: function (m, k) { return window.TurkceCalistir(m, k); },
      args: [mod, kaynak]
    });
    var sonuc = null;
    sonuclar.forEach(function (s) { if (s.result && s.result.durum) sonuc = s.result; });
    if (!sonuc) sonuc = { durum: 'alan-yok', hata: 'Odakta yazı kutusu bulunamadı. Kutu başka bir alan adından gelen çerçevedeyse (ör. GMX) simgeye tıklayıp "Çerçeveli editörler için izin ver"i aç.' };
    kaydet(sekme, mod, sonuc);
    rozet(sekme.id, sonuc.durum === 'tamam' ? (sonuc.sayi ? String(sonuc.sayi) : '✓') : '!');
    return sonuc;
  } catch (e) {
    // chrome:// ve Web Mağazası sayfalarına eklenti giremez.
    console.warn('Türkçeleştir:', e);
    var m = String(e && e.message || e);
    if (/Cannot access|permission|frame/i.test(m)) m += ' — Çerçeveli editörlerde (ör. GMX) simgeye tıklayıp "Çerçeveli editörler için izin ver"i aç.';
    var s = { durum: 'hata', hata: m };
    kaydet(sekme, mod, s);
    rozet(sekme.id, '!');
    return s;
  }
}

// Son işlem: simgeye tıklanınca açılan pencerede gösterilir (sorun bildirirken işe yarar).
function kaydet(sekme, mod, sonuc) {
  var adres = '';
  try { adres = new URL(sekme.url || '').hostname; } catch (e) {}
  chrome.storage.local.set({ son: Object.assign({ zaman: Date.now(), site: adres, mod: mod }, sonuc) });
}

// İçerik betiği yapay zekâ düzeltmesini buradan ister (model service worker'da çalışır).
chrome.runtime.onMessage.addListener(function (ileti, gonderen, cevapla) {
  if (ileti && ileti.tur === 'sozluk') {
    sozluk().then(function (h) { cevapla({ metin: TurkceSozluk.duzelt(ileti.metin, h) }); },
      function (e) { cevapla({ hata: String(e && e.message || e) }); });
    return true;
  }
  if (!ileti || ileti.tur !== 'yz') return;
  TurkceYZ.yzUygula(ileti.metin).then(function (metin) { cevapla({ metin: metin }); }, function (e) {
    var m = String(e && e.message || e);
    if (/user activation|NotAllowed/i.test(m)) m = 'Model henüz indirilmemiş: simge → "Yapay zekâ denemesi" sayfasından bir kez indirin.';
    cevapla({ hata: m });
  });
  return true; // cevap eşzamansız
});

// Simgenin üstünde kısa süre: kaç yer düzeltildi (✓ = zaten düzgün, ! = yapılamadı).
function rozet(sekmeId, yazi, kalici) {
  if (!yazi) return;
  chrome.action.setBadgeBackgroundColor({ color: yazi === '!' ? '#b00020' : yazi === '…' ? '#666666' : '#1b7f3b', tabId: sekmeId });
  chrome.action.setBadgeText({ text: yazi, tabId: sekmeId });
  if (!kalici) setTimeout(function () { chrome.action.setBadgeText({ text: '', tabId: sekmeId }); }, 2500);
}
