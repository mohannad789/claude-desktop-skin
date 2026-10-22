// Project tags + colour picker + column split, all stored in this app's own localStorage
// ("claudeSkin"), so choices made in the sidebar survive restarts with no files to edit.
//  - Each project block gets data-cskin-project (its name); coloured ones get --cskin-color.
//  - A small dot appears at the right end of a project's line on hover; clicking it opens a
//    palette (20 colours + none), tags, and "Right column starts here".
//  - A MutationObserver re-applies everything when the app redraws the list.
const PALETTE = [['Red','hsl(0 72% 55%)'],['Rose','hsl(350 75% 62%)'],['Pink','hsl(330 70% 62%)'],['Fuchsia','hsl(295 60% 58%)'],
  ['Purple','hsl(272 58% 58%)'],['Violet','hsl(255 60% 62%)'],['Indigo','hsl(236 58% 60%)'],['Blue','hsl(214 80% 55%)'],
  ['Sky','hsl(198 85% 52%)'],['Cyan','hsl(186 75% 42%)'],['Teal','hsl(172 62% 38%)'],['Emerald','hsl(155 60% 40%)'],
  ['Green','hsl(135 50% 44%)'],['Lime','hsl(85 60% 42%)'],['Olive','hsl(62 45% 40%)'],['Yellow','hsl(48 92% 48%)'],
  ['Amber','hsl(38 92% 50%)'],['Orange','hsl(24 90% 55%)'],['Brown','hsl(25 40% 42%)'],['Slate','hsl(215 20% 42%)']];
