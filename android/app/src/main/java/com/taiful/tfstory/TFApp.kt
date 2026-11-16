package com.taiful.tfstory

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class TFApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(
                NotificationChannel(CH_UPDATE, "অ্যাপ আপডেট", NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = "নতুন ভার্সন এলে জানাবে"
                }
            )
            nm.createNotificationChannel(
                NotificationChannel(CH_FILES, "ফাইল সেভ", NotificationManager.IMPORTANCE_LOW).apply {
                    description = "ভিডিও/ফাইল সেভ হলে জানাবে"
                }
            )
        }
        // check for a new version in the background every 4 hours (only with internet); UPDATE re-schedules older installs too
        val req = PeriodicWorkRequestBuilder<UpdateWorker>(4, TimeUnit.HOURS)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork("tf_update_check", ExistingPeriodicWorkPolicy.UPDATE, req)
    }

    companion object {
        const val CH_UPDATE = "tf_update"
        const val CH_FILES = "tf_files"
    }
}
