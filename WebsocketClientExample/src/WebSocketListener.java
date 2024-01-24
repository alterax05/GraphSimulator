import java.net.http.WebSocket;
import java.util.concurrent.CompletionStage;

public class WebSocketListener implements WebSocket.Listener{
        public static final String ANSI_RESET = "\u001B[0m";
        public static final String ANSI_GREEN = "\u001B[32m";


        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            synchronized (System.out){
                String[] message = data.toString().split("\"");
                System.out.print("\033[0;34m");
                System.out.println(ANSI_GREEN + "\n\tMessaggio ricevuto: \""+message[3]+"\" da "+message[7] + ANSI_RESET);
            }
            return WebSocket.Listener.super.onText(webSocket, data, last);
        }
}
