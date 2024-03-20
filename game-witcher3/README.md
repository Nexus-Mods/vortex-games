# Vortex Extension for The Witcher 3

This is an extension for Vortex to add support for The Witcher 3.

The [Steam](https://store.steampowered.com/sub/124923/), [Epic](https://store.epicgames.com/en-US/p/the-witcher-3-wild-hunt) and [GOG](https://www.gog.com/en/game/the_witcher_3_wild_hunt_game_of_the_year_edition) versions of The Witcher 3 are all supported.

## Features

- Check (and ask to fix) bare minimum setup of StarfieldCustom.ini
- Can support both /Data folders through the use of a folder junction. Defaults to off but is asked to enable with necessary warnings. Please read this page on modding.wiki for more information.
- Supports SFSE, BethINI and SFEdit

## Installation

This extension requires Vortex 1.9.10 or greater.

To install, click the Vortex button at the top of the Starfield Extension page on Nexus Mods, and then click Install.

You can also manually install it by click the Manual button at the top of the page and dragging it into the drop target labelled Drop File(s) in the Extensions page at the bottom right.

Afterwards, restart Vortex and you can begin installing supported Starfield mods with Vortex.

If you've already got a previous version, the extension should auto update on a Vortex restart.

## Game detection

The Witcher 3 game extension enables Vortex to automatically locate installs from the Steam and Xbox apps.

It is also possible to manually set the game folder if the auto detection doesn't find the correct installation. A valid Starfield game folder contains:

Starfield.exe

If your game lacks this file then it is likely that your installation has become corrupted somehow.

## Mod Management

By default, Vortex will deploy files to the game's root folder and extracts the archive while preserving the folder structure.

## Migration

Something about previous versions to now

## Dependencies

As The Witcher 3 doesn't have 

## Troubleshooting

See below for known problems and fixes to common modding problems

### Known Issues

* This extension has been tested with all of the most popular mods, installers, script extenders, mod fixers etc. Please see this [Mod Compatibility List](https://forums.nexusmods.com/index.php?/topic/13287213-baldurs-gate-3-mod-compatibility-megathread/) forum post for details. 

* When installing mods in previous versions of the extension, some workarounds were necessary that are no longer needed. Fox example, Mod types being manually set as an Engine Injector was common. This shouldn't break a working setup but when mods are updated or reinstalled they will be installed correctly. If mods do seem to be in a wrong folder, then reinstalling that mod should fix this. This is easily done by finding the mod

* Rarely, during mod updating or purging, Vortex spams errors saying about failure to read PAK files. This is nothing to worry about, they can be dismissed and will be fixed in next version.

### Load Orders

Most load order issues can be fixed with a Purge and then Deploy. This removes PAK files from the Mods folder and then Deploy re-writes them with a fresh load order. Please note: the load order will be reset and so will require a reordering.

### Further Support

* [Mod Compatibility List (Nexus Forums) ](https://forums.nexusmods.com/index.php?/topic/13287213-baldurs-gate-3-mod-compatibility-megathread/)
* [Vortex Support (Nexus Forums) ](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/)
* [Vortex Support (Discord)](https://discord.com/channels/215154001799413770/408252140533055499)

# Thanks!

