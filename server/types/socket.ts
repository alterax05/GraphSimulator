import { WebSocket } from "ws";

export interface Client {
  id: string;
  ws: WebSocket;
  subscriptions: string[];
  neighbours: string[];
}

export interface ClientMessage {
  to?: string[];
  message?: string;
  command?: string;
  neighbours?: string[];
}
