package Core;

import java.io.Serializable;
public class Message implements Serializable { // classe Core.Message, dove viene specificato:
    private final String message; // il messaggio
    private final String from; // il mittente
    private final String[] to; // i destinatari
    private final String command; // il comando che il webServer deve eseguire
    private final String[] neighbours; // i vicini

    public Message(String message, String from, String[] to, String command, String[] neighboursToSet) {
        this.message = message;
        this.from = from;
        this.to = to;
        this.command = command;
        this.neighbours = neighboursToSet;
    }

    public String getMessage() {
        return message;
    }

    public String getFrom() {
        return from;
    }

    public String[] getTo() {
        return to;
    }

    public String getCommand() {
        return command;
    }

    public String[] getNeighbours() {
        return neighbours;
    }
}
