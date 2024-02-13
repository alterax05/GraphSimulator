import { WebSocket } from "ws";

export interface Client {
  id: string;
  ws: WebSocket;
  subscriptions: string[];
  neighbours: string[];
  failedPings: number;
  state: string | null;
}

export interface Edge {
  fromNodeId: string;
  toNodeId: string;
}

export interface ClientMessage {
  to?: string[];
  from?: string;
  message?: string;
  command?: string;
  neighbours?: string[];
}
