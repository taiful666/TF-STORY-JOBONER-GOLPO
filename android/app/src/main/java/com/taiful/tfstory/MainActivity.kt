package com.taiful.tfstory

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader

class MainActivity : AppCompatActivity() {
    private lateinit var web: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var pendingPermission: PermissionRequest? = null
    private var lastBack = 0L

    // the app is served from a secure https origin inside the APK (works offline; storage + microphone allowed)
    private val origin = "https://appassets.androidplatform.net"
    private val startUrl = "$origin/assets/www/index.html"

    private val pickFiles = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val cb = fileCallback ?: return@registerForActivityResult
        fileCallback = null
        val data = res.data
        val uris: Array<Uri>? = if (res.resultCode != RESULT_OK || data == null) null else {
            val clip = data.clipData
            if (clip != null && clip.itemCount > 0) Array(clip.itemCount) { clip.getItemAt(it).uri }
            else data.data?.let { arrayOf(it) }
        }
        cb.onReceiveValue(uris)
    }

    private val askMic = registerForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
        val req = pendingPermission ?: return@registerForActivityResult
        pendingPermission = null
        if (ok) req.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
        else { req.deny(); Toast.makeText(this, "মাইক্রোফোনের অনুমতি ছাড়া রেকর্ড করা যাবে না", Toast.LENGTH_LONG).show() }
    }
    private val askNotify = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }
    private val askStorage = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = FrameLayout(this).apply { setBackgroundColor(Color.WHITE) }
        web = WebView(this).apply { setBackgroundColor(Color.parseColor("#F5F6F3")) }
        root.addView(web, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        setContentView(root)
        // keep the page clear of the status bar, navigation bar and keyboard (Android 15 edge-to-edge)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val b = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime() or WindowInsetsCompat.Type.displayCutout())
            v.setPadding(b.left, b.top, b.right, b.bottom); WindowInsetsCompat.CONSUMED
        }

        val loader = WebViewAssetLoader.Builder().addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = true
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setSupportMultipleWindows(false)
            javaScriptCanOpenWindowsAutomatically = false
            loadWithOverviewMode = true
            useWideViewPort = true
            textZoom = 100
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
        web.addJavascriptInterface(WebBridge(this), "TFAndroid")

        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                loader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (u.host == "appassets.androidplatform.net") return false
                // external links (ChatGPT, Gemini, Claude, Facebook, Drive…) open in the phone's browser / app
                if (u.scheme == "https") try { startActivity(Intent(Intent.ACTION_VIEW, u)) } catch (_: Exception) {}
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread {
                    if (request.origin.host != "appassets.androidplatform.net") { request.deny(); return@runOnUiThread }
                    if (request.resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED)
                            request.grant(arrayOf(PermissionRequest.RESOURCE_AUDIO_CAPTURE))
                        else { pendingPermission = request; askMic.launch(Manifest.permission.RECORD_AUDIO) }
                    } else request.deny()
                }
            }

            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = callback
                return try {
                    val i = params.createIntent().apply {
                        addCategory(Intent.CATEGORY_OPENABLE)
                        if (params.mode == FileChooserParams.MODE_OPEN_MULTIPLE) putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                        // accept="audio/*,.mp3" → let the user pick freely; the page checks the file itself
                        if (type == null || type!!.contains(",") || type!!.startsWith(".")) type = "*/*"
                    }
                    pickFiles.launch(i); true
                } catch (e: Exception) { fileCallback = null; false }
            }

            override fun onConsoleMessage(m: ConsoleMessage): Boolean = true
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("(window.TFBack && window.TFBack()) ? 'y' : 'n'") { r ->
                    if (r?.contains("y") == true) return@evaluateJavascript
                    val now = System.currentTimeMillis()
                    if (now - lastBack < 2000) finish()
                    else { lastBack = now; Toast.makeText(this@MainActivity, "বের হতে আবার Back চাপুন", Toast.LENGTH_SHORT).show() }
                }
            }
        })

        if (savedInstanceState != null) web.restoreState(savedInstanceState) else web.loadUrl(startUrl)

        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
            askNotify.launch(Manifest.permission.POST_NOTIFICATIONS)
        if (Build.VERSION.SDK_INT <= 28 && ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED)
            askStorage.launch(Manifest.permission.WRITE_EXTERNAL_STORAGE)

        // check for a new version every time the app opens
        web.postDelayed({ Updater.check(this, intent?.getBooleanExtra(EXTRA_UPDATE, false) == true) }, 2500)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.getBooleanExtra(EXTRA_UPDATE, false)) Updater.check(this, true)
    }

    override fun onResume() { super.onResume(); web.onResume(); Updater.resumePendingInstall(this) }
    override fun onPause() { web.onPause(); super.onPause() }
    override fun onSaveInstanceState(outState: Bundle) { super.onSaveInstanceState(outState); web.saveState(outState) }
    override fun onDestroy() { web.destroy(); super.onDestroy() }

    companion object { const val EXTRA_UPDATE = "tf_update" }
}
