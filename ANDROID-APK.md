# Ecal Android APK

Ecal is packaged as an Android app using Capacitor. The existing HTML, CSS, JavaScript, and logo files are loaded locally inside an Android WebView.

## Build using GitHub Actions

1. Open the repository on GitHub.
2. Select the `apk-cinv` branch.
3. Open the **Actions** tab.
4. Select **Build Android APK**.
5. Click **Run workflow**.
6. Wait for the workflow to finish.
7. Open the completed workflow run.
8. Download the `ecal-debug-apk` artifact.
9. Extract the ZIP file and install `app-debug.apk` on your Android phone.

Android may require permission to install applications from unknown sources.

This is a debug APK for testing. A release APK requires signing with an Android keystore before publishing.

## Build locally

```bash
npm install
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK will be generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```