# CampusLeaf combined update — timetable dates + feedback email

This package combines BOTH previously requested changes from the most recent saved timetable update and feedback update:

1. Timetable day tabs show dates (19, 20, 21…) as large numbers, with class counts below.
2. Quick Settings shows a clickable feedback email link below the HSWT non-affiliation disclaimer.
   Address: rokibul.islam@student.hswt.de
   Email subject: CampusLeaf Feedback
   English and German labels are included.
3. CSS includes both timetable-date styling and feedback styling; existing dark/light theme fixes are preserved.
4. The Android build workflow routes feedback email links to a mail app via Capacitor's AppLauncher.

No local timetable data or settings are intentionally deleted.

HOW TO APPLY WITHOUT ANOTHER MERGE CONFLICT

A. Open GitHub Desktop and select the campusleaf repo.
B. IMPORTANT: verify there is no merge in progress, no uncommitted changes, and no unpushed local commits. If there is a conflict, stop and resolve the earlier conflict first; do not paste this ZIP over an unresolved merge.
C. Click Fetch origin, then Pull origin (if offered) BEFORE copying the update.
D. Extract this ZIP, then copy its *contents* to the cloned campusleaf directory, merging folders and replacing the three specified files.
E. Verify GitHub Desktop lists app.js, styles.css and .github/workflows/android-apk.yml as changed.
F. Commit to main with message "Combine timetable dates and feedback email"; click Push origin.
G. Check GitHub Actions for a successful Android APK build and reinstall the new beta as appropriate.

NOTE: This is a source update, not the finished APK. GitHub must build the APK.
Existing local copies may have additional unsynced changes; inspect diffs before committing.
