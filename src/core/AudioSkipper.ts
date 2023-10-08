import { AudioResource } from "@discordjs/voice";
import internal from "node:stream";

const BPS = 192000;
// const SILENCE_FRAME = Buffer.from([0xf8, 0xff, 0xfe]);

class AudioSkipper extends internal.Writable {
    public _bytes = 0;
    public constructor(public source: internal.Readable, skipSeconds = 1) {
        super()
        this._bytes = skipSeconds * BPS;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: internal.TransformCallback): void {
        if (this._bytes > 0) {
            callback(null);
            return;
        }

        this.source.unpipe(this);
        this.end();
        this.source = null
    }
}

export = AudioSkipper;