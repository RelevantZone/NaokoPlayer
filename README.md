# naoko-player
> A standard and simple music library for discord.js
[![NaokoPlayer](https://img.shields.io/github/package-json/v/KairoKunazuki/naoko-player/main?label=naoko-player&color=5c16d4)](https://github.com/KairoKunazuki/naoko-player/)

## How to use
You can download this from github repo
```bash
npm i https://github.com/KairoKunazuki/NaokoPlayer.git
```
NPM
```bash
npm i naoko-player
```

Initializing in your client
```js
const NaokoPlayer = require('naoko-player');
const path = require("node:path");
const MusicManager = new NaokoPlayer.MusicManager({
    providers: [
        new NaokoPlayer.Providers.LocalProvider() // A provider searches in your computer files
    ], // Adding providers
    cacheEnabled: true // Allows music caching
});
```

## Search Music
For searching music, providers have implemented the function `Provider.loadTracks` to query tracks.
```js
const { LoadResultType } = require('naoko-player').enums;
const provider = MusicManager.providers.get(/* providerName */ 'local') // Find a provider with prefix of 'local', LocalProvider

provider.loadTracks(path.join(process.cwd(), 'NeverGonna.mp3'), /* Filter only tracks / songs */ LoadResultType.Tracks).then(console.log);
```

## Playing Music
Playing music in a server requires an instance of `MusicNode`. You can create one with `MusicManager`;
```js
// In Asynchronous
// Connecting to voice channel
MusicManager.joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adaptorCreator: voiceChannel.guild.voiceAdaptorCreator
});
// Creating the music node for server
const MusicNode = MusicManager.createNode(message.guild.id);
// Loading track
const track = await provider.loadTracks(path.join(process.cwd(), 'NeverGonna.mp3'));
MusicNode.playTrack(track); // Playing track
```

## Providers
### Provider.provider
`string` - The name / prefix of Provider constructor.
### Provider.cacheIsAllowed
`string` - The allowance for caching to tracks loaded from current Provider.
### Provider.loadTracks
Usage: `Provider.loadTracks(query: string, loadType: LoadResultType): Promise<SearchResultType>` <br>
Loads and search for tracks.

Params:
- `query` - A query string for searching tracks
- `loadType` - Load result type for filtering return types.

### Provider.getTrackStream
Usage: `Provider.getTrackStream(track: ITrack): Promise<stream.Readable>` <br>
Returns a `node:stream.Readable` of audio from track

Params:
- `track` - The track information from a provider instance