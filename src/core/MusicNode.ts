import { AudioPlayer, AudioResource, StreamType, createAudioPlayer, createAudioResource, getVoiceConnection } from "@discordjs/voice";
import prism from 'prism-media';
import internal from "stream";
import { ITrack, Provider } from "../provider/Provider";
import { ReadStream } from "fs";
import MusicManager from "./MusicManager";
import AudioSkipper from "./AudioSkipper";
import AudioAssetStream from "./AudioAssetStream";
import path from "node:path";

const BPS = 192000;

class MusicNode {
    private _player: AudioPlayer;
    private _resource: AudioResource<internal.PassThrough | prism.FFmpeg>;
    private _audio: AudioAssetStream;
    constructor(public readonly guildId: string, public readonly manager: MusicManager) {
        this._player = createAudioPlayer();
        manager['nodes'].set(guildId, this);
    }

    public get connection() {
        return getVoiceConnection(this.guildId);
    }

    public async playTrack(track: ITrack) {
        const provider = this.manager.providers.get(track.provider);
        if (! provider) throw new Error('no provider');

        const audioAsset = AudioAssetStream.createAssetStream(track);
        const audioResource = this._createAudioResource();

        if (this._audio && this._resource) {
            this._audio.unpipe(this._resource.metadata);
        }

        this._audio = audioAsset;
        this._resource = audioResource;
        audioAsset.pipe(this._resource.metadata);

        if (! audioAsset.isAudioCached) {
            const writers = Array.from(audioAsset.writers.keys());
            const writer = writers.find(x => path.basename(x.path.toString()) === track.encodedId);

            if (writer) {
                await new Promise((res) => writer.once('close', res));
                audioAsset.getAssetStream();
            } else {
                await audioAsset.downloadAssetStream(this.manager);
            }
        } else {
            audioAsset.getAssetStream();
        }

        if (this.manager.options?.cacheEnabled && provider.cacheIsAllowed && ! audioAsset.isAudioCached) {
            audioAsset.startAudioCache();
        }

        this._player.play(audioResource);
    }

    public async skipForward(seconds: number) {
        if (! (this._audio && this._resource)) return false;
        const skipper = new AudioSkipper(this._audio, seconds);
        this._audio.unpipe(this._resource.metadata);
        this._audio.pipe(skipper);

        await new Promise((res) => skipper.once('close', res));
    }

    public stop() {
        if (! (this._audio && this._resource)) return false;
        this._audio.unpipe(this._resource.metadata);
        this._player.stop();
        return true;
    }

    private _createAudioResource() {
        let stream: internal.PassThrough | prism.FFmpeg = new internal.PassThrough();
        // Do if ffmpeg
        
        const audio = createAudioResource(stream, {
            metadata: stream,
            inputType: StreamType.Arbitrary,
            inlineVolume: true
        });
        return audio;
    }

    //#region Static Region
    
    //#endregion
}

export = MusicNode;