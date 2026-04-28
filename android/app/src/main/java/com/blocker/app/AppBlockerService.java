package com.blocker.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;
import java.util.Arrays;
import java.util.List;
import java.util.ArrayList;

public class AppBlockerService extends Service {
    private static final String CHANNEL_ID = "B-LOCKER_SERVICE";
    public static boolean isUnlocked = false;
    public static List<String> activeBlockedPackages = new ArrayList<>();
    private Handler handler = new Handler();

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("B-LOCKER is Active")
                .setContentText("Monitoring social media usage")
                .setSmallIcon(android.R.drawable.ic_lock_lock)
                .build();
        startForeground(1, notification);

        startMonitoring();
        return START_STICKY;
    }

    private void startMonitoring() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                handler.postDelayed(this, 1000); // Check every second
            }
        }, 1000);
    }

    private void checkForegroundApp() {
        if (isUnlocked) return;

        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        long time = System.currentTimeMillis();
        List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time);
        if (stats != null) {
            String topPackage = "";
            long lastUsed = 0;
            for (UsageStats usageStats : stats) {
                if (usageStats.getLastTimeUsed() > lastUsed) {
                    topPackage = usageStats.getPackageName();
                    lastUsed = usageStats.getLastTimeUsed();
                }
            }

            if (activeBlockedPackages.contains(topPackage)) {
                // BLOCK IT: Bring B-LOCKER to front
                Intent lockIntent = new Intent(this, MainActivity.class);
                lockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                startActivity(lockIntent);
            }
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel serviceChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "B-LOCKER Monitoring",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(serviceChannel);
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
