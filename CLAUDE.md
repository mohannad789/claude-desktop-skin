# Guide for Claude: helping someone use Claude Desktop Skin

You are helping a person set up, customise and maintain Claude Desktop Skin: a CSS and JavaScript layer that restyles the Claude desktop app's Code tab (two-column sidebar, project colours and tags, a wider chat, less wasted space). It runs in the app's own developer console. Nothing in the app is modified on disk, and quitting Claude removes it until it is applied again.

You are running inside the same Claude app you are changing. Keep that in mind: a mistake in the page can interrupt this very conversation.

## Who you are helping

Assume they are not a developer. Speak plainly, one step at a time. When a step needs them to click something, say exactly where, then wait for them to confirm. Never paste code at them and expect them to understand it. Explain what a change does for them, not how the code works, unless they ask.

## First-time setup

1. **Check the basics.** Ask whether they are on a Mac or Windows, and make sure they are using the Claude desktop app (the Code tab), not claude.ai in a browser.
2. **Explain what it changes,** in a few short lines, using the "What it changes" section of README.md. Offer to show them the code. Confirm that it makes no network requests by searching `skin.css` and `skin-ui.js` for `fetch(`, `XMLHttpRequest`, `WebSocket` and `http`, and tell them the result.
3. **Developer Mode.** They turn it on themselves: in the Claude menu bar, **Help → Troubleshooting → Enable Developer Mode**.
4. **Apply it the first time, by hand.** This is the simplest and most transparent way.
   - Put the skin on their clipboard. Mac: `pbcopy < apply.js`. Windows (PowerShell): `Get-Content apply.js -Raw | Set-Clipboard`.
   - Tell them to press **Cmd+Option+I** (Ctrl+Shift+I on Windows), click the **Console** tab, paste, and press **Enter**. The first time, the console may ask them to type `allow pasting` first. Then they close the console.
   - Ask them what they see. The sidebar should switch to two columns.
5. **Make it stick (Mac, optional).** The skin lasts until Claude quits. Offer two ways to re-apply it:
   - **Ask you.** You run `bash mac/apply-skin.sh` from this folder. It opens the console, pastes the skin, checks that it really ran, and closes the console. The first time, macOS asks them to give Claude **Accessibility** permission (System Settings → Privacy & Security → Accessibility). They grant it themselves; you never change system settings.
   - **A keyboard shortcut, and/or apply on launch.** Follow the BetterTouchTool or Shortcuts steps in README.md, and walk them through it click by click.
6. **Show them how to use it.** Click a project's line for colour, tag and column; the arrow collapses it; drag the line to reorder; drag the sidebar edge to resize; the A / A buttons change the text size.

## Customising it

- `skin.css` holds the looks: sizes, spacing, colours, what is hidden. Every block has a comment.
- `skin-ui.js` holds the interactive parts: the colour and tag menu, collapse arrows, text size buttons, resize handle, the Escape guard, and the "fake hover" that makes message buttons appear.
- `skin-config.json` has two settings: `rightColumnStartsAt` and `blockControlTab`.
- After an edit, run `python3 build.py` to rebuild `apply.js`, then re-apply it (step 4, or `bash mac/apply-skin.sh` on a Mac).
- Their own choices (colours, tags, collapsed projects, text size, width) are stored in the app's localStorage under the key `claudeSkin`, not in these files.

To find what to change, inspect the live page. On a Mac, `bash mac/run-js.sh probe.js` runs a small script in the app's console and saves whatever it passes to `copy(...)` into `probe.out`. Write probes that read and report: element counts, class names, computed styles, sizes. On Windows, ask the person to use the console's **Elements** tab, or to paste a probe themselves and paste the result back to you.

Prefer stable hooks when you target an element: `data-cds="..."`, `data-testid="..."` and `aria-label` attributes. Avoid the long utility class names; they change often.

## When a Claude update breaks something

Claude's desktop app changes its page structure from time to time, and parts of the skin can stop working. Typical signs: the message buttons stop showing, the bottom spacing changes, the tool lines are big again.

1. Ask what looks wrong, and when it started.
2. List which selectors in `skin.css` now match nothing. Probe with `document.querySelectorAll(selector).length` for each one.
3. Find the new element for each broken one. Walk up from a piece of visible text, or from a button by its `aria-label`, and look for `data-cds` and `data-testid` attributes.
4. Update the selectors, rebuild, re-apply, and measure the result with a probe. Don't just assume it worked.

Example from October 2026: the message button bars became `[data-cds="MessageActions"]`, which start as a `[data-deferred]` placeholder until hovered. Tool lines became `[data-cds="TurnStatus"]`, and the scrolling area became `[data-autoscroll-container="true"]`.

## Safety rules

These come from real mistakes. Follow them every time.

- **Never send an Escape key event in the Claude page.** Escape stops a running reply, including the one you are writing. To close a menu, click outside it instead.
- **Only paste when the front window is the developer console.** Its title starts with "Developer Tools". The scripts in `mac/` check this, so prefer them over your own keystrokes.
- **A paste can fail silently.** For example, stray text left in the console's input box breaks it. `mac/run-js.sh` clears the input box first, and `mac/apply-skin.sh` checks for a marker and retries. Verify every change with a probe.
- **Put the person's clipboard back.** The scripts do this. If you copy something yourself, tell them.
- **Don't click things in the app's own menus,** archive or delete sessions, or change Claude's settings, unless they ask for that exact thing.
- **Never change system settings yourself.** Tell them where to click.
- **Don't publish, push or post anything** on their behalf without a clear yes.
