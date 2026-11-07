# Keep the JavaScript bridge methods (called from the web page)
-keepclassmembers class com.taiful.tfstory.WebBridge {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
