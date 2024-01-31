import { WebSocketServer } from "ws";
import UrlParser from "url";
import SocketUtils, { Command } from "../utils/socketUtils";
import { Client } from "../types/socket";
import WebSocketController from "../controllers/websocket";

export const clients: Map<string, Client> = new Map();
const ipCounts: Map<string, number> = new Map();
const MAX_CONNECTIONS_PER_IP = process.env.NODE_ENV === "production" ? 5 : 1000;

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
  const ip = request.socket.remoteAddress;

  //Limit connections per IP
  if (
    ip &&
    ipCounts.has(ip) &&
    (ipCounts.get(ip) || 0) >= MAX_CONNECTIONS_PER_IP
  ) {
    // If it has, refuse the connection
    ws.send(JSON.stringify({ message: "Maximum connections reached" }));
    return ws.close();
  }

  ipCounts.set(ip!, (ipCounts.get(ip!) || 0) + 1);

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
  // regex to validate id
  // id must start with A, B or C and be followed by a number between 0 and 25
  const idPattern =
    /^[ABC]([0-9]|1[0-9]|2[0-5])$|inspector[0-9][0-9][0-9][0-9]$/;
  if (!idPattern.test(id)) {
    ws.send(JSON.stringify({ message: "invalid id" }));
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

    if (messageData.to) {
      //Dont show message if there is no one to send it to
      if(!messageData.to.every((clientID) => {return clients.has(clientID)})) {
        ws.send(JSON.stringify({ message: `Invalid client(s) in the recipient list. Use the "list-users" to list the connected users` }));
        return;
      }
      controller.publishRealtimeActions(client, messageData);
    }else{
      controller.publishRealtimeActions(client, messageData);
    }
    
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
