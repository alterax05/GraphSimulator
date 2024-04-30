import { WebSocket } from "ws";

/**
 * Represents a client connected to the server.
 */
export interface Client {
  /**
   * The unique identifier of the client.
   */
  id: string;

  /**
   * The WebSocket connection associated with the client.
   */
  ws: WebSocket;

  /**
   * An array of subscription names that the client is subscribed to.
   */
  subscriptions: string[];

  /**
   * An array of client IDs representing the neighboring clients.
   */
  neighbours: string[];

  /**
   * The number of failed ping attempts for the client.
   */
  failedPings: number;

  /**
   * The state of the client.
   */
  state: string | null;

  /**
   * Whether the client wants to enable strict mode.
   * In strict mode, the client can only send messages to its neighbours.
   */
  strict: boolean;
}

/**
 * Represents an edge between two nodes in a graph.
 */
export interface Edge {
  fromNodeId: string;
  toNodeId: string;
}

/**
 * Represents a message sent by a client.
 */
export interface ClientMessage {
  /**
   * The recipients of the message.
   */
  to?: string[];

  /**
   * The sender of the message.
   */
  from?: string;

  /**
   * The content of the message.
   */
  message?: string;

  /**
   * The possible command associated with the message.
   */
  command?: string;

  /**
   * The neighbors of the client. (used by the 'set-neighbours' command)
   */
  neighbours?: string[];
}

/**
 * Represents the data structure for a node.
 */
export interface NodeData {
  /**
   * The unique identifier of the node.
   */
  id: string;

  /**
   * The state of the node.
   */
  state: string | null;
}

/**
 * Represents a collection of nodes.
 */
export interface Nodes {
  nodes: NodeData[];
}

/**
 * Represents a real-time action sent from a client.
 */
export interface RealtimeAction {
  from: string;
  action: ClientMessage;
}

/**
 * Represents a real-time graph.
 */
export interface RealtimeGraph {
  graph: [string, string[]][];
}
