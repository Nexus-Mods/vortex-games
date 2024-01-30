# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.12] - 2024-01-30

- Fixed info.json files being reported as conflicts

## [1.3.11] - 2023-12-20

- Fix for modfixer notification not able to be supressed

## [1.3.10] - 2023-11-01

- Load Order Export to File now uses System Save Dialog 

## [1.3.9] - 2023-11-01

- Fix for orphaned pak file unassociated with a mod during lsx import

## [1.3.8] - 2023-10-24

- Fix for undefined id if an orphaned pak file has been found in the Mods directory

## [1.3.7] - 2023-10-11

- Added activity notification when importing load order
- Fixed importing missing mods name comparison
- Removed some spamming console logs   

## [1.3.6] - 2023-10-11

- Load Order now uses pak filename to uniquely identify
- Fixes potential import issue where 'Name' was being compared 'Folder'

## [1.3.5] - 2023-10-11

- Catching of non-response from LSLib CLI

## [1.3.4] - 2023-10-10

- Fix handling of duplicates during importing but a warning is still shown just in case.
- Extra logging for tracking down of random locking bug.
- Removed cache when accessing a pak files meta.lsx file which allows fix for random locking by purging/deploying.

## [1.3.3] - 2023-10-05

- Backup of `modsettings.lsx` is created on initial managing of BG3
- Initial import of `modsettings.lsx` happens when a backup isn't found (should solve migration issues) 

## [1.3.2] - 2023-10-05

- Mods containing multiple PAK files can load order each individual pak
- Buttons for importing load order from file or direct from BG3
- Buttons for exporting load order to file or direct to BG3
- Toggle in Settings (Settings > Mods) to disable auto exporting load order to game (defaults to enabled)

## [1.3.1] - 2023-10-04

- Re-written load ordering so that Vortex has it's own data and doesn't rely on the game's `modsettings.lsx` file.
- Added 'Export to Game' button on Load Order page to write the game's `modsettings.lsx` file.

## [1.3.0] - 2023-09-28

- Fixed default `modsettings.lsx` having outdated Name and UUID
- Fixed Engine Injector installer so no longer needing manual setting when installing mods to the Game root folder.
- Updated extension game art
- Updated installer and modtype for mods that need deploying to the `%GAMEROOT\Data` folder.
- Added installer for [Mod Fixer](https://www.nexusmods.com/baldursgate3/mods/141) to fix notification showing when it's already installed
- Added installer and modtype for [BG3 Script Extender](https://github.com/Norbyte/bg3se)
- Updated testing documentation and [mod compatibility](https://forums.nexusmods.com/index.php?/topic/13287213-baldurs-gate-3-mod-compatibility-megathread/)

## [1.2.2] - 2023-08-17

- Support for full release 