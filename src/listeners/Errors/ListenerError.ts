import { LoaderPieceContext } from "@sapphire/pieces";
import { Events, Listener } from "liqueur";

export class ListenerError extends Listener {
    public constructor(context: LoaderPieceContext<"listeners">) {
        super(context, {
            event: Events.MessageCommandError
        });
    }

    public run(error: unknown): void {
        this.container.client.logger.error(error);
    }
}
