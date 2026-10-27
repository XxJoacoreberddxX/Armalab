// 50 pruebas automáticas de ArmaLab (Playwright)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const results = []; const ok = (n, c, d='') => { results.push({n, c:!!c, d}); };
(async () => {
  const b = await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const ctx = await b.newContext({viewport:{width:1440,height:900}}); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type()==='error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await pg.route('https://**', r => r.fulfill({body:'', contentType:'text/css'}));
  await pg.goto('file://' + path.resolve(__dirname, '../ArmaLab-offline.html')); await pg.waitForTimeout(1500);
  const E = (f, a) => pg.evaluate(f, a);
  // helper en la página: carga plantilla con params y devuelve datos
  await E(() => {
    window.T = {
      load(id, params){ fromTemplate(id, params); state.project.nombre = 'test'; setProject(state.project); return state.project; },
      boxes(){ const o = {}; state.project.pieces.forEach(p=>{ const bb = new THREE.Box3().setFromObject(objs.get(p.id)); o[p.id] = {min:bb.min.toArray(), max:bb.max.toArray(), nombre:p.p.nombre, kind:p.kind}; }); return o; },
      simple(pts){ const n = pts.length; const X = (a,b,c,d)=>{ const o=(p,q,r)=>Math.sign((q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])); return o(a,b,c)*o(a,b,d)<0 && o(c,d,a)*o(c,d,b)<0; };
        for (let i=0;i<n;i++) for (let j=i+2;j<n;j++){ if (i===0 && j===n-1) continue; if (X(pts[i],pts[(i+1)%n],pts[j],pts[(j+1)%n])) return false; } return true; },
      inside(pt, poly){ let c=false; for (let i=0,j=poly.length-1;i<poly.length;j=i++){ const [xi,yi]=poly[i],[xj,yj]=poly[j]; if ((yi>pt[1])!==(yj>pt[1]) && pt[0] < (xj-xi)*(pt[1]-yi)/(yj-yi)+xi) c=!c; } return c; },
      total(){ return computeBOM().lines.filter(l=>l.cat!=='herramienta'&&!l.opcional&&!state.tengo.has(l.id)).reduce((a,l)=>a+l.sub,0); },
    };
  });

  /* ===== CASITA CHICA (8 × 7 × 6 + techo 3, cartón 2 mm) ===== */
  const cas = await E(() => { const p = T.load('casita', {}); return {p, cuts: allCuts(), boxes: T.boxes(), bom: computeBOM(), pages: buildPages()}; });
  const by = n => cas.p.pieces.filter(x=>x.p.nombre===n);
  const t = 0.2;
  ok('01 Casita: 7 piezas (piso, frente, fondo, 2 laterales, 2 techos)', cas.p.pieces.length===7);
  ok('02 Piso = 8 × 7 cm', by('Piso')[0].p.w===8 && by('Piso')[0].p.h===7);
  const fc = cas.cuts.find(c=>c.nombre==='Frente');
  ok('03 Frente = 8 cm de ancho × 9 cm a la punta', Math.abs(fc.w-8)<1e-6 && Math.abs(fc.h-9)<1e-6, `${fc.w}×${fc.h}`);
  const la = by('Lateral')[0];
  ok('04 Laterales = 6 × 6,6 cm (7 − 2×0,2 de espesor)', la.p.w===6 && Math.abs(la.p.h-6.6)<1e-6, `${la.p.w}×${la.p.h}`);
  const B = cas.boxes; const id = n => by(n).map(x=>x.id);
  const fr = B[id('Frente')[0]], fo = B[id('Fondo')[0]], l1 = B[id('Lateral')[0]], l2 = B[id('Lateral')[1]], pi = B[id('Piso')[0]];
  ok('05 Lateral encaja justo entre frente y fondo (sin hueco ni choque)', Math.abs(l1.max[2]-fr.min[2])<0.01 && Math.abs(l1.min[2]-fo.max[2])<0.01, `${l1.max[2]} vs ${fr.min[2]}`);
  ok('06 Laterales al ras del borde del frente', Math.abs(l1.max[0]-4)<0.01 && Math.abs(l2.min[0]+4)<0.01);
  ok('07 Paredes apoyadas sobre el piso (y = espesor)', Math.abs(fr.min[1]-t)<0.01 && Math.abs(l1.min[1]-t)<0.01 && Math.abs(pi.min[1])<0.01);
  ok('08 Huella de la casa = 8 × 7 cm', Math.abs(pi.max[0]-pi.min[0]-8)<0.01 && Math.abs(pi.max[2]-pi.min[2]-7)<0.01);
  const te = by('Techo')[0]; const slope = Math.hypot(4,3);
  ok('09 Techo cubre la pendiente + alero (≥ 5,5 cm)', te.p.w >= slope+0.5-0.05, `${te.p.w} vs ${slope+0.5}`);
  ok('10 Techo sobresale 0,5 cm adelante y atrás (7 + 1 = 8)', te.p.h===8);
  const r1b = B[id('Techo')[0]], r2b = B[id('Techo')[1]];
  ok('11 Las dos aguas se tocan en el lomo (centro)', r1b.min[0] < 0.3 && r2b.max[0] > -0.3, `${r1b.min[0]} / ${r2b.max[0]}`);
  ok('12 Techo apoya sobre la punta del frente (sin quedar flotando)', Math.min(r1b.min[1], r2b.min[1]) <= t+6+0.05);
  const front = by('Frente')[0];
  ok('13 La puerta está dentro del frente', front.p.holes[0].every(q=>q[1]>0 && Math.abs(q[0])<4));
  const fondo = by('Fondo')[0];
  ok('14 La ventana está dentro del fondo y no toca bordes', fondo.p.holes[0].every(q=>q[1]>0.5 && q[1]<6 && Math.abs(q[0])<3.5));
  ok('15 Frente es polígono válido (sin cruces)', await E(pts=>T.simple(pts), front.p.pts));
  ok('16 Todas las piezas entran en hojas A4 (sin “no entra”)', cas.pages.overs.length===0, cas.pages.overs.length);
  const ovl = await E(() => { const {pages} = buildPages(); let bad = 0; pages.forEach(pg=>{ const P = pg.placed; for (let i=0;i<P.length;i++) for (let j=i+1;j<P.length;j++){ const a=P[i], b=P[j]; if (a.x < b.x+b.w-1e-6 && b.x < a.x+a.w-1e-6 && a.y < b.y+b.h-1e-6 && b.y < a.y+a.h-1e-6) bad++; } }); return bad; });
  ok('17 Ninguna plantilla se superpone en la hoja', ovl===0, ovl);
  const inA4 = await E(() => buildPages().pages.every(pg=>pg.placed.every(p=>p.x>=0 && p.y>=0 && p.x+p.w<=19.0001 && p.y+p.h<=25.8001)));
  ok('18 Todas las plantillas quedan dentro del margen A4', inA4);
  const cartonLine = cas.bom.lines.find(l=>l.nombre.startsWith('Cartón gris N°12 · 2 mm'));
  ok('19 Compra: 1 hoja de cartón gris 2 mm 35×50 alcanza', cartonLine && cartonLine.n===1, cartonLine && cartonLine.n);
  ok('20 Compra: 1 hoja de microcorrugado para el techo', cas.bom.lines.some(l=>l.nombre.startsWith('Microcorrugado') && l.n===1));
  ok('21 Pide Plasticola (cartón con cartón)', cas.bom.lines.some(l=>(l.id==='plasticola'||l.id==='cola1k')));
  const svg = await E(() => svgPage(buildPages().pages[0],1,1));
  ok('22 Plantilla SVG en tamaño real A4 (210×297 mm)', svg.includes('width="210mm"') && svg.includes('viewBox="0 0 210 297"'));
  ok('23 Barra de control mide 50 mm', svg.includes('<rect width="50" height="5"'));
  // espesores distintos
  const c3 = await E(() => { const p = T.load('casita', {mat:'cg3c'}); return p.pieces.filter(x=>x.p.nombre==='Lateral')[0].p.h; });
  ok('24 Con cartón 3 mm el lateral se acorta a 6,4 cm', Math.abs(c3-6.4)<1e-6, c3);
  const cf = await E(() => { const p = T.load('casita', {mat:'foam'}); return p.pieces.filter(x=>x.p.nombre==='Lateral')[0].p.h; });
  ok('25 Con foam 5 mm el lateral se acorta a 6 cm', Math.abs(cf-6)<1e-6, cf);
  const sinp = await E(() => T.load('casita', {puerta:'no'}).pieces.filter(x=>x.kind==='perfil').every(x=>!x.p.holes.length));
  ok('26 Sin puerta/ventana: no hay calados', sinp);
  const mismo = await E(() => T.load('casita', {techo:'mismo'}).pieces.filter(x=>x.p.nombre==='Techo').every(x=>x.mat==='cg2c'));
  ok('27 Techo “mismo cartón” usa el cartón de las paredes', mismo);
  const big = await E(() => { T.load('casita', {W:40, D:40, Hw:30}); return buildPages().overs.length; });
  ok('28 Casa gigante (40 cm): avisa piezas que no entran en A4', big>0, big);

  /* ===== ÁRBOL DE ENCASTRE ===== */
  const enc = await E(() => { const out = {}; for (const m of ['cg1c','cg15','cg2c','cg3c','micro','foam']){ const p = T.load('encastre', {mat:m}); const A = p.pieces.filter(x=>x.kind==='perfil'); out[m] = {s:A[0].p.ranura, esp:MAT[m].esp, ry:A[0].p.ry, simpleA:T.simple(A[0].p.pts), simpleB:T.simple(A[1].p.pts), cruz:p.pieces[1].p.cruz}; } return out; });
  ok('29 Ranura = espesor + 0,25 mm en los 6 cartones', Object.values(enc).every(v=>Math.abs(v.s*10 - (v.esp+0.25))<0.051), JSON.stringify(Object.values(enc).map(v=>v.s*10)));
  ok('30 Perfil A sin cruces de líneas (6 materiales)', Object.values(enc).every(v=>v.simpleA));
  ok('31 Perfil B sin cruces de líneas (6 materiales)', Object.values(enc).every(v=>v.simpleB));
  const e2 = await E(() => { const p = T.load('encastre', {}); const A = p.pieces[2], Bp = p.pieces[3]; const ys = A.p.pts.map(q=>q[1]); const Ht = Math.max(...ys);
    // ranura de A: puntos en x=±s/2 y y=ry ; de B: idem desde abajo
    return {Ht, ry:A.p.ry, Aslot:A.p.pts.filter(q=>Math.abs(Math.abs(q[0])-A.p.ranura/2)<1e-9).map(q=>q[1]), Bslot:Bp.p.pts.filter(q=>Math.abs(Math.abs(q[0])-Bp.p.ranura/2)<1e-9).map(q=>q[1]), boxes:T.boxes(), cruz:p.pieces[1].p.cruz, s:A.p.ranura}; });
  ok('32 Ranura A (de arriba) + ranura B (de abajo) = altura del perfil', Math.abs((e2.Ht - Math.min(...e2.Aslot)) + Math.max(...e2.Bslot) - e2.Ht) < 0.01, `${e2.Ht} ${Math.min(...e2.Aslot)} ${Math.max(...e2.Bslot)}`);
  const hEnc = Math.max(...Object.values(e2.boxes).map(x=>x.max[1]));
  ok('33 Altura total del árbol de encastre = 15 cm', Math.abs(hEnc-15)<0.15, hEnc);
  ok('34 Cruz de la base = ancho de ranura', Math.abs(e2.cruz.s - e2.s)<1e-9);
  const w1 = await E(() => { T.load('encastre', {mat:'cg1c'}); return state.project.pieces.filter(p=>p.kind==='perfil').some(p=>!aguanta(p, objs.get(p.id)).ok); });
  ok('35 Cartón 1 mm para 15 cm: avisa que se dobla', w1);
  const w3 = await E(() => { T.load('encastre', {mat:'cg3c'}); return state.project.pieces.filter(p=>p.kind==='perfil').every(p=>aguanta(p, objs.get(p.id)).ok); });
  ok('36 Cartón 3 mm para 15 cm: sin aviso', w3);
  const fl = await E(() => [T.load('encastre', {flores:'si'}).pieces.filter(p=>p.kind==='racimo').length, T.load('encastre', {flores:'no'}).pieces.filter(p=>p.kind==='racimo').length]);
  ok('37 Flores sí/no agrega o quita las bolitas', fl[0]===2 && fl[1]===0, fl);

  /* ===== SAKURA ===== */
  const sk = await E(() => [8,15,30].map(H=>{ T.load('sakura', {H}); const hs = Object.values(T.boxes()).map(x=>x.max[1]); const ar = state.project.pieces.find(p=>p.kind==='arbol'); return {H, alto:Math.max(...hs), hebras:ar.p.hebras, c:arbolCalc(ar.p)}; }));
  ok('38 Sakura: altura real ≈ pedida (8, 15 y 30 cm, ±0,6)', sk.every(s=>Math.abs(s.alto-s.H)<=0.6), sk.map(s=>s.alto.toFixed(2)).join(' '));
  ok('39 Hebras entre 8 y 32', sk.every(s=>s.hebras>=8 && s.hebras<=32), sk.map(s=>s.hebras));
  ok('40 Largo de hebra ≈ 2,6 × altura del árbol, redondeado a 5 cm', sk.every(s=>s.c.largo%5===0 && s.c.largo >= 2.4*(s.H-0.7)), sk.map(s=>s.c.largo));
  const det = await E(() => { const a = JSON.stringify(genArbol({H:14,hebras:12,seed:7,dens:1}).flores.slice(0,5)); arbolCache.clear(); const b = JSON.stringify(genArbol({H:14,hebras:12,seed:7,dens:1}).flores.slice(0,5)); return a===b; });
  ok('41 Misma “variante” = mismo árbol (determinístico)', det);
  const telg = await E(() => { T.load('sakura', {base:'telgo2'}); return computeBOM().avisos.join(' '); });
  ok('42 Base de telgopor: avisa silicona de baja temperatura', /baja temperatura/.test(telg));
  const a26 = await E(() => { T.load('sakura', {alambre:'al26'}); const ar = state.project.pieces.find(p=>p.kind==='arbol'); return aguanta(ar).ok; });
  ok('43 Alambre N°26: avisa que es blando para tronco', a26===false);

  /* ===== GENERAL / ROBUSTEZ ===== */
  await E(() => T.load('casita', {}));
  await pg.click('.tabs[data-group="L"] [data-tab="proyecto"]');
  await pg.fill('#tp-W', '999'); await pg.waitForTimeout(150);
  const clampW = await E(() => state.project.template.params.W);
  ok('44 Medida exagerada (999) se limita al máximo (40)', clampW===40, clampW);
  await pg.fill('#tp-W', ''); await pg.waitForTimeout(150);
  const keep = await E(() => state.project.template.params.W);
  ok('45 Campo vacío no rompe nada (mantiene el valor)', keep===40 && !isNaN(await E(()=>T.total())));
  const t0 = await E(() => { T.load('casita', {}); return T.total(); });
  const t1 = await E(() => { precios['cg2c'] = 3000; renderAll(); const v = T.total(); delete precios['cg2c']; renderAll(); return v; });
  ok('46 Cambiar un precio recalcula el total (+$1.600)', Math.round(t1-t0)===1600, `${t0} → ${t1}`);
  const t2 = await E(() => { const id = computeBOM().lines.find(l=>l.id.startsWith('cg2c')).id; state.tengo.add(id); const v = T.total(); state.tengo.delete(id); return v; });
  ok('47 “Ya lo tengo” descuenta del total', Math.round(t0-t2)===1400, `${t0} → ${t2}`);
  const rt = await E(() => { const s = JSON.stringify(state.project); state.project = null; setProject(JSON.parse(s)); return JSON.stringify(state.project.pieces)===JSON.stringify(JSON.parse(s).pieces); });
  await pg.click('.tabs[data-group="L"] [data-tab="proyecto"]'); await pg.click('details summary'); await pg.fill('#impTxt', '{esto no es json'); await pg.click('#imp');
  const msg = await pg.textContent('#impMsg');
  ok('48 Exportar/importar ida y vuelta + código inválido avisa', rt && /no es un proyecto válido/.test(msg), msg);
  // modelador libre: todas las formas con todos los materiales compatibles
  const lib = await E(() => { window.__nan = []; setProject({nombre:'Mi proyecto', template:null, pieces:[], next:1, modificado:false}); let n=0;
    for (const m of MATS) for (const [k,K] of Object.entries(KINDS)){ if (K.soloPlantilla || !K.mats(m)) continue; state.matSel = m.id; addPiece(k); n++; }
    const b = computeBOM(); const nan = b.lines.some(l=>isNaN(l.sub)||isNaN(l.n)); b.lines.filter(l=>isNaN(l.sub)||isNaN(l.n)).forEach(l=>window.__nan.push(l.nombre+' '+l.n+' '+l.sub)); const steps = genericSteps(state.project.pieces).length; buildPages(); return {n, nan, steps, piezas:state.project.pieces.length}; });
  ok('49 Modelador: todas las combinaciones forma×material sin errores ni NaN', lib.n>50 && !lib.nan && lib.steps>3, JSON.stringify(lib) + await E(()=>window.__nan.join('; ')));
  // apoyar, duplicar, borrar con clicks reales
  await E(() => { state.sel = state.project.pieces[0].id; state.tabL='modelar'; showTabs(); renderModelar(); });
  await pg.fill('#e-pos1', '7'); await pg.click('#e-floor'); await pg.waitForTimeout(100);
  const fy = await E(() => new THREE.Box3().setFromObject(objs.get(state.sel)).min.y);
  const n0 = await E(() => state.project.pieces.length); await pg.click('#e-dup'); const n1 = await E(() => state.project.pieces.length); await pg.click('#e-del'); const n2 = await E(() => state.project.pieces.length);
  await pg.setViewportSize({width:400, height:850}); await pg.waitForTimeout(300);
  const sw = await E(() => document.documentElement.scrollWidth);
  ok('50 Apoyar/duplicar/borrar andan, celular sin scroll lateral y 0 errores JS', Math.abs(fy)<0.06 && n1===n0+1 && n2===n0 && sw<=400 && errs.length===0, `y=${fy} ${n0}/${n1}/${n2} sw=${sw} errs=${errs.slice(0,3).join(' | ')}`);


  /* ===== 0.2.0: GRAN ESCALA, FÍSICA Y PRECIOS ===== */
  const fl2 = await E(() => { const p = T.load('flor', {D:60, petalos:8, capas:3}); const pet = p.pieces.filter(x=>x.kind==='perfil'); return {n:pet.length, q:pet.map(x=>x.p.qty), veta:pet.every(x=>x.p.veta), L1:Math.max(...pet[0].p.pts.map(q=>q[1])), v:vuelco().th}; });
  ok('51 Flor: 3 capas × 8 pétalos, con veta marcada', fl2.n===3 && fl2.q.every(q=>q===8) && fl2.veta, JSON.stringify(fl2));
  ok('52 Flor: pétalo exterior = radio (30 cm)', Math.abs(fl2.L1-30)<0.1, fl2.L1);
  ok('53 Flor de pared: no calcula vuelco (se cuelga)', fl2.v===null);
  const st = await E(() => { const p = T.load('standee', {H:170}); const cab = p.pieces.find(x=>x.p.nombre==='Caballete'); const fig = p.pieces.find(x=>x.p.nombre==='Figura'); return {cab:cab.p.h, simple:T.simple(fig.p.pts), hf:Math.max(...fig.p.pts.map(q=>q[1])), av:computeBOM(1).avisos.join(' ')}; });
  ok('54 Standee: caballete = 75 % de la altura (127,5 cm)', Math.abs(st.cab-127.5)<0.1, st.cab);
  ok('55 Standee: silueta válida y de 170 cm', st.simple && Math.abs(st.hf-170)<1, `${st.simple} ${st.hf}`);
  ok('56 Standee: avisa que la figura va en 2 placas de foam', /2 partes/.test(st.av), st.av);
  const lz = await E(() => [0,1,3].map(k=>{ T.load('standee', {lastre:k}); return vuelco().th; }));
  ok('57 Standee: más lastre = más estable', lz[0] < lz[1] && lz[1] < lz[2], lz.map(x=>x.toFixed(1)).join(' < '));
  const ag = await E(() => [120,250,350].map(H=>{ T.load('arbolG', {H}); return sceneBox().max.y; }));
  ok('58 Árbol grande: altura real ≈ pedida (1,2 / 2,5 / 3,5 m, ±5 %)', ag.every((h,i)=>Math.abs(h-[120,250,350][i]) <= [120,250,350][i]*0.05), ag.map(h=>h.toFixed(0)).join(' '));
  const agk = await E(() => { T.load('arbolG', {H:250}); return computeBOM(1).lines.find(l=>l.mid==='galv16').n; });
  ok('59 Árbol 2,5 m: 1 kg de alambre galvanizado alcanza', agk===1, agk);
  const agb = await E(() => ['b10','b20'].map(b=>{ T.load('arbolG', {H:300, base:b}); return vuelco().th; }));
  ok('60 Árbol 3 m: base de 20 L más estable que la de 10 L', agb[1] > agb[0], agb.map(x=>x.toFixed(1)).join(' vs '));
  const mc = await E(() => [macheCalc({d:35, alto:40, capas:4, hum:1}), macheCalc({d:35, alto:40, capas:4, hum:1.5})]);
  ok('61 Papel maché: 4 capas = 2 tandas = 48 h', mc[0].tandas===2 && mc[0].horas===48, JSON.stringify(mc[0]));
  ok('62 Papel maché: clima húmedo ×1,5 (72 h)', mc[1].horas===72, mc[1].horas);
  const le = await E(() => { const p = T.load('letras', {texto:'ÁRBOL', alto:20}); const per = p.pieces.filter(x=>x.kind==='perfil'); const ti = p.pieces.filter(x=>x.kind==='placa');
    const k = per[0]; const perim = polyPerim(k.p.pts) + (k.p.holes||[]).reduce((s,h)=>s+polyPerim(h),0); return {nombre:TEMPLATES.letras.titulo(p.template.params), nper:per.length, nti:ti.length, tira:ti[0].p.w, perim, alto:Math.max(...per.flatMap(x=>x.p.pts.map(q=>q[1])))}; });
  ok('63 Letras: “ÁRBOL” → ARBOL, un frente/fondo y una tira por letra', le.nombre==='Letras ARBOL' && le.nper===5 && le.nti===5, JSON.stringify(le));
  ok('64 Letras: tira lateral = contorno + 1 cm de solape', Math.abs(le.tira - (le.perim+1)) < 0.15, `${le.tira} vs ${le.perim+1}`);
  ok('65 Letras: alto de letra ≈ 20 cm', Math.abs(le.alto-20) < 0.6, le.alto);
  const cj = await E(() => { const p = T.load('caja', {W:10, D:8, H:6, mat:'cartulina'}); const tr = p.pieces.filter(x=>x.kind==='perfil'); const xs = tr[1].p.pts.map(q=>q[0]); const anchoTapa = tr[1].p.pts[1][0]-tr[1].p.pts[0][0];
    return {simple:tr.every(x=>T.simple(x.p.pts)), folds:tr[0].p.folds.length, anchoTapa}; });
  ok('66 Caja: troqueles válidos con 8 líneas de pliegue', cj.simple && cj.folds===8, JSON.stringify(cj));
  ok('67 Caja: la tapa es 2×espesor + 2 mm más ancha (10,24 cm)', Math.abs(cj.anchoTapa - 10.24) < 0.06, cj.anchoTapa);
  const nu = await E(() => { T.load('sakura', {}); const a = totalMat(computeBOM(1, true)); const b = totalMat(computeBOM(20, true))/20; return [a,b]; });
  ok('68 Hacer 20 unidades baja el costo por unidad', nu[1] < nu[0]*0.8, nu.map(Math.round).join(' → '));
  const tr = await E(() => { T.load('sakura', {}); return [totalMat(computeBOM(100, false)), totalMat(computeBOM(100, true))]; });
  ok('69 Pago por transferencia aplica descuentos mayoristas', tr[1] < tr[0], tr.map(Math.round).join(' → '));
  const may = await E(() => { const r = []; for (const t of ['casita','sakura','letras','arbolG']){ T.load(t, {}); for (const N of [1,10,100]) computeBOM(N, true).lines.filter(l=>l.cat==='material').forEach(l=>r.push(l.best.cost <= l.retail.cost + 0.5)); } return r.every(Boolean); });
  ok('70 Siempre elige la compra más barata (nunca peor que suelto)', may);
  const rig = await E(() => rigidezRel(2,1));
  ok('71 Rigidez: 2 mm ≈ 6 veces más rígido que 1 mm (t^2,6)', Math.abs(rig-6.06) < 0.05, rig);
  const til = await E(() => { T.load('flor', {D:150}); const {tiles} = buildPages(); const t0 = tiles[0]; const svgs = allPagesSVG(true); return {n:tiles.length, ok:tiles.every(t=>t.r<t.rows && t.q<t.cols), svg:svgs.every(s=>s.startsWith('<svg') && s.endsWith('</svg>')), codes:svgs.some(s=>/>A2</.test(s))}; });
  ok('72 Pétalos de 75 cm salen en mosaico A4 con códigos A1, A2…', til.n>0 && til.ok && til.svg && til.codes, JSON.stringify(til));
  const tx = await E(() => { setProject({nombre:'t', template:null, pieces:[], next:1}); state.matSel='crepe'; addPiece('placa'); const pc = state.project.pieces[0]; const a0 = cutsOf(pc)[0]; pc.p.tex='retorcido'; const a1 = cutsOf(pc)[0]; return (a1.w*a1.h)/(a0.w*a0.h); });
  ok('73 Textura “retorcido” agranda el papel 2,5 veces', Math.abs(tx-2.5) < 0.01, tx);
  await pg.click('.tabs[data-group="L"] [data-tab="tecnicas"]'); await E(() => document.querySelectorAll('#L-tecnicas details').forEach(d=>d.open=true)); await pg.fill('#k-vb','30'); await pg.fill('#k-vh','80');
  const kv = await pg.textContent('#k-vout');
  ok('74 Calculadora de vuelco: base 30 / altura 80 → 10,6° (se cae)', /10,6°/.test(kv) && /se cae/.test(kv), kv);
  await pg.click('#verBtn'); const mo = await E(() => !document.querySelector('#modal').hidden && /0\.2\.0/.test(document.querySelector('#modal').textContent)); await pg.click('#closeModal');
  ok('75 Novedades v0.2.0 abre y cierra', mo && await E(() => document.querySelector('#modal').hidden));
  const gr = await E(() => { T.load('arbolG', {H:300}); return gridSize; });
  ok('76 La cuadrícula se agranda para piezas de metros', gr >= 300, gr);
  // casita chica para el informe
  await pg.setViewportSize({width:1440, height:900});
  const casita = await E(() => { T.load('casita', {}); return {cuts: allCuts().map(c=>({pid:c.pid, nombre:c.nombre, mat:MAT[c.mat].nombre, medida:c.medida})), bom: computeBOM().lines.map(l=>`${l.cat}|${l.nombre}|${l.cant} ${l.unidad}|${l.sub}|${l.opcional?'opc':''}`), pasos: TEMPLATES.casita.steps(state.project.template.params, state.project.pieces).map(s=>s.t), tiempo: fmtT(tiempoMin()), total:T.total()}; });
  await E(() => { state.tabL='proyecto'; state.tabR='piezas'; showTabs(); fit(); }); await pg.waitForTimeout(600);
  
  ok('77 Sin errores de JavaScript en todas las pruebas', errs.length===0, errs.slice(0,3).join(' | '));
  const pass = results.filter(r=>r.c).length;
  results.forEach(r => console.log(`${r.c?'✅':'❌'} ${r.n}${r.c?'':'  → '+r.d}`));
  console.log(`\n${pass}/${results.length} OK`);
  await b.close();
})();
