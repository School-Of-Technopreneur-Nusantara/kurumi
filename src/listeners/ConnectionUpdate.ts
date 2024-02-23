import type { Boom } from "@hapi/boom";
import type { LoaderPieceContext } from "@sapphire/pieces";
import { DisconnectReason } from "@whiskeysockets/baileys";
import type { BaileysEventMap } from "@whiskeysockets/baileys";
import { Listener } from "liqueur";

export class ConnectionUpdate extends Listener {
    public constructor(context: LoaderPieceContext<"listeners">) {
        super(context, {
            event: "connection.update",
            emitter: "baileysEmitter"
        });
    }

    public async run({ lastDisconnect, connection }: BaileysEventMap["connection.update"]): Promise<any> {
        const shouldReconnect = (lastDisconnect as Boom | undefined)?.output.statusCode !== DisconnectReason.loggedOut;
        if (connection === "close") {
            this.container.client.logger.warn(
                `Connection closed due to ${lastDisconnect?.error?.message ?? "unknown reason"
                }, reconnecting ${shouldReconnect}`
            );
            if (shouldReconnect) {
                await this.container.client.login();
            }
        } else if (connection === "open") {
            this.container.client.logger.info("Opened connection.");
        }
    }
}
