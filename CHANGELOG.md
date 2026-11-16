# Changelog

## 2.0.0 - 2026-11-16

### Fixed
- **Wrong date after midnight.** New entries and the default month were taken from UTC, so
  anything logged between 00:00 and 02:00 in South Africa got the previous day (or month).
  Dates now use the phone's local calendar.
- **Possible data loss on a storage error.** If saved data could not be read, the app used to
  load the demo data and the next save overwrote what was really stored. Now unreadable data is
  copied to a backup key and left alone, and nothing is written when storage itself is unavailable.
- Missing rate no longer produces `NaN` in the report; one shared default rate (R 4.28/km) is used
  everywhere, and Settings rejects a rate that is not a sensible number.

### Added
- **Edit entries.** An Edit action on every entry in the Monthly Log reopens it in the same form.
- **CSV export.** Share any month as a CSV (cells that start with `=`, `+`, `-` or `@` are
  neutralised so a spreadsheet will not run them as formulas).
- **Start empty.** First launch no longer fills the log with a fictional employee. Demo data is
  loaded on request from Settings, with a confirmation.
- Unit tests for local dates, CSV output and the storage layer (31 tests, up from 13).

### Changed
- Storage code moved into `src/storage.js`; saved data now carries a `version` field. v1 data is
  read as before, so existing installs keep their entries.
- Writes are based on the latest state, so two quick actions cannot save stale data.
- `@expo/vector-icons` is now a declared dependency.
- Placeholder app identifiers (`com.yourcompany.fuellog`) replaced with `com.mrpettitt.fuellog`;
  Android `versionCode` / iOS `buildNumber` set to 2.
- README: removed the deprecated `expo build` commands in favour of EAS Build.

## 1.0.0
- Initial release: trip and fuel logging, dashboard, monthly log, shareable summary, settings.
