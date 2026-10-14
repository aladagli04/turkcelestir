// Arka plan: sağ tık menüsü ve klavye kısayolları.
// Sayfalara sürekli betik eklenmez; yalnız kullanıcı istediğinde o sekmeye enjekte edilir (activeTab).

var BASLIK = { karakter: 'Sadece Türkçe karakterler', tam: 'Karakter + büyük harf + noktalama' };

chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.removeAll(function () {
    chrome.contextMenus.create({ id: 'kok', title: 'Türkçeleştir', contexts: ['editable'] });
    chrome.contextMenus.create({ id: 'karakter', parentId: 'kok', title: BASLIK.karakter, contexts: ['editable'] });
    chrome.contextMenus.create({ id: 'tam', parentId: 'kok', title: BASLIK.tam, contexts: ['editable'] });
  });
});

chrome.contextMenus.onClicked.addListener(function (bilgi, sekme) {
  if (bilgi.menuItemId === 'karakter' || bilgi.menuItemId === 'tam') {
    calistir(sekme, bilgi.menuItemId, 'menu', { frameIds: [bilgi.frameId || 0] });
  }
});

chrome.commands.onCommand.addListener(function (komut, sekme) {
  if (komut === 'karakter' || komut === 'tam') calistir(sekme, komut, 'kisayol', { allFrames: true });
});

async function calistir(sekme, mod, kaynak, cerceve) {
  if (!sekme || sekme.id == null) return;
  var hedef = Object.assign({ tabId: sekme.id }, cerceve);
  try {
    await chrome.scripting.executeScript({ target: hedef, files: ['lib/deasciifier.js', 'lib/turkce.js', 'icerik.js'] });
    var sonuclar = await chrome.scripting.executeScript({
      target: hedef,
      func: function (m, k) { return window.TurkceCalistir(m, k); },
      args: [mod, kaynak]
    });
    var sonuc = null;
    sonuclar.forEach(function (s) { if (s.result && s.result.durum) sonuc = s.result; });
    if (!sonuc) sonuc = { durum: 'alan-yok', hata: 'Odakta yazı kutusu bulunamadı (' + kaynak + ')' };
    kaydet(sekme, mod, sonuc);
    rozet(sekme.id, sonuc.durum === 'tamam' ? (sonuc.sayi ? String(sonuc.sayi) : '✓') : '!');
    return sonuc;
  } catch (e) {
    // chrome:// ve Web Mağazası sayfalarına eklenti giremez.
    console.warn('Türkçeleştir:', e);
    var s = { durum: 'hata', hata: String(e && e.message || e) };
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

// Simgenin üstünde kısa süre: kaç yer düzeltildi (✓ = zaten düzgün, ! = yapılamadı).
function rozet(sekmeId, yazi) {
  if (!yazi) return;
  chrome.action.setBadgeBackgroundColor({ color: yazi === '!' ? '#b00020' : '#1b7f3b', tabId: sekmeId });
  chrome.action.setBadgeText({ text: yazi, tabId: sekmeId });
  setTimeout(function () { chrome.action.setBadgeText({ text: '', tabId: sekmeId }); }, 2500);
}
