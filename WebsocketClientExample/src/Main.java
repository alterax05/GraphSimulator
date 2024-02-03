import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.Scanner;
import java.util.List;

public class Main {

    public static void main(String[] args) throws InterruptedException, IOException {
        // TODO: inserire l'URL del server nel formato wss://dominio
        String serverUrl = "";

        Scanner scanner = new Scanner(System.in);
        System.out.print("Inserisci l'ID del nodo: ");
        String nodeId = scanner.next();

        HttpClient client = HttpClient.newHttpClient();
        WebSocket webSocket = client.newWebSocketBuilder()
                .buildAsync(URI.create(serverUrl + "?id=" + nodeId), new WebSocketListener()).join();
        System.out.println("Connessione effettuata!");

        while (true) {
            synchronized (System.out)
            {
                System.out.print("Messaggio da inviare ai vicini: ");
            }

            String message = "";
            do{
                message = scanner.nextLine();

            }while(message=="");

            synchronized (System.out)
            {
                System.out.print("Inserisci i vicini separati da una virgola:");
            }

            String neighborsString = "";
            do{
                neighborsString = scanner.nextLine().replaceAll(" ", "");
            }while(neighborsString=="");

            List<String> neighbors = List.of(neighborsString.split(","));
            System.out.println("Resoconto, vicini: " + neighborsString + ", messaggio: " + message);
            StringBuilder jsonMessage = new StringBuilder("{\"message\": \"" + message + "\", \"id\": \"" + nodeId + "\", \"to\": [");;
            for (int i = 0; i < neighbors.size(); i++) {
                jsonMessage.append("\"").append(neighbors.get(i)).append("\"");
                if (i != neighbors.size()-1) {
                    jsonMessage.append(",");
                }
            }
            jsonMessage.append("]}");

            webSocket.sendText(jsonMessage.toString(), true);
        }
    }
}