// Eklentiyi Chrome for Testing'e yükleyip gerçek sayfalarda dener.
const puppeteer = require('puppeteer');
const http = require('http');
const EKLENTI = 'D:/Projects/turkcelestir/eklenti';

// İki farklı köken: localhost:8801 (ana sayfa) ve 127.0.0.1:8802 (iframe içindeki editör, GMX gibi)
http.createServer((q, r) => {
  r.setHeader('content-type', 'text/html; charset=utf-8');
  r.end(`<!doctype html><body><h3>Posta</h3><iframe src="http://127.0.0.1:8802/" style="width:600px;height:200px"></iframe></body>`);
}).listen(8801);
http.createServer((q, r) => {
  r.setHeader('content-type', 'text/html; charset=utf-8');
  r.end(`<!doctype html><body><div id="ed" contenteditable="true"><div>merhaba, bugun cok guzel</div><div>gorusuruz</div></div></body>`);
}).listen(8802);

(async () => {
  const tarayici = await puppeteer.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    userDataDir: __dirname + '/profil',
    pipe: true,
    enableExtensions: [EKLENTI],
  });
  const swHedef = await tarayici.waitForTarget(t => t.type() === 'service_worker' && t.url().includes('arka.js'));
  const sw = await swHedef.worker();
  const calistir = (mod, kaynak, cerceve) => sw.evaluate(async (mod, kaynak, cerceve) => {
    const [sekme] = await chrome.tabs.query({ active: true });
    return await calistir(sekme, mod, kaynak, cerceve);
  }, mod, kaynak, cerceve);

  const sayfa = await tarayici.newPage();
  await sayfa.bringToFront();

  // 1) Google arama kutusu
  await sayfa.goto('https://www.google.de/', { waitUntil: 'networkidle2' });
  const red = await sayfa.$$eval('button', bs => { const b = bs.find(b => /Alle ablehnen|Reject all|Tümünü reddet/i.test(b.textContent)); if (b) { b.click(); return true; } return false; });
  if (red) await new Promise(r => setTimeout(r, 1500));
  await sayfa.click('textarea[name=q]');
  await sayfa.keyboard.type('cocuk oyunlari nasil');
  console.log('google karakter:', JSON.stringify(await calistir('karakter', 'menu', { frameIds: [0] })),
    '->', await sayfa.$eval('textarea[name=q]', e => e.value));

  // 2) Chrome'un sağ tıkta tek kelime seçmesi
  await sayfa.$eval('textarea[name=q]', e => { e.value = ''; });
  await sayfa.keyboard.type('yarin aksam gorusuruz');
  await sayfa.$eval('textarea[name=q]', e => e.setSelectionRange(6, 11));
  console.log('tek kelime seçili:', JSON.stringify(await calistir('tam', 'menu', { frameIds: [0] })),
    '->', await sayfa.$eval('textarea[name=q]', e => e.value));

  // 3) Başka kökenden iframe içindeki editör (kısayol: tüm çerçeveler)
  await sayfa.goto('http://localhost:8801/', { waitUntil: 'load' });
  const cerceve = sayfa.frames().find(f => f.url().includes('8802'));
  await cerceve.click('#ed');
  console.log('iframe kısayol:', JSON.stringify(await calistir('tam', 'kisayol', { allFrames: true })),
    '->', await cerceve.$eval('#ed', e => e.innerText));

  await tarayici.close();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
