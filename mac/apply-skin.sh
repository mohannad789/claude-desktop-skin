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

OLD="$(mktemp)"; pbpaste > "$OLD"
pbcopy < apply.js

RESULT=$(osascript <<'OSA'
tell application "Claude" to activate
delay 0.3
tell application "System Events"
  tell process "Claude"
    set devWins to (every window whose name starts with "Developer Tools")
    if (count of devWins) > 0 then
      set w to item 1 of devWins
      set frontmost to true
      perform action "AXRaise" of w
      set value of attribute "AXMain" of w to true
      set opened to false
    else
      keystroke "i" using {command down, option down}
      set opened to true
    end if
    repeat 15 times
      if name of front window starts with "Developer Tools" then exit repeat
      delay 0.3
    end repeat
    delay 0.3
    set winName to name of front window
    if winName does not start with "Developer Tools" then return "aborted: front window is " & winName
    keystroke "v" using {command down}
    delay 0.5
    key code 36
    delay 0.6
    if opened then click button 1 of (first window whose name starts with "Developer Tools")
  end tell
end tell
return "applied"
OSA
)
sleep 0.3
[ -s "$OLD" ] && pbcopy < "$OLD"
rm -f "$OLD"
echo "$(date '+%F %T') $RESULT" >> "$DIR/apply-skin.log"
