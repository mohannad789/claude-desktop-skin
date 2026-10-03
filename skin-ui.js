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
  document.body.append(p);
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
const applySidebarWidth = () => {
  const a = document.querySelector('aside.dframe-sidebar'); if (!a) return;
  const w = load().sidebarW;
  if (w && !document.getElementById('cskin-width')) setWidth(w);
  if (!a.querySelector(':scope > .cskin-resize')) {
    const h = document.createElement('div'); h.className = 'cskin-resize'; h.title = 'Drag to resize (double-click: default width)';
    h.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); h.setPointerCapture(e.pointerId);
      const left = a.getBoundingClientRect().left; let cur = null; document.body.classList.add('cskin-resizing');
      const move = ev => { cur = Math.round(Math.min(600, Math.max(170, ev.clientX - left))); setWidth(cur); };
      const up = () => { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); document.body.classList.remove('cskin-resizing');
        if (cur) { const s = load(); s.sidebarW = cur; save(s); } };
      h.addEventListener('pointermove', move); h.addEventListener('pointerup', up);
    });
    h.addEventListener('dblclick', () => { const s = load(); delete s.sidebarW; save(s); setWidth(null); });
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

// --- Sidebar text size control in the bottom bar (claudeSkin.fontSize, 7–14 px in 0.5 steps)
const applyFont = () => {
  const fs = load().fontSize; let st = document.getElementById('cskin-fs');
  if (!fs) { st?.remove(); return; }
  if (!st) { st = document.createElement('style'); st.id = 'cskin-fs'; document.head.append(st); }
  st.textContent = `aside.dframe-sidebar { --df-row-font: ${fs}px !important; --df-row-h: ${Math.round(fs * 1.9)}px !important; }
    aside.dframe-sidebar .truncate, aside.dframe-sidebar .dframe-fade-label, aside.dframe-sidebar [class*="text-[12px]"] { font-size: ${fs}px !important; }`;
};
const addFontControl = () => {
  const row = document.querySelector('aside.dframe-sidebar .df-footer-row');
  if (!row || row.querySelector('.cskin-fs')) return;
  const box = document.createElement('div'); box.className = 'cskin-fs'; box.title = 'Sidebar text size';
  const val = document.createElement('span'); val.className = 'cskin-fs-v';
  const show = () => { val.textContent = (load().fontSize || 10.5).toFixed(1); };
  const step = d => { const s = load(); s.fontSize = Math.min(14, Math.max(7, (s.fontSize || 10.5) + d)); save(s); applyFont(); show(); };
  const minus = document.createElement('button'); minus.className = 'cskin-fs-s'; minus.textContent = 'A'; minus.title = 'Smaller'; minus.onclick = e => { e.stopPropagation(); step(-0.5); };
  const plus = document.createElement('button'); plus.className = 'cskin-fs-l'; plus.textContent = 'A'; plus.title = 'Bigger'; plus.onclick = e => { e.stopPropagation(); step(0.5); };
  box.append(minus, val, plus); show();
  row.insertBefore(box, row.querySelector('.df-footer-aux'));
};


// --- "At the end" cue: mark each chat panel whose transcript is scrolled to the bottom (skin.css draws the cue)
const updateEnd = () => {
  document.documentElement.dataset.cskinEndcue = load().endCue || 'glow';
  for (const panel of document.querySelectorAll('.epitaxy-chat-panel')) {
    const sc = panel.querySelector('.epitaxy-transcript-typography')?.parentElement; if (!sc) continue;
    const end = sc.scrollHeight - sc.scrollTop - sc.clientHeight < 6;
    if (end !== panel.hasAttribute('data-cskin-end')) panel.toggleAttribute('data-cskin-end', end);
  }
};
let endQueued = false;
if (window.__cskinScrollFn) document.removeEventListener('scroll', window.__cskinScrollFn, true);
window.__cskinScrollFn = () => { if (!endQueued) { endQueued = true; requestAnimationFrame(() => { endQueued = false; updateEnd(); }); } };
document.addEventListener('scroll', window.__cskinScrollFn, { capture: true, passive: true });


// --- Message button bars (copy, branch, pin, read aloud, time): Claude only builds a message's bar after the
// mouse first passes over it, so skin.css's "always visible" had nothing to show. Each turn-ending message
// (and each of your messages) without a bar gets a fake hover, so the bar is built straight away.
const mountBars = () => {
  let retry = false;
  const rows = [...document.querySelectorAll('.epitaxy-chat-panel [data-testid="transcript-row"]')].filter(r => r.dataset.perfRow !== 'marker');
  rows.forEach((r, k) => {
    if (r.querySelector('div.select-none:has(> time)') || (+r.dataset.cskinHovN || 0) >= 5 || Date.now() - (+r.dataset.cskinHov || 0) < 500) return;   // has one, gave up, or tried just now
    const user = !!r.querySelector('.epitaxy-user-turn'), next = rows[k + 1];
    const endOfTurn = !user && /^assistant/.test(r.dataset.perfRow || '') && (!next || next.querySelector('.epitaxy-user-turn'));   // older rows are just "assistant"
    if (!user && !endOfTurn) return;
    if (endOfTurn && !next) {      // the last drawn row is only the end of a turn if nothing is drawn below it
      const tail = r.closest('[data-testid="transcript-rows"]')?.lastElementChild;
      if (!/height: 48px/.test(tail?.getAttribute('style') || '') || document.querySelector('.epitaxy-chat-panel [data-turn-working="true"]')) return;
    }
    const leaf = r.querySelector('.prose p, .prose li, .epitaxy-user-turn p, .epitaxy-user-turn [class*="whitespace-pre"]') || r.querySelector('[class*="group/msg"]');
    if (!leaf) return;
    r.dataset.cskinHov = Date.now(); r.dataset.cskinHovN = (+r.dataset.cskinHovN || 0) + 1; retry = true;
    const o = { bubbles: true, cancelable: true, view: window, relatedTarget: null };       // out first, so it counts as a fresh hover
    for (const t of ['pointerout', 'mouseout', 'pointerover', 'mouseover']) leaf.dispatchEvent(new (t[0] === 'p' ? PointerEvent : MouseEvent)(t, o));
  });
  if (retry) { clearTimeout(window.__cskinBarT); window.__cskinBarT = setTimeout(mountBars, 600); }   // a just-drawn message may ignore the first try
};

