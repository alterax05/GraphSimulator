import { clients } from "../routes/websocket";
import { Client, ClientMessage } from "../types/socket";
import { Topic } from "../utils/socketUtils";

class WebSocketController {
  public forwardMessage(message: ClientMessage) {
    return message.to?.forEach(to => {
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

  public publishRealtimeUsersList() {
    const subscribedUsers = Array.from(clients.values()).filter(client =>
      client.subscriptions.includes(Topic.RealtimeListUsers)
    );
    const usersIds = Array.from(clients.keys());

    subscribedUsers.forEach(client => {
      this.listUsers(client);
    });
  }
}

export default WebSocketController;
