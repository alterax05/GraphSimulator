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
  const newClient = { id, ws, subscriptions: [], neighbours: [] };
  clients.set(id, newClient);
  console.log("new connection with id: ", id);

  // publish realtime users list to clients subscribed to the topic
  controller.publishRealtimeUsersList();
  controller.publishRealtimeActions(newClient, { message: "New Connection" });

  ws.on("message", (message) => {
    const messageData = SocketUtils.parseMessage(message);
    const client = clients.get(id);
    if (!client) return;

    if (!messageData) {
      ws.send(JSON.stringify({ message: "Invalid message sintax" }));
      return;
    }

    controller.publishRealtimeActions(client, messageData);

    // retrieve list of all users
    if (messageData.command === Command.ListUsers) {
      return controller.listUsers(client);
    }

    if (messageData.command === Command.RealtimeListUsers) {
      return controller.subscribeToRealtimeUsersList(client, messageData);
    }

    if (messageData.command === Command.RealtimeListActions) {
      return controller.subscribeToRealtimeActions(client);
    }

    if (messageData.command === Command.SetNeighbours) {
      return controller.setNeighbours(client, messageData);
    }

    // send message to specified clients
    if (messageData.to) {
      return controller.forwardMessage(messageData);
    }

    return ws.send(JSON.stringify({ message: "Invalid message" }));
  });

  ws.on("close", () => {
    if (!clients.get(id)) return;

    // publish realtime users list to clients subscribed to the topic
    controller.publishRealtimeActions(clients.get(id)!, {
      message: "Disconnected",
    });

    clients.delete(id);
    controller.publishRealtimeUsersList();
  });
});

wsServer.on("error", (error: Error) => {
  console.log(error);
});

export default wsServer;
