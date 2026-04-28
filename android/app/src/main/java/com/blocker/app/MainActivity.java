package com.blocker.app;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import java.util.Calendar;
import java.util.List;
import java.util.Map;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (!hasUsageStatsPermission()) {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            startActivity(intent);
        } else {
            startBlockerService();
        }
    }

    private boolean hasUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), getPackageName());
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private void startBlockerService() {
        Intent serviceIntent = new Intent(this, AppBlockerService.class);
        startService(serviceIntent);
    }

    @CapacitorPlugin(name = "BockerNative")
    public class BockerNativePlugin extends Plugin {
        @PluginMethod
        public void setUnlockState(PluginCall call) {
            boolean state = call.getBoolean("state", false);
            AppBlockerService.isUnlocked = state;
            call.resolve();
        }

        @PluginMethod
        public void setBlockedApps(PluginCall call) {
            JSArray apps = call.getArray("apps");
            try {
                List<String> packages = apps.toList();
                AppBlockerService.activeBlockedPackages.clear();
                AppBlockerService.activeBlockedPackages.addAll(packages);
            } catch (Exception e) {}
            call.resolve();
        }

        @PluginMethod
        public void getUsageStats(PluginCall call) {
            UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
            long now = System.currentTimeMillis();
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            long startOfDay = calendar.getTimeInMillis();

            Map<String, UsageStats> stats = usm.queryAndAggregateUsageStats(startOfDay, now);
            JSObject results = new JSObject();
            
            for (Map.Entry<String, UsageStats> entry : stats.entrySet()) {
                long totalTime = entry.getValue().getTotalTimeInForeground();
                if (totalTime > 0) {
                    results.put(entry.getKey(), (int)(totalTime / 60000)); // Minutes
                }
            }
            
            JSObject ret = new JSObject();
            ret.put("stats", results);
            call.resolve(ret);
        }
    }
}
