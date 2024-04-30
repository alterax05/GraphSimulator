import { RawData } from "ws";
import { ClientMessage } from "../types/socket";
import z from "zod";

// zod message schema
// Why zod: https://zod.dev/?id=introduction
const messageScheme = z.object({
  to: z.array(z.string()).optional(),
  from: z.string().optional(),
  message: z.string().optional(),
  command: z.string().optional(),
  neighbours: z.array(z.string()).optional(),
});

/**
 * Represents the available commands for socket communication.
 */
export enum Command {
  /**
   * Command to list users.
   */
  ListUsers = "list-users",

  /**
   * Command to list users in real-time.
   */
  RealtimeListUsers = "realtime-list-users",

  /**
   * Command to list actions in real-time.
   */
  RealtimeListActions = "realtime-list-actions",

  /**
   * Command to set neighbours.
   */
  SetNeighbours = "set-neighbours",

  /**
   * Command to get the graph.
   */
  GetGraph = "get-graph",

  /**
   * Command to get the graph in real-time.
   */
  RealtimeGraph = "realtime-get-graph",

  /**
   * Command to set the state.
   */
  SetState = "set-state",
}


/**
 * Enum representing different topics for socket communication.
 */
export enum Topic {
  /**
   * Topic for real-time listing of users.
   */
  RealtimeListUsers = "realtime-list-users",

  /**
   * Topic for real-time listing of actions.
   */
  RealtimeListActions = "realtime-list-actions",

  /**
   * Topic for getting a graph.
   */
  GetGraph = "get-graph",

  /**
   * Topic for real-time graph updates.
   */
  RealtimeGraph = "realtime-get-graph",
}

class SocketUtils {
  /**
   * Parses a raw message received from a socket connection and converts it into a valid ClientMessage object.
   * @param message - The raw message to parse.
   * @param id - The identifier of the client sending the message.
   * @returns The parsed ClientMessage object if the message is valid, otherwise null.
   */
  static parseMessage(message: RawData, id: string) {
    try {
      const json = JSON.parse(message.toString());
      //using zod for validation
      const messageData = messageScheme.parse(json);
      messageData.from = id;
      return messageData as ClientMessage;
    } catch (e) {
      return null;
    }
  }
}

export default SocketUtils;
