package com.taiful.tfstory

import android.app.Activity
import android.app.AlertDialog
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import kotlin.concurrent.thread

/** A release published by the GitHub Actions build. */
data class Release(val code: Int, val name: String, val notes: String, val apkUrl: String, val size: Long)

object Updater {
    private const val PREFS = "tf_update"
    private val main = Handler(Looper.getMainLooper())
    @Volatile private var pendingApk: File? = null
    @Volatile private var busy = false

    /** Latest release on GitHub, or null (no internet / no release / error). Runs on a background thread. */
    fun fetchLatest(): Release? = try {
        val c = URL("https://api.github.com/repos/${BuildConfig.UPDATE_REPO}/releases/latest").openConnection() as HttpURLConnection
        c.connectTimeout = 10000; c.readTimeout = 15000
        c.setRequestProperty("Accept", "application/vnd.github+json")
        c.setRequestProperty("User-Agent", "TFStoryStudio-Android")
        if (c.responseCode != 200) null else {
            val j = JSONObject(c.inputStream.bufferedReader().use { it.readText() })
            val code = j.optString("tag_name").filter { it.isDigit() }.toIntOrNull() ?: 0
            val assets = j.optJSONArray("assets")
            var url = ""; var size = 0L
            if (assets != null) for (i in 0 until assets.length()) {
                val a = assets.getJSONObject(i)
                if (a.optString("name").endsWith(".apk")) { url = a.optString("browser_download_url"); size = a.optLong("size") }
            }
            if (code <= 0 || !url.startsWith("https://")) null
            else Release(code, j.optString("name").ifBlank { "v$code" }, j.optString("body").take(600), url, size)
        }
    } catch (e: Exception) { null }

    /** Called when the app opens (and from the notification / settings button). */
    fun check(activity: Activity, manual: Boolean) {
        if (busy) return
        thread {
            val r = fetchLatest()
            main.post {
                if (activity.isFinishing) return@post
                when {
                    r == null -> if (manual) Toast.makeText(activity, "আপডেট চেক করা গেল না — ইন্টারনেট দেখুন", Toast.LENGTH_LONG).show()
                    r.code <= BuildConfig.VERSION_CODE -> if (manual) Toast.makeText(activity, "আপনি সর্বশেষ ভার্সন ব্যবহার করছেন (${BuildConfig.VERSION_NAME})", Toast.LENGTH_LONG).show()
                    !manual && snoozed(activity, r.code) -> {}
                    else -> offer(activity, r)
                }
            }
        }
    }

    private fun snoozed(ctx: Context, code: Int): Boolean {
        val p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return p.getInt("snooze_code", 0) == code && System.currentTimeMillis() < p.getLong("snooze_until", 0)
    }

    private fun offer(activity: Activity, r: Release) {
        val mb = if (r.size > 0) " (%.1f MB)".format(r.size / 1048576.0) else ""
        AlertDialog.Builder(activity)
            .setTitle("নতুন আপডেট এসেছে")
            .setMessage("নতুন ভার্সন: ${r.name}$mb\nআপনার ভার্সন: ${BuildConfig.VERSION_NAME}\n\n${r.notes.ifBlank { "উন্নতি ও ভুল সংশোধন।" }}\n\nআপনার গল্প, লাইব্রেরি ও সেটিংস সব থাকবে।")
            .setPositiveButton("এখনই আপডেট করুন") { _, _ -> download(activity, r) }
            .setNegativeButton("পরে") { _, _ ->
                activity.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                    .putInt("snooze_code", r.code).putLong("snooze_until", System.currentTimeMillis() + 12 * 3600_000L).apply()
            }
            .show()
    }

