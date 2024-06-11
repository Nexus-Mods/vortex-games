# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.3] - 2024-06-11

- Fixed the installer for mixed mods not executing (been broken for a while)
- Fixed mod installation for mods that provide both dlc and mods folders and do not contain menu mod information.

## [1.6.2] - 2024-05-29

- Fixed crash when attempting to create load order file, and user has insufficient permissions

## [1.6.1] - 2024-05-22

- Fixed crash when attempting to raise the "Missing Script Merger" notification

## [1.6.0] - 2024-05-21

- Added Epic Game Store discovery
- Added context menu item in Mods page to allow users to import LO and script merge data when right clicking the mod entry.
- Added custom item renderer to view source mods of load order entries
- Fixed longstanding issue causing the menu mod to fail deployment when imported from a collection
- Version information now displaying correctly
- Removed mod limit patcher (no longer needed)
- Migrated load ordering system to use new FBLO API
- Bug fixes and code cleanup

## [1.5.3] - 2022-12-14

- Initial version