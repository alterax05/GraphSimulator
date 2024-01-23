import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer } from "ws";

//https://stackoverflow.com/questions/12192321/is-it-possible-to-send-a-data-when-a-websocket-connection-is-opened
//non c'è il body del messaggio

const wss = new WebSocketServer({ port: Number(process.env.PORT) || 3000});

let clientMap: Map<string, WebSocket> = new Map();

interface MessageClient {
    id: string;
    to: string[];
    message: string;
}

wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    const url = request.url;
    if(!url) {
        ws.close();
        return;
    }

    const id = url.split('?')[1].split('=')[1];
    clientMap.set(id, ws);

    ws.on('message', (message: string) => {
        const messageClient: MessageClient = JSON.parse(message);
        messageClient.to.forEach(to => {
            const client = clientMap.get(to);
            if(client) {
                client.send(JSON.stringify(messageClient));
            }
        });
    });

    ws.on('close', () => {
        clientMap.delete(id);
    });
});

wss.on('error', (error: Error) => {
    console.log(error);
});
