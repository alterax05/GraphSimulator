// create an array with nodes
var nodes = new vis.DataSet([
  //   { id: 1, label: "Node 1" },
  //   { id: 2, label: "Node 2" },
  //   { id: 3, label: "Node 3" },
  //   { id: 4, label: "Node 4" },
  //   { id: 5, label: "Node 5" },
]);

// create an array with edges
var edges = new vis.DataSet([
  //   { from: 1, to: 3 },
  //   { from: 1, to: 2 },
  //   { from: 2, to: 4 },
  //   { from: 2, to: 5 },
  //   { from: 3, to: 3 },
]);

// create a network
var container = document.getElementById("network");
var data = {
  nodes: nodes,
  edges: edges,
};
var options = {};
var network = new vis.Network(container, data, options);

const randomId = Math.floor(Math.random() * 10000);

const currentHost = window.location.hostname;
const currentPort = window.location.port;
const currentProtocol = window.location.protocol == "https:" ? "wss" : "ws";

const ws = new WebSocket(`${currentProtocol}://${currentHost}:${currentPort}?id=inspector${randomId}`);

ws.onopen = () => {
  console.log("connected");
  ws.send(JSON.stringify({ command: "realtime-list-users" }));
};
ws.onmessage = message => {
  console.log(message.data);
  const data = JSON.parse(message.data);

  // based on the data structure update the network
  if (data.nodes) {
    nodes.forEach(node => {
      // delete old nodes
      if (!data.nodes.some(n => n.id === node.id)) {
        nodes.remove(node.id);

        // remove old edges
        edges.forEach(edge => {
          if (edge.from === node.id || edge.to === node.id) {
            edges.remove(edge.id);
          }
        });
      }
    });

    data.nodes.forEach(node => {
      // add node if it doesn't exist
      if (!nodes.get(node.id) && !node.id.startsWith("inspector") ) {
        nodes.add({
          id: node.id,
          label: node.id,
        });
      }
    });
  }
};