    private fun download(activity: Activity, r: Release) {
        busy = true
        val bar = ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal).apply { max = 100; isIndeterminate = r.size <= 0 }
        val label = TextView(activity).apply { text = "ডাউনলোড হচ্ছে… ০%"; setPadding(0, 0, 0, 16) }
        val box = LinearLayout(activity).apply { orientation = LinearLayout.VERTICAL; setPadding(60, 40, 60, 10); addView(label); addView(bar) }
        val dlg = AlertDialog.Builder(activity).setTitle("আপডেট ডাউনলোড").setView(box).setCancelable(false).show()
        thread {
            val dir = File(activity.cacheDir, "updates").apply { mkdirs(); listFiles()?.forEach { it.delete() } }
            val out = File(dir, "TF-Story-Studio-${r.code}.apk")
            var err: String? = null
            try {
                var c = URL(r.apkUrl).openConnection() as HttpURLConnection
                c.instanceFollowRedirects = true; c.connectTimeout = 15000; c.readTimeout = 30000
                c.setRequestProperty("User-Agent", "TFStoryStudio-Android")
                var hops = 0
                while (c.responseCode in 300..399 && hops++ < 5) { // follow cross-host redirects (GitHub → CDN), https only
                    val loc = c.getHeaderField("Location") ?: break
                    if (!loc.startsWith("https://")) throw Exception("insecure redirect")
                    c = URL(loc).openConnection() as HttpURLConnection
                    c.setRequestProperty("User-Agent", "TFStoryStudio-Android")
                }
                if (c.responseCode != 200) throw Exception("HTTP ${c.responseCode}")
                val total = if (c.contentLengthLong > 0) c.contentLengthLong else r.size
                var done = 0L; var lastPct = -1
                c.inputStream.use { inp -> out.outputStream().use { os ->
                    val buf = ByteArray(64 * 1024)
                    while (true) {
                        val n = inp.read(buf); if (n < 0) break
                        os.write(buf, 0, n); done += n
                        val pct = if (total > 0) (done * 100 / total).toInt() else -1
                        if (pct != lastPct) { lastPct = pct; main.post { if (pct >= 0) { bar.isIndeterminate = false; bar.progress = pct; label.text = "ডাউনলোড হচ্ছে… ${toBn(pct)}%" } } }
                    }
                } }
                if (!sameSigner(activity, out)) { out.delete(); throw SecurityException("sig") }
            } catch (e: SecurityException) { err = "নিরাপত্তা যাচাই ব্যর্থ: এই ফাইলের সিগনেচার আপনার অ্যাপের সাথে মেলেনি, তাই ইনস্টল করা হয়নি।" }
            catch (e: Exception) { err = "ডাউনলোড হলো না (${e.message}) — ইন্টারনেট দেখে আবার চেষ্টা করুন।"; out.delete() }
            main.post {
                busy = false
                try { dlg.dismiss() } catch (_: Exception) {}
                if (err != null) AlertDialog.Builder(activity).setTitle("আপডেট").setMessage(err).setPositiveButton("ঠিক আছে", null).show()
                else { pendingApk = out; install(activity) }
            }
        }
    }

    /** Only install an update signed with the SAME key as the installed app (protects against fake APKs). */
    @Suppress("DEPRECATION")
    private fun sameSigner(ctx: Context, apk: File): Boolean {
        val pm = ctx.packageManager
        val flags = if (Build.VERSION.SDK_INT >= 28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
        val archive: PackageInfo = pm.getPackageArchiveInfo(apk.absolutePath, flags) ?: return false
        if (archive.packageName != ctx.packageName) return false
        val installed = pm.getPackageInfo(ctx.packageName, flags)
        fun digests(pi: PackageInfo): Set<String> {
            val sigs = if (Build.VERSION.SDK_INT >= 28) pi.signingInfo?.let { if (it.hasMultipleSigners()) it.apkContentsSigners else it.signingCertificateHistory } else pi.signatures
            return sigs.orEmpty().map { MessageDigest.getInstance("SHA-256").digest(it.toByteArray()).joinToString("") { b -> "%02x".format(b) } }.toSet()
        }
        val a = digests(archive); val i = digests(installed)
        return a.isNotEmpty() && a.intersect(i).isNotEmpty()
    }

    /** Opens the Android installer. If "install unknown apps" is off, opens that setting first. */
    fun install(activity: Activity) {
        val apk = pendingApk ?: return
        if (!apk.exists()) { pendingApk = null; return }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !activity.packageManager.canRequestPackageInstalls()) {
            AlertDialog.Builder(activity).setTitle("একবার অনুমতি দিন")
                .setMessage("আপডেট ইনস্টল করতে \"এই উৎস থেকে অনুমতি দিন\" চালু করুন, তারপর ফিরে আসুন — ইনস্টল নিজে থেকেই শুরু হবে।")
                .setPositiveButton("সেটিংস খুলুন") { _, _ ->
                    activity.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${activity.packageName}")))
                }.setNegativeButton("পরে", null).show()
            return
        }
        pendingApk = null
        val uri = FileProvider.getUriForFile(activity, "${activity.packageName}.files", apk)
        activity.startActivity(Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        })
    }

    /** After returning from the "unknown apps" setting. */
    fun resumePendingInstall(activity: Activity) { if (pendingApk != null) install(activity) }

    fun toBn(n: Int): String = n.toString().map { if (it in '0'..'9') "০১২৩৪৫৬৭৮৯"[it - '0'] else it }.joinToString("")
}

/** Background check → notification "নতুন আপডেট এসেছে". */
class UpdateWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {
    override fun doWork(): Result {
        val r = Updater.fetchLatest() ?: return Result.success()
        if (r.code <= BuildConfig.VERSION_CODE) return Result.success()
        val p = applicationContext.getSharedPreferences("tf_update", Context.MODE_PRIVATE)
        if (p.getInt("notified_code", 0) == r.code) return Result.success()
        p.edit().putInt("notified_code", r.code).apply()
        val open = Intent(applicationContext, MainActivity::class.java).apply { putExtra(MainActivity.EXTRA_UPDATE, true); addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP) }
        val pi = PendingIntent.getActivity(applicationContext, 7, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(applicationContext, TFApp.CH_UPDATE)
            .setSmallIcon(android.R.drawable.stat_sys_download_done)
            .setContentTitle("TF Story Studio — নতুন আপডেট")
            .setContentText("নতুন ভার্সন ${r.name} এসেছে। ট্যাপ করে আপডেট করুন।")
            .setContentIntent(pi).setAutoCancel(true).build()
        try { (applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify(1001, n) } catch (_: SecurityException) {}
        return Result.success()
    }
}
