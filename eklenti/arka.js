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
    var sayi = null;
    sonuclar.forEach(function (s) { if (typeof s.result === 'number') sayi = s.result; });
    rozet(sekme.id, sayi === null ? '' : sayi < 0 ? '!' : sayi === 0 ? '✓' : String(sayi));
  } catch (e) {
    // chrome:// ve Web Mağazası sayfalarına eklenti giremez.
    console.warn('Türkçeleştir:', e);
    rozet(sekme.id, '!');
  }
}

// Simgenin üstünde kısa süre: kaç yer düzeltildi (✓ = zaten düzgün, ! = yapılamadı).
function rozet(sekmeId, yazi) {
  if (!yazi) return;
  chrome.action.setBadgeBackgroundColor({ color: yazi === '!' ? '#b00020' : '#1b7f3b', tabId: sekmeId });
  chrome.action.setBadgeText({ text: yazi, tabId: sekmeId });
  setTimeout(function () { chrome.action.setBadgeText({ text: '', tabId: sekmeId }); }, 2500);
}
