import { WebSocketServer } from "ws";
import UrlParser from "url";
import SocketUtils, { Command } from "../utils/socketUtils";
import { Client } from "../types/socket";
import WebSocketService from "../service/websocket";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import ClientFilterUtils from "../utils/clientFilterUtils";

export const clients: Map<string, Client> = new Map();
const wsServer = new WebSocketServer({ noServer: true });
const wsService = new WebSocketService();

// limit each IP to X connections per hour
const rateLimitingOptions = {
  points: 100,
  duration: 1 * 60 * 60,
};
const rateLimiter = new RateLimiterMemory(rateLimitingOptions);

wsServer.on("connection", async (ws, request) => {
  if (!request.url) {
    ws.close();
    return;
  }

  // parse url to get query params
  const { query } = UrlParser.parse(request.url, true);
  const id = query.id;
  const ip = request.socket.remoteAddress;
  if (!ip) {
    ws.send(JSON.stringify({ message: "IP not recognized" }));
    return ws.close();
  }

  // limit connections per IP
  let rateLimitStatus: RateLimiterRes;
  try {
    rateLimitStatus = await rateLimiter.consume(ip);
  } catch (err) {
    ws.send(
      JSON.stringify({ message: "Maximum connections reached", rateInfo: err })
    );
    return ws.close();
  }

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
  // filter invalid ids
  if (!ClientFilterUtils.isValidId(id)) {
    ws.send(JSON.stringify({ message: "invalid id" }));
    return ws.close();
  }

  // register client
  const newClient = { id, ws, subscriptions: [], neighbours: [] };
  clients.set(id, newClient);
  console.log("new connection with id: ", id);

  // publish realtime users list to clients subscribed to the topic
  wsService.publishRealtimeUsersList();
  wsService.publishRealtimeAction(newClient, { message: "New Connection" });

  // handle different type of messages
  ws.on("message", message => {
    const messageData = SocketUtils.parseMessage(message);
    const client = clients.get(id);
    if (!client) return;

    if (!messageData) {
      ws.send(JSON.stringify({ message: "Invalid message sintax" }));
      return;
    }

    if (messageData.message && messageData.message.length > 100) {
      ws.send(
        JSON.stringify({ message: "Message too big. Max 100 characters" })
      );
      return;
    }

    if (messageData.to) {
      // don't forward the message if the recipient list contains invalid ids
      if (!messageData.to.every(id => clients.has(id))) {
        return ws.send(
          JSON.stringify({
            message: `Invalid client(s) in the recipient list. Use the 'list-users' to list the connected users`,
          })
        );
      }

      wsService.publishRealtimeAction(client, messageData);
      // send message to specified clients
      return wsService.forwardMessage(messageData);
    } else {
      wsService.publishRealtimeAction(client, messageData);
    }

    if (messageData.command === Command.ListUsers) {
      return wsService.listUsers(client);
    }

    if (messageData.command === Command.RealtimeListUsers) {
      return wsService.subscribeToRealtimeUsersList(client, messageData);
    }

    if (messageData.command === Command.RealtimeListActions) {
      return wsService.subscribeToRealtimeActions(client);
    }

    if (messageData.command === Command.SetNeighbours) {
      return wsService.setNeighbours(client, messageData);
    }

    return ws.send(JSON.stringify({ message: "Invalid message" }));
  });

  ws.on("close", () => {
    if (!clients.get(id)) return;

    // publish realtime users list to clients subscribed to the topic
    wsService.publishRealtimeAction(clients.get(id)!, {
      message: "Disconnected",
    });

    clients.delete(id);
    wsService.publishRealtimeUsersList();
  });
});

wsServer.on("error", (error: Error) => {
  console.log(error);
});

export default wsServer;
