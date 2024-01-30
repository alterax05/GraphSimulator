import { clients } from "../routes/websocket";
import { Client, ClientMessage } from "../types/socket";
import { Topic } from "../utils/socketUtils";

class WebSocketController {
  public forwardMessage(message: ClientMessage) {
    return message.to?.forEach((to) => {
      const client = clients.get(to);
      if (client) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  public listUsers(senderClient: Client) {
    const usersData = Array.from(clients.entries()).map(([id, client]) => ({
      id: id,
      neighbours: client.neighbours,
    }));

    senderClient.ws.send(
      JSON.stringify({
        nodes: usersData,
      })
    );
  }

  public subscribeToRealtimeUsersList(client: Client, message: ClientMessage) {
    client.subscriptions.push(Topic.RealtimeListUsers);
    return this.listUsers(client);
  }

  public subscribeToRealtimeActions(client: Client) {
    client.subscriptions.push(Topic.RealtimeListActions);
    return client.ws.send(
      JSON.stringify({
        message: "Subscribed to realtime actions",
      })
    );
  }

  public publishRealtimeUsersList() {
    const subscribedUsers = Array.from(clients.values()).filter((client) =>
      client.subscriptions.includes(Topic.RealtimeListUsers)
    );
    subscribedUsers.forEach((client) => {
      // send list of users to subscribed clients
      this.listUsers(client);
    });
  }

  public publishRealtimeActions(sender: Client, senderMessage: ClientMessage) {
    const subscribedUsers = Array.from(clients.values()).filter((client) =>
      client.subscriptions.includes(Topic.RealtimeListActions)
    );
    subscribedUsers.forEach((client) => {
      client.ws.send(
        JSON.stringify({
          from: sender.id,
          action: senderMessage,
        })
      );
    });
  }

  public setNeighbours(sender: Client, message: ClientMessage) {
    if (message.neighbours) {
      sender.neighbours = message.neighbours;
      this.publishRealtimeUsersList();

      return sender.ws.send(
        JSON.stringify({ message: "Neighbours set successfully" })
      );
    }

    return sender.ws.send(JSON.stringify({ message: "Neighbours required" }));
  }
}

export default WebSocketController;
