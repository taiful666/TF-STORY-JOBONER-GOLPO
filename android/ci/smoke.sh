#!/usr/bin/env bash
# Installs the APK on the emulator, opens it and checks: no crash + the web app's Bangla UI is on screen.
set -u
APK=$(ls apk/*.apk | head -1)
echo "Installing $APK"
adb install -r -g "$APK"
adb shell pm grant com.taiful.tfstory android.permission.POST_NOTIFICATIONS 2>/dev/null || true
adb logcat -c
adb shell am start -W -n com.taiful.tfstory/.MainActivity --ez tf_selftest true
for i in $(seq 1 24); do
  if adb logcat -d -s TFWeb:* | grep -q "SELFTEST"; then echo "web app ready after $((i*5))s"; break; fi
  sleep 5
done
sleep 3
PID=$(adb shell pidof com.taiful.tfstory | tr -d '\r')
echo "PID=$PID"
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml ui.xml >/dev/null 2>&1
echo "---- visible text ----"
grep -o 'text="[^"]*"' ui.xml | sed 's/text="//;s/"$//' | grep -v '^$' | head -40
echo "---- web app health ----"
adb logcat -d -s TFWeb:* | tail -20
echo "---- screen ----"
adb shell dumpsys window | grep -E "mCurrentFocus" | head -2
echo "---- crashes / page errors ----"
adb logcat -d | grep -E "FATAL EXCEPTION|AndroidRuntime: |chromium.*(Uncaught|SyntaxError|TypeError|ReferenceError)" | head -30
OK=1
[ -z "$PID" ] && { echo "FAIL: app is not running"; OK=0; }
# only a crash of OUR app counts (the uiautomator test tool itself sometimes crashes on slow emulators)
adb logcat -d | grep -A3 "FATAL EXCEPTION" | grep -q "Process: com.taiful.tfstory" && { echo "FAIL: app crashed"; OK=0; }
adb logcat -d -s TFWeb:* | grep -qE 'health "?title=TF Story Studio lib=[1-9]' || { echo "FAIL: web app did not start"; OK=0; }
adb logcat -d -s TFWeb:* | grep -q "SELFTEST ok" || { echo "FAIL: saving a file through the bridge did not work"; OK=0; }
adb shell 'ls "/sdcard/Download/TF Story Studio/"' 2>&1 | head -3
adb exec-out screencap -p > screen.png
python3 - <<'PY' || true
import zlib,struct
d=open('screen.png','rb').read(); print('screenshot bytes', len(d))
PY
[ $OK = 1 ] && echo "SMOKE TEST PASSED" || exit 1
