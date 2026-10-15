const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: true, pipe: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', userDataDir: __dirname + '/profil', enableExtensions: ['D:/Projects/turkcelestir/eklenti'] });
  const swt = await b.waitForTarget(t => t.type() === 'service_worker' && t.url().includes('arka.js'));
  const id = new URL(swt.url()).host;
  const p = await b.newPage(); const hatalar = [];
  p.on('pageerror', e => hatalar.push(String(e)));
  await p.goto('chrome-extension://' + id + '/pencere.html'); await new Promise(r => setTimeout(r, 800));
  console.log('düğme:', await p.$eval('#izin', e => e.textContent));
  console.log('not  :', await p.$eval('#izinnot', e => e.textContent));
  const sw = await swt.worker();
  console.log('izinler:', JSON.stringify(await sw.evaluate(async () => await chrome.permissions.getAll())));
  console.log('sayfa hataları:', hatalar.length ? hatalar : 'yok');
  await b.close();
})();
