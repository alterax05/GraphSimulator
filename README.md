# Graph Simulator

This repository contains the code used in TPSI lessons to simulate different graph behaviours

## Get Started

### Backend

The backend is created using typescript, Express.js and the WS package. The service is hosted on the Plesk platform of the school's servers at [https://test-tpsi.barsanti.edu.it](https://test-tpsi.barsanti.edu.it)

Links for further informations about configurations:

- [Configure Websockets on Plesk](https://www.plesk.com/kb/support/does-node-js-on-plesk-support-websockets-socket-io/)
- [Use Node.js on Plesk](https://www.plesk.com/blog/product-technology/node-js-plesk-onyx/)

### Frontend

The backend also serves a simple web page to inspect the network state providing the actions of all the users in realtime and also a visual representation of the network.

### Java Client

The repository also contains a starter project to interact with the backend service.

Download the repository and setup the <b>serverUrl</b> string in the Main.java file to point to the school's backend.

## Available Actions

- Send a message

```
{
    "message": "Messaggio da inviare!"
    "to": ["B1", "B2"]
}
```

- List Connected Users

```
{
    "command": "list-users"
}
```

- Set neighbours

```
{
    "command": "set-neighbours",
    "neighbours": ["B2", "C1", "A3"]
}
```

- Get adjacency list of the network's graph

```
{
    "command": "get-graph"
}
```

- List users in realtime (receive an event each time a user connects/disconnects from the server)

```
{
    "command": "realtime-list-users"
}
```

- Track all users actions in realtime (receive an event each time a user connects/disconnect/send a message or an action to the server)

```
{
    "command": "realtime-list-actions"
}
```

- Get adjacency list of the network's graph in realtime (receive an event each time a user connects/disconnects/updates his neighbours)

```
{
    "command": "realtime-get-graph"
}
```