const tagAll = () => {
  addSearchButton();
  addFontControl();
  if (!document.getElementById('cskin-fs') && load().fontSize) applyFont();
  applySidebarWidth();
  updateEnd();
  mountBars();
  const st = load(), colors = st.colors || {}, splitAt = st.split || CFG.rightColumnStartsAt;
  for (const rec of document.querySelectorAll('[data-testid="sidebar-recents"]')) for (const block of rec.children) {
    const lab = block.querySelector('button[class*="group/label"]'); if (!lab) continue;
    const name = clean(lab.textContent);
    if (block.dataset.cskinProject !== name) block.dataset.cskinProject = name;
    const color = colors[name] || '';
    if (color) { if (block.style.getPropertyValue('--cskin-color') !== color) block.style.setProperty('--cskin-color', color); block.dataset.cskinColored = '1'; }
    else { if (block.style.getPropertyValue('--cskin-color')) block.style.removeProperty('--cskin-color'); if (block.dataset.cskinColored) delete block.dataset.cskinColored; }
    const fold = (st.folded || []).includes(name);
    if (fold && !block.dataset.cskinFolded) block.dataset.cskinFolded = '1';
    if (!fold && block.dataset.cskinFolded) delete block.dataset.cskinFolded;
    const brk = name === splitAt;
    if (brk && !block.dataset.cskinBreak) block.dataset.cskinBreak = '1';
    if (!brk && block.dataset.cskinBreak) delete block.dataset.cskinBreak;
    const row = block.querySelector('[class*="group/labelrow"]');
    if (row) {
      const firstLbl = block.querySelector('button.w-full .dframe-fade-label');
      const first = firstLbl ? firstLbl.textContent.trim() : '';
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
const MOVED = ['Terminal', 'Changes', 'Browser'];
const keys = k => (k || '').split('+').map(p => ({ Meta: '⌘', Shift: '⇧', Alt: '⌥', Control: '⌃' }[p] || p.toUpperCase())).join('');
const extendViewMenu = () => {
  for (const menu of document.querySelectorAll('[role=menu]')) {
    const first = menu.querySelector('[role=menuitemcheckbox],[role=menuitem]');
    if (!first || !/Files/.test(menu.textContent) || menu.querySelector('.cskin-menu-item')) continue;
    const list = first.parentElement, frag = document.createDocumentFragment();
    for (const label of MOVED) {
      const orig = document.querySelector(`.dframe-content button[aria-label="${label}"]`); if (!orig) continue;
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
  if (e.target.closest('.cskin-chev')) { const s = load(), f = new Set(s.folded || []); f.has(name) ? f.delete(name) : f.add(name); s.folded = [...f]; save(s); tagAll(); }
  else openPalette(name, row.querySelector('.cskin-swatch') || row);
};
document.addEventListener('click', window.__cskinClick, true);
// Optional (skin-config.json blockControlTab): Control+Tab / Control+Shift+Tab switch sessions in Claude. Block them if
// another tool (e.g. a trackpad gesture) sends them by accident. Cmd+Shift+[ / ] still switch sessions.
if (window.__cskinKey) window.removeEventListener('keydown', window.__cskinKey, true);
window.__cskinKey = e => { if (CFG.blockControlTab && e.ctrlKey && !e.metaKey && e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); } };
window.addEventListener('keydown', window.__cskinKey, true);
for (const ev of ['pointerdown', 'mousedown']) document.addEventListener(ev, window.__cskinDown, true);
if (window.__cskinObs) window.__cskinObs.disconnect();
document.querySelectorAll('.cskin-swatch, .cskin-chev, .cskin-search, .cskin-resize, .cskin-fs, .cskin-tags').forEach(e => e.remove());
document.querySelectorAll('[data-cskin-click]').forEach(e => delete e.dataset.cskinClick);   // remove old dots so new ones get the current palette code
let queued = false;
window.__cskinObs = new MutationObserver(() => { extendViewMenu(); if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; tagAll(); }); } });
window.__cskinObs.observe(document.body, { childList: true, subtree: true });
tagAll();
window.__cskinTag = tagAll;   // for maintenance/testing
