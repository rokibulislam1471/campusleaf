# CampusLeaf — next integration milestones

Version 2.0 already provides phone-installable PWA delivery, public menu integrations, seven dining locations, an ICS parser and live feed connector when CORS allows.

## HSWT authorization required
- Ask HSWT Rechenzentrum for a documented, approved OAuth/SSO flow and a permitted personal timetable endpoint or signed calendar feed.
- Do not scrape login pages or collect student credentials in CampusLeaf.
- Agree on data privacy terms, caching, rate limits, account revocation and a security review.
- Implement a backend only when necessary, hosted separately from GitHub Pages.

## Production quality milestones
- Verify third-party menu availability and attribution with actual live deployment.
- Verify iOS Safari home screen and Android Chrome installation on physical devices.
- Improve complex ICS exception handling and imported calendar updates.
- Review accessibility and keyboard navigation.
- Draft and publish Impressum, privacy policy, and any required consent controls.
- Obtain feedback from students on both campuses and establish maintenance ownership.

## App stores optional
- The current PWA installs on iOS/Android without stores.
- Native binaries would require additional build tooling and, for iOS, Apple-signing credentials.
