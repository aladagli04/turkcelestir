const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({ headless: true, pipe: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', userDataDir: __dirname + '/profil', enableExtensions: ['D:/Projects/turkcelestir/eklenti'] });
  const sw = await b.waitForTarget(t => t.type() === 'service_worker' && t.url().includes('arka.js'));
  const id = new URL(sw.url()).host;
  const p = await b.newPage();
  await p.goto('chrome-extension://' + id + '/ayarlar.html');
  await new Promise(r => setTimeout(r, 1500));
  console.log(await p.evaluate(async () => {
    if (typeof LanguageModel === 'undefined') return 'LanguageModel yok';
    const s = async l => await LanguageModel.availability({ expectedInputs: [{ type: 'text', languages: [l] }], expectedOutputs: [{ type: 'text', languages: [l] }] }).catch(e => 'HATA ' + e.message);
    let params = null; try { params = await LanguageModel.params(); } catch (e) { params = 'HATA ' + e.message; }
    return JSON.stringify({ tr: await s('tr'), en: await s('en'), de: await s('de'), params, durumYazi: document.getElementById('durum').textContent });
  }));
  await b.close();
})();
