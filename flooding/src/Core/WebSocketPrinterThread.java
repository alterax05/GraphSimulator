package Core;

public class WebSocketPrinterThread extends Thread {
    public WebSocketListener listener;

    public WebSocketPrinterThread(WebSocketListener listener) {
        this.listener = listener;
    }

    @Override
    public void run() {
        super.run();
        Coda<String> queueOfMessages = listener.getQueueOfMessages();
        while(!listener.isClosed) {
            String message = queueOfMessages.pop();
            System.out.println(message);
        }
    }
}
