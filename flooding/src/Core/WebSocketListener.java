package Core;

import com.google.gson.Gson;
import java.net.http.WebSocket;
import java.util.concurrent.CompletionStage;

public class WebSocketListener implements WebSocket.Listener {
        private static final String ANSI_RESET = "\u001B[0m";
        private static final String ANSI_GREEN = "\u001B[32m";
        private Coda<String> queueOfMessages;
        private BaseNode node;
        public boolean isClosed = false;

        public WebSocketListener()
        {
            super();
            queueOfMessages = new Coda<String>();
        }

        public void setNode(BaseNode node) {
            this.node = node;
        }

        @Override
        public void onOpen(WebSocket webSocket) {
            System.out.println("Connessione aperta");
            WebSocket.Listener.super.onOpen(webSocket);
        }

        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            Gson gson = new Gson();
            Message message = gson.fromJson(data.toString(), Message.class);

            // se il mittente è nullo, il mittente è il server
            String sender = message.getFrom();
            if(sender == null) sender = "Server";

            // dopo la conversione il messaggio viene inserito nella coda chiamata queueOfMessages
            queueOfMessages.push("\033[0;34m" +ANSI_GREEN + "\n\tMessaggio ricevuto: \""+message.getMessage()+"\" da "+ sender + ANSI_RESET);

            // gestisco il messaggio se il mittente non è il server
            if (message.getFrom() != null) {
                node.afterReceivingMessage(message);
            }

            return WebSocket.Listener.super.onText(webSocket, data, last);
        }

        @Override
        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) { // metodo che permette la chiusura del webSocket
            System.out.println("Connessione chiusa");
            isClosed = true;
            return WebSocket.Listener.super.onClose(webSocket, statusCode, reason);
        }

        public Coda<String> getQueueOfMessages()
        {
            return queueOfMessages;
        }
}
