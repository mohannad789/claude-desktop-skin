# Builds apply.js (the snippet you paste into Claude's DevTools console) from skin.css + skin-ui.js.
# Run after editing either file:  python3 build.py
import json, pathlib
here = pathlib.Path(__file__).parent
css = (here / "skin.css").read_text()
cfg = (here / "skin-config.json").read_text()
ui = (here / "skin-ui.js").read_text()
js = f"""(() => {{
  let s = document.getElementById('claude-skin-style');
  if (!s) {{ s = document.createElement('style'); s.id = 'claude-skin-style'; document.head.appendChild(s); }}
  s.textContent = {json.dumps(css)};
  const CFG = {cfg};
  {ui}
  return 'Claude Skin applied';
}})()"""
# Escape every non-ASCII character, so the clipboard can never scramble icons or symbols
def esc(c):
    o = ord(c)
    if o < 128: return c
    if o < 0x10000: return "\\u%04x" % o
    o -= 0x10000
    return "\\u%04x\\u%04x" % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF))
js = "".join(esc(c) for c in js)
(here / "apply.js").write_text(js)
print("apply.js built,", len(js), "bytes")
