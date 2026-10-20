// node test/sozluk-dene.js [dosya...]  — sözlük düzeltmesini dener; dosya verilirse içindeki değişiklikleri listeler
// (doğru yazılmış metinde hiç değişiklik olmamalı: yanlış pozitif avı).
var fs = require('fs'), path = require('path');
var T = require('../eklenti/lib/turkce.js'), S = require('../eklenti/lib/sozluk.js');
var t0 = Date.now();
var harita = S.yukle(fs.readFileSync(path.join(__dirname, '../eklenti/lib/sozluk.txt'), 'utf8'));
console.log('sözlük: ' + harita.size + ' kelime, ' + (Date.now() - t0) + ' ms, ' +
  Math.round(process.memoryUsage().heapUsed / 1e6) + ' MB bellek');
var tam = function (s) { return S.duzelt(T.duzelt(s, 0, s.length, 'tam'), harita); };

var dosyalar = process.argv.slice(2);
if (!dosyalar.length) {
  ['Fena degil, tam bir yapaya zeka destegi gibi olmasada fena degilm mesela yanlisliklabitisik yazilan kelmeleri ayiramiyor',
    'bugun cokguzel bir gun, gelsede gitsek', 'kusburnu cayi ictim, zeytinyagi aldim'].forEach(function (s) {
    console.log('girdi:  ' + s + '\nçıktı:  ' + tam(s));
  });
}
dosyalar.forEach(function (d) {
  var satirlar = fs.readFileSync(d, 'utf8').split('\n'), kelime = 0, degisen = 0;
  t0 = Date.now();
  satirlar.forEach(function (s) {
    kelime += (s.match(/\p{L}+/gu) || []).length;
    var y = S.duzelt(s, harita);
    if (y === s) return;
    var ek = s.match(/\p{L}+/gu) || [], yk = y.match(/[\p{L} ]+/gu) || [];
    var yeniler = y.split(/\s+/), eskiler = s.split(/\s+/);
    eskiler.forEach(function (e, i) { if (yeniler.indexOf(e) < 0) { degisen++; console.log('  ' + e + '  ->  ' + S.duzelt(e, harita)); } });
  });
  console.log(d + ': ' + kelime + ' kelime, ' + degisen + ' değişiklik, ' + (Date.now() - t0) + ' ms');
});
