import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.util.Scanner;
import java.util.List;
import com.google.gson.Gson;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in); // scanner utilizzato per permettere l'inserimento dei vari campi
        System.out.print("Inserisci l'ID del nodo: ");
        String nodeId = scanner.next();

        String serverUrl = "wss://graphsimulator.barsanti.edu.it"; // url di connessione al webServer

        WebSocketListener listener = new WebSocketListener();
        HttpClient client = HttpClient.newHttpClient();
        WebSocket webSocket = client.newWebSocketBuilder()
                .buildAsync(URI.create(serverUrl + "?id=" + nodeId), listener).join(); // creazione e avvio del webSocket

        while (!listener.isClosed) {
            String message;
            System.out.print("Messaggio da inviare ai vicini: ");
            do{
                message = scanner.nextLine();

            }while(message.isEmpty()); // ciclo che permette l'inserimento del campo message

            String neighborsString;
            System.out.print("Inserisci i vicini separati da una virgola:");
            do{
                neighborsString = scanner.nextLine().replaceAll(" ", "");
            }while(neighborsString.isEmpty()); // ciclo che permette l'inserimento dei vicini di questo nodo

            // partendo dalla stringa i vicini vengono convertiti in una lista di stringhe
            List<String> neighbors = List.of(neighborsString.split(","));
            Message messageObject = new Message(message, null, neighbors.toArray(new String[0]),null, null);
            // creazione del oggetto messageObject di tipo Message, nella riga di codice scritta sopra, vengono inseriti nell'oggetto i vicini di questo nodo e il messaggio scritto prima
            Gson gson = new Gson();

            // si esegue un controllo che nella lista dei vicini non sia presente il nome del nostro nodo
            if(!neighbors.contains(nodeId)) {
                Message setNeighbors = new Message(null, null, null, "set-neighbours", neighbors.toArray(new String[0]));
                String SetNeighborsJSON = gson.toJson(setNeighbors); // converto l'oggetto setNeighbors di tipo Message, che serve per comunicare al server i vicini di un nodo,
                webSocket.sendText(SetNeighborsJSON, true); // e la invio
            }

            String MessageJSON = gson.toJson(messageObject);
            // converto l'oggetto messageObject in JSON, dove sono contenuti i vicini e il messaggio scritto prima
            System.out.println("Resoconto [Vicini: " + neighborsString + ", messaggio: " + message + " ]");
            webSocket.sendText(MessageJSON, true); // e lo invio in JSON al webServer

            Coda<String> queueOfMessages = listener.getQueueOfMessages();
            while(!queueOfMessages.isEmpty())
            {
                System.out.println(queueOfMessages.pop()); // stampo a schermo i messaggi ricevuti (inseriti nella queueOfMessages)

            }

            System.out.print("Vuoi continuare a scrivere messaggi? (y/n) ");
            String continueString;
            do{
                continueString = scanner.nextLine();

            }while(continueString.isEmpty()); // ciclo che permette l'inserimento del campo continueString

            if (continueString != "y") { // controllo se l'utente, vuole continuare a scrivere messaggi
                break;
            }
        }

        System.out.print("Disconnessione avvenuta");
        webSocket.sendClose(1000, "WantToClose"); // chiusura del webSocket
    }
}