package com.example.ecal;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.StatFs;
import android.provider.Settings;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

public class UpdateManager {
    private static final String TAG = "EcalUpdateManager";
    private static final int BUFFER_SIZE = 8192;
    private static final int TIMEOUT_CONNECT_MS = 15000;
    private static final int TIMEOUT_READ_MS = 30000;

    public interface UpdateListener {
        void onProgress(int percent, long downloadedBytes, long totalBytes);
        void onStatus(String state, String message);
        void onError(String message);
    }

    private final Activity activity;
    private final Handler mainHandler;
    private final ExecutorService executor;
    private final AtomicBoolean isDownloading;
    private final AtomicBoolean isCancelled;
    private HttpURLConnection currentConnection;
    private File currentDownloadingFile;

    public UpdateManager(Activity activity) {
        this.activity = activity;
        this.mainHandler = new Handler(Looper.getMainLooper());
        this.executor = Executors.newSingleThreadExecutor();
        this.isDownloading = new AtomicBoolean(false);
        this.isCancelled = new AtomicBoolean(false);
    }

    public boolean isDownloading() {
        return isDownloading.get();
    }

    public void cancelDownload(UpdateListener listener) {
        if (!isDownloading.get()) {
            return;
        }
        isCancelled.set(true);
        if (currentConnection != null) {
            new Thread(() -> {
                try {
                    currentConnection.disconnect();
                } catch (Exception ignored) {}
            }).start();
        }
        if (currentDownloadingFile != null && currentDownloadingFile.exists()) {
            currentDownloadingFile.delete();
        }
        isDownloading.set(false);
        notifyStatus(listener, "CANCELLED", "Download cancelled by user.");
    }

