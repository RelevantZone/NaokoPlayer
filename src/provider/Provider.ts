import { Static, Type } from "@sinclair/typebox";
import path from "node:path";
import { Readable } from "node:stream";
import fs = require("node:fs");
import { LoadResultType } from "../utils/consts";

const TypeboxTrack = Type.Object({
    name: Type.String(),
    provider: Type.String(),
    encodedId: Type.String(),
    description: Type.String(),
    authorName: Type.String(),
    authorURL: Type.String(),
    sourceURL: Type.String()
});

const TypeboxPlaylist = Type.Object({
    name: Type.String(),
    provider: Type.String(),
    description: Type.String(),
    authorName: Type.String(),
    authorURL: Type.String(),
    sourceURL: Type.String(),
    tracks: Type.Array(TypeboxTrack)
})

type ITrack = Static<typeof TypeboxTrack>;
type IPlaylist = Static<typeof TypeboxPlaylist>;
type SearchResultType<Track extends ITrack = ITrack, Playlist extends IPlaylist = IPlaylist> = (Track | Playlist)[]

abstract class Provider {
    static cache = new Map<string, ITrack>();
    static cache_path = path.join(process.cwd(), 'sounds', 'cache');
    public readonly provider: string;
    public constructor(provider: string) {
        this.provider = provider;
        // Provider.registered.set(this.provider, this);
    };
    abstract get cacheIsAllowed(): boolean;

    abstract loadTracks(query: string, loadType: LoadResultType.Track): Promise<ITrack[]>;
    abstract loadTracks(query: string, loadType: LoadResultType.Playlist): Promise<IPlaylist[]>;
    abstract loadTracks(query: string, loadType: LoadResultType): Promise<SearchResultType>;

    abstract getTrackStream(track: ITrack): Promise<Readable>;

    static assignAssetId(provider: string, track: ITrack) {
        const id = Buffer.from(`Asset:${provider}=${track.sourceURL}`).toString('base64url');

        track.encodedId = id;
        Provider.cache.set(id, track);
        return id;
    }

    static checkIfCached(id: string) {
        return fs.existsSync(path.join(this.cache_path, id));
    }

    static getCacheStream(id: string) {
        if (! fs.existsSync(this.cache_path)) fs.mkdirSync(this.cache_path, { recursive: true });
        return fs.createReadStream(path.join(this.cache_path, id));
    }

    static createCacheStream(id: string) {
        if (! fs.existsSync(this.cache_path)) fs.mkdirSync(this.cache_path, { recursive: true });
        return fs.createWriteStream(path.join(this.cache_path, id));
    }
}

export {
    Provider,
    ITrack,
    IPlaylist,
    SearchResultType
}