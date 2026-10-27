const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const pg = await b.newPage({viewport:{width:1440,height:900}}); const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERR '+e.message)); pg.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
  await pg.route('https://**', r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../ArmaLab-offline.html')); await pg.waitForTimeout(1500);
  for (const t of ['sakura','encastre','casita','caja','flor','standee','arbolG','mache','letras']){
    await pg.click(`[data-tpl="${t}"]`); await pg.waitForTimeout(700);
    await pg.screenshot({path:`shots/${t}.png`});
    const info = await pg.evaluate(() => ({stats: document.querySelector('#hud').innerText.replace(/\n/g,' | '), n: state.project.pieces.length}));
    console.log(t, JSON.stringify(info));
  }
  for (const tab of ['compras','pasos','plantillas']) { await pg.click(`.tabs[data-group="R"] [data-tab="${tab}"]`); await pg.waitForTimeout(400); await pg.screenshot({path:`shots/letras-${tab}.png`}); }
  await pg.click('.tabs[data-group="L"] [data-tab="tecnicas"]'); await pg.waitForTimeout(300); await pg.screenshot({path:'shots/tecnicas.png'});
  console.log('ERRS', errs.slice(0,10).join('\n'));
  await b.close();
})();
