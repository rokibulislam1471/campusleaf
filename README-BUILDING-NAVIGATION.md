# CampusLeaf 6 — Verified buildings + walking directions

## What changed

- Replaces decorative campus drawings with a **searchable HSWT building directory** and a map preview for the selected street address.
- Lists all **23 Weihenstephan** building codes and all **7 Triesdorf** codes for which HSWT publishes individual street addresses (not every numbered building appearing on PDF maps).
- **Use my location** asks permission on tap only. Location stays in RAM and is not stored in CampusLeaf or uploaded by CampusLeaf. Only if the student chooses Walking directions is the current position included in the external Google Maps URL.
- Walking directions work without CampusLeaf GPS access too: Google Maps can determine the departure point itself when opened.
- Native Android APK now uses `@capacitor/geolocation@7` and declares Android coarse/fine location permissions. Android asks for permission at runtime.
- Official building street addresses can be shared across several buildings, so the app warns that the verified **street address is not a verified entrance, room pin, or indoor path**.
- The optional Google Maps embedded preview and external directions require internet access; if the preview cannot load, use **View on map** or **Walking directions**.
- An independent student project; CampusLeaf is not affiliated with or endorsed by HSWT.

## Install update into your existing GitHub repository

1. In GitHub Desktop click **Pull origin** first if available.
2. **Repository → Show in Explorer** to open the existing `campusleaf` repository.
3. Extract the update ZIP and copy **app.js**, **styles.css**, **sw.js**, **tests/building-navigation.test.cjs**, and **.github/workflows/android-apk.yml** into the matching paths. Replace files when prompted, preserve `.git`.
4. In GitHub Desktop commit `Add HSWT building directory and GPS walking navigation`, then **Push origin**.
5. GitHub Actions automatically deploys GitHub Pages and rebuilds the Android beta APK. Wait for green checks.
6. Download new `CampusLeaf-Android-Beta.apk` from GitHub Releases and test all campus buildings on your phone. Beta signing might require uninstalling an old version. Export your timetable backup first.

## Official location sources (accessed 2026-10-19)

- Weihenstephan street addresses: https://www.hswt.de/studium/im-studium/campusleben/campus-weihenstephan
- Triesdorf street addresses: https://www.hswt.de/studium/im-studium/campusleben/campus-triesdorf
- Official campus access maps: https://www.hswt.de/anfahrt/

## Privacy and accuracy

The browser or Android device prompts for precise location only after tapping **Use my location**. Coordinates are retained in application memory for the current session only. They are not part of user backups. Google Maps receives the destination address, and potentially coordinates if included in a student-initiated walking-directions link, under Google's policies. Maps embed may load provider content on the Campus page. Avoid relying on Google Maps address geocoding for building entrances when multiple buildings share an address. For indoor rooms use official floor plans.
