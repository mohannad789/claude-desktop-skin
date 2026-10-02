(() => {
  let s = document.getElementById('claude-skin-style');
  if (!s) { s = document.createElement('style'); s.id = 'claude-skin-style'; document.head.appendChild(s); }
  s.textContent = "/* Claude Skin: styles for the Claude desktop app. Applied by apply.js (re-run after each launch). */\n\n/* Sidebar: smaller text and tighter rows. The app sizes rows from these two variables. */\naside.dframe-sidebar {\n  --df-row-font: 10.5px; /* was 13px */\n  --df-row-h: 20px;      /* was 26px */\n}\n/* Section labels (Pinned, Recents\u2026) and the search box follow suit */\naside.dframe-sidebar .df-search-field,\naside.dframe-sidebar .df-search-field span { font-size: 10.5px !important; }\naside.dframe-sidebar [class*=\"text-[12px]\"], aside.dframe-sidebar .truncate { font-size: 10.5px; }\n\n\n/* Less padding on the sides so more fits */\naside.dframe-sidebar [data-testid=\"sidebar\"] { padding-left: 2px !important; padding-right: 2px !important; }\naside.dframe-sidebar { --df-row-px: 4px; }\n\n/* The whole session list flows into two columns, like a newspaper: projects fill the left\n   column first, then continue at the top of the right one. A project is never split. */\naside.dframe-sidebar .df-recents-anchor { column-count: 2; column-gap: 4px; column-fill: auto; }\n/* The right column always starts at the project named in skin-config.json (rightColumnStartsAt) */\naside.dframe-sidebar .df-recents-anchor > [data-cskin-break] { break-before: column; }\naside.dframe-sidebar .df-recents-anchor > * { break-inside: avoid; }\n/* No split chosen yet: share the projects evenly between the two columns */\naside.dframe-sidebar .df-recents-anchor:not(:has(> [data-cskin-break])) { column-fill: balance; }\n\n/* Less indent on the left of each session, and less space between the unread dot and the name */\naside.dframe-sidebar {\n  --df-row-indent: 0px;\n  --df-iconless-pad: 2px;\n  --df-leading-slot: 10px;\n  --df-row-gap: 3px;\n}\n\n/* No \"\u2026\" button on hover over a session (right-click still has every action) */\naside.dframe-sidebar .df-recents-anchor .group.relative > div.absolute { display: none !important; }\n\n/* Section titles (Routines, Pinned, project names): much less space above and below */\naside.dframe-sidebar { --df-group-pt: 3px; }                        /* was 12px above */\naside.dframe-sidebar .df-label-inset { padding-bottom: 1px !important; padding-left: 2px !important; }\n\n/* Session rows: start the unread dot right at the edge and put the name right after it */\naside.dframe-sidebar { --df-row-px: 1px; --df-row-gap: 2px; }\naside.dframe-sidebar .df-recents-anchor button.w-full .df-leading-slot,\naside.dframe-sidebar .df-recents-anchor button.w-full [class*=\"min-w-3.5\"] { width: 8px !important; min-width: 8px !important; }\n\n/* Hide the top items: New, Artifacts, Routines, Customize (Search stays) */\naside.dframe-sidebar .static-composer-boot-fade > .shrink-0 > .contents { display: none !important; }   /* New */\naside.dframe-sidebar [data-testid=\"nav-pin-rows\"] { display: none !important; }                          /* Artifacts, Routines, Customize */\n\n/* Project names become grab bars: a thin line at rest, a thicker bar on hover. Drag it to reorder\n   projects; click it for the colour / tag / column menu; the arrow on its left collapses the project. */\naside.dframe-sidebar .df-recents-anchor [class*=\"group/labelrow\"] {\n  position: relative; height: 14px !important; min-height: 0 !important; padding: 0 !important;\n  margin: 1px 0 0 !important; width: 100% !important; overflow: visible !important; cursor: grab;\n  background: none !important; }\naside.dframe-sidebar .df-recents-anchor [class*=\"group/labelrow\"]::before {      /* the line / bar, 70% wide */\n  content: \"\"; position: absolute; left: max(15%, 22px); right: max(15%, 22px); top: 50%; height: 1px; transform: translateY(-50%);\n  border-radius: 999px; background: hsl(var(--text-500) / 0.16); pointer-events: none;\n  transition: height .12s ease, background-color .12s ease, right .12s ease; }\naside.dframe-sidebar .df-recents-anchor [class*=\"group/labelrow\"]:hover::before {\n  height: 7px; background: hsl(var(--text-500) / 0.30); transition-delay: .25s; }\naside.dframe-sidebar .df-recents-anchor [class*=\"group/labelrow\"] > :not(button[class*=\"group/label\"]):not(.cskin-swatch):not(.cskin-chev):not(.cskin-tags) { display: none !important; }\naside.dframe-sidebar .df-recents-anchor [class*=\"group/labelrow\"] > button[class*=\"group/label\"] {\n  width: 100% !important; height: 100% !important; margin: 0 !important; opacity: 0; cursor: grab; }\naside.dframe-sidebar .df-recents-anchor > * { padding-bottom: 7px; }\n\n/* No fade \"curtain\" over the end of a session name on hover (it made room for the hidden \u2026 button).\n   A name that is too long for its column still fades out at the end, as before. */\naside.dframe-sidebar .df-recents-anchor .group:hover .dframe-fade-label:not([data-overflowing]) {\n  mask-image: none !important; -webkit-mask-image: none !important; }\naside.dframe-sidebar .df-recents-anchor .group:hover .dframe-fade-label[data-overflowing] {\n  mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%) !important;\n  -webkit-mask-image: linear-gradient(to right, black calc(100% - 24px), transparent 100%) !important; }\n\n/* Bold session names (delete this block for normal weight) */\naside.dframe-sidebar .df-recents-anchor button.w-full .dframe-fade-label { font-weight: 600; }\n\n\n\n/* Shorter bar above the sidebar, and less space before the first item */\nhtml body .dframe-root { --df-header-h: 34px !important; }   /* was 48px */\naside.dframe-sidebar [data-testid=\"sidebar\"] { padding-top: 2px !important; }\n\n/* Shorter bar at the bottom of the sidebar (your name and plan) */\naside.dframe-sidebar .df-footer-row { min-height: 0 !important; height: 30px !important; padding-top: 0 !important; padding-bottom: 0 !important; }\naside.dframe-sidebar [data-testid=\"user-menu-button\"] { height: 24px !important; }\n\n/* Bottom bar (your name and plan): breathing room from the edges */\naside.dframe-sidebar .df-bottom-tray { margin-left: 0 !important; margin-right: 0 !important; }  /* it hung 6 px off the edge */\naside.dframe-sidebar .df-footer-row { padding-left: 10px !important; padding-right: 8px !important; }\n\n/* Account button: space between the round avatar and your name */\naside.dframe-sidebar [data-testid=\"user-menu-button\"] { gap: 7px !important; }\naside.dframe-sidebar [data-testid=\"user-menu-button\"] .df-on-rail { width: 22px !important; min-width: 22px !important; } /* room for the avatar (the row slot was shrunk to 10 px) */\n\n/* Hovering a project's line highlights the whole project, so you see what you're about to drag */\naside.dframe-sidebar .df-recents-anchor [class*=\"group/section\"]:has([class*=\"group/labelrow\"]:hover) {\n  background: hsl(var(--text-500) / 0.08); border-radius: 8px; }\n\n/* Project colours: every project gets a soft box + line in its colour; default is grey\n   (the dash circle in the palette). Pick a colour from the dot on the project's line. */\naside.dframe-sidebar .df-recents-anchor > [data-cskin-project] { --cskin-c: var(--cskin-color, hsl(220 8% 55%)); }\naside.dframe-sidebar .df-recents-anchor > [data-cskin-project] [class*=\"group/section\"] {\n  background: color-mix(in srgb, var(--cskin-c) 8%, transparent); border-radius: 8px; transition: background-color .12s ease; }\naside.dframe-sidebar .df-recents-anchor > [data-cskin-project] [class*=\"group/labelrow\"]::before {\n  background: color-mix(in srgb, var(--cskin-c) 60%, transparent); }\naside.dframe-sidebar .df-recents-anchor > [data-cskin-project] [class*=\"group/labelrow\"]:hover::before { background: var(--cskin-c); }\naside.dframe-sidebar .df-recents-anchor > [data-cskin-project] [class*=\"group/section\"]:has([class*=\"group/labelrow\"]:hover) {\n  background: color-mix(in srgb, var(--cskin-c) 17%, transparent); transition-delay: .25s; }\n\n/* The colour dot at the right end of a project's line band: shows while the pointer is anywhere in that\n   band, and lingers 0.6 s after leaving so a small slip doesn't hide it */\naside.dframe-sidebar .cskin-swatch { position: absolute; right: 3px; top: 50%; transform: translateY(-50%);\n  width: 9px; height: 9px; border-radius: 50%; z-index: 3; cursor: pointer;\n  background: var(--cskin-c, hsl(220 8% 55%));\n  opacity: 0; visibility: hidden; transition: opacity .15s ease .6s, visibility 0s linear .75s; }\naside.dframe-sidebar .cskin-chev { position: absolute; left: 2px; top: 50%; transform: translateY(-50%); z-index: 3;\n  display: flex; cursor: pointer; color: hsl(var(--text-400));\n  opacity: 0; visibility: hidden; transition: opacity .15s ease .6s, visibility 0s linear .75s, transform .15s ease; }\naside.dframe-sidebar [data-cskin-folded] .cskin-chev { transform: translateY(-50%) rotate(-90deg); }\naside.dframe-sidebar [class*=\"group/labelrow\"]:hover .cskin-chev { opacity: 1; visibility: visible; transition: opacity .1s ease .25s, visibility 0s linear .25s, transform .15s ease; }\naside.dframe-sidebar [class*=\"group/labelrow\"]:hover .cskin-swatch {\n  opacity: 1; visibility: visible; transition: opacity .1s ease .25s, visibility 0s linear .25s; }\n\n/* The palette: 20 colours + a dashed circle for default grey, and the column option */\n#cskin-palette { position: fixed; z-index: 99999; background: hsl(var(--bg-000)); color: hsl(var(--text-100));\n  border: 1px solid hsl(var(--text-500) / 0.18); border-radius: 10px; padding: 7px; width: auto;\n  box-shadow: 0 8px 28px hsl(0 0% 0% / 0.18); font: 10px/1.3 var(--cds-font-sans, system-ui); }\n#cskin-palette .cskin-p-grid { display: grid; grid-template-columns: repeat(7, 18px); gap: 5px; margin-bottom: 5px; }\n#cskin-palette .cskin-p-grid button { width: 18px; height: 18px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; }\n#cskin-palette .cskin-p-grid button.on { box-shadow: 0 0 0 2px hsl(var(--bg-000)), 0 0 0 3px hsl(var(--text-100)); }\n#cskin-palette .cskin-p-grid button.cskin-none { background:\n  linear-gradient(135deg, transparent 45%, hsl(var(--text-500)) 45%, hsl(var(--text-500)) 55%, transparent 55%),\n  hsl(220 8% 55% / 0.25); }\n#cskin-palette .cskin-p-row { display: block; width: 100%; text-align: left; border: 0; background: none; color: inherit;\n  padding: 4px 3px; border-radius: 6px; cursor: pointer; font: 10px/1.3 var(--cds-font-sans, system-ui); }\n#cskin-palette .cskin-p-row:hover { background: hsl(var(--text-500) / 0.10); }\n#cskin-palette .cskin-p-row { display: flex; align-items: center; gap: 6px; }\n#cskin-palette .cskin-p-row svg { flex: none; opacity: .75; }\n#cskin-palette .cskin-p-row .cskin-check { margin-left: auto; opacity: 1; color: hsl(var(--accent-brand)); }\n\n/* Selected session: clearly darker, with an accent edge */\naside.dframe-sidebar [data-row][data-selected=\"focused\"], aside.dframe-sidebar [data-row][data-selected=\"open\"] {\n  background: hsl(var(--text-500) / 0.26) !important; box-shadow: inset 2px 0 0 hsl(var(--accent-brand)); }\naside.dframe-sidebar [data-row][data-selected=\"focused\"] button.w-full, aside.dframe-sidebar [data-row][data-selected=\"open\"] button.w-full {\n  color: hsl(var(--text-000)) !important; }\n\n/* Collapsed projects (the arrow on a project's line): only the line shows; hovering the project opens it */\naside.dframe-sidebar .df-recents-anchor > [data-cskin-folded]:not(:hover) [class*=\"group/section\"] > .contents { display: none !important; }\n\n/* Message box: at most about 8 lines tall, then it scrolls */\n.dframe-content [class*=\"max-h-96\"]:has(> .ProseMirror) { max-height: calc(8lh + 6px) !important; }\n\n/* Top-right buttons Terminal / Changes / Browser live in the \u22ee menu instead (added by tag.js) */\n.dframe-content .epitaxy-titlebar button[aria-label=\"Terminal\"],\n.dframe-content .epitaxy-titlebar button[aria-label=\"Changes\"],\n.dframe-content .epitaxy-titlebar button[aria-label=\"Browser\"] { display: none !important; }\n.cskin-menu-item { cursor: default; }\n.cskin-menu-item:hover { background: var(--cds-fill-ghost-hover, hsl(var(--text-500) / 0.08)); }\n.cskin-menu-item .cskin-keys { color: var(--cds-text-muted, hsl(var(--text-400))); margin-left: 12px; }\n.cskin-menu-item .cskin-on { color: var(--cds-fill-accent, hsl(var(--accent-brand))); font-size: 8px; margin-left: 6px; }\n.cskin-menu-sep { height: 1px; margin: 4px 6px; background: hsl(var(--text-500) / 0.15); }\n\n/* Shorter top bar above the chat */\n.dframe-content .epitaxy-titlebar { height: 26px !important; }\ndiv:has(> div > div > .tiles-shell) { padding-top: 3px !important; }\n\n/* Bar above the sidebar: no Back/Forward; the sidebar's Search box becomes a magnifier button here */\naside.dframe-sidebar .df-titlebar button[aria-label=\"Back\"],\naside.dframe-sidebar .df-titlebar button[aria-label=\"Forward\"] { display: none !important; }\naside.dframe-sidebar [data-testid=\"sidebar\"] div:has(> .df-search-field) { display: none !important; }\naside.dframe-sidebar .df-titlebar .cskin-search { display: flex; align-items: center; justify-content: center;\n  width: 26px; height: 26px; margin-left: 6px; border: 0; border-radius: 7px; background: none; cursor: pointer;\n  color: hsl(var(--text-300)); -webkit-app-region: no-drag; }\naside.dframe-sidebar .df-titlebar .cskin-search:hover { background: hsl(var(--text-500) / 0.12); color: hsl(var(--text-100)); }\n\n/* Sidebar width: our own resize handle on the right edge replaces the app's (which stops at 242 px).\n   Range 170\u2013600 px; double-click the edge to go back to the app's width. */\naside.dframe-sidebar button[aria-label=\"Resize sidebar\"] { display: none !important; }\naside.dframe-sidebar > .cskin-resize { position: absolute; top: 0; bottom: 0; right: -4px; width: 8px; z-index: 50;\n  cursor: col-resize; -webkit-app-region: no-drag; }\naside.dframe-sidebar > .cskin-resize:hover { background: linear-gradient(to right, transparent 3px, hsl(var(--accent-brand) / 0.5) 3px, hsl(var(--accent-brand) / 0.5) 5px, transparent 5px); }\nbody.cskin-resizing, body.cskin-resizing * { cursor: col-resize !important; user-select: none !important; }\n\n/* Collapsed projects show their first session's name, small, in place of the line (until hovered) */\naside.dframe-sidebar .df-recents-anchor > [data-cskin-folded]:not(:hover) [class*=\"group/labelrow\"]::before {\n  content: attr(data-cskin-first); height: auto; background: none !important; left: 5px; right: 5px;\n  font-size: 9px; font-weight: 550; line-height: 12px; color: hsl(var(--text-400)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n\n/* Tags on a project: tiny text at the right end of its line; hidden while the colour dot is showing */\naside.dframe-sidebar .cskin-tags { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); z-index: 2;\n  max-width: 62%; display: flex; gap: 2px; overflow: hidden; pointer-events: none; transition: opacity .1s; }\naside.dframe-sidebar .cskin-pill { flex: none; padding: 0 3px; border-radius: 5px; font-size: 7px; font-weight: 600; line-height: 10px; white-space: nowrap;\n  color: color-mix(in srgb, var(--tag-c) 85%, black); background: color-mix(in srgb, var(--tag-c) 18%, hsl(var(--bg-100))); }\naside.dframe-sidebar [class*=\"group/labelrow\"]:hover .cskin-tags { opacity: 0; transition-delay: .25s; }\n\n/* Tag chips inside the colour menu */\n#cskin-palette .cskin-tags-sec { display: flex; flex-wrap: wrap; gap: 4px; max-width: 180px; padding: 4px 0 6px;\n  border-top: 1px solid hsl(var(--text-500) / 0.12); margin-top: 2px; }\n#cskin-palette .cskin-chip { display: inline-flex; align-items: center; border-radius: 999px; font-size: 10px;\n  background: hsl(var(--text-500) / 0.10); color: hsl(var(--text-200)); }\n#cskin-palette .cskin-chip { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tag-c) 45%, transparent); }\n#cskin-palette .cskin-chip.on { background: var(--tag-c); color: white; box-shadow: none; }\n#cskin-palette .cskin-chip-b { display: inline-flex; align-items: center; justify-content: center; }\n#cskin-palette .cskin-tag-edit { display: inline-flex; align-items: center; gap: 3px; flex-wrap: wrap; }\n#cskin-palette .cskin-tag-dot { width: 12px; height: 12px; border-radius: 50%; border: 0; padding: 0; cursor: pointer; }\n#cskin-palette .cskin-tag-dot.on { box-shadow: 0 0 0 1.5px hsl(var(--bg-000)), 0 0 0 2.5px hsl(var(--text-100)); }\n#cskin-palette .cskin-chip-l { padding: 2px 4px 2px 8px; cursor: pointer; }\n#cskin-palette .cskin-chip-b { border: 0; background: none; color: inherit; opacity: 0; width: 0; padding: 0; cursor: pointer; font-size: 10px; overflow: hidden; }\n#cskin-palette .cskin-chip:hover .cskin-chip-b { opacity: .7; width: 14px; }\n#cskin-palette .cskin-chip:hover .cskin-chip-b:hover { opacity: 1; }\n#cskin-palette .cskin-chip { padding-right: 4px; }\n#cskin-palette .cskin-tag-in { font: 10px var(--cds-font-sans, system-ui); border: 1px solid hsl(var(--text-500) / 0.25);\n  border-radius: 999px; padding: 2px 8px; width: 84px; background: hsl(var(--bg-000)); color: hsl(var(--text-100)); outline: none; }\n#cskin-palette .cskin-tag-in:focus { border-color: hsl(var(--accent-brand)); }\n\n/* Text-size control in the bottom bar */\naside.dframe-sidebar .cskin-fs { display: flex; align-items: center; gap: 2px; margin-right: 4px; flex: none; }\naside.dframe-sidebar .cskin-fs button { border: 0; background: none; cursor: pointer; padding: 2px 4px; border-radius: 5px;\n  font-size: 10px; color: hsl(var(--text-300)); }\naside.dframe-sidebar .cskin-fs button:hover { background: hsl(var(--text-500) / 0.12); color: hsl(var(--text-100)); }\naside.dframe-sidebar .cskin-fs .cskin-fs-s { font-size: 9px; }\naside.dframe-sidebar .cskin-fs .cskin-fs-l { font-size: 13px; font-weight: 600; }\naside.dframe-sidebar .cskin-fs-v { font-size: 9.5px; color: hsl(var(--text-400)); min-width: 22px; text-align: center; font-variant-numeric: tabular-nums; }\n/* Collapsed + tagged: leave room on the right for the tag next to the session preview */\naside.dframe-sidebar .df-recents-anchor > [data-cskin-folded]:not(:hover) [class*=\"group/labelrow\"]:has(.cskin-tags)::before { right: calc(var(--cskin-tag-w, 30%) + 8px); }\naside.dframe-sidebar .df-recents-anchor [class*=\"group/labelrow\"]:has(.cskin-tags):not(:hover)::before { right: max(15%, 22px, calc(var(--cskin-tag-w, 30%) + 8px)); }\n\n/* Chat area: half the side spacing around the messages and the message box (about 41px each side, now about 20px) */\n.epitaxy-chat-panel [class*=\"--chat-column-gutter-start\"] { --chat-gutter: 12px !important; }\n\n/* Session name in the chat's top bar: smaller (was 13px) */\n.epitaxy-titlebar button.truncate[class*=\"text-body-medium\"] { font-size: 11.5px !important; }\n\n/* Message action bar (copy / branch / pin / read aloud / time): always visible instead of on hover, and smaller */\n.epitaxy-chat-panel [class*=\"group/msg\"] div.select-none:has(> time) { opacity: 1 !important; scale: 1 !important; visibility: visible !important; pointer-events: auto !important; zoom: .8; }\n\n/* Unread that sticks (see tag.js): the skin's own unread mark draws the idle ring as Claude's blue unread dot */\naside [data-row][data-cskin-unread] [role=img][aria-label=\"Idle\"] > span { background: rgb(42, 120, 214); border-color: rgb(42, 120, 214); opacity: 1; }\n\n/* Tool lines in the chat (\"Ran 4 commands\", \"Probed ...\"): timestamp-sized text, less space above and below */\n.epitaxy-transcript-typography [class*=\"group/tool\"] { zoom: .75; }\n.epitaxy-transcript-typography div.flex-col.w-full:has(> [class*=\"group/tool\"]) { margin-block: -4px; }\n\n/* Working status line under the last message (\"37s \u00b7 189 tokens \u00b7 Thinking...\"): smaller, and the 48px of\n   empty space the app keeps below the last message is cut to 12px */\n.epitaxy-transcript-typography [data-turn-working] > div.h-5 { zoom: .85; }\n[data-testid=\"transcript-rows\"] > [data-testid=\"transcript-spacer\"]:last-child { height: 12px !important; }\n";
  const CFG = {
  "rightColumnStartsAt": "",
  "blockControlTab": false
}
;
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
  const b = document.createElement('button'); b.className = 'cskin-search'; b.title = 'Search (\u2318K)';
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

// --- Sidebar text size control in the bottom bar (claudeSkin.fontSize, 7\u201314 px in 0.5 steps)
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


// --- Unread that sticks. Claude clears a session's unread dot the moment it is opened (or never sets it if
// the reply finished while you were in it). The skin keeps its own list (localStorage 'claudeSkinUnread', by session
// name): a session joins it when Claude shows "Unread response", or when it goes Running -> Idle. It leaves
// only when you scroll the open chat (real wheel/trackpad, 300px+) AND reaches the end, or sends a message there.
const uLoad = () => { try { return new Set(JSON.parse(localStorage.getItem('claudeSkinUnread') || '[]')); } catch { return new Set(); } };
const uSave = u => { try { localStorage.setItem('claudeSkinUnread', JSON.stringify([...u])); } catch {} };
const rowName = r => r.querySelector('.dframe-fade-label')?.textContent.trim() || '';
const curName = () => { const r = document.querySelector('aside [data-row][data-selected="focused"]'); return r ? rowName(r) : ''; };
window.__cskinPrev = window.__cskinPrev || {};
const syncUnread = () => {
  const u = uLoad(); let changed = false;
  for (const r of document.querySelectorAll('aside [data-row]')) {
    const st = r.querySelector('[role=status][aria-label], [role=img][aria-label]'); const n = rowName(r); if (!st || !n) continue;
    const s = st.getAttribute('aria-label'), prev = window.__cskinPrev[n]; window.__cskinPrev[n] = s;
    if ((s === 'Unread response' || (prev === 'Running' && s === 'Idle')) && !u.has(n)) { u.add(n); changed = true; if (n === window.__cskinCur) window.__cskinWheel = 0; }
    const show = u.has(n) && s === 'Idle';
    if (show !== r.hasAttribute('data-cskin-unread')) r.toggleAttribute('data-cskin-unread', show);
  }
  if (changed) uSave(u);
};
const markRead = n => { const u = uLoad(); if (u.delete(n)) { uSave(u); syncUnread(); } };
const checkRead = () => {
  const n = curName(); if (n !== window.__cskinCur) { window.__cskinCur = n; window.__cskinWheel = 0; }
  if (!n || !uLoad().has(n) || !document.hasFocus()) return;
  const sc = document.querySelector('.epitaxy-chat-panel .epitaxy-transcript-typography')?.parentElement; if (!sc) return;
  if (window.__cskinWheel >= 300 && sc.scrollHeight - sc.scrollTop - sc.clientHeight < 60) markRead(n);
};
if (window.__cskinWheelFn) document.removeEventListener('wheel', window.__cskinWheelFn, true);
window.__cskinWheelFn = e => { if (!e.target.closest?.('.epitaxy-chat-panel') || e.target.closest('.ProseMirror')) return;
  if (curName() !== window.__cskinCur) checkRead(); window.__cskinWheel = (window.__cskinWheel || 0) + Math.abs(e.deltaY); checkRead(); };
document.addEventListener('wheel', window.__cskinWheelFn, { capture: true, passive: true });

const tagAll = () => {
  addSearchButton();
  addFontControl();
  if (!document.getElementById('cskin-fs') && load().fontSize) applyFont();
  applySidebarWidth();
  syncUnread();
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

// --- Terminal / Changes / Browser move into the \u22ee (View options) menu. Their own buttons are hidden by
// skin.css; these menu items click the hidden originals, so they keep working exactly as before.
const MOVED = ['Terminal', 'Changes', 'Browser'];
const keys = k => (k || '').split('+').map(p => ({ Meta: '\u2318', Shift: '\u21e7', Alt: '\u2325', Control: '\u2303' }[p] || p.toUpperCase())).join('');
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
        (orig.getAttribute('aria-pressed') === 'true' ? '<span class="cskin-on">\u25cf</span>' : '') +
        `<span class="ml-md text-footnote cskin-keys">${keys(orig.getAttribute('aria-keyshortcuts'))}</span>`;
      it.addEventListener('click', e => { e.stopPropagation(); document.querySelector('button[aria-label="View options"]')?.click(); setTimeout(() => orig.click(), 30); });
      frag.append(it);
    }
    const sep = document.createElement('div'); sep.className = 'cskin-menu-sep'; frag.append(sep);
    list.prepend(frag);
  }
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePalette(); });

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
window.__cskinKey = e => { if (CFG.blockControlTab && e.ctrlKey && !e.metaKey && e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); }
  else if (e.key === 'Enter' && !e.shiftKey && e.target.closest?.('.ProseMirror')) { const n = curName(); if (n) markRead(n); } };   // sending = read
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

  return 'Claude Skin applied';
})()