# Requirements

Before we get started, this guide assumes that you have installed Baldur's Gate 3 and Vortex at their default locations. You will also need to be logged in to your Nexus Mods account in Vortex.

Please see: [Getting Started with Vortex](/en/vortex/users/getting-started)

# Getting Set Up

Open up Vortex and navigate to the Games page. Use the 'Manage' button on the game tile to add it to your managed games. If you can’t see Baldur's Gate 3, you can scan for it or define it manually.

### Migration

If migrating from an existing version (older than 0.3), there are some extra things to be aware of.

* A backup is made of the game's load order file, `modsettings.lsx`, as a fallback in case anything goes wrong. This is located in the same folder as the original at `%APPDATA%\Local\Larian Studios\Baldur's Gate 3\PlayerProfiles\Public\modsettings.lsx.backup`

* The original `modsettings.lsx` is then imported so Vortex can attempt to match the Game's load order for future changes to stay in sync. This isn't perfect but may help not to have to completely rearrange 100s of mods.

* Vortex defaults to keeping the game's `modsettings.lsx` file in sync with it's own load order as this is what the majority of users will expect. If you don't want this to be the case, see the Settings section below to turn it off and use the backup made above to put your original game load order back. Please note: when this setting is off, the game's load order is never set.

# Dependencies

### LSLib

In the majority of cases, mods for Baldur's Gate 3 will require a 3rd party tool called [LSLib](https://github.com/Norbyte/lslib) to manipulate game files. When you first manage the game, Vortex should popup and give you the option to download and install this tool automatically. If that has already been dismissed, it can be accessed again via the 'Re-install LSLib/Divine' button on the toolbar in the Mods page of Vortex.

Please ensure that the tool is always enabled and deployed on the mods page. Some Anti-Virus software may flag this tool as malicious due to the nature of what it does. We suggest you ensure that your security software is configured to allow this tool to install.

# Settings

Found in Settings > Mods when Baldur's Gate 3 is selected

| Name    | Description | Default |
| -------- | ------- | ------- |
| Auto export load order  | If on, Vortex will update the Game's load order automatically. If off, the Game's load order will need manually Exporting using the buttons on the toolbar | On |

# Troubleshooting

See below for known problems and fixes to common modding problems

### Known Issues

* This extension has been tested with all of the most popular mods, installers, script extenders, mod fixers etc. Please see this [Mod Compatibility List](https://forums.nexusmods.com/index.php?/topic/13287213-baldurs-gate-3-mod-compatibility-megathread/) forum post for details. 

* When installing mods in previous versions of the extension, some workarounds were necessary that are no longer needed. Fox example, Mod types being manually set as an Engine Injector was common. This shouldn't break a working setup but when mods are updated or reinstalled they will be installed correctly. If mods do seem to be in a wrong folder, then reinstalling that mod should fix this. This is easily done by finding the mod

* Rarely, during mod updating or purging, Vortex spams errors saying about failure to read PAK files. This is nothing to worry about, they can be dismissed and will be fixed in next version.

### Load Orders

Most load order issues can be fixed with a Purge and then Deploy. This removes PAK files from the Mods folder and then Deploy re-writes them with a fresh load order. Please note: the load order will be reset and so will require a reordering.

### Launching using Vulkan (and not the default DX11)

Vortex does have the ability to launch the Vulkan version of the game instead of the default DX11 but it does require setting Vulkan as primary launch method.

On the Dashboard, find the "Tools" dashlet and there should be a Vulkan option there. Click the little menu button and select "Set as primary".

### Full release issues

Baldur's Gate 3 had a huge mod-breaking update on August 3rd 2023 when the game left early access. Some of the files that Vortex (and other mod managers) were relying on changed and have possibly become corrupted while we were updating our Vortex support for it. Most mods will also need to be updated to support the latest version of the game. Vortex uses these files and automatically edits them when managing mods.

The below instructions should reset the game files and allow you to continue your modding adventure. Larian Studios, the developers of Baldur's Gate 3, [also recommend](https://larian.com/support/faqs/mod-information_77) doing the below if having any problems starting the game.

* Make sure the Baldur's Gate 3 extensions in Vortex is the latest version. 
*You can check by going Vortex > Extensions > Click 'Show bundled' > Game: Baldur's Gate 3 > Version should be greater than 1.2.2.* 
* Close Vortex
* Delete all files in `%AppData%\Local\Larian Studios\Baldur's Gate 3\Mods`
* Delete `modsettings.lsx` in `%AppData%\Local\Larian Studios\Baldur's Gate3\PlayerProfiles\Public`
* Run Baldur's Gate 3 at least once (for the deleted files to be recreated).
* Load Vortex and Re-deploy your mods.

# Further Support

* [Mod Compatibility List (Nexus Forums) ](https://forums.nexusmods.com/index.php?/topic/13287213-baldurs-gate-3-mod-compatibility-megathread/)
* [Vortex Support (Nexus Forums) ](https://forums.nexusmods.com/index.php?/forum/4306-vortex-support/)
* [Vortex Support (Discord)](https://discord.com/channels/215154001799413770/408252140533055499)