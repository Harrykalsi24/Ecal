package com.example.ecal;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;
    private UpdateManager updateManager;

    public class AndroidUpdateBridge {
        @JavascriptInterface
        public String getAppVersionName() {
            try {
                PackageManager pm = getPackageManager();
                PackageInfo pInfo = pm.getPackageInfo(getPackageName(), 0);
                return pInfo.versionName != null ? pInfo.versionName : "1.0";
            } catch (Exception e) {
                return "1.0";
            }
        }

        @JavascriptInterface
        public long getAppVersionCode() {
            try {
                PackageManager pm = getPackageManager();
                PackageInfo pInfo = pm.getPackageInfo(getPackageName(), 0);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    return pInfo.getLongVersionCode();
                } else {
                    return pInfo.versionCode;
                }
            } catch (Exception e) {
                return 1L;
            }
        }

        @JavascriptInterface
        public boolean isAndroidApp() {
            return true;
        }

        @JavascriptInterface
        public boolean canRequestPackageInstalls() {
            return updateManager != null && updateManager.canRequestPackageInstalls();
        }

        @JavascriptInterface
        public void openInstallSettings() {
            if (updateManager != null) {
                updateManager.openInstallSettings();
            }
        }

        @JavascriptInterface
        public void startDownload(String downloadUrl, String apkFileName, long expectedSize) {
            if (updateManager == null) return;
            updateManager.startDownload(downloadUrl, apkFileName, expectedSize, new UpdateManager.UpdateListener() {
                @Override
                public void onProgress(int percent, long downloadedBytes, long totalBytes) {
                    evalJs("if(window.onUpdateProgress) window.onUpdateProgress(" + percent + "," + downloadedBytes + "," + totalBytes + ");");
                }

                @Override
                public void onStatus(String state, String message) {
                    evalJs("if(window.onUpdateStatus) window.onUpdateStatus(" + escapeJs(state) + "," + escapeJs(message) + ");");
                }

                @Override
                public void onError(String message) {
                    evalJs("if(window.onUpdateError) window.onUpdateError(" + escapeJs(message) + ");");
                }
            });
        }

        @JavascriptInterface
        public void cancelDownload() {
            if (updateManager != null) {
                updateManager.cancelDownload(new UpdateManager.UpdateListener() {
                    @Override
                    public void onProgress(int percent, long downloadedBytes, long totalBytes) {}

                    @Override
                    public void onStatus(String state, String message) {
                        evalJs("if(window.onUpdateStatus) window.onUpdateStatus(" + escapeJs(state) + "," + escapeJs(message) + ");");
                    }

                    @Override
                    public void onError(String message) {
                        evalJs("if(window.onUpdateError) window.onUpdateError(" + escapeJs(message) + ");");
                    }
                });
            }
        }

        @JavascriptInterface
        public void installExistingApk(String apkFileName) {
            if (updateManager != null) {
                updateManager.installExistingApk(apkFileName, new UpdateManager.UpdateListener() {
                    @Override
                    public void onProgress(int percent, long downloadedBytes, long totalBytes) {}

                    @Override
                    public void onStatus(String state, String message) {
                        evalJs("if(window.onUpdateStatus) window.onUpdateStatus(" + escapeJs(state) + "," + escapeJs(message) + ");");
                    }

                    @Override
                    public void onError(String message) {
                        evalJs("if(window.onUpdateError) window.onUpdateError(" + escapeJs(message) + ");");
                    }
                });
            }
        }
    }

    private void evalJs(String script) {
        if (webView != null) {
            webView.post(() -> webView.evaluateJavascript(script, null));
        }
    }

    private String escapeJs(String str) {
        if (str == null) return "''";
        return "'" + str.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "") + "'";
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        updateManager = new UpdateManager(this);

        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setDisplayZoomControls(false);
        settings.setBuiltInZoomControls(false);
        settings.setSupportZoom(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidUpdateBridge(), "AndroidUpdateBridge");
        webView.loadUrl("file:///android_asset/index.html");

        setContentView(webView);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (updateManager != null && webView != null) {
            boolean canInstall = updateManager.canRequestPackageInstalls();
            evalJs("if(window.onInstallPermissionResult) window.onInstallPermissionResult(" + canInstall + ");");
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
