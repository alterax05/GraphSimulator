import { RawData } from "ws";
import { ClientMessage } from "../types/socket";
import z from "zod";

const messageScheme = z.object({
  to: z.array(z.string()).optional(),
  from: z.string().optional(),
  message: z.string().optional(),
  command: z.string().optional(),
  neighbours: z.array(z.string()).optional(),
});

export enum Command {
  ListUsers = "list-users",
  RealtimeListUsers = "realtime-list-users",
  RealtimeListActions = "realtime-list-actions",
  SetNeighbours = "set-neighbours",
  GetGraph = "get-graph",
  RealtimeGraph = "realtime-get-graph",
}

export enum Topic {
  RealtimeListUsers = "realtime-list-users",
  RealtimeListActions = "realtime-list-actions",
  GetGraph = "get-graph",
  RealtimeGraph = "realtime-get-graph",
}

class SocketUtils {
  static parseMessage(message: RawData, id: string) {
    try {
      const json = JSON.parse(message.toString());
      const messageData = messageScheme.parse(json);
      messageData.from = id;
      return messageData as ClientMessage;
    } catch (e) {
      return null;
    }
  }
}

export default SocketUtils;
