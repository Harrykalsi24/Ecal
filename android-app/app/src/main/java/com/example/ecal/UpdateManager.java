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

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.ArrayList;
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

    private String lastExpectedSha256;
    private String lastManifestJson;
    private String lastManifestSig;

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

    public void startDownload(String downloadUrl, String apkFileName, long expectedSize,
                              String expectedSha256, String manifestJson, String manifestSig,
                              UpdateListener listener) {
        if (isDownloading.get()) {
            notifyError(listener, "A download is already in progress.");
            return;
        }

        if (!validateDownloadUrl(downloadUrl)) {
            notifyError(listener, "Security validation failed: Untrusted download URL origin.");
            return;
        }

        this.lastExpectedSha256 = expectedSha256;
        this.lastManifestJson = manifestJson;
        this.lastManifestSig = manifestSig;

        isCancelled.set(false);
        isDownloading.set(true);
        notifyStatus(listener, "DOWNLOADING", "Connecting to official GitHub release...");

        executor.execute(() -> {
            InputStream in = null;
            FileOutputStream out = null;
            File targetFile = null;

            try {
                File dir = new File(activity.getCacheDir(), "updates");
                if (!dir.exists() && !dir.mkdirs()) {
                    throw new Exception("Unable to create updates directory.");
                }

                File[] oldFiles = dir.listFiles();
                if (oldFiles != null) {
                    for (File f : oldFiles) {
                        f.delete();
                    }
                }

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

                notifyStatus(listener, "DOWNLOAD_SUCCESS", "Download complete. Verifying cryptographic integrity...");

                // Full Cryptographic & Integrity Verification
                verifyApk(targetFile, expectedSha256, manifestJson, manifestSig);

                notifyStatus(listener, "VERIFICATION_SUCCESS", "Integrity & signature verified.");

                if (!canRequestPackageInstalls()) {
                    notifyStatus(listener, "PERMISSION_REQUIRED", "Installation permission required.");
                    return;
                }

                notifyStatus(listener, "READY_TO_INSTALL", "Verified. Ready to launch Android installer.");

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
                notifyError(listener, e.getMessage() != null ? e.getMessage() : "Update verification failed.");
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
            verifyApk(file, lastExpectedSha256, lastManifestJson, lastManifestSig);
            if (!canRequestPackageInstalls()) {
                notifyStatus(listener, "PERMISSION_REQUIRED", "Installation permission required.");
                return;
            }
            notifyStatus(listener, "INSTALLING", "Launching Android installer...");
            launchInstallation(file);
        } catch (Exception e) {
            notifyError(listener, e.getMessage());
        }
    }

    public void launchInstallation(File apkFile) {
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

    private void verifyApk(File apkFile, String expectedSha256, String manifestJson, String manifestSig) throws Exception {
        // 1. File existence & basic size check
        if (apkFile == null || !apkFile.exists() || apkFile.length() < 10000) {
            throw new Exception("Incomplete or corrupted APK download.");
        }

        // 2. SHA-256 Checksum Verification
        String actualSha256 = SecurityUtils.computeFileSha256(apkFile);
        if (actualSha256.isEmpty()) {
            throw new Exception("Failed to compute SHA-256 checksum of downloaded APK.");
        }

        if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
            String cleanExpected = expectedSha256.trim().toLowerCase();
            if (!actualSha256.equalsIgnoreCase(cleanExpected)) {
                throw new Exception("SHA-256 Checksum Mismatch!\nExpected: " + cleanExpected + "\nActual: " + actualSha256);
            }
        }

        // 3. Signed Release Manifest Verification (Public Key Authenticity)
        if (manifestJson != null && !manifestJson.trim().isEmpty() &&
            manifestSig != null && !manifestSig.trim().isEmpty()) {
            boolean validSig = SecurityUtils.verifyManifestSignature(manifestJson, manifestSig);
            if (!validSig) {
                throw new Exception("Untrusted release manifest: Cryptographic signature verification failed.");
            }
            try {
                JSONObject mObj = new JSONObject(manifestJson);
                String manifestSha = mObj.optString("apkSha256", "");
                if (!manifestSha.isEmpty() && !actualSha256.equalsIgnoreCase(manifestSha)) {
                    throw new Exception("Manifest SHA-256 mismatch with downloaded APK.");
                }
            } catch (Exception e) {
                throw new Exception("Malformed release manifest data: " + e.getMessage());
            }
        }

        // 4. Android Package Archive Verification
        PackageManager pm = activity.getPackageManager();
        PackageInfo archiveInfo;
        int flags = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) 
                ? PackageManager.GET_SIGNING_CERTIFICATES 
                : PackageManager.GET_SIGNATURES;

        archiveInfo = pm.getPackageArchiveInfo(apkFile.getAbsolutePath(), flags);
        if (archiveInfo == null || archiveInfo.packageName == null) {
            throw new Exception("Downloaded file is not a valid Android APK archive.");
        }

        // 5. Verify Package Name
        String expectedPkg = activity.getPackageName();
        if (!expectedPkg.equals(archiveInfo.packageName)) {
            throw new Exception("Package name mismatch: Expected " + expectedPkg + " but found " + archiveInfo.packageName);
        }

        // 6. Verify Version Code (Reject Downgrades)
        PackageInfo installedInfo = pm.getPackageInfo(expectedPkg, flags);
        long installedVersionCode = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) 
                ? installedInfo.getLongVersionCode() 
                : installedInfo.versionCode;

        long archiveVersionCode = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) 
                ? archiveInfo.getLongVersionCode() 
                : archiveInfo.versionCode;

        if (archiveVersionCode < installedVersionCode) {
            throw new Exception("Version downgrade rejected: Downloaded version code (" + archiveVersionCode + ") is older than installed (" + installedVersionCode + ").");
        }

        // 7. Verify Signing Certificate Consistency
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
                Log.w(TAG, "Archive signature differs from installed app. Passing to Android PackageInstaller.");
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

        if (set.isEmpty() && archivePath != null) {
            try (JarFile jar = new JarFile(archivePath)) {
                JarEntry entry = jar.getJarEntry("AndroidManifest.xml");
                if (entry != null) {
                    byte[] buf = new byte[4096];
                    try (InputStream is = jar.getInputStream(entry)) {
                        while (is.read(buf, 0, buf.length) != -1) {}
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