const svg = d => `<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const ICON = {
  columns: svg('<rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M8 2.5v11"/><path d="M10.2 8h2M11.6 6.6 13 8l-1.4 1.4"/>'),
  collapse: svg('<path d="M4.5 2.5 8 6l3.5-3.5M4.5 13.5 8 10l3.5 3.5"/>'),
  expand: svg('<path d="M4.5 6.5 8 3l3.5 3.5M4.5 9.5 8 13l3.5-3.5"/>'),
  check: svg('<path d="m3.5 8.5 3 3 6-7"/>').replace('width="13"', 'width="12" class="cskin-check"'),
};
const load = () => { try { return JSON.parse(localStorage.getItem('claudeSkin')) || {}; } catch { return {}; } };
const save = s => localStorage.setItem('claudeSkin', JSON.stringify(s));
const clean = t => t.replace(/[^\p{L}\p{N}\s\-()&.,'+]+/gu, '').replace(/\s+/g, ' ').trim();

const closePalette = () => document.getElementById('cskin-palette')?.remove();
const openPalette = (name, anchor) => {
  closePalette();
  const st = load(), r = anchor.getBoundingClientRect();
  const p = document.createElement('div'); p.id = 'cskin-palette';
  p.style.left = Math.round(r.right + 6) + 'px'; p.style.top = Math.round(r.top - 8) + 'px';
  const head = document.createElement('div'); head.className = 'cskin-p-head'; head.textContent = name; head.title = name; p.append(head);   // project name on top (2026-10-22)
  const grid = document.createElement('div'); grid.className = 'cskin-p-grid';
  const pick = color => { const s = load(); s.colors = s.colors || {}; if (color) s.colors[name] = color; else delete s.colors[name]; save(s); closePalette(); tagAll(); };
  for (const [label, c] of PALETTE) { const b = document.createElement('button'); b.title = label; b.style.background = c;
    if ((st.colors || {})[name] === c) b.className = 'on'; b.onclick = () => pick(c); grid.append(b); }
  const none = document.createElement('button'); none.className = 'cskin-none' + ((st.colors || {})[name] ? '' : ' on');
  none.title = 'Default (grey)'; none.onclick = () => pick(null); grid.append(none);
  p.append(grid);
  p.append(tagSection(name));
  const isSplit = (st.split || CFG.rightColumnStartsAt) === name;
  const split = document.createElement('button'); split.className = 'cskin-p-row';
  split.innerHTML = ICON.columns + '<span>Right column starts here</span>' + (isSplit ? ICON.check : '');
  split.onclick = () => { const s = load(); s.split = name; save(s); closePalette(); tagAll(); }; p.append(split);
  const ord = orderSection(name); if (ord) p.append(ord);
  document.body.append(p);
  // keep the whole menu on screen: near the bottom it opens upward (it used to run off the window, 2026-10-12)
  const fit = () => { const h = p.offsetHeight, top0 = Math.round(r.top - 8), lim = innerHeight - 8;
    p.style.maxHeight = (innerHeight - 16) + 'px'; p.style.overflowY = h > innerHeight - 16 ? 'auto' : '';
    p.style.top = Math.max(8, top0 + h > lim ? lim - h : top0) + 'px'; };
  fit(); new ResizeObserver(fit).observe(p);
  const outside = e => { if (!p.isConnected) { document.removeEventListener('pointerdown', outside, true); return; }
    if (!p.contains(e.target)) { document.removeEventListener('pointerdown', outside, true); closePalette(); } };
  setTimeout(() => document.addEventListener('pointerdown', outside, true), 0);
};

const addSearchButton = () => {
  const tb = document.querySelector('aside.dframe-sidebar > .df-titlebar');
  if (!tb || tb.querySelector('.cskin-search')) return;
  const b = document.createElement('button'); b.className = 'cskin-search'; b.title = 'Search (⌘K)';
  b.innerHTML = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>';
  b.addEventListener('click', e => { e.stopPropagation(); document.querySelector('aside .df-search-field')?.click(); });
  tb.append(b);
};
// --- Our own sidebar resize handle: the app won't go below 242 px. Drag the sidebar's right edge;
// width is kept between 170 and 600 px and remembered (localStorage claudeSkin.sidebarW).
const setWidth = w => {        // one small <style> drives both the sidebar and the app's layout variable
  let st = document.getElementById('cskin-width');
  if (!w) { st?.remove(); return; }
  if (!st) { st = document.createElement('style'); st.id = 'cskin-width'; document.head.append(st); }
  st.textContent = `.dframe-root { --df-sidebar-width: ${w}px !important; }
    aside.dframe-sidebar { width: ${w}px !important; min-width: 0 !important; flex: none !important; }`;
};
// The app keeps its own sidebar width (localStorage dframe-store, 242 by default) and draws some things with it: the
// start-up placeholder, skeletons while a session loads. With the skin's sidebar narrower, those stuck out past it as
// grey bars and a thin line (seen 2026-10-06). So the skin writes its width into the app's setting as well.
const syncAppWidth = w => { for (const k of ['dframe-store', 'dframe-store.backup.v1']) { try {
  const v = JSON.parse(localStorage.getItem(k) || 'null'); if (!v || !v.state || v.state.sidebarWidth === w) continue;
  v.state.sidebarWidth = w; localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
const applySidebarWidth = () => {
  const a = document.querySelector('aside.dframe-sidebar'); if (!a) return;
  const w = load().sidebarW;
  if (w && !document.getElementById('cskin-width')) setWidth(w);
  if (w) syncAppWidth(w);
  if (!a.querySelector(':scope > .cskin-resize')) {
    const h = document.createElement('div'); h.className = 'cskin-resize'; h.title = 'Drag to resize (double-click: default width)';
    h.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId);
      const left = a.getBoundingClientRect().left; let cur = null; document.body.classList.add('cskin-resizing');
      const move = ev => { cur = Math.round(Math.min(600, Math.max(170, ev.clientX - left))); setWidth(cur); applyFont(); };
      const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); document.body.classList.remove('cskin-resizing');
        if (cur) { const s = load(); s.sidebarW = cur; save(s); syncAppWidth(cur); } };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up);
    });
    h.addEventListener('dblclick', () => { const s = load(); delete s.sidebarW; save(s); setWidth(null); applyFont(); });
    a.append(h);
  }
};

// --- Tags: one shared list (claudeSkin.tags = [{id, name}]); each project keeps tag ids (claudeSkin.projTags).
// Renaming or deleting a tag changes it on every project at once.
const TAG_COLORS = ['hsl(214 80% 55%)', 'hsl(140 55% 42%)', 'hsl(36 92% 50%)', 'hsl(350 72% 58%)', 'hsl(272 55% 60%)'];
const SVG_EDIT = '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 2.5l3 3-8 8H2.5v-3z"/></svg>';
const SVG_X = '<svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
const keepKeys = el => { for (const ev of ['keydown', 'keyup', 'keypress', 'input']) el.addEventListener(ev, e => e.stopPropagation()); };
const tagSection = name => {
  const sec = document.createElement('div'); sec.className = 'cskin-tags-sec';
  const render = () => {
    sec.innerHTML = '';
    const s = load(), mine = new Set((s.projTags || {})[name] || []);
    for (const t of s.tags || []) {
      const chip = document.createElement('span'); chip.className = 'cskin-chip' + (mine.has(t.id) ? ' on' : '');
      chip.style.setProperty('--tag-c', t.color || TAG_COLORS[0]);
      const lbl = document.createElement('span'); lbl.className = 'cskin-chip-l'; lbl.textContent = t.name; lbl.title = 'Add / remove on this project';
      const ed = document.createElement('button'); ed.className = 'cskin-chip-b'; ed.innerHTML = SVG_EDIT; ed.title = 'Rename / recolour everywhere';
      const del = document.createElement('button'); del.className = 'cskin-chip-b'; del.innerHTML = SVG_X; del.title = 'Delete this tag everywhere';
      chip.append(lbl, ed, del);
      lbl.onclick = () => { const s = load(); s.projTags = s.projTags || {};      // one tag per project: picking replaces
        s.projTags[name] = (s.projTags[name] || [])[0] === t.id ? [] : [t.id]; save(s); render(); tagAll(); };
      ed.onclick = e => { e.stopPropagation();
        const box = document.createElement('span'); box.className = 'cskin-tag-edit';
        const inp = document.createElement('input'); inp.className = 'cskin-tag-in'; inp.value = t.name; keepKeys(inp); box.append(inp);
        let color = t.color || TAG_COLORS[0];
        for (const c of TAG_COLORS) { const d = document.createElement('button'); d.className = 'cskin-tag-dot' + (c === color ? ' on' : ''); d.style.background = c;
          d.onpointerdown = ev => ev.preventDefault();       // keep the text box focused
          d.onclick = ev => { ev.stopPropagation(); color = c; box.querySelectorAll('.cskin-tag-dot').forEach(x => x.classList.toggle('on', x === d)); inp.focus(); };
          box.append(d); }
        chip.replaceWith(box); inp.focus(); inp.select(); let done = false;
        const finish = () => { if (done) return; done = true; const v = inp.value.trim(), s = load(), tt = (s.tags || []).find(x => x.id === t.id);
          if (tt) { if (v) tt.name = v; tt.color = color; save(s); } render(); tagAll(); };
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') finish(); });
        inp.addEventListener('blur', () => setTimeout(() => { if (!box.contains(document.activeElement)) finish(); }, 0)); };
      del.onclick = e => { e.stopPropagation(); const s = load(); s.tags = (s.tags || []).filter(x => x.id !== t.id);
        for (const k in s.projTags || {}) s.projTags[k] = s.projTags[k].filter(x => x !== t.id); save(s); render(); tagAll(); };
      sec.append(chip);
    }
    const add = document.createElement('input'); add.className = 'cskin-tag-in cskin-tag-new'; add.placeholder = '+ New tag'; keepKeys(add);
    add.addEventListener('keydown', ev => { if (ev.key !== 'Enter' || !add.value.trim()) return;
      const s = load(); s.tags = s.tags || []; const id = 't' + Date.now().toString(36);
      s.tags.push({ id, name: add.value.trim(), color: TAG_COLORS[(s.tags.length) % TAG_COLORS.length] }); s.projTags = s.projTags || {}; s.projTags[name] = [id];
      save(s); render(); tagAll(); setTimeout(() => sec.querySelector('.cskin-tag-new')?.focus(), 0); });
    sec.append(add);
  };
  render();
  return sec;
};

// --- Text size follows the panel's width: the narrower the sidebar or side pane, the smaller the text.
// Each panel has points (width in px, size in px); between them the size is drawn on a straight line, past the
// last one the line carries on, up to 11 px. The A / A buttons nudge it up or down from there (claudeSkin.fontOffset,
// claudeSkin.paneFontOffset). Points agreed with Cskin 2026-10-04: narrowest = 9, the width he uses = 10.
const SIDE_FONT_POINTS = [[170, 9], [208, 10]];
const PANE_FONT_POINTS = [[160, 9], [245, 10]];
const AUTO_FONT_MAX = 11;   // following the width never goes past 11; the A buttons can
const sizeForWidth = (w, pts) => {
  let i = 0; while (i < pts.length - 2 && w > pts[i + 1][0]) i++;
  const [[w0, f0], [w1, f1]] = [pts[i], pts[i + 1]];
  const f = f0 + (w - w0) * (f1 - f0) / (w1 - w0);
  return Math.min(AUTO_FONT_MAX, Math.max(8, Math.round(f * 2) / 2));   // the A buttons can still go past the cap
};
const sideFont = () => { const a = document.querySelector('aside.dframe-sidebar'); const w = a ? a.getBoundingClientRect().width : 0;
  return w ? sizeForWidth(w, SIDE_FONT_POINTS) + (load().fontOffset || 0) : 0; };
const applyFont = () => {
  const fs = sideFont(); let st = document.getElementById('cskin-fs');
  if (!fs) return;
  if (!st) { st = document.createElement('style'); st.id = 'cskin-fs'; document.head.append(st); }
  // the 2026-10-14 update also sets its own row height on each row, so the rows get it too
  const css = `aside.dframe-sidebar, aside.dframe-sidebar [data-row], aside.dframe-sidebar [data-row] > button[data-row-main-button] { --df-row-font: ${fs}px !important; --df-row-h: ${Math.round(fs * 1.9)}px !important; }
    aside.dframe-sidebar .truncate, aside.dframe-sidebar .dframe-fade-label, aside.dframe-sidebar [class*="text-[12px]"] { font-size: ${fs}px !important; }`;
  if (st.textContent !== css) st.textContent = css;
};
// the A / A buttons: same size, no number (the size itself follows the width)
const fontButtons = (cls, title, onStep) => {
  const box = document.createElement('div'); box.className = cls; box.title = title;
  const btn = (c, t, d) => { const b = document.createElement('button'); b.className = c; b.textContent = 'A'; b.title = t;
    b.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); onStep(d); }); b.addEventListener('click', e => e.stopPropagation()); return b; };
  box.append(btn('cskin-fs-s', 'Smaller', -0.5), btn('cskin-fs-l', 'Bigger', 0.5));
  box.addEventListener('pointerdown', e => e.stopPropagation());
  return box;
};
const addFontControl = () => {
  const row = document.querySelector('aside.dframe-sidebar .df-footer-row');
  if (!row || row.querySelector('.cskin-fs')) return;
  const box = fontButtons('cskin-fs', 'Sidebar text size (follows the sidebar width)', d => { const s = load(); s.fontOffset = Math.min(4, Math.max(-4, (s.fontOffset || 0) + d)); delete s.fontSize; save(s); applyFont(); });
  row.insertBefore(box, row.querySelector('.df-footer-aux'));
};
if (window.__cskinResizeFn) window.removeEventListener('resize', window.__cskinResizeFn);
window.__cskinResizeFn = () => { applyFont(); applyPaneFont(); };
window.addEventListener('resize', window.__cskinResizeFn);


// --- Sticky unread (testing). Claude marks a session read the moment it is opened. The skin keeps its own
// list (localStorage 'claudeSkinUnread', by session id since 2026-10-21), but only in two cases:
//  1. a reply finished in the background (Claude shows "Unread response", or a session that is not the open
//     one goes from Running to done);
//  2. a reply finished in the open session and for 30 s nothing happened there: no scrolling in the chat,
//     no switching to another session, no message sent.
// Such a session keeps its blue dot, and its last reply gets a "Mark as read" button next to the time.
// Only that button, or sending a message in that session, clears it.
const uLoad = () => { try { return new Set(JSON.parse(localStorage.getItem('claudeSkinUnread') || '[]')); } catch { return new Set(); } };
const uSave = u => { try { localStorage.setItem('claudeSkinUnread', JSON.stringify([...u])); } catch {} };
// a session's visible name: since the 2026-10-14 update the label also holds hidden screen-reader words
// ("Forked from …", "Running"), which must not end up in names
const labelText = l => { if (!l) return ''; let t = ''; const w = document.createTreeWalker(l, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) if (!n.parentElement.closest('.sr-only')) t += n.textContent; return t.trim(); };
const rowName = r => labelText(r.querySelector('.dframe-fade-label'));
// 2026-10-21: the unread list is keyed by the session's fixed id (data-row-key on an ancestor), not its name,
// because a renamed session (a session renamed from A to B) lost its dot. Old name entries are converted on sight.
const rowKey = r => r.closest('[data-row-key]')?.dataset.rowKey || rowName(r);
const curName = () => { const r = document.querySelector('aside [data-row][data-selected="focused"]'); return r ? rowKey(r) : ''; };
window.__cskinPrev = window.__cskinPrev || {};
const addUnread = n => { const u = uLoad(); if (!u.has(n)) { u.add(n); uSave(u); } };
const cancelPending = () => { if (window.__cskinPending) { clearTimeout(window.__cskinPending.timer); window.__cskinPending = null; } };
const READ_SVG = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3.5 8.5 3 3 6-7"/></svg>';
const placeReadButton = (cur, show) => {
  const bars = show ? [...document.querySelectorAll('.epitaxy-chat-panel [data-cds="MessageActions"]:not([data-deferred])')].filter(b => { const row = b.closest('[data-testid="transcript-row"]'); return !row || !/^human/.test(row.dataset.perfRow || ''); }) : [];   // 2026-10-15: the latest reply's bar now sits outside the transcript rows
  const bar = bars.at(-1) || null;
  document.querySelectorAll('.cskin-read-btn').forEach(b => { if (b.parentElement !== bar) b.remove(); });
  if (bar && !bar.querySelector('.cskin-read-btn')) {
    const b = document.createElement('button'); b.className = 'cskin-read-btn'; b.title = 'Mark this session as read';
    b.innerHTML = READ_SVG + '<span>Mark as read</span>';
    b.addEventListener('click', e => { e.stopPropagation(); const row = document.querySelector('aside [data-row][data-selected="focused"]');
      markRead(curName()); if (row && needsDone(row)) completeRow(row); });
    bar.append(b);
  }
};
// orange (needs input) or red (failed): since the 2026-10-22 update only the app's "Mark as completed" clears these.
// The skin's button does that too: it opens the row's menu out of sight and picks the item (2026-10-22).
const rowState = r => r?.querySelector('[role=img][aria-label]')?.getAttribute('aria-label') || 'Idle';
const needsDone = r => !['Idle', 'Running', 'Unread response'].includes(rowState(r));
const completeRow = row => {
  const html = document.documentElement; html.setAttribute('data-cskin-silentmenu', '');
  const b = row.getBoundingClientRect(); let tries = 0;
  row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: b.left + 20, clientY: b.top + b.height / 2 }));
  const done = () => setTimeout(() => html.removeAttribute('data-cskin-silentmenu'), 300);
  const look = () => {
    const it = [...document.querySelectorAll('[role=menu] [role=menuitem]')].find(i => /^mark as completed?/i.test(i.textContent.trim()));
    if (it) { it.click(); done(); return; }
    if (++tries < 30) { requestAnimationFrame(look); return; }
    const o = { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true };   // no such item: close the menu again
    const out = document.querySelector('.epitaxy-chat-panel') || document.body;
    for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) out.dispatchEvent(t.startsWith('pointer') ? new PointerEvent(t, o) : new MouseEvent(t, o));
    done(); };
  requestAnimationFrame(look);
};
const syncUnread = () => {
  const cur = curName();
  if (window.__cskinPending && window.__cskinPending.name !== cur) cancelPending();          // switched session within the 30 s
  { const u = uLoad(); let ch = false;                                                      // convert old name entries to ids
    for (const r of document.querySelectorAll('aside [data-row]')) { const nm = rowName(r), k = rowKey(r); if (nm && k !== nm && u.has(nm)) { u.delete(nm); u.add(k); ch = true; } }
    if (ch) uSave(u); }
  for (const r of document.querySelectorAll('aside [data-row]')) {
    // since the 2026-10-14 update an idle session has no status mark at all, so no mark means Idle
    const st = r.querySelector('[role=status][aria-label], [role=img][aria-label]'); if (!rowName(r)) continue; const n = rowKey(r);
    const s = st ? st.getAttribute('aria-label') : 'Idle', prev = window.__cskinPrev[n]; window.__cskinPrev[n] = s;
    // orange "Awaiting input" is NOT saved: since the 2026-10-22 update the app keeps it lit until you answer or use
    // its own "Mark as completed" (saving it here made a blue dot appear right after that)
    if (s === 'Unread response') addUnread(n);                                              // case 1 (Claude's own unread)
    else if (prev === 'Running' && s === 'Idle') {                                         // a reply just finished
      if (n === cur) { cancelPending();                                                     // case 2: wait 30 s for any sign of life
        window.__cskinPending = { name: n, timer: setTimeout(() => { if (window.__cskinPending?.name === n) { window.__cskinPending = null; addUnread(n); syncUnread(); } }, 30000) }; }
      else addUnread(n);                                                                    // case 1 (finished in the background)
    }
  }
  const u = uLoad();
  for (const r of document.querySelectorAll('aside [data-row]')) {
    // shown while the session is idle: the old idle ring, or (since the update) no status mark at all
    const busy = r.querySelector('[role=img][aria-label]:not([aria-label="Idle"])'); const show = !busy && u.has(rowKey(r));
    if (show !== r.hasAttribute('data-cskin-unread')) r.toggleAttribute('data-cskin-unread', show);
  }
  const curRow = document.querySelector('aside [data-row][data-selected="focused"]');
  placeReadButton(cur, !!cur && (u.has(cur) || (curRow && needsDone(curRow))));
};
const markRead = n => { cancelPending(); const u = uLoad(); if (u.delete(n)) uSave(u); syncUnread(); };
// Right-click on a session the skin keeps unread: the app's menu says "Mark as unread" (to the app it is read already),
// so that item is relabelled "Mark as read" and clears the skin's dot instead. The app's own "Mark as read" clears it too.
if (window.__cskinCtxFn) document.removeEventListener('contextmenu', window.__cskinCtxFn, true);
window.__cskinCtxFn = e => {
  const r = e.target.closest?.('aside [data-row]'); window.__cskinCtxRow = r ? rowKey(r) : null; if (!r) return;
  const sticky = r.hasAttribute('data-cskin-unread'); let tries = 0;
  const look = () => { const it = [...document.querySelectorAll('[role=menu] [role=menuitem]')].find(i => /^mark as (un)?read/i.test(i.textContent.trim()));   // the text ends in its shortcut letter
    if (!it) { if (++tries < 20) requestAnimationFrame(look); return; }
    if (sticky && /unread/i.test(it.textContent)) { const t = [...it.querySelectorAll('*'), it].reverse().find(x => x.childNodes.length && [...x.childNodes].some(c => c.nodeType === 3 && /unread/i.test(c.textContent)));
      if (t) for (const c of t.childNodes) if (c.nodeType === 3) c.textContent = c.textContent.replace(/unread/i, 'read');
      it.dataset.cskinRead = '1'; } };
  requestAnimationFrame(look); };
document.addEventListener('contextmenu', window.__cskinCtxFn, true);
if (window.__cskinMenuFn) document.removeEventListener('click', window.__cskinMenuFn, true);
window.__cskinMenuFn = e => {
  const it = e.target.closest?.('[role=menuitem]'); if (!it || !window.__cskinCtxRow) return;
  if (it.dataset.cskinRead) { e.preventDefault(); e.stopPropagation(); markRead(window.__cskinCtxRow);
    const out = document.querySelector('.epitaxy-titlebar') || document.body, o = { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse', isPrimary: true };
    for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) out.dispatchEvent(t.startsWith('pointer') ? new PointerEvent(t, o) : new MouseEvent(t, o));   // closes the menu like a click outside it
    return; }
  if (/^mark as (read|completed?)/i.test(it.textContent.trim())) setTimeout(() => markRead(window.__cskinCtxRow), 0); };   // the app's "Mark as completed" clears the skin's dot too
document.addEventListener('click', window.__cskinMenuFn, true);
// No hover popups from session rows (asked 2026-10-15): the black name tooltip and the big "Claude asked · …" card
// with its reply box. Any popup that opens while the mouse is over a session row is hidden, except menus.
if (window.__cskinHovFn) { document.removeEventListener('pointerover', window.__cskinHovFn, true); window.__cskinPopObs?.disconnect(); }
window.__cskinHovRow = false;
window.__cskinHovFn = e => { window.__cskinHovRow = !!e.target.closest?.('aside.dframe-sidebar [data-row]'); };
document.addEventListener('pointerover', window.__cskinHovFn, true);
window.__cskinPopObs = new MutationObserver(ms => { if (!window.__cskinHovRow) return;
  for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.hasAttribute('data-base-ui-portal') && !n.querySelector('[role=menu]')) n.classList.add('cskin-nohover'); });
window.__cskinPopObs.observe(document.body, { childList: true, subtree: true });
// Any scroll in the chat during those 30 s means you are reading: no sticky unread
if (window.__cskinWheelFn) document.removeEventListener('wheel', window.__cskinWheelFn, true);
window.__cskinWheelFn = e => { if (window.__cskinPending && e.target.closest?.('.epitaxy-chat-panel')) cancelPending(); };
document.addEventListener('wheel', window.__cskinWheelFn, { capture: true, passive: true });
// Sending a message counts as reading that session
if (window.__cskinEnterFn) window.removeEventListener('keydown', window.__cskinEnterFn, true);
window.__cskinEnterFn = e => { if (e.key === 'Enter' && !e.shiftKey && e.target.closest?.('.ProseMirror')) { const n = curName(); if (n) markRead(n); } };
window.addEventListener('keydown', window.__cskinEnterFn, true);
document.querySelectorAll('.cskin-read-btn').forEach(e => e.remove());   // fresh button on every apply

// --- "At the end" cue: mark each chat panel whose transcript is scrolled to the bottom (skin.css draws the cue)
const updateEnd = () => {
  document.documentElement.dataset.cskinEndcue = load().endCue || 'glow';
  for (const panel of document.querySelectorAll('.epitaxy-chat-panel')) {
    const sc = panel.querySelector('[data-autoscroll-container="true"]') || panel.querySelector('.epitaxy-transcript-typography')?.parentElement; if (!sc) continue;
    const end = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 6;
    if (end !== panel.hasAttribute('data-cskin-end')) panel.toggleAttribute('data-cskin-end', end);
  }
};
let endQueued = false;
if (window.__cskinScrollFn) document.removeEventListener('scroll', window.__cskinScrollFn, true);
window.__cskinScrollFn = () => { if (!endQueued) { endQueued = true; requestAnimationFrame(() => { endQueued = false; updateEnd(); }); } };
document.addEventListener('scroll', window.__cskinScrollFn, { capture: true, passive: true });


// --- Message button bars (copy, branch, pin, read aloud, time): Claude draws each one as an empty placeholder
// ([data-cds=MessageActions][data-deferred]) and only fills it in once the mouse passes over the message, so
// skin.css's "always visible" had nothing to show. Each placeholder gets a fake hover, so it fills in straight away.
const mountBars = () => {
  let retry = false;
  for (const bar of document.querySelectorAll('.epitaxy-chat-panel [data-cds="MessageActions"][data-deferred]')) {
    const row = bar.closest('[data-testid="transcript-row"]') || bar.parentElement;
    if ((+row.dataset.cskinHovN || 0) >= 5 || Date.now() - (+row.dataset.cskinHov || 0) < 500) continue;   // gave up, or tried just now
    const leaf = row.querySelector('p, li') || row;
    row.dataset.cskinHov = Date.now(); row.dataset.cskinHovN = (+row.dataset.cskinHovN || 0) + 1; retry = true;
    const o = { bubbles: true, cancelable: true, view: window, relatedTarget: null };       // out first, so it counts as a fresh hover
    for (const t of ['pointerout', 'mouseout', 'pointerover', 'mouseover']) leaf.dispatchEvent(new (t[0] === 'p' ? PointerEvent : MouseEvent)(t, o));
  }
  if (retry) { clearTimeout(window.__cskinBarT); window.__cskinBarT = setTimeout(mountBars, 600); }   // a just-drawn message may ignore the first try
};


// --- Mod side panes (a mod's pane, like a to-do list): the app seats each as a tile beside the chat, at least
// 280px wide, and the only way to get the room back is to close it. The skin lets it go down to 160px and adds
// show/hide without closing: a button in the chat's top bar (only while a pane exists) and Option+Cmd+B,
// the mirror of Claude's own Cmd+B for the left sidebar. Hidden or not, the mod keeps running.
const PANE_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M10 2.5v11"/></svg>';
const panesHidden = () => !!load().panesHidden;
const setPanesHidden = v => { const s = load(); s.panesHidden = v; save(s); addPaneToggle(); };
const addPaneToggle = () => {
  document.documentElement.toggleAttribute('data-cskin-panes-hidden', panesHidden());
  const tb = document.querySelector('.epitaxy-chat-panel .epitaxy-titlebar'); if (!tb) return;
  let b = tb.querySelector('.cskin-pane-toggle');
  if (!document.querySelector('[data-tile-host="plugin"]')) { b?.remove(); return; }
  if (!b) {
    b = document.createElement('button'); b.className = 'cskin-pane-toggle'; b.innerHTML = PANE_SVG;
    b.addEventListener('click', e => { e.stopPropagation(); setPanesHidden(!panesHidden()); });
    const vo = tb.querySelector('button[aria-label="View options"]'); vo ? vo.before(b) : tb.append(b);
  }
  b.classList.toggle('on', !panesHidden()); { const t = (panesHidden() ? 'Show' : 'Hide') + ' the side pane (Option+Cmd+B)'; if (b.title !== t) b.title = t; }   // only when changed: every write woke the observer again
};
// --- New session: the sidebar's own "New" row (⌘N) is out of sight with this layout, so a ＋ in the sidebar's top
// bar, just left of the search button, presses it. ⌘N still works too.
const NEW_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>';
// its text starts with an icon character, then "New⌘N"
const appNewButton = () => [...document.querySelectorAll('aside button')].find(x => /(^|[^A-Za-z])New\s*⌘/.test(x.textContent));
const addNewButton = () => {
  const tb = document.querySelector('aside.dframe-sidebar > .df-titlebar'); if (!tb || tb.querySelector('.cskin-new')) return;
  const b = document.createElement('button'); b.className = 'cskin-new'; b.title = 'New session (⌘N)'; b.innerHTML = NEW_SVG;
  b.addEventListener('click', e => { e.stopPropagation(); appNewButton()?.click(); });
  const at = tb.querySelector('.cskin-search'); at ? at.before(b) : tb.append(b);
};
if (window.__cskinPaneKey) window.removeEventListener('keydown', window.__cskinPaneKey, true);
// Closed with its ✕ the pane is gone, not hidden, so the key has nothing to show. Then it sends /branches (the mod's
// own reopen command), but only into an EMPTY message box, so a draft is never touched (asked 2026-10-18).
const reopenBranches = async () => {
  const pm = document.querySelector('.epitaxy-chat-panel .ProseMirror'); if (!pm) return;
  if (pm.textContent.trim()) { showHint(pm, 'Clear the message box first, or send /branches'); return; }
  if (panesHidden()) setPanesHidden(false);
  pm.focus(); document.execCommand('insertText', false, '/branches');
  const enter = () => pm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 250)); enter();
  // the / menu may take the first Enter to pick the command; then a second one sends it
  await new Promise(r => setTimeout(r, 300)); if (/^\/branches\s*$/.test(pm.textContent)) enter();
};
const showHint = (near, text) => {
  document.querySelector('.cskin-hint')?.remove();
  const r = near.getBoundingClientRect(), h = document.createElement('div'); h.className = 'cskin-hint'; h.textContent = text;
  h.style.cssText = 'position:fixed;z-index:9999;left:' + r.left + 'px;top:' + (r.top - 34) + 'px;padding:5px 9px;border-radius:7px;font-size:12px;background:hsl(var(--bg-000));color:hsl(var(--text-100));box-shadow:0 2px 10px rgb(0 0 0/.18);pointer-events:none';
  document.body.append(h); setTimeout(() => h.remove(), 2500);
};
window.__cskinPaneKey = e => { if (e.metaKey && e.altKey && !e.shiftKey && !e.ctrlKey && e.code === 'KeyB') { e.preventDefault(); e.stopImmediatePropagation(); if (document.querySelector('[data-tile-host="plugin"]')) setPanesHidden(!panesHidden()); else void reopenBranches(); } };
window.addEventListener('keydown', window.__cskinPaneKey, true);


// --- Mod text fields: a mod can ask for a text field to take the cursor (autoFocus), but the desktop leaves the
// cursor in the message box, so what you type next lands in your message. After a click or Enter inside a mod pane,
// the skin puts the cursor in a field the mod has just drawn that way.
const modRoot = t => { const tile = t?.closest?.('[data-tile-host="plugin"]'); return tile?.querySelector('[class*="contain:none"]')?.shadowRoot || null; };
if (window.__cskinModFocus) { document.removeEventListener('click', window.__cskinModFocus, true); document.removeEventListener('keydown', window.__cskinModFocus, true); }
window.__cskinModFocus = e => {
  if (e.type === 'keydown' && e.key !== 'Enter') return;
  const root = modRoot(e.target); if (!root) return;
  // Branches "add to chat" (and "Add N to message"): put the cursor at the end of the message box afterwards, so you
  // can type straight away (this also makes the box show text a mod has just put in it)
  const key = e.composedPath?.()[0]?.closest?.('button')?.dataset?.pressKey || '';
  if (e.type === 'click' && /^(msg-|to-msg)/.test(key)) setTimeout(() => {
    const ed = document.querySelector('[data-testid="code-prompt-input"]'); if (!ed) return;
    ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    // and scroll the message box down to what was just added (it grows past its height and hid the new text)
    for (let el = ed; el && !el.matches('.epitaxy-prompt'); el = el.parentElement) if (el.scrollHeight > el.clientHeight + 2) el.scrollTop = el.scrollHeight;
  }, 300);
  const before = new Set(root.querySelectorAll('input'));
  let n = 0;
  const look = () => {
    const f = [...root.querySelectorAll('input[data-engine-autofocus]')].find(x => !before.has(x));
    if (f) { upgradeNoteFields(root); const t = f.__cskinTa; if (t) { t.focus(); t.setSelectionRange(t.value.length, t.value.length); } else f.focus(); return; }
    if (++n < 10) setTimeout(look, 100);
  };
  setTimeout(look, 50);
};
document.addEventListener('click', window.__cskinModFocus, true);
document.addEventListener('keydown', window.__cskinModFocus, true);


// --- Mod pane text size: A / A buttons in the pane's top corner, like the sidebar's (remembered). The pane's text,
// buttons and fields follow it.
const applyPaneFont = () => {
  const wrap = document.querySelector('[data-tile-host="plugin"]')?.parentElement?.parentElement, h = document.documentElement;
  const w = wrap ? wrap.getBoundingClientRect().width : 0; if (!w) return;
  const f = sizeForWidth(w, PANE_FONT_POINTS) + (load().paneFontOffset || 0);
  if (h.style.getPropertyValue('--cskin-pane-fs') !== f + 'px') h.style.setProperty('--cskin-pane-fs', f + 'px');
};
const addPaneFontControl = () => {
  for (const tr of document.querySelectorAll('[data-tile-host="plugin"] [data-pane-root] [data-top-right]')) {
    if (tr.querySelector('.cskin-pfs')) continue;
    const box = fontButtons('cskin-pfs', 'Pane text size (follows the pane width)', d => { const s = load(); s.paneFontOffset = Math.min(4, Math.max(-4, (s.paneFontOffset || 0) + d)); delete s.paneFont; save(s); applyPaneFont(); });
    // after the header's drag layer: the app works out its no-drag spots in page order, so one placed before is covered
    const drag = tr.querySelector(':scope > .draggable'); drag ? drag.after(box) : tr.prepend(box);
  }
};

// --- Mod panes are drawn in a sealed layer (shadow DOM) that page CSS cannot reach, so the skin adds a small
// stylesheet inside each one: roomier dropdown lists, bold branch names in Branches, and the Branches summary hidden
// there because the skin shows it in the top bar instead. Branches' title buttons are stretched over the whole title.
// Branches paints the strip behind its hover icons #ececec (branch) or #f4f4f4 (task), the right grey for light mode
// only (a mod cannot tell the modes apart); the skin repaints both as the pane's own background plus the row's
// see-through hover greys, which is right in either mode.
const MOD_CSS = `
[data-engine-select-list] { padding: 5px !important; }
[data-engine-select-list] [role="option"] { padding: 4px 12px !important; }
button[data-press-key^="bn-"] [data-press-label] { font-weight: 600; }
button[data-press-key^="bn-"] { padding-left: 0 !important; }
[data-hover-box]:has(> div > button[data-press-key^="bn-"]) { padding-top: 4px !important; padding-bottom: 4px !important; }
[style*="padding-top:calc(1 "]:has(> div > form[data-held-owner="branches"]) { padding-top: 4px !important; padding-bottom: 4px !important; }
button[data-press-key="bsum"] { display: none !important; }
button[data-press-key^="bn-"], button[data-press-key^="bn-"] * { --cds-fill-ghost-hover: transparent; --cds-fill-secondary-hover: transparent; background: none !important; box-shadow: none !important; }
/* Branches chips (a box with hover whose icon button is keyed "...-i") and tag pills (a box with hover and no button):
   a little smaller than the text around them. Every keyed box has data-hover-box; only boxes with hover have data-hover-id. */
