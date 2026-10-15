// Chrome Web Store ekran görüntüleri: 1280x800, gerçek eklentiyle üretilir.
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');
const EKLENTI = 'D:/Projects/turkcelestir/eklenti';
const CIKTI = 'D:/Projects/turkcelestir/magaza';

const SAYFA = (metin, baslik, alt) => `<!doctype html><html lang="tr"><meta charset="utf-8"><body style="margin:0;width:1280px;height:800px;font-family:'Segoe UI',system-ui,sans-serif;background:linear-gradient(135deg,#e30a17,#8f0510);color:#fff;display:flex;align-items:center;justify-content:center;gap:56px">
<div style="width:440px">
  <div style="font-size:20px;opacity:.85;margin-bottom:10px">Türkçeleştir</div>
  <div style="font-size:38px;font-weight:700;line-height:1.2">${baslik}</div>
  <div style="font-size:22px;margin-top:18px;opacity:.95;line-height:1.4">${alt}</div>
</div>
<div style="width:520px;background:#fff;color:#1d1d1f;border-radius:14px;padding:22px;box-shadow:0 18px 40px rgba(0,0,0,.35)">
  <div style="font-size:15px;color:#666;margin-bottom:8px">Forum · Yanıt yaz</div>
  <textarea id="kutu" spellcheck="false" style="width:100%;box-sizing:border-box;height:260px;font:19px/1.5 'Segoe UI',system-ui,sans-serif;padding:14px;border:1px solid #bbb;border-radius:10px">${metin}</textarea>
  <div style="margin-top:14px;display:flex;justify-content:flex-end"><span style="background:#e30a17;color:#fff;padding:10px 22px;border-radius:8px;font-size:16px">Gönder</span></div>
</div></body></html>`;

const ILK = 'merhaba arkadaslar, bugun cok guzel bir gun .yarin istanbula gidiyorum,siz de gelecek misiniz';
const SONRA = 'Merhaba arkadaşlar, bugün çok güzel bir gün. Yarın İstanbul\'a gidiyorum, siz de gelecek misiniz?';

const ekranlar = [
  { ad: '1-once.png', baslik: 'Türkçe karakterleri olmayan bir klavyeyle mi yazdın?', alt: 'Sorun değil. Yazı kutusuna sağ tıkla.', metin: ILK, duzelt: false },
  { ad: '2-sonra.png', baslik: 'Harfler, büyük harf ve noktalama tek tıkla düzelir.', alt: 'Yapay zekâ seçeneği (deneysel) yazım hatalarını ve virgülleri de düzeltir. Kelimelerin hep aynı kalır.', metin: ILK, duzelt: true },
];

http.createServer((q, r) => { r.setHeader('content-type', 'text/html; charset=utf-8'); r.end(q.url.includes('sonra') ? '' : ''); }).listen(8831);

(async () => {
  const tarayici = await puppeteer.launch({
    headless: true, pipe: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: __dirname + '/profil', enableExtensions: [EKLENTI],
  });
  const sw = await (await tarayici.waitForTarget(t => t.type() === 'service_worker' && t.url().includes('arka.js'))).worker();
  const sayfa = await tarayici.newPage();
  await sayfa.setViewport({ width: 1280, height: 800 });
  for (const e of ekranlar) {
    await sayfa.goto('http://localhost:8831/' + e.ad, { waitUntil: 'load' }).catch(() => {});
    // localhost sunucusu boş döner; içeriği doğrudan yazarız
    await sayfa.setContent(SAYFA(e.metin, e.baslik, e.alt), { waitUntil: 'load' });
    await sayfa.click('#kutu');
    if (e.duzelt) {
      await sw.evaluate(async () => { const [s] = await chrome.tabs.query({ active: true }); return await calistir(s, 'tam', 'kisayol', { allFrames: true }); });
      await new Promise(r => setTimeout(r, 400));
    }
    await sayfa.screenshot({ path: path.join(CIKTI, e.ad) });
    console.log(e.ad, await sayfa.$eval('#kutu', x => x.value));
  }
  await tarayici.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
