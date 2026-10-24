const monSel = document.getElementById('monSel');
const wait = ms => new Promise(r => { const t0 = performance.now(); const f = () => performance.now() - t0 >= ms ? r() : requestAnimationFrame(f); f(); });
monSel.value = 'em044_00'; await monSel.onchange(); await wait(2000);
return { cur: monSel.value, id: window.__view.state && window.__view.state.id, rows: [...document.querySelectorAll('[data-row]')].map(e => e.tagName + ':' + e.dataset.row + ':' + (e.querySelector('select') ? [...e.querySelector('select').options].map(o => o.textContent).join('/') : '-')) };
