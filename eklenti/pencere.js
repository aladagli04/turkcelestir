chrome.commands.getAll(function (komutlar) {
  komutlar.forEach(function (k) {
    var el = document.getElementById(k.name === 'karakter' ? 'k1' : k.name === 'tam' ? 'k2' : k.name === 'yz' ? 'k3' : '');
    if (el) el.textContent = k.shortcut || 'atanmamış';
  });
});
document.getElementById('kisayol').addEventListener('click', function () {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

document.getElementById('yz').addEventListener('click', function () { chrome.runtime.openOptionsPage(); });

// Son işlemin sonucu (sorun bildirirken bunu göndermek yeterli).
chrome.storage.local.get('son', function (v) {
  var s = v.son, el = document.getElementById('son');
  if (!s) return;
  var saat = new Date(s.zaman).toLocaleTimeString('tr-TR');
  var ozet = s.durum === 'tamam' ? (s.sayi ? s.sayi + ' yer düzeltildi' : 'değişecek bir şey yoktu') +
      (s.atlanan ? ', ' + s.atlanan + ' yer editör izin vermediği için atlandı' : '')
    : s.durum === 'alan-yok' ? 'yazı kutusu bulunamadı' : 'HATA';
  el.textContent = 'Son işlem (' + saat + ', ' + (s.site || '?') + ', ' + (s.alan || '-') + '): ' + ozet +
    (s.durum !== 'tamam' && s.hata ? ' — ' + s.hata : '');
});

// Çerçeveli editörler (GMX gibi başka alan adından gelen iframe) için isteğe bağlı geniş site izni.
var TUM = { origins: ['<all_urls>'] };
function izinGuncelle() {
  chrome.permissions.contains(TUM, function (var_) {
    document.getElementById('izin').textContent = var_ ? 'Tüm sitelerde izni geri al' : 'Çerçeveli editörler için izin ver';
    document.getElementById('izinnot').textContent = var_
      ? 'Tüm sitelerde çalışma izni açık (GMX gibi çerçeveli editörler dahil). Yine yalnız sen tetiklediğinde çalışır.'
      : 'Gmail, forumlar, Reddit gibi çoğu yerde izin gerekmez. Yazı kutusu başka bir alan adından gelen çerçevedeyse (ör. GMX) çalışmaz; o zaman bu izni ver.';
  });
}
document.getElementById('izin').addEventListener('click', function () {
  chrome.permissions.contains(TUM, function (var_) {
    if (var_) chrome.permissions.remove(TUM, izinGuncelle);
    else chrome.permissions.request(TUM, izinGuncelle);
  });
});
izinGuncelle();
