// Capturas de las pantallas principales (para revisar el diseño)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const out = path.resolve(__dirname, '../shots'); fs.mkdirSync(out, {recursive:true});
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']}); const pg = await b.newPage({viewport:{width:1440,height:900}}); const errs=[];
  pg.on('pageerror', e => errs.push(e.message)); await pg.route('https://**', r => r.abort());
  await pg.goto('file://' + path.resolve(__dirname, '../ArmaLab-offline.html')); await pg.waitForTimeout(1200);
  await pg.click('#fab'); await pg.fill('#chatIn', 'quiero diseñar un árbol sakura de 3 metros, ¿qué papel uso?'); await pg.press('#chatIn','Enter'); await pg.waitForTimeout(900);
  await pg.screenshot({path:out+'/1-armi.png'});
  await pg.click('#chatClose'); await pg.click('.tabs[data-group="L"] [data-tab="modelar"]'); await pg.waitForTimeout(300); await pg.screenshot({path:out+'/2-modelar.png'});
  await pg.click('[data-tpl="casita"]').catch(()=>{}); await pg.evaluate(()=>{ fromTemplate('casita'); setProject(state.project); state.tabR='compras'; showTabs(); }); await pg.waitForTimeout(500); await pg.screenshot({path:out+'/3-compras.png'});
  await pg.evaluate(()=>showMaterial('corrD')); await pg.waitForTimeout(200); await pg.screenshot({path:out+'/4-ficha.png'}); await pg.click('#closeModal');
  await pg.evaluate(()=>{ state.tabR='piezas'; showTabs(); }); await pg.screenshot({path:out+'/5-piezas.png'});
  await pg.setViewportSize({width:400,height:850}); await pg.waitForTimeout(400); await pg.screenshot({path:out+'/6-celu.png', fullPage:false});
  console.log('errores:', errs); await b.close(); })();
