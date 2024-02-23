import { container } from "@sapphire/pieces";
import { useMultiFileAuthState, makeWASocket, makeCacheableSignalKeyStore, AuthenticationState, Browsers } from "@whiskeysockets/baileys";
import { FrameworkClient, createLogger } from "liqueur";
import { google } from "googleapis";
import { Result } from "@sapphire/result";
import { setTimeout as delay } from "node:timers/promises";
import { groupId, sheetId } from "./config.js";

const logger = createLogger({
    name: "kurumi",
    debug: false
});

const client = new FrameworkClient({
    baseUserDirectory: "dist",
    fetchPrefix: () => Promise.resolve("/"),
    makeWASocket: async () => {
        container.authState = await useMultiFileAuthState("auth/baileys");
        return makeWASocket({
            auth: {
                creds: container.authState.state.creds,
                keys: makeCacheableSignalKeyStore(container.authState.state.keys, logger as unknown as any)
            },
            logger: logger as unknown as any,
            printQRInTerminal: true
        }) as unknown as Promise<ReturnType<typeof makeWASocket>>
    },
    logger
});

const auth = await new google.auth.GoogleAuth({
    keyFile: './auth/sheets.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
}).getClient();

const sheets = google.sheets({
    version: "v4",
    auth: auth as any
});

await client.login();

interface Responden {
    phone: string;
    timestamp: string;
    nama: string;
    email: string;
    semester: string;
    nim: string;
}

setTimeout(async () => {
    await Result.fromAsync(async () => {
        const values = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: "Form Responses 1"
        });
    
        const respondens: Responden[] = [];
    
        for (let i = 1; i < values.data.values!.length; i++) {
            const timestamp = values.data.values![i][0];
            const email = values.data.values![i][1];
            const nama = values.data.values![i][2];
            const semester = values.data.values![i][3];
            const nim = values.data.values![i][4];
            const phone = values.data.values![i][5];
          
            respondens.push({
                timestamp,
                email,
                nama,
                semester,
                nim,
                phone: phone.startsWith("0") ? phone : `0${phone}`
            })
          }
    
          const { participants } = await client.socket!.groupFetchAllParticipating().then(x => x[`${groupId}@g.us`]);
          for (const responden of respondens) {
            if (!participants.some(x => x.id.includes(responden.phone.slice(1, responden.phone.length)))) {
                try {
                    await client.socket!.groupParticipantsUpdate(`${groupId}@g.us`, [`62${responden.phone.slice(1, responden.phone.length)}@s.whatsapp.net`], "add");
                    await client.socket!.sendMessage(`${groupId}@g.us`, {
                        text: `Selamat datang @62${responden.phone.slice(1, responden.phone.length)}, dalam pelatihan Web dan IOT !`,
                        mentions: [`62${responden.phone.slice(1, responden.phone.length)}@s.whatsapp.net`]
                    })
                    await delay(5_000);
                } catch {
                    continue;
                }
            }
          }
    })
}, 10_000)

declare module "@sapphire/pieces" {
    interface Container {
        authState: Awaited<{
            state: AuthenticationState;
            saveCreds: () => Promise<void>;
        }>        
    }
}
