// Capturas de las pantallas principales (para revisar el diseño)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => { const out = path.resolve(__dirname, '../shots'); fs.mkdirSync(out, {recursive:true});
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']}); const errs=[];
  const abrir = async (vp) => { const pg = await b.newPage({viewport:vp}); pg.on('pageerror', e => errs.push(e.message)); await pg.route('https://**', r => r.abort()); await pg.goto('file://' + path.resolve(__dirname, '../ArmaLab-offline.html')); await pg.waitForTimeout(1200); return pg; };
  const pg = await abrir({width:1440,height:900});
  for (const [t, p] of [['sakura',{}],['arbolG',{H:300}]]){ await pg.evaluate(([t,p])=>{ fromTemplate(t,p); setProject(state.project); }, [t,p]); await pg.waitForTimeout(500); await pg.screenshot({path:`${out}/arbol-${t}.png`}); }
  await pg.click('#fab'); await pg.fill('#chatIn', 'quiero un cartel con palo para una marcha que diga "EDUCACIÓN PÚBLICA"'); await pg.press('#chatIn','Enter'); await pg.waitForTimeout(800);
  await pg.screenshot({path:out+'/cartel-armi.png'});
  const m = await abrir({width:400,height:850}); await m.evaluate(()=>{ fromTemplate('arbolG',{H:300}); setProject(state.project); }); await m.waitForTimeout(500);
  const t0 = Date.now(); await m.evaluate(()=>{ for (let i=0;i<10;i++){ camera.position.x += 1; renderer.render(scene, camera); } }); console.log('celu 10 frames ms', Date.now()-t0, await m.evaluate(()=>LIVIANO));
  await m.screenshot({path:out+'/celu-arbol.png'});
  console.log('errores:', errs); await b.close(); })();