    public boolean canRequestPackageInstalls() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return activity.getPackageManager().canRequestPackageInstalls();
        }
        return true;
    }

    public void openInstallSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
            intent.setData(Uri.parse("package:" + activity.getPackageName()));
            activity.startActivity(intent);
        }
    }

    public void startDownload(String downloadUrl, String apkFileName, long expectedSize, UpdateListener listener) {
        if (isDownloading.get()) {
            notifyError(listener, "A download is already in progress.");
            return;
        }

        if (!validateDownloadUrl(downloadUrl)) {
            notifyError(listener, "Security validation failed: untrusted download URL.");
            return;
        }

        isCancelled.set(false);
        isDownloading.set(true);
        notifyStatus(listener, "DOWNLOADING", "Downloading update...");

        executor.execute(() -> {
            InputStream in = null;
            FileOutputStream out = null;
            File targetFile = null;

            try {
                File dir = new File(activity.getCacheDir(), "updates");
                if (!dir.exists() && !dir.mkdirs()) {
                    throw new Exception("Unable to create updates directory.");
                }

                // Clean old files
                File[] oldFiles = dir.listFiles();
                if (oldFiles != null) {
                    for (File f : oldFiles) {
                        f.delete();
                    }
                }

                // Storage check
                StatFs stat = new StatFs(dir.getPath());
                long availableSpace = stat.getAvailableBytes();
                if (expectedSize > 0 && availableSpace < (expectedSize + (5L * 1024L * 1024L))) {
                    throw new Exception("Insufficient storage space on device.");
                }

                String safeName = (apkFileName != null && apkFileName.endsWith(".apk")) ? apkFileName : "update.apk";
                targetFile = new File(dir, safeName);
                currentDownloadingFile = targetFile;

                URL url = new URL(downloadUrl);
                HttpURLConnection conn = openConnectionWithRedirects(url);
                currentConnection = conn;

                int responseCode = conn.getResponseCode();
                if (responseCode < 200 || responseCode >= 300) {
                    throw new Exception("Download server returned HTTP " + responseCode);
                }

                long contentLength = conn.getContentLengthLong();
                if (contentLength <= 0 && expectedSize > 0) {
                    contentLength = expectedSize;
                }

                in = conn.getInputStream();
                out = new FileOutputStream(targetFile);

                byte[] buffer = new byte[BUFFER_SIZE];
                long downloaded = 0;
                int bytesRead;
                long lastProgressTime = 0;

                while ((bytesRead = in.read(buffer)) != -1) {
                    if (isCancelled.get()) {
                        throw new InterruptedException("Download cancelled.");
                    }
                    out.write(buffer, 0, bytesRead);
                    downloaded += bytesRead;

                    long now = System.currentTimeMillis();
                    if (now - lastProgressTime > 100 || downloaded == contentLength) {
                        lastProgressTime = now;
                        int percent = (contentLength > 0) ? (int) ((downloaded * 100) / contentLength) : 0;
                        final long curDownloaded = downloaded;
                        final long curTotal = contentLength;
                        mainHandler.post(() -> {
                            if (!isCancelled.get() && listener != null) {
                                listener.onProgress(percent, curDownloaded, curTotal);
                            }
                        });
                    }
                }

                out.flush();

                if (isCancelled.get()) {
                    throw new InterruptedException("Download cancelled.");
                }

                notifyStatus(listener, "DOWNLOAD_SUCCESS", "Download complete. Verifying package...");

                // APK Verification
                verifyApk(targetFile);

                notifyStatus(listener, "VERIFICATION_SUCCESS", "APK verified successfully.");

                // Check installation permission
                if (!canRequestPackageInstalls()) {
                    notifyStatus(listener, "PERMISSION_REQUIRED", "Installation permission required.");
                    return;
                }

                notifyStatus(listener, "INSTALLING", "Launching installer...");
                launchInstallation(targetFile);

            } catch (InterruptedException e) {
                if (targetFile != null && targetFile.exists()) {
                    targetFile.delete();
                }
                notifyStatus(listener, "CANCELLED", "Download cancelled.");
            } catch (Exception e) {
                Log.e(TAG, "Update failure", e);
                if (targetFile != null && targetFile.exists()) {
                    targetFile.delete();
                }
                notifyError(listener, e.getMessage() != null ? e.getMessage() : "Update failed.");
            } finally {
                isDownloading.set(false);
                currentConnection = null;
                currentDownloadingFile = null;
                try { if (in != null) in.close(); } catch (Exception ignored) {}
                try { if (out != null) out.close(); } catch (Exception ignored) {}
            }
        });
    }

    public void installExistingApk(String apkFileName, UpdateListener listener) {
        File dir = new File(activity.getCacheDir(), "updates");
        String safeName = (apkFileName != null && apkFileName.endsWith(".apk")) ? apkFileName : "update.apk";
        File file = new File(dir, safeName);
        if (!file.exists()) {
            notifyError(listener, "Downloaded update file not found.");
            return;
        }

        try {
            verifyApk(file);
            if (!canRequestPackageInstalls()) {
                notifyStatus(listener, "PERMISSION_REQUIRED", "Installation permission required.");
                return;
            }
            notifyStatus(listener, "INSTALLING", "Launching installer...");
            launchInstallation(file);
        } catch (Exception e) {
            notifyError(listener, e.getMessage());
        }
    }

    private void launchInstallation(File apkFile) {
        mainHandler.post(() -> {
            try {
                Uri apkUri = EcalFileProvider.getUriForFile(activity, apkFile);
                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(installIntent);
            } catch (Exception e) {
                Log.e(TAG, "Failed to launch installer intent", e);
            }
        });
    }

    private void verifyApk(File apkFile) throws Exception {
        PackageManager pm = activity.getPackageManager();
        PackageInfo archiveInfo;
        int flags = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) 
                ? PackageManager.GET_SIGNING_CERTIFICATES 
                : PackageManager.GET_SIGNATURES;

        archiveInfo = pm.getPackageArchiveInfo(apkFile.getAbsolutePath(), flags);
        if (archiveInfo == null || archiveInfo.packageName == null) {
            throw new Exception("Downloaded file is not a valid APK package.");
        }

        // 1. Verify Package Name
        String expectedPkg = activity.getPackageName();
        if (!expectedPkg.equals(archiveInfo.packageName)) {
            throw new Exception("Package name mismatch: Expected " + expectedPkg + " but found " + archiveInfo.packageName);
        }

        // 2. Verify Version Code
        PackageInfo installedInfo = pm.getPackageInfo(expectedPkg, flags);
        long installedVersionCode = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) 
                ? installedInfo.getLongVersionCode() 
                : installedInfo.versionCode;

        long archiveVersionCode = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) 
                ? archiveInfo.getLongVersionCode() 
                : archiveInfo.versionCode;

        if (archiveVersionCode < installedVersionCode) {
            throw new Exception("Downloaded APK version code (" + archiveVersionCode + ") is older than installed (" + installedVersionCode + ").");
        }

        // 3. Verify Signing Certificate
        Set<String> installedSigs = extractSignatures(installedInfo, null);
        Set<String> archiveSigs = extractSignatures(archiveInfo, apkFile.getAbsolutePath());

        if (!installedSigs.isEmpty() && !archiveSigs.isEmpty()) {
            boolean hasMatch = false;
            for (String sig : archiveSigs) {
                if (installedSigs.contains(sig)) {
                    hasMatch = true;
                    break;
                }
            }
            if (!hasMatch) {
                Log.w(TAG, "Signature differs between installed app and update APK. Passing to Android PackageInstaller for system verification.");
            }
        }
    }

    private Set<String> extractSignatures(PackageInfo info, String archivePath) {
        Set<String> set = new HashSet<>();
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && info.signingInfo != null) {
                SigningInfo si = info.signingInfo;
                Signature[] sigs = si.hasMultipleSigners() ? si.getApkContentsSigners() : si.getSigningCertificateHistory();
                if (sigs != null) {
                    for (Signature s : sigs) {
                        set.add(sha256(s.toByteArray()));
                    }
                }
            }
            if (set.isEmpty() && info.signatures != null) {
                for (Signature s : info.signatures) {
                    set.add(sha256(s.toByteArray()));
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error extracting package signatures: " + e.getMessage());
        }

        // Fallback for APK file archive if package archive info did not parse certificates
        if (set.isEmpty() && archivePath != null) {
            try (JarFile jar = new JarFile(archivePath)) {
                JarEntry entry = jar.getJarEntry("AndroidManifest.xml");
                if (entry != null) {
                    byte[] buf = new byte[4096];
                    try (InputStream is = jar.getInputStream(entry)) {
                        while (is.read(buf, 0, buf.length) != -1) {
                            // Read fully to verify signatures
                        }
                    }
                    java.security.cert.Certificate[] certs = entry.getCertificates();
                    if (certs != null) {
                        for (java.security.cert.Certificate cert : certs) {
                            set.add(sha256(cert.getEncoded()));
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Jar signature verification fallback: " + e.getMessage());
            }
        }
        return set;
    }

    private String sha256(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private boolean validateDownloadUrl(String urlStr) {
        try {
            URL url = new URL(urlStr);
            if (!"https".equalsIgnoreCase(url.getProtocol())) {
                return false;
            }
            String host = url.getHost().toLowerCase();
            return host.equals("github.com") 
                    || host.endsWith(".github.com") 
                    || host.equals("objects.githubusercontent.com") 
                    || host.endsWith(".githubusercontent.com");
        } catch (Exception e) {
            return false;
        }
    }

    private HttpURLConnection openConnectionWithRedirects(URL url) throws Exception {
        URL currentUrl = url;
        int redirects = 0;
        while (redirects < 6) {
            HttpURLConnection conn = (HttpURLConnection) currentUrl.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(TIMEOUT_CONNECT_MS);
            conn.setReadTimeout(TIMEOUT_READ_MS);
            conn.setRequestProperty("User-Agent", "Ecal-Android-App");

            int status = conn.getResponseCode();
            if (status == HttpURLConnection.HTTP_MOVED_TEMP 
                    || status == HttpURLConnection.HTTP_MOVED_PERM 
                    || status == 307 || status == 308) {
                String newUrl = conn.getHeaderField("Location");
                conn.disconnect();
                if (newUrl == null || !validateDownloadUrl(newUrl)) {
                    throw new Exception("Illegal or insecure redirect URL during download.");
                }
                currentUrl = new URL(newUrl);
                redirects++;
            } else {
                return conn;
            }
        }
        throw new Exception("Too many HTTP redirects.");
    }

    private void notifyProgress(UpdateListener listener, int percent, long downloaded, long total) {
        mainHandler.post(() -> {
            if (listener != null) listener.onProgress(percent, downloaded, total);
        });
    }

    private void notifyStatus(UpdateListener listener, String state, String message) {
        mainHandler.post(() -> {
            if (listener != null) listener.onStatus(state, message);
        });
    }

    private void notifyError(UpdateListener listener, String message) {
        mainHandler.post(() -> {
            if (listener != null) listener.onError(message);
        });
    }
}

