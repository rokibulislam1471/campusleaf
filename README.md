# CampusLeaf 5.0 — HSWT email quick access (October 2026)

The **Email / E-Mail** tab now offers a **Quick-open Email tab** toggle. Once a student enables it, tapping Email from the dashboard or the navigation launches HSWT's official webmail (`https://xmail.mwn.de/owa/`) directly in a separate browser page. The preference is stored locally as a boolean in CampusLeaf's own app settings. On/off works in English and German.

**Critical limitation: this is NOT a CampusLeaf email login or permanent authentication feature.** Each student signs in on the *real* HSWT-linked Outlook Web Access website. Their browser may keep an Outlook session while university rules allow it; the phone's password manager may autofill credentials. CampusLeaf cannot create, extend, synchronize or restore Outlook login cookies, and cannot promise that students will stay signed in indefinitely. Outlook may request sign-in again, including after a password change, expired session, or university security action. On iOS, the standalone CampusLeaf PWA and Safari may have separate browser storage; the official webmail link can open Safari and the login state is managed there.

**Privacy:** CampusLeaf does not ask for or store university email addresses, passwords, email content, cookies, or access/refresh tokens. No iframe, web scraping, unofficial Outlook proxy, credential relay, or session bypass is used. Students should choose persistent login only on their own secure device and should not save passwords on public/shared phones. The toggle remembers a convenience shortcut, *not* a login.

To use it: tap **Email** → **Open my HSWT inbox** and sign in once via the university mail service → optionally switch on **Quick-open Email tab**. To remain signed in where possible, enable cookies in your browser, use its password manager if desired and respect any university sign-in/session settings. The university may still require authentication on future visits.

