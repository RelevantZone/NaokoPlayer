import path from "node:path";
import { ITrack } from "../provider/Provider";
import internal from "node:stream";
import fs from 'fs';
import MusicManager from "./MusicManager";
import AudioSkipper from "./AudioSkipper";
import os from 'node:os';

const BPS = 192000;
const DEFAULT_CHUNK_LENGTH = 3800;

class AudioAssetStream extends internal.PassThrough {
    static cache_directory = path.join(process.cwd(), 'sounds', 'cache');
    // static cache_directory = path.join(os.tmpdir(), 'naoko_music_sounds');

    static createAssetId(track: ITrack) {
        return Buffer.from(`Asset:${track.provider}_${track.sourceURL}`).toString('base64url');
    }

    static createAssetStream(track: ITrack) {
        const encodedId = track.encodedId || this.createAssetId(track);
        const stream = new AudioAssetStream(encodedId, track);

        return stream;
    }

    public bytesSent = 0;
    public cachedSeconds = 0;
    public audioStream: fs.ReadStream | internal.Readable;
    public writers: Set<fs.WriteStream> = new Set();
    private _cachedaudio = false;
    public constructor(public readonly id: string, public readonly metadata: ITrack) {
        super();
        if (fs.existsSync(path.join(AudioAssetStream.cache_directory, id))) {
            this._cachedaudio = true;
        }
    }

    public startAudioCache() {
        if (! this._cachedaudio) {
            const fullWriter = fs.createWriteStream(path.join(AudioAssetStream.cache_directory, this.id));
            this.writers.add(fullWriter);
            this.pipe(fullWriter);
            fullWriter.once('close', () => {
                this.writers.delete(fullWriter);
                this._cachedaudio = true;
                this.unpipe(fullWriter);
            });
        }
        return true;
    }

    public get isAudioCached() {
        return this._cachedaudio;
    }

    public getAssetStream() {
        if (! this._cachedaudio)
            throw new Error('requested to use cache, but file doesnt exists!');

        const stream = fs.createReadStream(path.join(AudioAssetStream.cache_directory, this.id));
        this.audioStream = stream;
        this.audioStream.pipe(this);
        return stream;
    }

    public async downloadAssetStream(manager: MusicManager) {
        const provider = manager.providers.get(this.metadata.provider);
        if (! provider) throw new Error('no provider for track!');
        
        const stream = await provider.getTrackStream(this.metadata);
        this.audioStream = stream;
        this.audioStream.pipe(this);
        return stream;
    }

    _transform(chunk: Buffer, encoding: BufferEncoding, callback: internal.TransformCallback): void {
        this.bytesSent += chunk.length;
        this.cachedSeconds += chunk.length / BPS;

        callback(null, chunk);
    }
}

export = AudioAssetStream;