#!/bin/bash
# Runs a JS file in Claude's DevTools console (the same safe method apply-skin.sh uses) and saves whatever the
# script copy()-ed to the clipboard into <file>.out. Restores the user's clipboard. Used by apply-skin.sh, and by Claude to inspect the page (see CLAUDE.md).
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
export PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH"
JS="$1"; OUT="${JS%.js}.out"
OLD="$(mktemp)"; pbpaste > "$OLD"
pbcopy < "$JS"
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
    if name of front window does not start with "Developer Tools" then return "aborted"
    keystroke "a" using {command down}
    key code 51
    delay 0.2
    keystroke "v" using {command down}
    delay 1.2
    key code 36
    delay 0.8
    if opened then click button 1 of (first window whose name starts with "Developer Tools")
  end tell
end tell
return "ran"
OSA
)
pbpaste > "$OUT"
[ -s "$OLD" ] && pbcopy < "$OLD"; rm -f "$OLD"
echo "$RESULT -> $OUT"
