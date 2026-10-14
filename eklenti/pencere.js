chrome.commands.getAll(function (komutlar) {
  komutlar.forEach(function (k) {
    var el = document.getElementById(k.name === 'karakter' ? 'k1' : k.name === 'tam' ? 'k2' : '');
    if (el) el.textContent = k.shortcut || 'atanmamış';
  });
});
document.getElementById('kisayol').addEventListener('click', function () {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});

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
