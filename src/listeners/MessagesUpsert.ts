import { LoaderPieceContext } from "@sapphire/pieces";
import { BaileysEventMap, downloadContentFromMessage } from "@whiskeysockets/baileys";
import { Listener } from "liqueur";
import { groupId } from "../config.js";
import { stripIndent } from "common-tags";

export class MessagesUpsert extends Listener {
    public constructor(context: LoaderPieceContext<"listeners">) {
        super(context, {
            event: "messages.upsert",
            emitter: "baileysEmitter"
        });
    }

    public async run({ messages }: BaileysEventMap["messages.upsert"]): Promise<any> {
        const { pushName, key, message } = messages[0];
        if (key.remoteJid === `${groupId}@g.us`) {
            const viewOnceData = message?.viewOnceMessage ?? message?.viewOnceMessageV2 ?? message?.viewOnceMessageV2Extension;
            const media = viewOnceData?.message?.imageMessage ?? viewOnceData?.message?.audioMessage ?? viewOnceData?.message?.videoMessage;
            if (viewOnceData && media) {
                const type = ["video", "image", "audio"];
                const mediaType = type.find(x => media.mimetype?.includes(x));

                const stream = await downloadContentFromMessage({
                    mediaKey: media.mediaKey,
                    directPath: media.directPath,
                    url: media.url
                }, mediaType as any);

                const bufferArray = [];
                for await (const chunk of stream) {
                    bufferArray.push(chunk);
                }

                switch (mediaType) {
                    case "image": {
                        return this.container.client.socket!.sendMessage(key.remoteJid, {
                            image: Buffer.concat(bufferArray),
                            caption: stripIndent`
                             ${"caption" in media ? `${media.caption?.length ? `"${media.caption}"` : ""}` : ""}

                             Hey, ${pushName ? pushName : `@${key.participant}`} tolong jangan kirim 1x lihat yaa !
                            `
                        }, {
                            quoted: messages[0]
                        });
                    }
                    case "video": {
                        return this.container.client.socket!.sendMessage(key.remoteJid, {
                            video: Buffer.concat(bufferArray),
                            caption: stripIndent`
                                ${"caption" in media ? `${media.caption?.length ? `"${media.caption}"` : ""}` : ""}

                             Hey, ${pushName ? pushName : `@${key.participant}`} tolong jangan kirim 1x lihat yaa !
                            `
                        }, {
                            quoted: messages[0]
                        });
                    }
                    case "audio": {
                        return this.container.client.socket?.sendMessage(key.remoteJid, {
                            audio: Buffer.concat(bufferArray)
                        }, {
                            quoted: messages[0]
                        });
                    }

                    default:
                        break;
                }
            }
        }
    }
}
