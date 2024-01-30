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

const ws = new WebSocket(
  `${currentProtocol}://${currentHost}:${currentPort}?id=inspector${randomId}`
);

ws.onopen = () => {
  console.log("connected");
  ws.send(JSON.stringify({ command: "realtime-list-users" }));
  ws.send(JSON.stringify({ command: "realtime-list-actions" }));
};
ws.onmessage = (message) => {
  console.log(message.data);
  const data = JSON.parse(message.data);

  if (data.nodes) {
    updateNodes(data.nodes);
  } else if (data.action) {
    updateTable(data);
  }
};

const updateNodes = (newNodes) => {
  // based on the data structure update the network
  if (newNodes) {
    nodes.forEach((node) => {
      // delete old nodes
      if (!newNodes.some((n) => n.id === node.id)) {
        nodes.remove(node.id);

        // remove old edges
        edges.forEach((edge) => {
          if (edge.from === node.id || edge.to === node.id) {
            edges.remove(edge.id);
          }
        });
      }
    });

    newNodes.forEach((node) => {
      // add node if it doesn't exist
      if (!nodes.get(node.id) && !node.id.startsWith("inspector")) {
        nodes.add({
          id: node.id,
          label: node.id,
        });

        // delete old edges
        node.neighbours.forEach((neighbor) => {
          if (
            !newNodes.some((n) => n.id === neighbor) &&
            !neighbor.startsWith("inspector")
          ) {
            edges.forEach((edge) => {
              if (
                (edge.from === node.id && edge.to === neighbor) ||
                (edge.from === neighbor && edge.to === node.id)
              ) {
                edges.remove(edge.id);
              }
            });
          }
        });

        // add edges
        node.neighbours.forEach((neighbor) => {
          // check that edge doesn't exist
          if (
            !edges.get({
              filter: (edge) =>
                (edge.from === node.id && edge.to === neighbor) ||
                (edge.from === neighbor && edge.to === node.id),
            }).length
          ) {
            edges.add({
              from: node.id,
              to: neighbor,
            });
          }
        });
      }
    });
  }
};

const updateTable = (data) => {
  const clientId = data.from;
  const action = JSON.stringify(data.action);

  const tableBody = document.getElementById("network-table-body");
  const newRow = `
    <tr>
      <th scope="row">${clientId}</th>
      <td>${action}</td>
    </tr>
  `;

  tableBody.innerHTML += newRow;
};
