chrome.commands.getAll(function (komutlar) {
  komutlar.forEach(function (k) {
    var el = document.getElementById(k.name === 'karakter' ? 'k1' : k.name === 'tam' ? 'k2' : '');
    if (el) el.textContent = k.shortcut || 'atanmamış';
  });
});
document.getElementById('kisayol').addEventListener('click', function () {
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
