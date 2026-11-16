# Changelog

All notable changes to FuelLog are listed here. Each version is published as a
[GitHub Release](https://github.com/MrPettitt/fuellog-app/releases).

## 2.0.0 - 2026-11-16

### Fixed
- **Wrong date after midnight.** New entries and the default month were taken from UTC, so
  anything logged between 00:00 and 02:00 in South Africa got the previous day (or month).
  Dates now use the phone's local calendar.
- **Possible data loss on a storage error.** If saved data could not be read, the app used to
  load the demo data and the next save overwrote what was really stored. Unreadable data is now
  copied to a backup key and left alone, and nothing is written when storage is unavailable.
  A failed save shows a message instead of failing silently.
- **Stale writes.** Saves are based on the latest state, so two quick actions cannot persist
  an out-of-date list.
- A missing or invalid reimbursement rate no longer produces `NaN` in the report; one shared
  default (R 4.28/km) is used everywhere and Settings rejects a rate that is not a positive number.
- The trip form no longer shows a bogus distance when only one odometer reading is typed.
- The Dashboard rate caption is formatted as currency (`R 4.28/km`).
- The version shown in Settings is read from `app.json` instead of being hard-coded.

### Added
- **Edit entries.** Every entry in the Monthly Log has an Edit action that reopens it in the
  entry form; saving updates the entry in place.
- **CSV export.** The Summary screen can share the month as a `.csv` file (spreadsheet-safe:
  cells starting with `=`, `+`, `-` or `@` are neutralised so they are never run as formulas).
- **Start empty.** First launch no longer fills the log with a fictional employee. Demo data is
  loaded on request from Settings, with a confirmation.
- App icon, Android adaptive icon, splash screen and web favicon.
- Unit tests for local dates, CSV output and the storage layer (34 tests, up from 13), pinned to
  the Africa/Johannesburg time zone so they pass on any machine.

### Changed
- Storage moved to `src/storage.js`; saved data now carries a `version` field. v1 data is read
  as before, so existing installs keep their entries.
- App identifiers set to `com.mrpettitt.fuellog`; Android `versionCode` and iOS `buildNumber` are 2.
- `@expo/vector-icons`, `expo-constants`, `expo-file-system` and `expo-sharing` are declared
  dependencies.
- CI runs on Node 22 with current action versions; a Release workflow publishes a GitHub Release
  (with an Android APK) whenever the version in `package.json` changes on `main`.
- README: deprecated `expo build` commands replaced with EAS Build; screenshots refreshed and a
  Settings screenshot added.

## 1.0.0 - 2026-10-19
- Initial release: trip and fuel logging, dashboard, monthly log, shareable summary, settings.
