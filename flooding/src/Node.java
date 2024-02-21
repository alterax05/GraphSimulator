import Core.BaseNode;
import Core.Message;

import java.net.http.WebSocket;
import java.util.ArrayList;
import java.util.Objects;

public class Node extends BaseNode {
    String senderNodeId;

    public Node(String id, WebSocket websocket, String state, ArrayList<String> neighbours) {
        super(id, websocket, state, neighbours);
    }

    @Override
    public void afterSendingMessage(String message) {
        if (Objects.equals(state, "initiator")) {
            this.printMessage("Messaggio inviato");
            setState("done");
        } else if (Objects.equals(state, "sleeping")) {
            this.printMessage("Messaggio inviato");
            setState("done");
        } else if (Objects.equals(state, "done")) {
            this.printMessage("Non faccio niente");
        } else {
            this.printMessage("Stato invalido");
        }
    }

    @Override
    public void afterReceivingMessage(Message message) {
        if(Objects.equals(state, "sleeping")) {
            senderNodeId = message.getFrom();
            ArrayList<String> neighboursWithoutSender = this.neighbours;
            neighboursWithoutSender.remove(senderNodeId);
            // broadcast message to all neighbours except the sender
            sendMessage(message.getMessage(), neighboursWithoutSender);
        } else if(Objects.equals(state, "done") || Objects.equals(state, "initiator")) {
            this.printMessage("Messaggio ricevuto, non faccio niente");
        } else {
            this.printMessage("Stato invalido");
        }
    }
}
