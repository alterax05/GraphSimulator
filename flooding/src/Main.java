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

        System.out.print("Messaggio da inviare ai vicini: ");
        String message = scanner.nextLine();

        String serverUrl = "wss://graphsimulator.barsanti.edu.it";
        WebSocketListener listener = new WebSocketListener();
        WebSocketPrinterThread webSocketThread = new WebSocketPrinterThread(listener);
        webSocketThread.start();

        HttpClient client = HttpClient.newHttpClient();
        WebSocket webSocket = client.newWebSocketBuilder()
                .buildAsync(URI.create(serverUrl + "?id=" + nodeId), listener).join();

        Node node = new Node(nodeId, webSocket, initialState, neighbours);
        listener.setNode(node);

        node.sendMessage(message, node.getNeighbours());

        webSocketThread.join();

        System.out.print("Disconnessione avvenuta");
        webSocket.sendClose(1000, "WantToClose");
    }
}