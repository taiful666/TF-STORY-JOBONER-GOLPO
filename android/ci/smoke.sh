#!/usr/bin/env bash
# Installs the APK on the emulator, opens it and checks: no crash + the web app's Bangla UI is on screen.
set -u
APK=$(ls apk/*.apk | head -1)
echo "Installing $APK"
adb install -r -g "$APK"
adb shell pm grant com.taiful.tfstory android.permission.POST_NOTIFICATIONS 2>/dev/null || true
adb logcat -c
adb shell am start -W -n com.taiful.tfstory/.MainActivity
sleep 30
PID=$(adb shell pidof com.taiful.tfstory | tr -d '\r')
echo "PID=$PID"
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml ui.xml >/dev/null 2>&1
echo "---- visible text ----"
grep -o 'text="[^"]*"' ui.xml | sed 's/text="//;s/"$//' | grep -v '^$' | head -40
echo "---- crashes / page errors ----"
adb logcat -d | grep -E "FATAL EXCEPTION|AndroidRuntime: |chromium.*(Uncaught|SyntaxError|TypeError|ReferenceError)" | head -30
OK=1
[ -z "$PID" ] && { echo "FAIL: app is not running"; OK=0; }
adb logcat -d | grep -q "FATAL EXCEPTION" && { echo "FAIL: app crashed"; OK=0; }
grep -qE "গল্প|TF Story" ui.xml || { echo "FAIL: app screen text not found"; OK=0; }
adb exec-out screencap -p > screen.png
[ $OK = 1 ] && echo "SMOKE TEST PASSED" || exit 1
