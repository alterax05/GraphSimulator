package Core;

import com.google.gson.Gson;
import java.net.http.WebSocket;
import java.util.ArrayList;

public abstract class BaseNode {
    protected String id;
    protected WebSocket webSocket;
    protected Gson gson = new Gson();
    protected ArrayList<String> neighbours = new ArrayList<>();
    protected String state;

    public BaseNode(String id, WebSocket websocket, String state, ArrayList<String> neighbours) {
        this.id = id;
        this.webSocket = websocket;

        // set neighbours
        this.neighbours = neighbours;
        Message setNeighbors = new Message(null, null, null, "set-neighbours", neighbours.toArray(new String[0]));
        String SetNeighborsJSON = gson.toJson(setNeighbors);
        webSocket.sendText(SetNeighborsJSON, true);

        // tell the server the state of the node
        this.state = state;
        Message setState = new Message(state, null, null, "set-state", null);
        String setStateJSON = gson.toJson(setState);
        webSocket.sendText(setStateJSON, true);
    }

    public abstract void afterSendingMessage(String message);

    public abstract void afterReceivingMessage(Message message);

    public void setState(String state) {
        this.state = state;
        Message setState = new Message(state, null, null, "set-state", null);
        String setStateJSON = gson.toJson(setState);
        webSocket.sendText(setStateJSON, true);
    }

    public void sendMessage(String message, ArrayList<String> to) {
        Message messageObject = new Message(message, id, to.toArray(new String[0]), null, null);
        String MessageJSON = gson.toJson(messageObject);
        webSocket.sendText(MessageJSON, true);
        afterSendingMessage(message);
    }

    public ArrayList<String> getNeighbours() {
        return neighbours;
    }

    public void printMessage(String message) {
        System.out.println("\033[0;34m" + "\u001B[34m" + "\n\t" + message + "\u001B[0m");
    }
}
