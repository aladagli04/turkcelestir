var $ = function (id) { return document.getElementById(id); };
var ACIKLAMA = {
  yok: 'Bu Chrome\'da yerleşik yapay zekâ (Prompt API) bulunamadı.',
  unavailable: 'Bu bilgisayarda yerleşik model kullanılamıyor (donanım/disk ya da Chrome ayarı).',
  downloadable: 'Model henüz indirilmemiş. Aşağıdaki düğmeyle indir (bir kez, birkaç GB).',
  downloading: 'Model indiriliyor…',
  available: 'Model hazır.'
};

async function guncelle() {
  var d = await TurkceYZ.durum();
  $('durum').textContent = (ACIKLAMA[d.durum] || d.durum) +
    (d.dil ? ' (Not: Chrome bu modelde Türkçeyi resmi olarak desteklemiyor; yine de iyi çalışıyor.)' : '');
  $('indir').hidden = !(d.durum === 'downloadable' || d.durum === 'downloading');
  $('dene').disabled = !d.dil;
  return d;
}

function ilerleme(oran) {
  $('ilerleme').hidden = false;
  $('ilerleme').value = oran;
  $('durum').textContent = 'Model indiriliyor… %' + Math.round(oran * 100);
}

$('indir').addEventListener('click', async function () {
  this.disabled = true;
  try { await TurkceYZ.oturumAc(ilerleme); } catch (e) { $('durum').textContent = 'Hata: ' + e.message; }
  $('ilerleme').hidden = true;
  this.disabled = false;
  guncelle();
});

$('dene').addEventListener('click', async function () {
  var metin = $('girdi').value;
  $('kurallar').textContent = Turkce.duzelt(metin, 0, metin.length, 'tam');
  $('yz').textContent = 'Çalışıyor…';
  $('sure').textContent = '';
  this.disabled = true;
  var t0 = performance.now();
  try {
    var s = await TurkceYZ.duzelt(metin, ilerleme);
    $('yz').textContent = s.yz;
    $('sure').textContent = ((performance.now() - t0) / 1000).toFixed(1) + ' sn';
  } catch (e) {
    $('yz').textContent = 'Hata: ' + e.message;
  }
  $('ilerleme').hidden = true;
  this.disabled = false;
  guncelle();
});

guncelle();
