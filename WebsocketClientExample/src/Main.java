import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.Scanner;
import java.util.List;
import com.google.gson.Gson;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in); // scanner utilizzato
        System.out.print("Inserisci l'ID del nodo: ");
        String nodeId = scanner.next();

        String serverUrl = "wss://graphsimulator.barsanti.edu.it";

        WebSocketListener listener = new WebSocketListener();
        HttpClient client = HttpClient.newHttpClient();
        WebSocket webSocket = client.newWebSocketBuilder()
                .buildAsync(URI.create(serverUrl + "?id=" + nodeId), listener).join();

        while (!listener.isClosed) {
            String message;
            System.out.print("Messaggio da inviare ai vicini: ");
            do{
                message = scanner.nextLine();

            }while(message.isEmpty());

            String neighborsString;
            System.out.print("Inserisci i vicini separati da una virgola:");
            do{
                neighborsString = scanner.nextLine().replaceAll(" ", "");
            }while(neighborsString.isEmpty());

            //Set neighbours
            List<String> neighbors = List.of(neighborsString.split(","));
            Message messageObject = new Message(message, null, neighbors.toArray(new String[0]),null, null);
            Gson gson = new Gson();

            //Non posso settare me stesso come vicino
            if(!neighbors.contains(nodeId)) {
                Message setNeighbors = new Message(null, null, null, "set-neighbours", neighbors.toArray(new String[0]));
                String SetNeighborsJSON = gson.toJson(setNeighbors);
                webSocket.sendText(SetNeighborsJSON, true);
            }

            String MessageJSON = gson.toJson(messageObject);
            System.out.println("Resoconto [Vicini: " + neighborsString + ", messaggio: " + message + " ]");
            webSocket.sendText(MessageJSON, true);

            Coda<String> queueOfMessages = listener.getQueueOfMessages();
            while(!queueOfMessages.isEmpty())
            {
                System.out.println(queueOfMessages.pop());
            }

            System.out.print("Vuoi continuare a scrivere messaggi? (y/n)");
            String continueString;
            do{
                continueString = scanner.nextLine();

            }while(continueString.isEmpty());

            if (continueString != "y") {
                break;
            }
        }

        System.out.print("Disconnessione avvenuta");
        webSocket.sendClose(1000, "WantToClose");
    }
}