import { WebSocket } from "ws";
import { Client, ClientMessage, NodeData, Nodes, RealtimeAction, RealtimeGraph } from "../types/socket";
import Graph from "../utils/graph";
import { Topic } from "../utils/socketUtils";

class WebSocketService {
  graph = new Graph();

  /**
   * Forwards a message to the specified destinations if they are neighbors of the sender.
   * @param message - The message to be forwarded.
   */
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

  /**
   * Sends a list of users to the specified client.
   * @param senderClient - The client to send the list of users to.
   */
  public listUsers(senderClient: Client) {
    const nodes = this.graph.getNodes();
    const nodesData = Array.from(nodes.keys()).map((id) => ({
      id,
      state: nodes.get(id)?.state,
    } as NodeData));

    senderClient.ws.send(
      JSON.stringify({
        nodes: nodesData,
      } as Nodes)
    );
  }

  /**
   * Sets the neighbours for a given client.
   * @param sender - The client for which to set the neighbours.
   * @param message - The client message containing the neighbours.
   * @returns A Promise that resolves when the message is sent.
   */
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

  /**
   * Creates a new client and adds it to the graph.
   * @param id - The ID of the client.
   * @param ws - The WebSocket connection for the client.
   * @returns The newly created client.
   */
  public createClient(id: string, ws: WebSocket) {
    const newClient: Client = {
      id,
      ws,
      subscriptions: [],
      neighbours: [],
      failedPings: 0,
      state: null,
    };
    this.graph.addNode(newClient);
    return newClient;
  }

  /**
   * Subscribes the client to the realtime users list and returns the list of users.
   * @param client - The client subscribing to the realtime users list.
   * @param message - The client message.
   * @returns The list of users.
   */
  public subscribeToRealtimeUsersList(client: Client, message: ClientMessage) {
    client.subscriptions.push(Topic.RealtimeListUsers);
    return this.listUsers(client);
  }

  /**
   * Subscribes a client to receive realtime actions.
   * @param client - The client to subscribe.
   * @returns A Promise that resolves when the subscription is successful.
   */
  public subscribeToRealtimeActions(client: Client) {
    client.subscriptions.push(Topic.RealtimeListActions);
    return client.ws.send(
      JSON.stringify({
        message: "Subscribed to realtime actions",
      })
    );
  }

  /**
   * Subscribes a client to the realtime graph updates.
   * @param client - The client to subscribe.
   * @returns A promise that resolves when the realtime graph is published.
   */
  public subscribeToRealtimeGraph(client: Client) {
    client.subscriptions.push(Topic.RealtimeGraph);
    return this.publishRealtimeGraph();
  }

  /**
   * Publishes the real-time users list to all subscribed clients.
   * Retrieves the list of subscribed users and sends the user list to each client.
   */
  public publishRealtimeUsersList() {
    const subscribedUsers = Array.from(this.graph.getNodes().values()).filter(
      (client) => client.subscriptions.includes(Topic.RealtimeListUsers)
    );

    subscribedUsers.forEach((client) => this.listUsers(client));
  }

  /**
   * Publishes a realtime action to all subscribed users.
   * @param sender The client who initiated the action.
   * @param senderMessage The message sent by the sender.
   */
  public publishRealtimeAction(sender: Client, senderMessage: ClientMessage) {
    const subscribedUsers = Array.from(this.graph.getNodes().values()).filter(
      (client) => client.subscriptions.includes(Topic.RealtimeListActions)
    );
    subscribedUsers.forEach((client) => {
      client.ws.send(
        JSON.stringify({
          from: sender.id,
          action: senderMessage,
        } as RealtimeAction)
      );
    });
  }

  /**
   * Sends the graph to all subscribed users.
   */
  public publishRealtimeGraph() {
    const subscribedUsers = Array.from(this.graph.getNodes().values()).filter(
      (client) => client.subscriptions.includes(Topic.RealtimeGraph)
    );

    subscribedUsers.forEach((client) => this.sendGraph(client));
  }

  /**
   * Sends the graph to the specified client.
   * @param sender - The client to send the graph data to.
   */
  public sendGraph(sender: Client) {
    const adjacencyList = Array.from(this.graph.getAdjacencyList());
    sender.ws.send(
      JSON.stringify({
        graph: adjacencyList,
      } as RealtimeGraph)
    );
  }

  /**
   * Removes a client from the graph and clears the heartbeat.
   * @param client - The client to be removed.
   * @param heartbeat - The heartbeat interval for the client.
   * @param code - The code indicating the reason for disconnection.
   */
  public removeClient(client: Client, heartbeat: NodeJS.Timeout, code: number) {
    this.graph.deleteNode(client.id);
    clearInterval(heartbeat);
    // publish realtime users list to clients subscribed to the topic
    this.publishRealtimeAction(client, {
      // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
      message: `Disconnected with code: ${code}`,
    });
    this.publishRealtimeUsersList();
    this.publishRealtimeGraph();
  }

  /**
   * Checks if a client is connected to the server.
   * @param client - The client to check.
   * @returns `true` if the client is connected, `false` otherwise.
   */
  public isClientConnected(client: Client) {
    return this.graph.hasNode(client.id);
  }

  /**
   * Retrieves the client with the specified ID from the graph.
   * 
   * @param id - The ID of the client to retrieve.
   * @returns The client node with the specified ID.
   */
  public getClient(id: string) {
    return this.graph.getNode(id);
  }

  /**
   * Checks if two clients are neighbours.
   * @param client - The first client.
   * @param target - The second client.
   * @returns True if the clients are neighbours, false otherwise.
   */
  public areNeighbours(client: Client, target: Client) {
    return client.neighbours.includes(target.id);
  }

  /**
   * Sets the state of a client based on the provided message.
   * @param client - The client object.
   * @param message - The client message containing the new state.
   * @returns A Promise that resolves when the state is set and the response is sent.
   */
  public setClientState(client: Client, message: ClientMessage) {
    if (!message.message) {
      return client.ws.send(JSON.stringify({ message: "Message required" }));
    }

    client.state = message.message;
    return client.ws.send(
      JSON.stringify({ message: `State set to: ${message.message}` })
    );
  }
}

export default WebSocketService;