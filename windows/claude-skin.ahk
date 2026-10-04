; Claude Desktop Skin: apply it automatically on Windows (AutoHotkey v2, https://www.autohotkey.com).
; Watches for the Claude window and pastes apply.js into its developer console, the same way mac/apply-skin.sh does.
; Run it once by double-clicking, or put a shortcut to it in your Startup folder (see README, "Windows").
;
; Safety: it only pastes when the front window is Claude's developer console (title "Developer Tools"),
; so the code can never land in a chat box. It never sends Escape. Your clipboard is put back afterwards.
;
; Ctrl+Alt+S applies it again by hand (for example after the app reloads itself, which this script can't see).
; The tray icon menu has Apply now / Pause auto-apply / Open log.

#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

SKIN_JS   := A_ScriptDir "\..\apply.js"
LOG_FILE  := A_ScriptDir "\apply-skin.log"
LOAD_WAIT := 8000   ; ms to let Claude finish loading after its window appears; raise it if the skin sometimes doesn't show
MAIN_WIN  := "Claude ahk_exe claude.exe ahk_class Chrome_WidgetWin_1"
DEV_RX    := "i)^(Developer Tools|DevTools)"

SetTitleMatchMode 3          ; exact title match for the main window
seen := Map()
paused := false

A_TrayMenu.Delete()
A_TrayMenu.Add("Apply skin now", (*) => ApplySkin("manual"))
A_TrayMenu.Add("Pause auto-apply", TogglePause)
A_TrayMenu.Add("Open log", (*) => Run(LOG_FILE))
A_TrayMenu.Add()
A_TrayMenu.Add("Exit", (*) => ExitApp())
A_TrayMenu.Default := "Apply skin now"
A_IconTip := "Claude Skin"

^!s:: ApplySkin("hotkey")

SetTimer Watch, 1000
Watch()
return

; A new Claude window (app launch) gets the skin once it has had time to load
Watch() {
    global seen, paused
    live := Map()
    for hwnd in WinGetList(MAIN_WIN) {
        if !IsMainWindow(hwnd)
            continue
        live[hwnd] := true
        if !seen.Has(hwnd) {
            seen[hwnd] := true
            if !paused
                SetTimer ApplyLaunch.Bind(hwnd), -LOAD_WAIT
        }
    }
    for hwnd in seen.Clone()     ; forget closed windows so a relaunch applies it again
        if !live.Has(hwnd)
            seen.Delete(hwnd)
}

ApplyLaunch(hwnd) => ApplySkin("launch", hwnd)

; The Claude Code CLI is also claude.exe but has no window; this also skips small pop-ups with the same title
IsMainWindow(hwnd) {
    try {
        if !(WinGetStyle(hwnd) & 0x10000000)   ; WS_VISIBLE
            return false
        WinGetPos , , &w, &h, hwnd
        return w >= 600 && h >= 400
    }
    return false
}

ApplySkin(reason, hwnd := 0) {
    if !FileExist(SKIN_JS)
        return Log(reason, "aborted: apply.js not found at " SKIN_JS)
    if !hwnd {
        hwnd := WinExist(MAIN_WIN)
        if !hwnd || !IsMainWindow(hwnd)
            return Log(reason, "aborted: no Claude window")
    }
    prev := WinExist("A")
    saved := ClipboardAll()
    result := ""
    try {
        A_Clipboard := ""
        A_Clipboard := FileRead(SKIN_JS, "UTF-8")
        if !ClipWait(2)
            throw Error("clipboard did not take apply.js")

        WinActivate hwnd
        if !WinWaitActive(hwnd, , 2)
            throw Error("could not focus Claude")

        SetTitleMatchMode "RegEx"
        dev := WinExist(DEV_RX " ahk_exe claude.exe")
        opened := false
        if !dev {
            Send "^!i"                             ; Ctrl+Alt+I. Not Ctrl+Shift+I: in the Code tab that opens the model picker
            dev := WinWait(DEV_RX " ahk_exe claude.exe", , 6)
            opened := true
        }
        SetTitleMatchMode 3
        if !dev
            throw Error("the developer console did not open on Ctrl+Alt+I (is Developer Mode on, and Claude restarted since?)")

        WinActivate dev
        if !WinWaitActive(dev, , 2)
            throw Error("could not focus the developer console")
        Sleep 600                                  ; let it finish drawing

        ; Go to the Console tab through the command menu, whichever tab was open last
        Send "^+p"
        Sleep 400
        SendText "Show Console"
        Sleep 300
        Send "{Enter}"
        Sleep 700

        ; Last check before pasting: the developer console must still be the front window
        if WinExist("A") != dev
            throw Error("the front window is no longer the developer console")
        Send "^v"
        Sleep 500
        Send "{Enter}"
        Sleep 800
        if opened
            WinClose dev
        result := "applied"
    } catch as e {
        SetTitleMatchMode 3
        result := "aborted: " e.Message
    }
    Sleep 200
    A_Clipboard := saved
    if prev && prev != hwnd && WinExist(prev)
        try WinActivate prev                       ; hand focus back to whatever you were doing
    Log(reason, result)
}

TogglePause(item, *) {
    global paused
    paused := !paused
    A_TrayMenu.ToggleCheck(item)
}

Log(reason, msg) {
    FileAppend FormatTime(, "yyyy-MM-dd HH:mm:ss") " [" reason "] " msg "`n", LOG_FILE, "UTF-8"
}
