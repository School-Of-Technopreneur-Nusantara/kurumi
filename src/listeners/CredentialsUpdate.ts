import { LoaderPieceContext } from "@sapphire/pieces";
import { Listener } from "liqueur";

export class CredentialsUpdate extends Listener {
    public constructor(context: LoaderPieceContext<"listeners">) {
        super(context, {
            event: "creds.update",
            emitter: "baileysEmitter"
        });
    }

    public async run(): Promise<any> {
        await this.container.authState.saveCreds();
        this.container.client.logger.info("Credentials has been updated.");
    }
}
