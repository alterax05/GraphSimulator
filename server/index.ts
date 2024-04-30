import express from "express";
import wsServer from "./routes/websocket";
import path from "path";

const app = express();

app.use(express.static(path.join(__dirname, "/public")));

// using express to expose the files in the public folder
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

// forward web socket requests to wsServer
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, socket => {
    wsServer.emit("connection", socket, request);
  });
});
