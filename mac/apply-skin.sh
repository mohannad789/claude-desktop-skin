#!/bin/bash
# Claude Skin: rebuild apply.js from skin.css and apply it to the running Claude app.
# Run it from a keyboard shortcut (BetterTouchTool, Shortcuts, Keyboard Maestro, Raycast...) while Claude is in front,
# and optionally when Claude launches (with --launch). The app that runs it needs Accessibility permission.
# Safety: it only pastes if the front window is a DevTools window, so the code can never land
# in a chat box. Your clipboard (text) is put back afterwards.
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
export PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH"
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR" || exit 1
if [ "$1" = "--launch" ]; then
  # --launch: run when Claude launches: wait for its window, then give the UI time to load.
  for i in $(seq 1 60); do
    osascript -e 'tell application "System Events" to exists (first window of process "Claude" whose name is "Claude")' 2>/dev/null | grep -q true && break
    sleep 1
  done
  sleep 8
else
  # Only act when Claude is the app in front (in case the shortcut is global).
  FRONT=$(osascript -e 'tell application "System Events" to get name of first process whose frontmost is true')
  [ "$FRONT" = "Claude" ] || { echo "$(date '+%F %T') skipped: front app is $FRONT" >> "$DIR/apply-skin.log"; exit 0; }
fi
# Rebuild apply.js only if you edited the skin and Python is available. On a Mac without the developer tools,
# calling python3 pops up an install dialog, so the ready-made apply.js is used instead.
if [ skin.css -nt apply.js ] || [ skin-ui.js -nt apply.js ] || [ skin-config.json -nt apply.js ]; then
  if xcode-select -p >/dev/null 2>&1 || [ -x /opt/homebrew/bin/python3 ]; then python3 build.py >/dev/null 2>&1; fi
fi

# Paste it through run-js.sh and check it really ran: the snippet copies a marker to the clipboard when it
# finishes. A paste can fail silently (e.g. stray text left in the console's input box), so try up to 3 times.
TMP="$DIR/.apply-run.js"; { cat apply.js; printf '\n;copy("CLAUDE_SKIN_APPLIED")\n'; } > "$TMP"
RESULT="failed after 3 tries"
for i in 1 2 3; do
  "$DIR/mac/run-js.sh" "$TMP" >/dev/null 2>&1
  if grep -q "CLAUDE_SKIN_APPLIED" "$DIR/.apply-run.out" 2>/dev/null; then RESULT="applied (try $i)"; break; fi
  sleep 1
done
rm -f "$TMP" "$DIR/.apply-run.out"
echo "$(date '+%F %T') $RESULT" >> "$DIR/apply-skin.log"
echo "$RESULT"
