import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Scanner;

import Core.WebSocketListener;
import Core.WebSocketPrinterThread;

public class Main {
    public static void main(String[] args) throws InterruptedException {

        ////////////////////////// NON TOCCARE //////////////////////////////////////
        Scanner scanner = new Scanner(System.in);
        System.out.print("Inserisci l'ID del nodo: ");
        String nodeId = scanner.next();

        System.out.println("Inserisci stato iniziale: ");
        String initialState = scanner.next();

        String neighborsString;
        System.out.print("Inserisci i vicini separati da una virgola: ");
        do {
            neighborsString = scanner.nextLine().replaceAll(" ", "");
        } while(neighborsString.isEmpty());
        ArrayList<String> neighbours = new ArrayList<>(Arrays.asList(neighborsString.split(",")));

        System.out.print("Primo messaggio da inviare: ");
        String message = scanner.nextLine();

        // da qui in poi non si può prendere più niente in input dalla console
        String serverUrl = "wss://graphsimulator.barsanti.edu.it";
        WebSocketListener listener = new WebSocketListener();
        WebSocketPrinterThread webSocketThread = new WebSocketPrinterThread(listener);
        webSocketThread.start();

        HttpClient client = HttpClient.newHttpClient();
        WebSocket webSocket = client.newWebSocketBuilder()
                .buildAsync(URI.create(serverUrl + "?id=" + nodeId), listener).join();

        Node node = new Node(nodeId, webSocket, initialState, neighbours);
        listener.setNode(node);

        ///////////////////////////////////////////////////////////////////////


        // TODO: scrivere QUI il codice usando la variabile "node" (es. invio il messaggio iniziale se sono initiator)
        //  utilizzare e IMPLEMENTARE i metodi "afterSendingMessage" e "afterReceivingMessage" della classe Node
        //  afterSendingMessage inviene chiamato automaticamente dopo aver inviato un messaggio con il metodo "sendMessage"
        //  utilizzare il metodo "sendMessage" della classe Node per inviare messaggi
        //  afterReceivingMessage viene chiamato automaticamente alla ricezione dei messaggi
        //  i messaggi ricevuti dal Server in VERDE non effettuano il metodo "afterReceivingMessage"
        //  i log BLU in console derivano dal metodo "printMessage" della classe BaseNode da cui estende Node
        //  NON TOCCARE LA CARTELLA DI CORE

        String state = node.getState();
        if(state.equals("initiator")) {
            node.sendMessage(message, node.getNeighbours());
        } else if (state.equals("sleeping")) {
            node.printMessage("I don't send an initial message");
        }

        //////////////////////////////////////////////////////////////////////

        webSocketThread.join();
        System.out.print("Disconnessione avvenuta");
        webSocket.sendClose(1000, "WantToClose");
    }
}