[data-hover-id]:has(> [data-hover-box] > div > button[data-press-key$="-i"]) { font-size: calc(var(--cskin-pane-fs, 11.5px) * 0.9); --cds-font-size-body: calc(var(--cskin-pane-fs, 11.5px) * 0.9); }
[data-hover-id]:not(:has(button)) { font-size: calc(var(--cskin-pane-fs, 11.5px) * 0.8); line-height: 1.45; padding: 0 4px !important; border-radius: 5px; align-self: center; }
/* a task's tags run on inside its title (a span with its own background inside the title's text) */
span[style*="pre-wrap"] > span[style*="background-color:#"] { font-size: 0.8em; border-radius: 5px; padding: 0 1px; vertical-align: 1px; }
/* a faint line between two task rows that follow each other (90% wide); a task row is the hover box holding a
   title button "tn-..." */
/* tasks only: a note's open button is "tn-b..." too, and a note row is not positioned, so the line went to the top of the pane (2026-10-07) */
[data-hover-id]:has(> [data-hover-box] > [data-hover-box] > button[data-press-key^="tn-"]) + [data-hover-id]:has(> [data-hover-box] > [data-hover-box] > button[data-press-key^="tn-"]):not(:has(> [data-hover-box] > [data-hover-box] > button[data-press-key^="tn-b"]))::before {
  content: ""; position: absolute; top: 0; left: 5%; right: 5%; height: 1px; background: #80808012; pointer-events: none; }
/* task rows: a little more room above and below, so the line between tasks is not tight against the text; the
   status mark sits on the first line's middle (the row is top-aligned and a line is 19px, the mark 16px) */
[data-hover-id]:has(> [data-hover-box] > [data-hover-box] > button[data-press-key^="tn-"]) { padding-top: 3.5px !important; padding-bottom: 3.5px !important; }
[data-hover-id]:has(> [data-hover-box] > [data-hover-box] > button[data-press-key^="tn-"]) > div:has(button[data-press-key^="more-"], button[data-press-key^="sel-"]) { align-self: center; }
button[data-press-key^="tn-"], [style*="left:0ch"][style*="bottom:0lh"] button { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; opacity: 0; cursor: pointer; }
[style*="background-color:#ececec"] { background: linear-gradient(#80808033, #80808033), linear-gradient(#80808008, #80808008), var(--cskin-pane-surface, #fff) !important; }
[style*="background-color:#f4f4f4"] { background: linear-gradient(#8080800e, #8080800e), linear-gradient(#80808008, #80808008), var(--cskin-pane-surface, #fff) !important; }
/* the same for the yellow note sections (#f9ebb5 section bar, #fcf7e0 note) */
[style*="background-color:#f9ebb5"] { background: linear-gradient(#ebbe0a42, #ebbe0a42), linear-gradient(#ebbe0a0d, #ebbe0a0d), var(--cskin-pane-surface, #fff) !important; }
[style*="background-color:#fcf7e0"] { background: linear-gradient(#ebbe0a14, #ebbe0a14), linear-gradient(#ebbe0a0d, #ebbe0a0d), var(--cskin-pane-surface, #fff) !important; }
form[data-held-owner="branches"] > button[type="submit"] { display: none; }
form[data-held-owner="branches"] { display: flex !important; width: 100%; }
form[data-held-owner="branches"] > label { flex: 1; min-width: 0; }
form[data-held-owner="branches"] > label > input, form[data-held-owner="branches"] > input { flex: 1; width: 100%; min-width: 0; }
/* a note's text: the skin's multi-line box stands in for the mod's one-line field (kept, out of sight, so the app
   still gets every change) */
form[data-held-owner="branches"] .cskin-note-hidden { position: fixed !important; top: 0 !important; left: 0 !important; width: 1px !important; height: 1px !important; opacity: 0 !important; pointer-events: none !important; }
form[data-held-owner="branches"] textarea.cskin-note-ta { flex: 1; width: 100%; min-width: 0; resize: none; overflow: hidden; field-sizing: content; min-height: 3lh; height: auto;
  font: inherit; line-height: 1.4; white-space: pre-wrap; padding-top: 3px; padding-bottom: 3px; }
/* page mode (a session that shows a notes page): plain paper, no frame; the blocks run on without a gap; the last one fills the pane */
form[data-held-owner="branches"] textarea.cskin-page-ta { min-height: 0; border: 0 !important; box-shadow: none !important; outline: none !important; background: transparent !important;
  padding: 0 2px; border-radius: 0; line-height: 1.5; }
form[data-held-owner="branches"] textarea.cskin-page-last { min-height: calc(100vh - 112px); }
form[data-held-owner="branches"]:has(textarea.cskin-page-ta) [data-engine-caption] { display: none !important; }
form[data-held-owner="branches"] [data-engine-caption] { width: 3.2em; flex-shrink: 0; }
button[data-engine-select][data-held-key^="mv-"] { height: 18px; padding: 0 4px; background: none; box-shadow: none; }
button[data-engine-select][data-held-key^="mv-"]:hover { background: var(--cds-fill-ghost-hover); box-shadow: none; }
button[data-engine-select][data-held-key^="mv-"] [data-select-caret] { display: none; }
button[data-engine-select][data-held-key^="mv-"] [data-select-value] { font-size: 0; }
button[data-engine-select][data-held-key^="mv-"] [data-select-value]::before { content: "↳"; font-size: var(--cds-font-size-body); }
`;
const modRoots = () => [...document.querySelectorAll('[data-tile-host="plugin"] [class*="contain:none"]')].map(h => h.shadowRoot).filter(Boolean);
const styleModPanes = () => {
  // the pane's background: the first ancestor of the pane's drawing that has a solid colour
  let el = document.querySelector('[data-tile-host="plugin"] [class*="contain:none"]'), bg = '';
  const h = document.documentElement;
  for (; el && !bg; el = el.parentElement) { const c = getComputedStyle(el).backgroundColor; if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') bg = c; }
  if (bg && h.style.getPropertyValue('--cskin-pane-surface') !== bg) h.style.setProperty('--cskin-pane-surface', bg);
  for (const r of modRoots()) { let st = r.getElementById('cskin-mod-style'); if (!st) { st = document.createElement('style'); st.id = 'cskin-mod-style'; r.append(st); } if (st.textContent !== MOD_CSS) st.textContent = MOD_CSS;
    upgradeNoteFields(r);
    // a newer copy of the skin replaces the watcher, so note boxes are always made by the current code
    if (r.__cskinNoteFn !== upgradeNoteFields) { r.__cskinNoteObs?.disconnect(); r.__cskinNoteFn = upgradeNoteFields; r.__cskinNoteObs = new MutationObserver(() => upgradeNoteFields(r)); r.__cskinNoteObs.observe(r, { childList: true, subtree: true }); } } };

// --- Branches notes: a mod's text field is one line, so a note could not have line breaks. The mod marks its note
// field with an invisible character at the end of the placeholder; the skin lays a multi-line box over it, passes
// each line break on as U+2028 (which a one-line field keeps; the mod turns it back), and keeps the real field in the
// page so the app gets every change. Enter makes a new line; Cmd+Enter (or the mod's ✓) finishes.
const NATIVE_INPUT_SET = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
// The pane's engine sometimes throws the field away and draws it again (seen while a growing note sat at the bottom
// of a full pane: rebuilt many times a second, the pane jumping). So the box is kept per field (the form's key) and
// moved onto the new field with its text, cursor and focus, instead of a fresh box each time (2026-10-07).
const noteKey = inp => inp.closest('form')?.getAttribute('data-held-key') || inp.getAttribute('data-held-key') || '';
// the pane's scroll position as the person left it: a field drawn again is briefly missing, the content gets shorter
// and the pane snaps to the top (seen scrolling while the last note was open); it is put back after the box returns
const paneScroller = r => { let x = r.host; while (x && x !== document.body && !/(auto|scroll)/.test(getComputedStyle(x).overflowY)) x = x.parentElement; return x === document.body ? null : x; };
// The pane's engine keeps its own idea of how tall the content is, and it does not know about the height the skin
// adds (multi-line note boxes, task spacing). Scrolled to the real bottom, it thought that was past the end and
// scrolled the pane back up, a flicker (2026-10-07). For 1.5 s after the person scrolls (wheel, trackpad, keys,
// touch), the engine's own scrolling of the pane is ignored; at other times it works as before.
const SCROLL_TOP = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
const guardScroll = sc => {
  if (sc.__cskinGuard) return; sc.__cskinGuard = 1;
  const mark = () => { sc.__cskinUser = Date.now(); };
  for (const ev of ['wheel', 'touchmove', 'keydown']) sc.addEventListener(ev, mark, { passive: true, capture: true });
  const userNow = () => Date.now() - (sc.__cskinUser || 0) < 1500;
  Object.defineProperty(sc, 'scrollTop', { configurable: true, get() { return SCROLL_TOP.get.call(this); }, set(v) { if (!userNow()) SCROLL_TOP.set.call(this, v); } });
  for (const m of ['scrollTo', 'scroll', 'scrollBy']) { const orig = Element.prototype[m]; sc[m] = function (...a) { if (!userNow()) return orig.apply(this, a); }; }
};
const trackScroll = r => { const sc = paneScroller(r); if (!sc) return null; guardScroll(sc);
  if (!sc.__cskinTrack) { sc.__cskinTrack = 1; sc.__cskinLast = sc.scrollTop; sc.addEventListener('scroll', () => { if (!sc.__cskinHold) sc.__cskinLast = sc.scrollTop; }, { passive: true }); }
  return sc; };
const keepScroll = sc => { if (!sc) return; const want = sc.__cskinLast ?? sc.scrollTop; sc.__cskinHold = true; SCROLL_TOP.set.call(sc, want);
  requestAnimationFrame(() => { SCROLL_TOP.set.call(sc, want); requestAnimationFrame(() => { sc.__cskinHold = false; }); }); };
const noteRemember = ta => { ta.__t = Date.now(); ta.__s = ta.selectionStart; ta.__e = ta.selectionEnd; };
const noteAttach = (r, inp, ta) => {
  ta.__inp = inp; inp.__cskinTa = ta; inp.classList.add('cskin-note-hidden'); inp.tabIndex = -1;
  if (inp.nextSibling !== ta) inp.after(ta);
  if (!inp.__cskinWired) { inp.__cskinWired = 1;
    // the mod asks for the field: the box takes it, without scrolling and without moving the cursor if it already has it
    inp.addEventListener('focus', () => { const t = inp.__cskinTa; if (!t || r.activeElement === t) return; t.focus({ preventScroll: true }); const n = t.value.length; t.setSelectionRange(t.__s ?? n, t.__e ?? n); }); }
};
const upgradeNoteFields = r => {
  const kept = r.__cskinTas = r.__cskinTas || new Map();
  const sc = trackScroll(r);
  for (const inp of r.querySelectorAll('form[data-held-owner="branches"] input[placeholder$="\u200b"]')) {
    const ta0 = inp.__cskinTa;
    if (ta0 && ta0.isConnected && ta0.__inp === inp) { const want = inp.value.replace(/\u2028/g, '\n'); if (r.activeElement !== ta0 && Date.now() - (ta0.__t || 0) > 1500 && ta0.value !== want) ta0.value = want; continue; }
    const k = noteKey(inp), old = ta0 || (k && kept.get(k));
    if (old && (!old.isConnected || old.__inp !== inp)) {
      // the same field drawn again: move the kept box onto it; the box's text is the newer one while typing
      const typing = Date.now() - (old.__t || 0) < 3000;
      if (!typing) old.value = inp.value.replace(/\u2028/g, '\n');
      noteAttach(r, inp, old); keepScroll(sc);
      if (typing) { old.focus({ preventScroll: true }); old.setSelectionRange(old.__s ?? old.value.length, old.__e ?? old.value.length); }
      continue;
    }
    const ta = document.createElement('textarea');
    // two marks: a page block (page mode, no frame); three: the page's last block, which also fills the pane
    const marks = (inp.placeholder.match(/\u200b+$/) || [''])[0].length;
    ta.className = 'cskin-note-ta ' + inp.className + (marks >= 2 ? ' cskin-page-ta' : '') + (marks >= 3 ? ' cskin-page-last' : ''); ta.rows = marks >= 2 ? 1 : 3; ta.spellcheck = true;
    // a field takes at most 16384 characters and the pane draws at most 10000: stop well before either
    ta.maxLength = 9800;
    ta.placeholder = inp.placeholder.replace(/\u200b+$/, ''); ta.value = inp.value.replace(/\u2028/g, '\n');
    if (k) kept.set(k, ta);
    noteAttach(r, inp, ta);
    const push = () => { const f = ta.__inp; if (!f) return; NATIVE_INPUT_SET.call(f, ta.value.replace(/\r?\n/g, '\u2028')); f.dispatchEvent(new Event('input', { bubbles: true })); };
    ta.addEventListener('input', e => { e.stopPropagation(); noteRemember(ta); push(); });
    ta.addEventListener('keydown', e => { e.stopPropagation(); noteRemember(ta); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); push(); ta.__inp?.form?.requestSubmit(); } });
    for (const ev of ['keyup', 'keypress']) ta.addEventListener(ev, e => { e.stopPropagation(); noteRemember(ta); });
    ta.addEventListener('mouseup', () => noteRemember(ta));
    if (r.activeElement === inp || inp.hasAttribute('data-engine-autofocus')) setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 0);
  }
  // forget boxes whose field is gone for good
  for (const [k, ta] of kept) if (!ta.isConnected && !(ta.__inp && ta.__inp.isConnected) && Date.now() - (ta.__t || 0) > 60000) kept.delete(k);
};

// --- Branches summary in the chat's top bar: the Branches mod draws its counts as text ("4 need you · 1 in progress
// · 7 open"); the skin shows them as symbols, and they take the place of the pane button: a click shows or hides
// the side pane (as Option+Cmd+B does). The pane button comes back when there is no summary.
const BS_SVG = {
  overdue: '<circle cx="8" cy="8" r="5.6" stroke="#d4472f" stroke-width="1.7"/><path d="M8 5v3.2l2 1.4" stroke="#d4472f" stroke-width="1.6"/>',
  needs: '<circle cx="8" cy="8" r="5.6" stroke="#d4472f" stroke-width="1.7"/><path d="M8 4.9v3.5" stroke="#d4472f" stroke-width="1.8"/><circle cx="8" cy="10.9" r="1" fill="#d4472f"/>',
  doing: '<circle cx="8" cy="8" r="5.6" stroke="#d97757" stroke-width="1.7"/><path d="M8 2.4a5.6 5.6 0 0 1 0 11.2z" fill="#d97757"/>',
  open: '<circle cx="8" cy="8" r="5.6" stroke="#8d8d8d" stroke-width="1.7"/>',
  parked: '<circle cx="8" cy="8" r="5.6" stroke="#8d8d8d" stroke-width="1.7"/><path d="M6.7 5.9v4.2M9.3 5.9v4.2" stroke="#8d8d8d" stroke-width="1.8"/>',
};
const BS_TITLE = { overdue: 'overdue', needs: 'need you', doing: 'in progress', open: 'open', parked: 'parked' };
const syncBranchSummary = () => {
  const tb = document.querySelector('.epitaxy-chat-panel .epitaxy-titlebar');
  let el = tb?.querySelector('.cskin-bsum');
  let label = '';
  for (const r of modRoots()) { const b = r.querySelector('button[data-press-key="bsum"] [data-press-label]'); if (b) { label = b.textContent; break; } }
  if (!tb || !label) { el?.remove(); return; }
  if (el && el.dataset.label === label) return;
  const n = re => +((label.match(re) || [])[1] || 0);
  const counts = { overdue: n(/(\d+) overdue/), needs: n(/(\d+) needs? you/), doing: n(/(\d+) in progress/), open: n(/(\d+) open/), parked: n(/(\d+) parked/) };
  if (!el) {
    el = document.createElement('button'); el.className = 'cskin-bsum';
    el.addEventListener('click', e => { e.stopPropagation(); setPanesHidden(!panesHidden()); });
    const pt = tb.querySelector('.cskin-pane-toggle'); pt ? pt.before(el) : tb.querySelector('button[aria-label="View options"]')?.before(el);
  }
  el.dataset.label = label; el.title = 'Branches: ' + label + '. Click to show or hide the pane (Option+Cmd+B)';
  el.innerHTML = Object.entries(counts).filter(([k, v]) => v || k === 'open').map(([k, v]) =>
    '<span class="cskin-bsum-i cskin-bsum-' + k + '" title="' + v + ' ' + BS_TITLE[k] + '"><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke-linecap="round" stroke-linejoin="round">' + BS_SVG[k] + '</svg>' + v + '</span>').join('');
};

// --- Message box text: two pixels smaller than the reply text, worked out from the page.
const applyComposerFont = () => {
  const p = document.querySelector('[data-cds="AssistantMessage"] p'); if (!p) return;
  const want = (parseFloat(getComputedStyle(p).fontSize) - 2) + 'px', h = document.documentElement;
  if (h.style.getPropertyValue('--cskin-composer-fs') !== want) h.style.setProperty('--cskin-composer-fs', want);
};


// --- Pane width: the app's own drag between the chat and a mod pane stops at 280px. The skin takes over that
// one divider: drag to any width from 160 to 800px (remembered); double-click it to go back to the app's sizing.
// The pane's width is kept per session (asked 2026-10-06; the simulator's is one width for all): the session is the one in the page address. A session never
// resized here uses the last width set before that change (paneW), or the app's own sizing.
const sessKey = () => (location.pathname.match(/local_[\w-]+/) || [location.pathname])[0];
const paneWrap = () => document.querySelector('[data-tile-host="plugin"]')?.parentElement?.parentElement;
const sessW = (s, k) => (s[k + 'By'] || {})[sessKey()] ?? s[k];
const setSessW = (s, k, v) => { s[k + 'By'] = s[k + 'By'] || {}; if (v === null) delete s[k + 'By'][sessKey()]; else s[k + 'By'][sessKey()] = v; };
const applyPaneWidth = () => { const w = sessW(load(), 'paneW'), h = document.documentElement;
  if (w) { if (h.style.getPropertyValue('--cskin-pane-w') !== w + 'px') h.style.setProperty('--cskin-pane-w', w + 'px'); if (!h.hasAttribute('data-cskin-pane-w')) h.setAttribute('data-cskin-pane-w', ''); }
  else { h.style.removeProperty('--cskin-pane-w'); h.removeAttribute('data-cskin-pane-w'); } };
const paneDivider = t => { const d = t?.closest?.('[data-tile-divider]'); return d && d.nextElementSibling === paneWrap() ? d : null; };
if (window.__cskinPaneDrag) { window.removeEventListener('pointerdown', window.__cskinPaneDrag, true); window.removeEventListener('dblclick', window.__cskinPaneReset, true); }
window.__cskinPaneDrag = e => {
  if (e.button !== 0 || !paneDivider(e.target)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const right = paneWrap().getBoundingClientRect().right; let cur = null; document.body.classList.add('cskin-resizing');
  const move = ev => { cur = Math.round(Math.min(800, Math.max(160, right - ev.clientX))); const s = load(); setSessW(s, 'paneW', cur); save(s); applyPaneWidth(); applyPaneFont(); };
  const up = () => { window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); document.body.classList.remove('cskin-resizing'); };
  window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true);
};
window.__cskinPaneReset = e => { if (!paneDivider(e.target)) return; e.preventDefault(); e.stopImmediatePropagation(); const s = load(); setSessW(s, 'paneW', 0); save(s); applyPaneWidth(); };
window.addEventListener('pointerdown', window.__cskinPaneDrag, true);
window.addEventListener('dblclick', window.__cskinPaneReset, true);

// --- Simulator panel width: the app locks the divider between the chat and an iOS Simulator panel when the window
// is narrow (its minimums leave no room), so the panel could not be made smaller. The skin takes over that divider
// too: drag to any width from 200 to 1000px (remembered); double-click it to go back to the app's sizing.
const simWrap = () => document.querySelector('[data-tile-host^="simulator"]')?.parentElement?.parentElement;
const applySimWidth = () => { const w = load().simW, h = document.documentElement;
  if (w) { if (h.style.getPropertyValue('--cskin-sim-w') !== w + 'px') h.style.setProperty('--cskin-sim-w', w + 'px'); if (!h.hasAttribute('data-cskin-sim-w')) h.setAttribute('data-cskin-sim-w', ''); }
  else { h.style.removeProperty('--cskin-sim-w'); h.removeAttribute('data-cskin-sim-w'); } };
const simDivider = t => { const d = t?.closest?.('[data-tile-divider]'); return d && simWrap() && d.nextElementSibling === simWrap() ? d : null; };
if (window.__cskinSimDrag) { window.removeEventListener('pointerdown', window.__cskinSimDrag, true); window.removeEventListener('dblclick', window.__cskinSimReset, true); }
window.__cskinSimDrag = e => {
  if (e.button !== 0 || !simDivider(e.target)) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const right = simWrap().getBoundingClientRect().right; document.body.classList.add('cskin-resizing');
  const move = ev => { const s = load(); s.simW = Math.round(Math.min(1000, Math.max(200, right - ev.clientX))); save(s); applySimWidth(); };
  const up = () => { window.removeEventListener('pointermove', move, true); window.removeEventListener('pointerup', up, true); document.body.classList.remove('cskin-resizing'); };
  window.addEventListener('pointermove', move, true); window.addEventListener('pointerup', up, true);
};
window.__cskinSimReset = e => { if (!simDivider(e.target)) return; e.preventDefault(); e.stopImmediatePropagation(); const s = load(); delete s.simW; save(s); applySimWidth(); };
window.addEventListener('pointerdown', window.__cskinSimDrag, true);
window.addEventListener('dblclick', window.__cskinSimReset, true);


// --- Session order inside a project: Claude sorts sessions itself. The project's colour menu has an "Order" list
// with up/down buttons; the order is kept per project (localStorage claudeSkin.sessOrder, by the
// session's permanent key, so renames don't lose it). Sessions not yet placed (new ones) show first.
const sessionWraps = blk => [...blk.querySelectorAll('[class*="group/section"] > .contents > .df-drag-shiftable')].filter(w => w.querySelector('[data-row] .dframe-fade-label'));   // the Show more/less row also has data-row
const visualOrder = blk => sessionWraps(blk).map((w, i) => ({ w, i, o: +(w.style.order || 0) })).sort((a, b) => a.o - b.o || a.i - b.i).map(x => x.w.getAttribute('data-row-key'));
const moveSession = (blk, key, d) => {
  const keys = visualOrder(blk), i = keys.indexOf(key), j = i + d; if (i < 0 || j < 0 || j >= keys.length) return;
  [keys[i], keys[j]] = [keys[j], keys[i]];
  const s = load(); s.sessOrder = s.sessOrder || {}; s.sessOrder[blk.dataset.cskinProject] = keys; save(s); applySessionOrder();
};
const applySessionOrder = () => {
  const ord = load().sessOrder || {};
  for (const blk of document.querySelectorAll('[data-cskin-project]')) {
    const list = ord[blk.dataset.cskinProject];
    for (const w of sessionWraps(blk)) {
      const i = list ? list.indexOf(w.getAttribute('data-row-key')) : -1, v = list && i >= 0 ? String(i + 1) : '';
      if (w.style.order !== v) w.style.order = v;
    }
    // the app's own "Show more / Show less" row (2026-10-22) is not a session: keep it at the bottom
    for (const w of blk.querySelectorAll('[class*="group/section"] > .contents > .df-drag-shiftable')) if (!w.querySelector('.dframe-fade-label') && /^show (more|less)/i.test(w.textContent.trim()) && w.style.order !== '99999') w.style.order = '99999';
  }
};


// The "Order" list in a project's colour menu: its sessions, top to bottom, each with up/down buttons
const orderSection = name => {
  const blk = [...document.querySelectorAll('[data-cskin-project]')].find(b => b.dataset.cskinProject === name);
  if (!blk || sessionWraps(blk).length < 2) return null;
  const sec = document.createElement('div'); sec.className = 'cskin-order';
  const render = () => {
    sec.innerHTML = '<div class="cskin-order-h">Order</div>';
    const keys = visualOrder(blk), byKey = new Map(sessionWraps(blk).map(w => [w.getAttribute('data-row-key'), w]));
    keys.forEach((k, i) => {
      const w = byKey.get(k); const label = labelText(w?.querySelector('.dframe-fade-label'));
      const row = document.createElement('div'); row.className = 'cskin-order-row';
      const t = document.createElement('span'); t.className = 'cskin-order-name'; t.textContent = label; row.append(t);
      for (const [g, d] of [['▲', -1], ['▼', 1]]) {
        const b = document.createElement('button'); b.textContent = g; b.title = d < 0 ? 'Move up' : 'Move down';
        if ((d < 0 && i === 0) || (d > 0 && i === keys.length - 1)) b.disabled = true;
        b.onclick = e => { e.stopPropagation(); moveSession(blk, k, d); render(); };
        row.append(b);
      }
      sec.append(row);
    });
  };
  render();
  return sec;
};

// --- Weekly usage day dots (asked 2026-10-18). In the usage panel (the circle at the top right), the Weekly bar
// gets 6 dots that split it into 7 days of 24 h, counted from the weekly reset (e.g. Sat 6:00 AM to Sun 6:00 AM).
// The dot at the end of today's share is darker, and turns red once usage has gone past it. A soft band fills
// today's gap between the dots; it moves to the next gap at midnight.
const DAY = 864e5, WD = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const resetTime = txt => {     // "Resets Sat 6:00 AM" / "Resets in 4 hr 10 min" / "Resets tomorrow 6:00 AM" -> Date
  const now = new Date(); let m;
  if ((m = /in\s+(?:(\d+)\s*d\w*)?\s*(?:(\d+)\s*h\w*)?\s*(?:(\d+)\s*m\w*)?/i.exec(txt)) && (m[1] || m[2] || m[3]))
    return new Date(now.getTime() + ((+m[1] || 0) * 1440 + (+m[2] || 0) * 60 + (+m[3] || 0)) * 6e4);
  if (!(m = /(?:(\w+)\s+)?(\d{1,2}):(\d{2})\s*([AP]M)/i.exec(txt))) return null;
  const h = (+m[2] % 12) + (/p/i.test(m[4]) ? 12 : 0), t = new Date(now); t.setHours(h, +m[3], 0, 0);
  const wd = WD.indexOf((m[1] || '').slice(0, 3).toLowerCase());
  if (wd >= 0) { let add = (wd - t.getDay() + 7) % 7; t.setDate(t.getDate() + add); if (t <= now) t.setDate(t.getDate() + 7); }
  else if (/tomorrow/i.test(txt)) t.setDate(t.getDate() + 1);
  else if (t <= now) t.setDate(t.getDate() + 1);
  return t;
};
const usageDots = () => {
  for (const meter of document.querySelectorAll('[data-usage-bars] [role=meter]')) {
    let sec = meter.parentElement; while (sec && sec.parentElement && ![...sec.querySelectorAll('span')].some(x => /^Resets/.test(x.textContent.trim()))) sec = sec.parentElement;  // smallest box holding this bar's own "Resets" line (app added an outer group 2026-10-20)
    if (!sec) continue;
    if (!/^\s*Weekly/.test(sec.textContent)) continue;
    const host = meter.parentElement, used = +meter.getAttribute('aria-valuenow');
    const rs = [...sec.querySelectorAll('span')].find(x => /^Resets/.test(x.textContent.trim()));
    const end = rs && resetTime(rs.textContent); if (!end || isNaN(used)) continue;
    const day = Math.min(6, Math.max(0, Math.floor((Date.now() - (end.getTime() - 7 * DAY)) / DAY)));
    // today's gap between the dots gets a soft band (asked 2026-10-19). It fills the gap exactly, but moves on to the
    // next gap at midnight rather than at the 6 AM reset: gap n = calendar days since the week's first day.
    const first = new Date(end.getTime() - 7 * DAY); first.setHours(0, 0, 0, 0);
    const mid = new Date(); mid.setHours(0, 0, 0, 0);
    const gap = Math.min(6, Math.max(0, Math.round((mid - first) / DAY)));
    const bandL = gap / 7 * 100, bandR = (gap + 1) / 7 * 100;
    const key = used + '|' + day + '|g' + gap; let box = host.querySelector(':scope > .cskin-udots');
    if (box && box.dataset.k === key) continue;
    if (!box) { box = document.createElement('div'); box.className = 'cskin-udots'; host.style.position = 'relative'; host.append(box); }
    box.dataset.k = key; box.innerHTML = '';
    if (bandR > bandL) { const b = document.createElement('b'); b.style.left = bandL + '%'; b.style.width = (bandR - bandL) + '%'; box.append(b); }
    for (let k = 1; k <= 6; k++) {
      const at = k / 7 * 100, d = document.createElement('i');
      d.style.left = at + '%';
      if (at < used) d.classList.add('fill');
      if (k === day + 1) d.classList.add(used > at ? 'over' : 'today');
      box.append(d);
    }
  }
};
// --- Send delay (Branches mod holds each message 5 s): a message cancelled with Escape in that window comes back as
// the app's red "Claude couldn't process that message" card. Seen right after Enter then Escape (within 6 s), that
// card is marked data-cskin-notsent and drawn as a small grey "Not sent"; its turn key is remembered.
if (window.__cskinSendKey) window.removeEventListener('keydown', window.__cskinSendKey, true);
window.__cskinSendKey = e => {
  if (e.key === 'Enter' && !e.shiftKey && e.target.closest?.('.epitaxy-chat-panel .ProseMirror')) window.__cskinSubmitAt = Date.now();
  else if (e.key === 'Escape' && window.__cskinSubmitAt && Date.now() - window.__cskinSubmitAt < 6000) window.__cskinCancelAt = Date.now();
};
window.addEventListener('keydown', window.__cskinSendKey, true);
const markNotSent = () => {
  const st = load(), keys = st.notSent || [];
  let changed = false;
  // the card comes in two builds (compact, and a large one with Try again); both carry this headline as a leaf
  document.querySelectorAll('.epitaxy-chat-panel span, .epitaxy-chat-panel div').forEach(h => {
    if (h.childElementCount || !/^Claude couldn.t process that message$/.test(h.textContent.trim()) || h.closest('.prose, [data-cskin-errseen]')) return;
    const row = h.closest('[data-entry-key]'); if (!row) return;
    row.dataset.cskinErrseen = '';
    const key = row.dataset.entryKey;
    const fresh = window.__cskinCancelAt && Date.now() - window.__cskinCancelAt < 15000;
    if (fresh && key && !keys.includes(key)) { keys.push(key); changed = true; window.__cskinCancelAt = 0; }
    if (key && keys.includes(key)) row.dataset.cskinNotsent = '';
  });
  if (changed) { st.notSent = keys.slice(-200); save(st); }
};
// --- Composer buttons in a column (2026-10-21): the app keeps only 24px of text margin on the right while the send
// and mic buttons take ~70px side by side, so the last line ran under them. Once the text wraps, or a single line
// reaches the buttons, the shell gets data-cskin-tall: mic stacks above send and the text keeps 34px clear.
// It switches back only with a 12px gap, so the box does not flicker at the edge.
const composerStack = () => {
  for (const pm of document.querySelectorAll('.epitaxy-prompt .ProseMirror')) {
    const shell = pm.closest('[class*="bg-surface-3"]'), grp = shell?.querySelector('div.absolute.bottom-0.right-0'); if (!grp) continue;
    // count the text's own lines (the box itself stretches in tall mode, so its height can't be used)
    const tops = new Set(); let right = 0; const w = document.createTreeWalker(pm, NodeFilter.SHOW_TEXT);
    for (let t; (t = w.nextNode());) { if (!t.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(t);
      for (const q of r.getClientRects()) if (q.width > 1) { tops.add(Math.round(q.top / 4)); right = Math.max(right, q.right); } }
    const lines = tops.size;
    const edge = grp.getBoundingClientRect().right - 72, was = shell.hasAttribute('data-cskin-tall');
    const tall = window.__cskinTallTest || (was ? (lines > 1 || right > edge - 12) : (lines > 1 || right > edge));
    if (tall !== was) shell.toggleAttribute('data-cskin-tall', tall);
  }
};
// --- Status pills (2026-10-21): the row keeps its full width (fit-content made the app's wording picker loop);
// the grey pill is clipped just past its last item. Width is written only when it changes.
const pillWidths = () => {
  for (const row of document.querySelectorAll('.epitaxy-chat-panel :is([data-cds="TurnStatus"], [data-cds="TurnStatusStep"]) > [data-cds-row]')) {
    const rr = row.getBoundingClientRect(); if (!rr.width) continue; let end = rr.left;
    for (const c of row.children) { if (c.matches('span[class*="flex-1"][class*="h-0"]')) continue; const b = c.getBoundingClientRect(); if (b.width) end = Math.max(end, b.right); }   // the spacer is not content
    const w = Math.ceil((end - rr.left) * (row.offsetWidth / rr.width) + 10) + 'px';
    if (row.style.getPropertyValue('--cskin-pill-w') !== w) row.style.setProperty('--cskin-pill-w', w);
  }
};
const tagAll = () => {
  try { pillWidths(); } catch {}
  try { composerStack(); } catch {}
  try { usageDots(); } catch {}
  try { markNotSent(); } catch {}
  addSearchButton();
  addFontControl();
  applyFont();
  applySidebarWidth();
  syncUnread();
  updateEnd();
  mountBars();
  addPaneToggle();
  addNewButton();
  applyPaneWidth();
  applySimWidth();
  applyPaneFont();
  addPaneFontControl();
  styleModPanes();
  syncBranchSummary();
  applyComposerFont();
  applySessionOrder();
  const st = load(), colors = st.colors || {}, splitAt = st.split || CFG.rightColumnStartsAt;
  for (const rec of document.querySelectorAll('[data-testid="sidebar-recents"]')) for (const block of rec.children) {
    const lab = block.querySelector('button[class*="group/label"]'); if (!lab) continue;
    const name = clean(lab.textContent);
    if (block.dataset.cskinProject !== name) block.dataset.cskinProject = name;
    const color = colors[name] || '';
    if (color) { if (block.style.getPropertyValue('--cskin-color') !== color) block.style.setProperty('--cskin-color', color); block.dataset.cskinColored = '1'; }
    else { if (block.style.getPropertyValue('--cskin-color')) block.style.removeProperty('--cskin-color'); if (block.dataset.cskinColored) delete block.dataset.cskinColored; }
    // a folded project opens by itself while one of its sessions is busy or wants you: working, unread (Claude's own
    // or the sticky one) or waiting; the app marks every non-idle state with role=status. It folds back once the
    // session is idle and read (asked 2026-10-09, working added 2026-10-14)
    const unread = !!block.querySelector('[data-row][data-cskin-unread], [data-row] [role=status][aria-label], [data-row] [role=img][aria-label]:not([aria-label="Idle"])');
    const fold = (st.folded || []).includes(name) && !unread;
    if (fold && !block.dataset.cskinFolded) block.dataset.cskinFolded = '1';
    if (!fold && block.dataset.cskinFolded) delete block.dataset.cskinFolded;
    const brk = name === splitAt;
    if (brk && !block.dataset.cskinBreak) block.dataset.cskinBreak = '1';
    if (!brk && block.dataset.cskinBreak) delete block.dataset.cskinBreak;
    const row = block.querySelector('[class*="group/labelrow"]');
    if (row) {
      const firstLbl = block.querySelector('button.w-full .dframe-fade-label');
      const first = labelText(firstLbl);
      if (row.dataset.cskinFirst !== first) row.dataset.cskinFirst = first;
      const ids = ((st.projTags || {})[name] || []).slice(0, 1), tags = ids.map(id => (st.tags || []).find(t => t.id === id)).filter(Boolean);
      let tg = row.querySelector(':scope > .cskin-tags');
      const sig = tags.map(t => t.name + '|' + (t.color || '')).join(',');
      if (tags.length) {
        if (!tg) { tg = document.createElement('span'); tg.className = 'cskin-tags'; row.append(tg); }
        if (tg.dataset.sig !== sig) { tg.dataset.sig = sig; tg.innerHTML = '';
          for (const t of tags) { const p = document.createElement('span'); p.className = 'cskin-pill'; p.textContent = t.name;
            p.style.setProperty('--tag-c', t.color || TAG_COLORS[0]); tg.append(p); } }
        const w = tg.offsetWidth ? tg.offsetWidth + 'px' : '';   // the line stops short of the tag, leaving a gap
        if (w && row.style.getPropertyValue('--cskin-tag-w') !== w) row.style.setProperty('--cskin-tag-w', w);
      } else { tg?.remove(); if (row.style.getPropertyValue('--cskin-tag-w')) row.style.removeProperty('--cskin-tag-w'); }
    }
    if (row && !row.querySelector(':scope > .cskin-chev')) {
      const chev = document.createElement('span'); chev.className = 'cskin-chev';
      chev.innerHTML = '<svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l4 4 4-4"/></svg>';
      row.append(chev);
    }
    if (row && !row.querySelector(':scope > .cskin-swatch')) {
      const dot = document.createElement('span'); dot.className = 'cskin-swatch'; dot.title = 'Colour / column';
      row.append(dot);
    }
  }
};

// --- Terminal / Changes / Browser move into the ⋮ (View options) menu. Their own buttons are hidden by
// skin.css; these menu items click the hidden originals, so they keep working exactly as before.
// Session rail added 2026-10-14 (its label flips between Show / Hide session rail, so it is matched by the end)
const MOVED = ['Terminal', 'Changes', 'Browser', 'Files', { name: 'Session rail', sel: '[aria-label$="session rail"]' }];   // Files added 2026-10-09
const keys = k => (k || '').split('+').map(p => ({ Meta: '⌘', Shift: '⇧', Alt: '⌥', Control: '⌃' }[p] || p.toUpperCase())).join('');
const extendViewMenu = () => {
  // the menu the ⋮ (View options) button opened: found through the button (it used to be found by its "Files" item,
  // which the app has since moved out of the menu, 2026-10-09)
  const vo = document.querySelector('.dframe-content .epitaxy-titlebar button[aria-label="View options"]');
  if (!vo || vo.getAttribute('aria-expanded') !== 'true') return;
  const byId = vo.getAttribute('aria-controls') && document.getElementById(vo.getAttribute('aria-controls'));
  const menus = byId ? [byId.matches('[role=menu]') ? byId : byId.querySelector('[role=menu]')].filter(Boolean) : [...document.querySelectorAll('[role=menu]')].slice(-1);
  for (const menu of menus) {
    const first = menu.querySelector('[role=menuitemcheckbox],[role=menuitem]');
    if (!first || menu.querySelector('.cskin-menu-item')) continue;
    const list = first.parentElement, frag = document.createDocumentFragment();
    for (const m of MOVED) {
      const label = typeof m === 'string' ? m : m.name, sel = typeof m === 'string' ? `[aria-label="${m}"]` : m.sel;
      const orig = document.querySelector(`.dframe-content button${sel}`); if (!orig) continue;
      const it = document.createElement('div'); it.className = first.className + ' cskin-menu-item'; it.setAttribute('role', 'menuitem');
      const icon = orig.querySelector('[data-cds="Icon"]');
      it.innerHTML = `<span class="flex size-icon shrink-0 items-center justify-center">${icon ? icon.outerHTML : ''}</span>` +
        `<span class="min-w-0 flex-1 truncate">${label}</span>` +
        (orig.getAttribute('aria-pressed') === 'true' ? '<span class="cskin-on">●</span>' : '') +
        `<span class="ml-md text-footnote cskin-keys">${keys(orig.getAttribute('aria-keyshortcuts'))}</span>`;
      it.addEventListener('click', e => { e.stopPropagation(); document.querySelector('button[aria-label="View options"]')?.click(); setTimeout(() => orig.click(), 30); });
      frag.append(it);
    }
    const sep = document.createElement('div'); sep.className = 'cskin-menu-sep'; frag.append(sep);
    list.prepend(frag);
  }
};
// --- Escape. Claude stops a running reply on Escape, which also fires when you press Escape to close Cmd+F
// search. Claude's stop-on-Escape ignores an Escape that is already marked as handled (defaultPrevented), so
// while a reply is running the skin marks a single Escape as handled. Menus, dialogs and pop-ups still close
// with it, and pressing Escape twice quickly still stops the reply on purpose. It also closes the colour menu.
if (window.__cskinEscFn) window.removeEventListener('keydown', window.__cskinEscFn, true);
window.__cskinEscFn = e => {
  if (e.key !== 'Escape') return;
  if (document.getElementById('cskin-palette')) { closePalette(); e.preventDefault(); return; }
  if (!document.querySelector('.epitaxy-chat-panel [data-turn-working="true"]')) return;                 // nothing running
  if (document.querySelector('[role=menu], [role=dialog], [role=alertdialog], [role=listbox]')) return;    // let Escape close it
  if (Date.now() - (window.__cskinEscAt || 0) < 600) { window.__cskinEscAt = 0; return; }                  // second press: stop on purpose
  window.__cskinEscAt = Date.now(); e.preventDefault();
};
window.addEventListener('keydown', window.__cskinEscFn, true);

// One delegated click handler for the project bands (replaced cleanly on every re-apply):
// chevron = collapse/expand, anywhere else on the band = colour menu. Dragging the band still works.
if (window.__cskinClick) { document.removeEventListener('click', window.__cskinClick, true);
  for (const ev of ['pointerdown', 'mousedown']) document.removeEventListener(ev, window.__cskinDown, true); }
window.__cskinDown = e => { if (e.target.closest?.('.cskin-chev, .cskin-swatch')) e.stopPropagation(); };
window.__cskinClick = e => {
  const row = e.target.closest?.('.df-recents-anchor [class*="group/labelrow"]'); if (!row) return;
  const block = row.closest('[data-cskin-project]'); if (!block) return;
  e.stopPropagation(); e.preventDefault();
  const name = block.dataset.cskinProject;
  if (e.target.closest('.cskin-chev')) { const s = load(), f = new Set(s.folded || []), folding = !f.has(name); folding ? f.add(name) : f.delete(name); s.folded = [...f]; save(s);
    // collapsing closes it now, even with the pointer still on it; it opens for a look again only after leaving
    delete block.dataset.cskinPeek; clearTimeout(block.__cskinOpen); block.__cskinOpen = 0;
    if (folding) block.dataset.cskinNopeek = '1'; else delete block.dataset.cskinNopeek;
    tagAll(); }
  else openPalette(name, row.querySelector('.cskin-swatch') || row);
};
document.addEventListener('click', window.__cskinClick, true);
// A look into a collapsed project: it opens after the pointer rests on it for a moment (so passing over it on the
// way somewhere else doesn't open it) and closes 0.6 s after the pointer leaves (a small slip doesn't close it).
// skin.css draws data-cskin-peek. A project just collapsed with its arrow (data-cskin-nopeek) waits until the pointer leaves.
if (window.__cskinPeekOver) { document.removeEventListener('pointerover', window.__cskinPeekOver, true); document.removeEventListener('pointerout', window.__cskinPeekOut, true); }
const PEEK_OPEN = 180, PEEK_CLOSE = 300;
const peekBlock = t => t?.closest?.('.df-recents-anchor > [data-cskin-folded]');
window.__cskinPeekOver = e => {
  const b = peekBlock(e.target); if (!b) return;
  clearTimeout(b.__cskinClose); b.__cskinClose = 0;
  if (b.dataset.cskinPeek || b.dataset.cskinNopeek || b.__cskinOpen) return;
  b.__cskinOpen = setTimeout(() => { b.__cskinOpen = 0; if (b.isConnected && b.dataset.cskinFolded && !b.dataset.cskinNopeek) b.dataset.cskinPeek = '1'; }, PEEK_OPEN);
};
window.__cskinPeekOut = e => {
  const b = peekBlock(e.target); if (!b || b.contains(e.relatedTarget)) return;
  clearTimeout(b.__cskinOpen); b.__cskinOpen = 0; delete b.dataset.cskinNopeek;
  if (b.dataset.cskinPeek && !b.__cskinClose) b.__cskinClose = setTimeout(() => { b.__cskinClose = 0; delete b.dataset.cskinPeek; }, PEEK_CLOSE);
};
document.addEventListener('pointerover', window.__cskinPeekOver, true);
document.addEventListener('pointerout', window.__cskinPeekOut, true);
// Optional (skin-config.json blockControlTab): Control+Tab / Control+Shift+Tab switch sessions in Claude. Block them if
// another tool (e.g. a trackpad gesture) sends them by accident. Cmd+Shift+[ / ] still switch sessions.
if (window.__cskinKey) window.removeEventListener('keydown', window.__cskinKey, true);
window.__cskinKey = e => { if (CFG.blockControlTab && e.ctrlKey && !e.metaKey && e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); } };
window.addEventListener('keydown', window.__cskinKey, true);
for (const ev of ['pointerdown', 'mousedown']) document.addEventListener(ev, window.__cskinDown, true);
// --- Read aloud player: pause / play, back / forward 5 s, speed, one reading per session, keyboard media keys.
// Claude's Read aloud streams the voice as short sound pieces into a fresh AudioContext per reading (its pause =
// suspend, its stop = stop the pieces + close; checked 2026-10-08). The skin mutes Claude's pieces and keeps them, and
// plays them with its own small player: a pointer into the kept sound, so it can pause, jump 5 s, and change speed
// on the fly (sped up by overlap-add stretching, so the voice keeps its pitch). Each session keeps its own reading:
// switching away pauses it, and coming back shows its controls. Claude's own pause button stays in step (ours press it
// while it is on the page). A silent looping track makes the page the Mac's "now playing", so the play/pause key
// pauses and ⏪ ⏩ jump 5 s. (2026-10-08)
(() => {
  const T = window.__cskinTts || (window.__cskinTts = {});
  T.armed = T.armed || 0; T.R = T.R || {}; T.byCtx = T.byCtx || new Map(); T.appEnd = Infinity;
  window.__cskinTtsTake = () => {};   // hook of the previous build, unused now
  const SRC = AudioBufferSourceNode.prototype, NODE = AudioNode.prototype, CTX = AudioContext.prototype;
  const isTts = ctx => T.byCtx.has(ctx) || T.ctx === ctx || Date.now() - T.armed < 8000;
  if (!NODE.__cskinConnect) {   // Claude's pieces go to a silent node instead of the speakers
    const connect = NODE.__cskinConnect = NODE.connect;
    NODE.connect = function (dest) {
      if (this instanceof AudioBufferSourceNode && !this.__cskinOwn && window.__cskinTts && isTts(this.context)) {
        const c = this.context; if (!c.__cskinMute) { c.__cskinMute = c.createGain(); c.__cskinMute.gain.value = 0; connect.call(c.__cskinMute, c.destination); }
        return connect.call(this, c.__cskinMute); }
      return connect.apply(this, arguments); };
  }
  if (!SRC.__cskinTts3) {
    const start = SRC.start, stop = SRC.stop, close = CTX.close;
    SRC.start = function (when, offset, dur) { if (this.buffer && !this.__cskinOwn) { try { window.__cskinTtsPiece?.(this, when, offset, dur); } catch (_) {} } return start.apply(this, arguments); };
    SRC.stop = function () { const t = window.__cskinTts; if (t && !this.__cskinOwn && t.byCtx?.has(this.context)) t.appStopAt = Date.now(); return stop.apply(this, arguments); };
    CTX.close = function () { try { window.__cskinTtsClose?.(this); } catch (_) {} return close.apply(this, arguments); };
    SRC.__cskinTts3 = 1;
  }
  // ---- the kept sound of one reading, and the player
  const N = 1024, H = 512, SEARCH = 160, WIN = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
  const here = () => T.R[location.pathname];
  const append = (r, a) => { if (r.len + a.length > r.data.length) { const d = new Float32Array(Math.max(r.data.length * 2, r.len + a.length)); d.set(r.data.subarray(0, r.len)); r.data = d; }
    r.data.set(a, r.len); r.len += a.length; };
  window.__cskinTtsPiece = (src, when, offset, dur) => {
    const ctx = src.context; if (!isTts(ctx)) return;
    let r = T.byCtx.get(ctx);
    if (!r) {
      const key = Date.now() - T.armed < 8000 && T.armedKey ? T.armedKey : location.pathname;
      if (T.R[key]) delete T.R[key];
      r = T.R[key] = { key, ctx, data: new Float32Array(src.buffer.sampleRate * 60), len: 0, sr: src.buffer.sampleRate, pos: 0, rate: 1,
        base: src.playbackRate?.value || 1, turn: T.armedTurn, idx: T.armedIdx, live: true, playing: ctx.state !== 'suspended',
        ola: new Float32Array(N), prev: null, q: null, qi: 0, cEnd: 0 };
      T.byCtx.set(ctx, r); T.ctx = ctx;
      ctx.addEventListener('statechange', () => { if (ctx.state === 'closed') return; if (r.key === location.pathname) { r.playing = ctx.state === 'running'; paint(); } });
      player(r.sr);
    }
    const b = src.buffer, off = offset || 0, n0 = Math.floor(off * b.sampleRate), n = Math.floor((dur || (b.duration - off)) * b.sampleRate);
    let a = b.getChannelData(0).slice(n0, n0 + n);
    if (b.numberOfChannels > 1) { const c1 = b.getChannelData(1); for (let i = 0; i < a.length; i++) a[i] = (a[i] + c1[n0 + i]) / 2; }
    append(r, a);
    r.cEnd = Math.max(r.cEnd, Math.max(when || 0, ctx.currentTime) + n / b.sampleRate);
  };
  window.__cskinTtsClose = ctx => {
    const r = T.byCtx.get(ctx); if (!r) return; T.byCtx.delete(ctx); r.live = false;
    const now = Date.now(), naturalEnd = ctx.currentTime >= r.cEnd - 0.3;
    // Claude's own stop (not its natural end, not a new reading or a session switch): the reading ends here too
    if (!naturalEnd && now - (T.appStopAt || 0) < 800 && now - (T.navAt || 0) > 2500 && now - T.armed > 2500 && r.key === location.pathname) { delete T.R[r.key]; paint(); }
  };
  const step = r => {   // one stretched hop (H samples) into r.q
    const d = r.data; let p = Math.round(r.pos);
    if (p + N + SEARCH >= r.len) return false;
    if (r.prev !== null) { const nat = r.prev + H; let best = 0, top = -Infinity;
      for (let k = -SEARCH; k <= SEARCH; k += 2) { const q = p + k; if (q < 0) continue; let sc = 0; for (let i = 0; i < N / 2; i += 4) sc += d[q + i] * d[nat + i]; if (sc > top) { top = sc; best = k; } }
      p = Math.max(0, p + best); }
    const o = r.ola; for (let i = 0; i < N; i++) o[i] += d[p + i] * WIN[i];
    r.q = o.slice(0, H); o.copyWithin(0, H); o.fill(0, N - H); r.qi = 0;
    r.prev = p; r.pos += H * r.rate * r.base; return true; };
  const resetStretch = r => { r.prev = null; r.ola.fill(0); r.q = null; r.qi = 0; };
  const player = sr => {
    if (T.pctx && T.pctx.sampleRate === sr && T.pctx.state !== 'closed') { if (T.pctx.state === 'suspended') T.pctx.resume(); return; }
    try { T.pctx?.close(); } catch (_) {}
    const c = T.pctx = new AudioContext({ sampleRate: sr }), proc = T.proc = c.createScriptProcessor(2048, 0, 1);
    proc.onaudioprocess = e => {
      const out = e.outputBuffer.getChannelData(0), r = here(); let i = 0;
      if (r && r.playing && r.sr === c.sampleRate) {
        const eff = r.rate * r.base;
        if (Math.abs(eff - 1) < 0.001) {   // normal speed: the kept sound as it is
          const p = Math.floor(r.pos), n = Math.max(0, Math.min(out.length, r.len - p));
          if (n) { out.set(r.data.subarray(p, p + n)); r.pos = p + n; i = n; } resetStretch(r);
        } else while (i < out.length) {
          if (!r.q || r.qi >= H) { if (!step(r)) break; }
          const take = Math.min(H - r.qi, out.length - i); out.set(r.q.subarray(r.qi, r.qi + take), i); r.qi += take; i += take;
        }
        if (!r.live && r.pos >= r.len - N - SEARCH - 2 && i < out.length) r.finished = true;
      }
      if (i < out.length) out.fill(0, i);
    };
    proc.__cskinOwn = 1; NODE.__cskinConnect.call(proc, c.destination);
  };
  const seek = d => { const r = here(); if (!r) return; r.pos = Math.max(0, Math.min(r.pos + d * r.sr, Math.max(0, r.len - 1))); r.finished = false; resetStretch(r); paint(); };
  const SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.75];
  const speed = () => { const r = here(); if (!r) return; r.rate = SPEEDS[(SPEEDS.indexOf(r.rate) + 1) % SPEEDS.length]; resetStretch(r); paint(); };
  const bar = r => r && r.turn && document.querySelector(`.epitaxy-chat-panel [data-cds="AssistantMessage"][data-turn-key="${CSS.escape(r.turn)}"] [data-cds="MessageActions"]`);
  const ownBtn = r => { const b = bar(r); const x = b ? [...b.querySelectorAll('button')].filter(y => !y.closest('.cskin-tts'))[r.idx] : null;
    return x && r.live && !/read aloud/i.test(x.getAttribute('aria-label') || '') ? x : null; };
  // pause / play press Claude's own button when it's on the page (so its icon keeps in step), else act directly
  const toggle = want => { const r = here(); if (!r || r.playing === !want) return;
    const own = ownBtn(r); if (own) own.click();
    setTimeout(() => { if (r.playing === want) { r.playing = !want; if (!want) player(r.sr); } paint(); }, 300);
    if (!want) player(r.sr); };
  const doPause = () => toggle(true), doPlay = () => toggle(false);
  const silent = () => { if (T.audio) return T.audio;
    const n = 8000, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf), w = (o, str) => [...str].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    const a = new Audio(URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }))); a.loop = true; return (T.audio = a); };
  const ms = navigator.mediaSession;
  const session = r => { if (!ms) return;
    if (r) { const a = silent();
      if (!T.msOn) { T.msOn = 1;
        try { ms.metadata = new MediaMetadata({ title: 'Claude, reading aloud', artist: document.title.replace(/ - Claude Code$/, '') }); } catch (_) {}
        const Hd = { play: doPlay, pause: doPause, stop: doPause, seekbackward: () => seek(-5), seekforward: () => seek(5), previoustrack: () => seek(-5), nexttrack: () => seek(5) };
        for (const [k, f] of Object.entries(Hd)) { try { ms.setActionHandler(k, f); } catch (_) {} } }
      if (!r.playing) { if (!a.paused) a.pause(); ms.playbackState = 'paused'; } else { if (a.paused) a.play().catch(() => {}); ms.playbackState = 'playing'; }
    } else if (T.msOn) { T.msOn = 0; T.audio?.pause();
      for (const k of ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'previoustrack', 'nexttrack']) { try { ms.setActionHandler(k, null); } catch (_) {} }
      try { ms.metadata = null; } catch (_) {} ms.playbackState = 'none'; } };
  const ICON = {
    pause: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><rect x="4" y="3" width="2.6" height="10" rx=".8"/><rect x="9.4" y="3" width="2.6" height="10" rx=".8"/></svg>',
    play: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5 3.2v9.6c0 .5.5.8.9.5l7.2-4.8a.6.6 0 0 0 0-1L5.9 2.7c-.4-.3-.9 0-.9.5z"/></svg>',
    back: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 7.2A6.5 6.5 0 1 1 3.5 11"/><path d="M4.4 3.6v3.8h3.8"/><text x="10" y="13.4" font-size="6.6" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="-apple-system, system-ui">5</text></svg>',
    fwd: '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15.4 7.2A6.5 6.5 0 1 0 16.5 11"/><path d="M15.6 3.6v3.8h-3.8"/><text x="10" y="13.4" font-size="6.6" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="-apple-system, system-ui">5</text></svg>' };
  const button = (cls, title, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; if (title) b.title = title;
    for (const ev of ['pointerdown', 'mousedown']) b.addEventListener(ev, e => e.stopPropagation());
    b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
  const make = () => { const w = document.createElement('span'); w.className = 'cskin-tts cskin-tts-floating'; w.id = 'cskin-tts-float';
    const bk = button('cskin-tts-back', 'Back 5 seconds', () => seek(-5)); bk.innerHTML = ICON.back;
    const pp = button('cskin-tts-pp', '', () => here()?.playing ? doPause() : doPlay());
    const fw = button('cskin-tts-fwd', 'Forward 5 seconds', () => seek(5)); fw.innerHTML = ICON.fwd;
    const sp = button('cskin-tts-speed', 'Reading speed', speed);
    // a grip to drag the pill anywhere (it covered the Submit button of Claude's questions); the spot is remembered,
    // as an offset from its usual place above the message box. Double-click the grip to put it back.
    const grip = document.createElement('span'); grip.className = 'cskin-tts-grip'; grip.title = 'Drag to move (double-click to put back)';
    grip.innerHTML = '<svg viewBox="0 0 8 14" width="6" height="12" fill="currentColor"><circle cx="2" cy="2" r="1.1"/><circle cx="6" cy="2" r="1.1"/><circle cx="2" cy="7" r="1.1"/><circle cx="6" cy="7" r="1.1"/><circle cx="2" cy="12" r="1.1"/><circle cx="6" cy="12" r="1.1"/></svg>';
    grip.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); grip.setPointerCapture(e.pointerId);
      const o = offset(), x0 = e.clientX, y0 = e.clientY; w.classList.add('cskin-dragging');
      const mv = ev => { T.drag = { dx: o.dx + ev.clientX - x0, dy: o.dy + ev.clientY - y0 }; paint(); };
      const up = () => { grip.removeEventListener('pointermove', mv); grip.removeEventListener('pointerup', up); w.classList.remove('cskin-dragging');
        if (T.drag) { try { localStorage.setItem('cskinTtsOffset', JSON.stringify(T.drag)); } catch (_) {} T.drag = null; } paint(); };
      grip.addEventListener('pointermove', mv); grip.addEventListener('pointerup', up); });
    grip.addEventListener('dblclick', e => { e.stopPropagation(); try { localStorage.removeItem('cskinTtsOffset'); } catch (_) {} paint(); });
    w.append(grip, bk, pp, fw, sp); return w; };
  const offset = () => { if (T.drag) return T.drag; try { return JSON.parse(localStorage.getItem('cskinTtsOffset')) || { dx: 0, dy: 0 }; } catch (_) { return { dx: 0, dy: 0 }; } };
  const composerRect = () => { const pm = document.querySelector('.epitaxy-chat-panel .ProseMirror'); if (!pm) return null;
    let x = pm; for (let i = 0; i < 8 && x.parentElement; i++) { x = x.parentElement; if (x.getBoundingClientRect().width > pm.getBoundingClientRect().width + 16) break; }
    return x.getBoundingClientRect(); };
  const paint = () => {
    if (T.lastPath !== location.pathname) {   // switched session: the one left behind pauses
      const left = T.R[T.lastPath]; if (left && left.playing) { left.playing = false; const own = ownBtn(left); if (own) own.click(); }
      T.lastPath = location.pathname; T.navAt = Date.now(); }
    let r = here(); if (r && r.finished) { delete T.R[r.key]; r = null; }
    session(r);
    let fl = document.getElementById('cskin-tts-float');
    if (!r) { fl?.remove(); return; }
    if (!fl) { fl = make(); document.body.append(fl); }
    const pp = fl.querySelector('.cskin-tts-pp'), k = r.playing ? 'pause' : 'play';
    if (pp.dataset.k !== k) { pp.dataset.k = k; pp.innerHTML = ICON[k]; pp.title = r.playing ? 'Pause reading' : 'Carry on reading'; }
    const sp = fl.querySelector('.cskin-tts-speed'), label = r.rate + '×'; if (sp.textContent !== label) sp.textContent = label;
    const cr = composerRect(); if (cr) { const o = offset(), W = fl.offsetWidth, Hh = fl.offsetHeight;
      fl.style.top = Math.max(4, Math.min(innerHeight - Hh - 4, cr.top - Hh - 28 + o.dy)) + 'px';
      fl.style.left = Math.max(4, Math.min(innerWidth - W - 4, cr.right - W + o.dx)) + 'px'; }
  };
  if (window.__cskinTtsClick) document.removeEventListener('click', window.__cskinTtsClick, true);
  window.__cskinTtsClick = e => {
    const b = e.target.closest?.('[data-cds="MessageActions"] button[aria-label]'); if (!b || b.closest('.cskin-tts')) return;
    if (!/read aloud/i.test(b.getAttribute('aria-label'))) return;
    T.armed = Date.now(); T.armedKey = location.pathname;
    T.armedTurn = b.closest('[data-cds="AssistantMessage"]')?.dataset.turnKey || '';
    T.armedIdx = [...b.closest('[data-cds="MessageActions"]').querySelectorAll('button')].filter(x => !x.closest('.cskin-tts')).indexOf(b);
  };
  document.addEventListener('click', window.__cskinTtsClick, true);
  clearInterval(window.__cskinTtsTimer); window.__cskinTtsTimer = setInterval(paint, 250);
})();
// --- Input box: keep the line you are typing clear of the bottom fade. Past 8 lines the editor scrolls only
// until the cursor is ~5px above the box edge, which is under the fade; nudge it up to 12px (asked 2026-10-11).
if (window.__cskinCaretNudge) { document.removeEventListener('input', window.__cskinCaretNudge, true); document.removeEventListener('keyup', window.__cskinCaretNudge, true); }
window.__cskinCaretNudge = e => {
  const pm = e.target?.closest?.('.epitaxy-prompt .ProseMirror'); if (!pm) return;
  requestAnimationFrame(() => {
    const sc = pm.parentElement, sel = getSelection(); if (!sc || !sel || !sel.rangeCount || sc.scrollHeight <= sc.clientHeight) return;
    let r = sel.getRangeAt(0).getBoundingClientRect();
    if (!r.height) { const n = sel.focusNode?.nodeType === 1 ? sel.focusNode : sel.focusNode?.parentElement; if (n) r = n.getBoundingClientRect(); }
    if (!r.height) return;
    const gap = sc.getBoundingClientRect().bottom - r.bottom;
    if (gap < 12) sc.scrollTop += 12 - gap;
  });
};
document.addEventListener('input', window.__cskinCaretNudge, true);
document.addEventListener('keyup', window.__cskinCaretNudge, true);

if (window.__cskinObs) window.__cskinObs.disconnect();
document.querySelectorAll('.cskin-tts, .cskin-swatch, .cskin-chev, .cskin-search, .cskin-resize, .cskin-fs, .cskin-tags, .cskin-pane-toggle, .cskin-hint, .cskin-sord, .cskin-pfs, .cskin-bsum, .cskin-new').forEach(e => e.remove());
document.querySelectorAll('[data-cskin-click]').forEach(e => delete e.dataset.cskinClick);   // remove old dots so new ones get the current palette code
let queued = false;
window.__cskinObs = new MutationObserver(() => { extendViewMenu(); if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; tagAll(); }); } });
window.__cskinObs.observe(document.body, { childList: true, subtree: true });
tagAll();
window.__cskinTag = tagAll;   // for maintenance/testing
