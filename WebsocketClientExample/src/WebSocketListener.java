import com.google.gson.Gson;
import java.net.http.WebSocket;
import java.util.concurrent.CompletionStage;

public class WebSocketListener implements WebSocket.Listener{
        private static final String ANSI_RESET = "\u001B[0m";
        private static final String ANSI_GREEN = "\u001B[32m";

        public boolean isClosed = false;

        @Override
        public void onOpen(WebSocket webSocket) {
            System.out.println("Connessione aperta");
            WebSocket.Listener.super.onOpen(webSocket);
        }

        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            Gson gson = new Gson();
            Message message = gson.fromJson(data.toString(), Message.class);
            System.out.print("\033[0;34m");
            System.out.println(ANSI_GREEN + "\n\tMessaggio ricevuto: \""+message.getMessage()+"\" da "+message.getFrom() + ANSI_RESET);
            return WebSocket.Listener.super.onText(webSocket, data, last);
        }

        @Override
        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
            System.out.println("Connessione chiusa");
            isClosed = true;
            return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
        }
}
