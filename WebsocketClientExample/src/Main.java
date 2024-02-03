import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.Scanner;
import java.util.List;
import com.google.gson.Gson;

public class Main {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        System.out.print("Inserisci l'ID del nodo: ");
        String nodeId = scanner.next();

        WebSocketListener listener = new WebSocketListener();
        HttpClient client = HttpClient.newHttpClient();
        WebSocket webSocket = client.newWebSocketBuilder()
                .buildAsync(URI.create("wss://test-tpsi.barsanti.edu.it?id="+nodeId), listener).join();

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

            List<String> neighbors = List.of(neighborsString.split(","));
            Message messageObject = new Message(message, null, neighbors.toArray(new String[0]),null);
            Gson gson = new Gson();
            String json = gson.toJson(messageObject);
            System.out.println("Resoconto: vicini: " + neighborsString + ", messaggio: " + message);
            webSocket.sendText(json, true);
        }
    }
}