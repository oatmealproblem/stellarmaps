Stylized and customizable Stellaris maps

[Download the latest release here.](https://github.com/MichaelMakesGames/stellarmaps/releases)

<img src="./examples/default.png" alt="Example map ">

# Features

- Map modes (unions, population, relations, etc)
- Country borders
- Country names and emblems
- Sector borders
- System occupation
- Capital / sector capital / populated system icons
- Hyperlanes and hyper relays
- Gateways and wormholes
- Terra incognita
- Background galaxy graphics
- PNG and SVG export
- Modded emblem and name support
- Save and load multiple setting profiles

## Planned

- Time-lapses
- More map modes
- Fleets and more in system maps

## Known Issues

- Does not work with mod packs using Irony's "Compressed" merge
- Exported SVGs are tested with Inkscape and web browsers. Other viewers/editors may or may not work
- If viewing an SVG with Inkscape, the default Orbitron font will not work unless installed on your computer. [You can download it here.](https://fonts.google.com/specimen/Orbitron)

# Credits

A big thanks to an anonymous sponsor for supporting the development of system maps <3

Special thanks to the translators:

- HYA for Traditional Chinese
- karokaro for Japanese
- Tarkkaillaan for Finnish

The app icon is [Orbital](https://game-icons.net/1x1/lorc/orbital.html) by Lorc, licensed under [CC BY 3.0](http://creativecommons.org/licenses/by/3.0/).

Map icons are made by me. Basic shapes are released to the public domain, but others (Wormhole, Gateway, L-Gate, etc) are based on icons from the game Stellaris, and should not be used other than for tools or mods for the game.

The Discord icon is from https://discord.com/branding.

The GitHub icon is from https://github.com/logos.

Other interface icons from [Heroicons](https://heroicons.com), licensed under the [MIT license](https://github.com/tailwindlabs/heroicons/blob/master/LICENSE).

# Local Development

[Follow the tauri prerequisites guide](https://tauri.app/v1/guides/getting-started/prerequisites). Install a recent version of Node.js. Then, in the root directory, run `npm run dev`.

## Electron

For Linux, there is a version of the app which uses Electron instead of WebkitGTK for the frontend. To run that version, run `npm run dev:electron`. This will not work for other operating systems.
