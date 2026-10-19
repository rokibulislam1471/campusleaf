# CampusLeaf: Android display and safe-area update

This update makes the Android APK respect the phone's status bar, display cutouts and gesture-navigation area. It also improves mobile font and card sizing without changing the tablet or desktop layout.

## Files to replace in your existing cloned `campusleaf` repository

1. `styles.css` at the repository root.
2. `.github/workflows/android-apk.yml` inside its existing `.github/workflows` directory.

Copy both files from this ZIP into the corresponding locations. **Do not delete your existing repo or .git folder.** Use Windows File Explorer to replace the files; do not paste the whole ZIP into the repository.

Then in GitHub Desktop, commit `Fix Android safe areas and mobile layout`, push origin, and open GitHub → Actions → Build CampusLeaf Android APK. The push itself should start the APK build. Wait for a green check and download the new asset from GitHub Releases.

Latest APK release: https://github.com/rokibulislam1471/campusleaf/releases/tag/android-beta

## Details

- Uses AndroidX `WindowInsetsCompat` to inset the Capacitor WebView from visible system bars, not to hide those bars.
- When a keyboard opens, the WebView also adjusts for keyboard insets.
- Distinguishes the native app from web/PWA (`campusleaf-native`) to prevent double safe-area padding.
- Improves mobile header spacing, hero title scaling, small-screen grids, fixed bottom navigation and modal placement.
- Keeps the existing Capacitor package ID and all current app features.

## Before installing the replacement APK

The current GitHub workflow creates a **debug-signed beta**. The signing key may differ on each cloud run, which can prevent upgrading an already-installed copy. If Android reports **App not installed / package conflicts**, you may have to uninstall the previous beta first. This clears locally saved timetable data; export or copy anything important before uninstalling. Don't disable Play Protect for an actual harmful-app warning.

The updated files were syntax-checked and the existing JavaScript tests run locally. Native Android compilation and real-device behavior require a fresh GitHub Actions build and device testing; this ZIP contains **source updates, not an APK**.
