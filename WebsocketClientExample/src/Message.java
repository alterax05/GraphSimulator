import java.io.Serializable;
public class Message implements Serializable {
    private final String message;
    private final String from;
    private final String[] to;
    private final String command;

    public Message(String message, String from, String[] to, String command) {
        this.message = message;
        this.from = from;
        this.to = to;
        this.command = command;
    }

    public String getMessage() {
        return message;
    }

    public String getFrom() {
        return from;
    }

    public String[] getTo() {
        return to;
    }

    public String getCommand() {
        return command;
    }
}
