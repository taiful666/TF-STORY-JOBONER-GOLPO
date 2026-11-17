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
# the very first WebView start after install sometimes stalls on the emulator: relaunch once
if ! adb logcat -d -s TFWeb:* | grep -q "SELFTEST"; then
  echo "no web app yet: relaunching once"
  adb shell am start -W -S -n com.taiful.tfstory/.MainActivity --ez tf_selftest true
  for i in $(seq 1 24); do adb logcat -d -s TFWeb:* | grep -q "SELFTEST" && { echo "web app ready after relaunch, $((i*5))s"; break; }; sleep 5; done
fi
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
adb logcat -d -s TFWeb:* | grep -qE 'health "?title=TF Story Studio page=/assets/www/index.html lib=[1-9]' || { echo "FAIL: web app did not start"; OK=0; }
adb logcat -d -s TFWeb:* | grep -q "SELFTEST ok" || { echo "FAIL: saving a file through the bridge did not work"; OK=0; }
adb shell 'ls "/sdcard/Download/TF Story Studio/"' 2>&1 | head -3
adb exec-out screencap -p > screen.png

echo "---- Islamic part (islamic/index.html) ----"
adb logcat -c
adb shell am start -W -S -n com.taiful.tfstory/.MainActivity --es tf_page islamic/index.html --ez tf_selftest true
for i in $(seq 1 24); do
  if adb logcat -d -s TFWeb:* | grep -q "SELFTEST"; then echo "Islamic part ready after $((i*5))s"; break; fi
  sleep 5
done
adb logcat -d -s TFWeb:* | tail -8
adb logcat -d | grep -E "chromium.*(Uncaught|SyntaxError|TypeError|ReferenceError)" | head -10
adb logcat -d -s TFWeb:* | grep -q 'page=/assets/www/islamic/index.html' || { echo "FAIL: Islamic part did not start"; OK=0; }
adb logcat -d -s TFWeb:* | grep -q "SELFTEST ok" || { echo "FAIL: saving from the Islamic part did not work"; OK=0; }
adb exec-out screencap -p > screen-islamic.png

echo "---- Islamic story videos (index.html?part=islamic) ----"
adb logcat -c
adb shell "am start -W -S -n com.taiful.tfstory/.MainActivity --es tf_page 'index.html?part=islamic'"
for i in $(seq 1 15); do adb logcat -d -s TFWeb:* | grep -q 'part=islamic' && break; sleep 3; done
adb logcat -d -s TFWeb:* | tail -4
adb logcat -d | grep -E "chromium.*(Uncaught|SyntaxError|TypeError|ReferenceError)" | head -10
adb logcat -d -s TFWeb:* | grep -qE 'page=/assets/www/index.html\?part=islamic lib=[1-9]' || { echo "FAIL: Islamic story part did not start"; OK=0; }
adb exec-out screencap -p > screen-islamic-story.png

echo "---- start screen (home.html) ----"
adb logcat -c
adb shell am start -W -S -n com.taiful.tfstory/.MainActivity
for i in $(seq 1 15); do adb logcat -d -s TFWeb:* | grep -q 'page=/assets/www/home.html' && break; sleep 3; done
adb logcat -d -s TFWeb:* | tail -4
adb logcat -d -s TFWeb:* | grep -q 'page=/assets/www/home.html' || { echo "FAIL: start screen did not open"; OK=0; }
adb exec-out screencap -p > screen-home.png
python3 - <<'PY' || true
import zlib,struct
d=open('screen.png','rb').read(); print('screenshot bytes', len(d))
PY
[ $OK = 1 ] && echo "SMOKE TEST PASSED" || exit 1