Verified sources: [HSWT Rechenzentrum / Webmail link](https://www.hswt.de/hochschule/organisation/zentrale-einrichtungen/rechenzentrum), [official Outlook Web Access](https://xmail.mwn.de/owa/), [WebKit web app cookie behavior](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/).

**Validation:** 14 Node.js tests (including opt-in toggle, storage safety checks, login URL, and German localization) and 5 Python menu collector tests passed locally. Mobile browsers, live HSWT sign-in and actual cookies were not tested with a student account.

---

# CampusLeaf 4.0 — HSWT Student Email update

The **Email / E-Mail** page and dashboard shortcut open the university's **official Outlook Web Access** at <https://xmail.mwn.de/owa/>. This is the webmail URL linked from the current [HSWT Rechenzentrum page](https://www.hswt.de/hochschule/organisation/zentrale-einrichtungen/rechenzentrum). Students log in **on the official webmail site**, not inside this independent app. CampusLeaf never asks for, stores, transmits or relays student mail credentials, mail contents or cookies. Login handling belongs to the official provider.

- **Supported:** Dedicated email page, prominent secure official inbox link, German/English help, dashboard shortcut, navigation tab for phones, quick-search and tools shortcuts; works on GitHub Pages and installed iOS/Android PWAs.
- **Not supported:** Native in-app mail list, new-mail notification badge, email reading/compose inside CampusLeaf, and automated login. That functionality would require a university-approved mail API / delegated authentication integration. Do not attempt to embed the Outlook site in an iframe or ask users for passwords.
- **Help:** The [HSWT first-semester guidance](https://www.hswt.de/en/studium/before-the-study/freshman-info) explains where students can access official email setup instructions through the intranet.
- **Testing:** On a deployed site, visit **Email → Open my HSWT inbox** and ensure the browser navigates to `https://xmail.mwn.de/owa/` over HTTPS. Individual login is not testable without a real student's credentials and should not be automated.

---

# CampusLeaf 3.0 — HSWT Student Companion

**Installable iPhone / Android Progressive Web App (PWA)** for HSWT Weihenstephan and Triesdorf. An **unofficial student project**, not affiliated with or endorsed by HSWT.

## Working features

- English / German home dashboard, dark mode, responsive navigation, campus switching
- **Seven campus dining locations**: Mensa Weihenstephan, StuBistro Maximus, StuBistro Akademie, Espressobar Weihenstephan, StuLounge Weihenstephan, Mensateria Gastwirtschaft zum Adler (Triesdorf), Mensa der Landwirtschaftlichen Lehranstalten (Triesdorf)
- **Published menus displayed directly in the app:** Mensa Weihenstephan and two Weihenstephan cafés via TUM-Dev eat-api, Mensateria Triesdorf via public operator HTML (plus OpenMensa fallback), and the Triesdorf LL Mensa via its dated PDF where parseable. Venues without public feeds show a clear empty state, *not fictional dishes*
- GitHub Actions retrieves public menus **on each deployment and daily** into a static JSON snapshot. Phone clients use that freshly built feed, then try the public endpoints as fallback
- View menus on other dates, vegetarian / vegan quick filter, favorites, student prices where supplied by feeds, official operator links and directions
- **Calendar .ics file import**: parse one-off, daily / weekly / monthly recurrence, multiple weekly days and exception dates; recurring timetable and week navigation
- Optional calendar URL sync using a **direct HTTPS ICS URL that permits browser CORS access**. No university credentials are ever requested or proxied. MyCampus private timetables are **NOT** connected, nor can we guarantee that HSWT publishes a compatible feed
- Manual classes, reminders, local persistence, JSON backup export/import, university shortcuts and maps
- PWA manifest, app icons, offline app shell, iOS Safari **Add to Home Screen** and Android Chrome **Install app** instructions
- GitHub Pages zero-cost hosting; no Node server or database required

## Limitations — read before release

1. **Live HSWT personal timetable:** there is no verified authorized public API for MyCampus personal accounts. Students can import a calendar export if available, or link an ICS endpoint if their provider permits cross-origin requests. This is NOT the same as private MyCampus automatic synchronization. A real HSWT SSO/API integration requires HSWT authorization and security assessment.
2. **Dining data freshness:** supplied by independent community feeds, subject to outages, missing dates and menu changes. If unavailable, the app displays an honest warning and the operator link; opening hours are general published hours, not live “open now”.
3. **No student accounts or cross-device sync:** private classes, reminders and ICS events are stored in each device's browser storage. Back up before changing devices. Never store university passwords in this app.
4. **PWA, not native store binaries:** installation on iPhone/Android works from an HTTPS website; there is no APK or IPA in this repository. Native builds, notifications and store publishing are separate projects.
5. **Not production-certified:** automated unit/render smoke tests are included. iOS/Android real-device PWA install, privacy/legal requirements, accessibility and security should be reviewed before broad release.
6. **Advanced ICS rules:** common events and weekly class recurrence work; unusual timezone identifiers, overridden `RECURRENCE-ID` series and advanced recurrence rules may not import perfectly. Check imported events against the source.

## Host for free on GitHub Pages

1. Create a **public** GitHub repository, e.g. `campusleaf`.
2. Unzip the source folder and upload **all files and folders** in the project root, including `.github`, `data`, `scripts`, `index.html`, `app.js`, `data-services.js`, `styles.css`, and `assets`.
3. Commit to `main`.
4. GitHub → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. GitHub → **Actions**; open “Deploy CampusLeaf to GitHub Pages”, wait for successful deployment.
6. Your site should appear at `https://YOUR-USERNAME.github.io/campusleaf/`. The site serves PWA assets over HTTPS.
7. The deployment Action fetches current public menu data, builds `data/menu-snapshot.json` and publishes it without committing API data to the repository.
8. A scheduled workflow re-fetches menus daily at approximately **05:12 UTC**; GitHub scheduled workflows may be delayed or disabled due to inactivity.

You do **not** need a domain, Hostinger, Node hosting or a paid database for this version. If menu feeds are down when the scheduled job executes, the app falls back to the original public APIs or operator pages.

## Install on phone

**iPhone (Safari):** open the GitHub Pages HTTPS link → Share → Add to Home Screen → Add. Web app support depends on your iOS/Safari version.

**Android (Chrome):** open the GitHub Pages HTTPS link → menu (⋮) → Install app (or Add to Home screen). No Play Store required.

## Timetable setup

- On the app's **Timetable** page select **Import / sync**.
- **ICS file (reliable):** Export your own calendar as `.ics` (HSWT if such an export is provided, or Google/Apple Calendar) and choose the file. Imported entries appear on their actual dates. This does *not* automatically refresh future edits.
- **ICS URL (conditional):** Paste your calendar's **direct HTTPS iCalendar feed URL**. Browser cross-origin protection means MyCampus login pages, most password-gated URLs and many remote ICS links will not work. Only check “Save private calendar link” on trusted personal devices. Your browser fetch is credentialless (`credentials:'omit'`).
- Manually create recurring weekly classes if no ICS export is available.
- Imported ICS data replaces the *previous imported events only*. It does not delete manually created classes or reminders.
- Backups intentionally **exclude saved calendar feed URLs** because these can be secrets. A restored backup does not reconnect to the feed.

## Run locally

Requires a basic static HTTP server; there are **no npm dependencies**:

```bash
cd hswt-campus-app
python -m http.server 8000
# Open http://localhost:8000
```

Alternatively use `start-windows.bat` or `./start-mac-linux.sh`.

Run unit and DOM-render smoke tests if Node.js is installed:

```bash
node --test tests/*.cjs
```

## Source structure

```text
index.html                HTML entry point
data-services.js          Public mensa adapters and iCalendar parser
app.js                    Interface, local storage, navigation, and app actions
styles.css                Responsive phone and desktop styling
manifest.webmanifest      PWA install metadata
sw.js                     Offline app shell and versioned cache
assets/                   App icons
scripts/update_menus.py   Public menu collector for GitHub Actions
.github/workflows/deploy.yml    Deploy on push and scheduled menu refresh
tests/                    Node tests and render smoke test
data/                     Static public menu snapshot generated at deploy time
```

## Data providers & credits

- [TUM-Dev eat-api](https://github.com/TUM-Dev/eat-api) — public Weihenstephan menu data (MIT-licensed project, independent of HSWT)
- [OpenMensa API](https://docs.openmensa.org/api/v2/overview/) — optional community canteen menus
- [Studierendenwerk München Oberbayern — Freising](https://www.studierendenwerk-muenchen-oberbayern.de/gastronomie/standorte-und-oeffnungszeiten/freising-weihenstephan/) — primary operator / opening hours
- [Studierendenwerk Erlangen-Nürnberg — Mensateria Triesdorf](https://www.werkswelt.de/index?id=trie)
- [Landwirtschaftliche Lehranstalten Triesdorf — Mensa](https://www.triesdorf.de/essen-trinken-einkaufen)
- [HSWT MyCampus](https://mycampus.hswt.de/) — official student account website, **no integrated login**

Before publicly operating this service, prepare an accurate site-level privacy policy, legal notice (Impressum), copyright/attribution notices, and review third-party request behavior against GDPR. External menus and university links are independent services. All app branding here is original and not an official HSWT logo.

---

# CampusLeaf 3.0 — direct in-app Mensa menus (October 2026 update)

### What changed

The **Mensa tab now renders food directly on the page** for every venue with a dated, published menu. Students can change the venue, pick a calendar date, browse dishes, see student prices if supplied, and filter reliably tagged vegetarian/vegan dishes. The official provider is linked only as an optional source/allergen reference. Users no longer need to visit the operator site merely to read meals that our collector successfully retrieves.

### All seven dining locations

| Venue | In-app data source | Important availability note |
|---|---|---|
| Mensa Weihenstephan | TUM-Dev eat-api | Automated published JSON; menu depends on upstream feed availability |
| StuBistro Maximus | TUM-Dev eat-api (StuCafé Maximus ID) | Operator might publish a different selection under its StuBistro label; verify the feed mapping |
| StuBistro Akademie | TUM-Dev eat-api (StuCafé Akademie ID) | Only days with published meals |
| Espressobar Weihenstephan | Optional editorial source-backed entry | No verified public dish-level API; blank until an actual published menu is added |
| StuLounge Weihenstephan | Optional editorial source-backed entry | No verified public dish-level API; blank until an actual published menu is added |
| Mensateria Gastwirtschaft zum Adler (Triesdorf) | Operator's dated webpage + optional OpenMensa | Webpage usually publishes the displayed day's meals; parser may need updates if site layout changes |
| Triesdorf Landwirtschaftliche Lehranstalten Mensa | Operator's dated weekly menu PDF | PDF table is parsed if extractable; old PDFs are **rejected** based on actual listed dates |

**Never treat the menu as a medical/allergy guarantee:** ingredients, allergens and opening hours can change without advance online notice. Confirm at the actual service counter if you have allergies.

### Daily refresh on GitHub Pages

The included `.github/workflows/deploy.yml` installs `scripts/requirements.txt`, runs `scripts/update_menus.py` on pushes and automatically each day at ~05:12 UTC, generates `data/menu-snapshot.json` and deploys the website. GitHub scheduled Actions can be delayed. Public menu data is served with the PWA and is not personal information.

The collector uses external food APIs and website/PDF parsers. It **may fail** if publishers change source formats, block requests, or have not published new meals. The app shows *no published menu* rather than fake foods in those cases. A snapshot between 36 and 72 hours old is explicitly marked as previously fetched, not live. Both student prices and publication timestamps are shown only when available.

To diagnose a missing menu, open GitHub → Actions → most recent `Deploy CampusLeaf to GitHub Pages` run → `Refresh public canteen menus` step. Read the printed per-venue count of published days and warnings; any zero count means that no dated dishes were retrieved for that venue.

### Optional manual menu entries (no server required)

To add a missing venue's **real, source-verifiable** menus, edit `data/editorial-menus.json` in GitHub. Example of the *format only* (do not publish fictional dishes):

```json
{
  "venues": {
    "stulounge-weihenstephan": {
      "source": "https://OFFICIAL-PUBLISHER-URL",
      "days": {
        "YYYY-MM-DD": [
          {"name": "VERIFIED_DISH_NAME", "type": "Daily special", "price": null, "labels": []}
        ]
      }
    }
  }
}
```

This works only for upcoming actual ISO dates, with an HTTPS source URL. The collector validates and merges the entries during its next deployment; a GitHub repository editor can remove outdated entries anytime. It is **not** a public student editing feature and is not a source of automatically synchronized operator prices.

### Test locally

```bash
python -m pip install -r scripts/requirements.txt
python -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/*.cjs
python -m http.server 8000
```

Local menu aggregation requires access to public internet, which may not work from some managed environments. A normal `index.html` load will still show the app interface. For live menu snapshots, push to GitHub and run the action on its hosted runner.

### Outstanding work before calling it a fully live university service

- Confirm production access to each upstream food source and validate fresh menus and prices after GitHub deployment.
- The **HSWT personal timetable is NOT live-connected**. It still supports ICS import or a browser-accessible calendar feed. Private MyCampus integration requires documented university authorization.
- There is no student authentication, multi-device calendar sync or native APK/IPA in this PWA. Installation from the HTTPS website is supported on Android/iPhone, subject to browser and OS behavior.
- Publish suitable operator credits and your real Impressum and privacy notice before promoting widely; complete accessibility and real-device testing.
