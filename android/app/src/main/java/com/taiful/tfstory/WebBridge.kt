package com.taiful.tfstory

import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

/**
 * JavaScript ⇄ Android bridge, available in the page as window.TFAndroid.
 * Files (MP4, thumbnail, backups) are streamed from the page in base64 chunks, written to a private temp
 * file, then saved to the phone gallery / Downloads and/or shared with any app (Drive, Facebook, WhatsApp…).
 */
class WebBridge(private val activity: MainActivity) {
    private val files = ConcurrentHashMap<Int, Pair<File, FileOutputStream>>()
    private val meta = ConcurrentHashMap<Int, Pair<String, String>>() // name, mime
    private val ids = AtomicInteger(1)

    @JavascriptInterface fun isAndroid(): Boolean = true
    @JavascriptInterface fun appVersion(): String = BuildConfig.VERSION_NAME
    @JavascriptInterface fun sdk(): Int = Build.VERSION.SDK_INT

    @JavascriptInterface
    fun fileBegin(name: String, mime: String): Int {
        val id = ids.getAndIncrement()
        val safe = name.replace(Regex("[\\\\/:*?\"<>|\\u0000-\\u001f]"), "_").take(120).ifBlank { "file" }
        val dir = File(activity.cacheDir, "share").apply { mkdirs() }
        val f = File(dir, "${System.currentTimeMillis()}_$safe")
        files[id] = f to FileOutputStream(f)
        meta[id] = safe to (mime.ifBlank { "application/octet-stream" })
        return id
    }

    @JavascriptInterface
    fun fileChunk(id: Int, b64: String): Boolean = try {
        files[id]?.second?.write(Base64.decode(b64, Base64.DEFAULT)); true
    } catch (e: Exception) { false }

    /** action: "save" (gallery/Downloads), "share" (share sheet) or "both". Returns "ok:<where>" or "err:<msg>". */
    @JavascriptInterface
    fun fileEnd(id: Int, action: String): String {
        val (f, os) = files.remove(id) ?: return "err:no file"
        val (name, mime) = meta.remove(id) ?: return "err:no meta"
        return try {
            os.flush(); os.close()
            var where = ""
            if (action == "save" || action == "both") where = saveToPhone(f, name, mime)
            // "share:<package>" opens that app directly (Facebook, YouTube, WhatsApp, Drive); falls back to the share sheet
            val pkg = if (action.startsWith("share:")) action.removePrefix("share:").trim() else ""
            if (pkg.isNotEmpty() && !Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+$").matches(pkg)) return "err:bad package"
            if (action == "share" || action == "both" || pkg.isNotEmpty()) share(f, name, mime, pkg)
            cleanupLater()
            "ok:$where"
        } catch (e: Exception) { "err:${e.message}" }
    }

    private fun saveToPhone(f: File, name: String, mime: String): String {
        val isVideo = mime.startsWith("video/"); val isImage = mime.startsWith("image/"); val isAudio = mime.startsWith("audio/")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val (collection, base) = when {
                isVideo -> MediaStore.Video.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_MOVIES
                isImage -> MediaStore.Images.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_PICTURES
                isAudio -> MediaStore.Audio.Media.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_MUSIC
                else -> MediaStore.Downloads.EXTERNAL_CONTENT_URI to Environment.DIRECTORY_DOWNLOADS
            }
            val rel = "$base/TF Story Studio"
            val cv = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, name); put(MediaStore.MediaColumns.MIME_TYPE, mime)
                put(MediaStore.MediaColumns.RELATIVE_PATH, rel); put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val cr = activity.contentResolver
            val uri = cr.insert(collection, cv) ?: throw Exception("MediaStore insert failed")
            cr.openOutputStream(uri)?.use { out -> f.inputStream().use { it.copyTo(out) } } ?: throw Exception("open failed")
            cv.clear(); cv.put(MediaStore.MediaColumns.IS_PENDING, 0); cr.update(uri, cv, null, null)
            activity.runOnUiThread { Toast.makeText(activity, "সেভ হয়েছে: $rel", Toast.LENGTH_LONG).show() }
            return rel
        } else {
            @Suppress("DEPRECATION")
            val base = Environment.getExternalStoragePublicDirectory(if (isVideo) Environment.DIRECTORY_MOVIES else if (isImage) Environment.DIRECTORY_PICTURES else Environment.DIRECTORY_DOWNLOADS)
            val dir = File(base, "TF Story Studio").apply { mkdirs() }
            val out = File(dir, name); f.copyTo(out, overwrite = true)
            android.media.MediaScannerConnection.scanFile(activity, arrayOf(out.absolutePath), arrayOf(mime), null)
            activity.runOnUiThread { Toast.makeText(activity, "সেভ হয়েছে: ${dir.name}", Toast.LENGTH_LONG).show() }
            return dir.absolutePath
        }
    }

    private fun share(f: File, name: String, mime: String, pkg: String = "") {
        val named = File(f.parentFile, name).let { if (it.absolutePath == f.absolutePath) f else { f.copyTo(it, overwrite = true); it } }
        val uri: Uri = FileProvider.getUriForFile(activity, "${activity.packageName}.files", named)
        val send = Intent(Intent.ACTION_SEND).apply {
            type = mime; putExtra(Intent.EXTRA_STREAM, uri); addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        activity.runOnUiThread {
            val chooser = Intent.createChooser(send, "শেয়ার করুন — Drive, Facebook, WhatsApp…")
            if (pkg.isEmpty()) { activity.startActivity(chooser); return@runOnUiThread }
            val direct = Intent(send).setPackage(pkg)
            try { activity.startActivity(direct) }
            catch (e: android.content.ActivityNotFoundException) {
                Toast.makeText(activity, "অ্যাপটা ফোনে নেই — অন্য অ্যাপ বেছে নিন", Toast.LENGTH_SHORT).show()
                activity.startActivity(chooser)
            }
        }
    }

    private fun cleanupLater() {
        // keep recent share files (the receiving app may still be reading them); remove files older than 6 hours
        val dir = File(activity.cacheDir, "share"); val limit = System.currentTimeMillis() - 6 * 3600_000L
        dir.listFiles()?.forEach { if (it.lastModified() < limit) it.delete() }
    }

    @JavascriptInterface
    fun keepAwake(on: Boolean) {
        activity.runOnUiThread { if (on) activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) else activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
    }

    @JavascriptInterface
    fun openExternal(url: String) {
        if (!url.startsWith("https://")) return
        activity.runOnUiThread { try { activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url))) } catch (_: Exception) {} }
    }

    /** Opens the phone's Google account picker; the result goes to window.TFAuthResult({status, value}). */
    @JavascriptInterface
    fun googleSignIn() { activity.runOnUiThread { GoogleSignIn.signIn(activity) { r -> activity.sendAuthResult(r) } } }

    @JavascriptInterface
    fun googleSignOut() { activity.runOnUiThread { GoogleSignIn.signOut(activity) } }

    @JavascriptInterface
    fun checkUpdate() { activity.runOnUiThread { Updater.check(activity, true) } }

    @JavascriptInterface
    fun toast(msg: String) { activity.runOnUiThread { Toast.makeText(activity, msg.take(200), Toast.LENGTH_SHORT).show() } }
}
