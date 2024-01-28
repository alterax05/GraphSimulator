import { WebSocketServer } from "ws";
import UrlParser from "url";
import SocketUtils, { Command } from "../utils/socketUtils";
import { Client } from "../types/socket";
import WebSocketController from "../controllers/websocket";

export const clients: Map<string, Client> = new Map();

const wsServer = new WebSocketServer({ noServer: true });
const controller = new WebSocketController();

wsServer.on("connection", (ws, request) => {
  if (!request.url) {
    ws.close();
    return;
  }

  // parse url to get query params
  const { query } = UrlParser.parse(request.url, true);
  const id = query.id;

  // prevent access for clients without id
  if (!id || typeof id !== "string") {
    ws.send(JSON.stringify({ message: "id is required" }));
    return ws.close();
  }
  // prevent access for clients with already existing id
  if (clients.has(id)) {
    ws.send(JSON.stringify({ message: "id already exists" }));
    return ws.close();
  }

  // register client
  clients.set(id, { id, ws, subscriptions: [], neighbours: [] });
  console.log("new connection with id: ", id);

  // publish realtime users list to clients subscribed to the topic
  controller.publishRealtimeUsersList();

  ws.on("message", message => {
    const messageClient = SocketUtils.parseMessage(message);
    const client = clients.get(id);
    if (!client) return;

    if (!messageClient) {
      ws.send(JSON.stringify({ message: "Invalid message sintax" }));
      return;
    }

    // retrieve list of all users
    if (messageClient.command === Command.ListUsers) {
      return controller.listUsers(client);
    }

    if (messageClient.command === Command.RealtimeListUsers) {
      return controller.subscribeToRealtimeUsersList(client, messageClient);
    }

    // send message to specified clients
    if (messageClient.to) {
      return controller.forwardMessage(messageClient);
    }

    return ws.send(JSON.stringify({ message: "Invalid message" }));
  });

  ws.on("close", () => {
    clients.delete(id);

    // publish realtime users list to clients subscribed to the topic
    controller.publishRealtimeUsersList();
  });
});

wsServer.on("error", (error: Error) => {
  console.log(error);
});

export default wsServer;
