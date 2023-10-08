import path = require("node:path");
import { Provider, ITrack, IPlaylist, SearchResultType } from "../Provider";
import fs = require("node:fs");
import { LoadResultType } from "../../utils/consts";

class LocalProvider extends Provider {
    public constructor() {
        super("local");
    }

    public get cacheIsAllowed() {
        return false;
    }

    /** Loads and returns a specified audio file */
    public async loadTracks(query: string, loadType: LoadResultType) {
        if (! fs.existsSync(query)) 
            throw new ProviderError('Local', `specified path does not exists! \n\tQuery: '${query}'`);

        const stat = await fs.promises.stat(query);

        if (stat.isFile() && loadType !== LoadResultType.Playlist) {
            return [ await this.loadFile(query) ];
        }

        switch (loadType) {
            case LoadResultType.Search: {
                const readdir = await fs.promises.readdir(query);
                return await Promise.all(readdir.map(async x => await this.loadFile(path.join(query, x)) || await this.loadPlaylist(x)));
            }
            case LoadResultType.Track: {
                const readdir = await fs.promises.readdir(query);
                return (await Promise.all(readdir.map(async x => await (this.loadFile(path.join(query, x)).catch(() => null)))))
                    .filter(x => x);
            }
            case LoadResultType.Playlist: {
                const readdir = await fs.promises.readdir(query);
                return (await Promise.all(readdir.map(async x => await (this.loadPlaylist(path.join(query, x)).catch(() => null)))))
                    .filter(x => x);
            }
        }
        return [];
    }

    /** Loads a directory and returns tracks with audio codecs */
    public async loadPlaylist(query: string): Promise<IPlaylist> {
        if (! fs.existsSync(query)) 
            throw new ProviderError('Local', `specified path does not exists! \n\tQuery: '${query}'`);

        const stat = await fs.promises.stat(query);

        if (stat.isDirectory()) {
            const list = await fs.promises.readdir(query);

            const tracks: ITrack[] = await Promise.all(list.map(async (x) => await this.loadFile(path.join(query, x))))

            const playlist: IPlaylist = {
                name: path.basename(query),
                provider: this.provider,
                description: '',
                authorName: 'filesystem',
                authorURL: path.join(query, '..'),
                sourceURL: query,
                tracks: tracks.filter(x => x)
            }
            return playlist;
        }
        throw new ProviderError('Local', 'path was not a directory!\n\tQuery:' + query);
    }

    public async loadFile(queryPath: string) {
        const stat = await fs.promises.stat(queryPath);
        if (! stat.isFile()) return;
        if (! this.checkIsValid(path.extname(queryPath))) return;

        return this.buildTrack(queryPath);
    }

    public async getTrackStream(track: ITrack) {
        const file = fs.createReadStream(track.sourceURL);
        return file;
    }

    public checkIsValid(extname: string) {
        switch (extname) {
            case '.mp3': return true;
            case '.opus': return true;
            case '.vorbis': return true;
            case '.ogg': return true;
            case '.aac': return true;
            case '.m4a': return true;
        }
        return false;
    }

    public buildTrack(source: string): ITrack {
        const track: ITrack = {
            name: path.basename(source),
            description: '',
            authorName: 'filesystem',
            authorURL: path.join(source, '..'),
            provider: this.provider,
            encodedId: '',
            sourceURL: source
        };
        
        Provider.assignAssetId(this.provider, track);
        return track;
    }
}

export = LocalProvider;