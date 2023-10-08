import { joinVoiceChannel } from "@discordjs/voice";
import { Provider } from "../provider/Provider";
import MusicNode from "./MusicNode";

interface ManagerOptions {
    providers: Provider[];
    cacheEnabled?: boolean;
}

class MusicManager {
    private nodes = new Map<string, MusicNode>();
    public providers = new Map<string, Provider>();
    public constructor(public options: ManagerOptions) {
        for (const perv of options.providers) {
            this.providers.set(perv.provider, perv);
        }
    }

    createNode(guildId: string, force?: boolean) {
        if (! force && this.nodes.has(guildId)) return this.nodes.get(guildId);
        
        const node = new MusicNode(guildId, this);
        if (! this.nodes.has(guildId)) this.nodes.set(guildId, node);
        
        return node;
    }

    getNode(guildId: string, forceCreate?: boolean) {
        if (forceCreate && !this.nodes.has(guildId)) return this.createNode(guildId);
        return this.nodes.get(guildId);
    }

    /**
     * Creates a VoiceConnection to a Discord voice channel.
     *
     * @param options the options for joining the voice channel
     */
    public get joinVoiceChannel() {
        return joinVoiceChannel;
    }
}

export = MusicManager;