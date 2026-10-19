# CampusLeaf — Dark-first theme + original leaf brand (Android)

This is an **overlay update**, not the entire project. Copy the contents of this folder into your cloned `campusleaf` repository, merging the `.github` and `assets` folders and replacing files when asked. **Never delete `.git`.**

## Changes
- Fresh installs start in **Dark** theme. Existing users' saved Light/Dark choice is honored. Resetting personal data returns to Dark.
- Settings and More have visible **Dark / Light** buttons; choices are remembered in local storage.
- Header brand, favicon, web icons, launcher icons, Android 12+ adaptive icon, and splash resources use the **same existing CampusLeaf outline leaf** shown in the supplied screenshot (instead of the former building favicon or Capacitor default icon).
- `styles.css` includes the earlier Android safe-area/responsive display fix.
- `sw.js` updates the PWA asset cache so the new logo loads after web deployment.
- `tests/theme-and-leaf.test.cjs` verifies new-install theme, saved theme selection and icon resources.
- Existing features (Mensa, classes/calendar import, campus, HSWT email shortcut) are retained.

## Publish / rebuild
1. Open GitHub Desktop → Repository → Show in Explorer.
2. Copy all items inside this overlay folder to the repository root: `app.js`, `styles.css`, `index.html`, `sw.js`, `.github`, `assets`, `tests`. Merge/replace existing files.
3. Commit changes with `Dark default and CampusLeaf leaf logo`, then **Push origin**.
4. Open GitHub → Actions → **Build CampusLeaf Android APK**. The updated APK is rebuilt automatically.
5. If the APK build succeeds, download it from the GitHub Releases `android-beta` tag.
6. **Back up personal classes/reminders before uninstalling a prior debug APK.** Debug signing can change between builds, so uninstalling the old beta may be required.

## Verification
This update includes the source and build workflow, not a compiled APK. The repository workflow must compile the Android app, and the device icon/splash should be inspected on a real Android phone.
