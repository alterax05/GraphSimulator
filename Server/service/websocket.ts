import { WebSocket } from "ws";
import { Client, ClientMessage } from "../types/socket";
import Graph from "../utils/graph";
import { Topic } from "../utils/socketUtils";

class WebSocketService {
  graph = new Graph();

  public forwardMessage(message: ClientMessage) {
    return message.to?.forEach((destination) => {
      if (this.graph.areNeighbours(message.from!, destination)) {
        const client = this.graph.getNodes().get(destination);
        if (client) {
          client.ws.send(JSON.stringify(message));
        }
      }
    });
  }

  public listUsers(senderClient: Client) {
    const nodeIds = Array.from(this.graph.getNodes().keys());
    senderClient.ws.send(
      JSON.stringify({
        nodes: nodeIds,
      })
    );
  }

  public setNeighbours(sender: Client, message: ClientMessage) {
    if (message.neighbours) {
      sender.neighbours = message.neighbours;
      this.graph.setNeighbours(sender.id, message.neighbours);

      return sender.ws.send(
        JSON.stringify({ message: "Neighbours set successfully" })
      );
    }

    return sender.ws.send(JSON.stringify({ message: "Neighbours required" }));
  }

  public createClient(id: string, ws: WebSocket) {
    const newClient = { id, ws, subscriptions: [], neighbours: [] };
    this.graph.addNode(newClient);
    return newClient;
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

  public subscribeToRealtimeGraph(client: Client) {
    client.subscriptions.push(Topic.RealtimeGraph);
    return this.publishRealtimeGraph();
  }

  public publishRealtimeUsersList() {
    const subscribedUsers = Array.from(this.graph.getNodes().values()).filter(
      (client) => client.subscriptions.includes(Topic.RealtimeListUsers)
    );

    subscribedUsers.forEach((client) => this.listUsers(client));
  }

  public publishRealtimeAction(sender: Client, senderMessage: ClientMessage) {
    const subscribedUsers = Array.from(this.graph.getNodes().values()).filter(
      (client) => client.subscriptions.includes(Topic.RealtimeListActions)
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

  public publishRealtimeGraph() {
    const subscribedUsers = Array.from(this.graph.getNodes().values()).filter(
      (client) => client.subscriptions.includes(Topic.RealtimeGraph)
    );

    subscribedUsers.forEach((client) => this.sendGraph(client));
  }

  public sendGraph(sender: Client) {
    const adjacencyList = Array.from(this.graph.getAdjacencyList());
    sender.ws.send(
      JSON.stringify({
        graph: adjacencyList,
      })
    );
  }

  public removeClient(client: Client) {
    this.graph.deleteNode(client.id);
    this.publishRealtimeUsersList();
    this.publishRealtimeGraph();
  }

  public isClientConnected(client: Client) {
    return this.graph.hasNode(client.id);
  }

  public getClient(id: string) {
    return this.graph.getNode(id);
  }

  public areNeighbours(client: Client, target: Client) {
    return client.neighbours.includes(target.id);
  }
}

export default WebSocketService;
