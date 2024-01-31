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
  if (newNodes) {
    // search and delete old nodes and edges
    nodes.forEach((node) => {
      if (!newNodes.find((newNode) => newNode.id == node.id)) {
        nodes.remove(node.id);

        // remove related edges
        edges.forEach((edge) => {
          if (edge.from == node.id || edge.to == node.id) {
            edges.remove(edge.id);
          }
        });
      }
    });

    // add new nodes
    newNodes.forEach((newNode) => {
      if (!nodes.get(newNode.id) && !newNode.id.startsWith("inspector")) {
        nodes.add({ id: newNode.id, label: newNode.id });
      }
    });

    // add new edges
    newNodes.forEach((newNode) => {
      if (newNode.neighbours) {
        newNode.neighbours.forEach((neighbour) => {
          if (!edges.get(`${newNode.id}-${neighbour}`)) {
            edges.add({
              id: `${newNode.id}-${neighbour}`,
              from: newNode.id,
              to: neighbour,
            });
          }
        });
      }
    });

    // remove old edges
    edges.forEach((edge) => {
      // check if "from" node has the "to" in the neighbours
      const fromNode = newNodes.find((node) => node.id == edge.from);
      if (!fromNode) {
        edges.remove(edge.id);
      } else if (
        !fromNode.neighbours ||
        !fromNode.neighbours.includes(edge.to)
      ) {
        edges.remove(edge.id);
      }
    });
  }
};

const updateTable = (data) => {
  const clientId = data.from;
  let action;
  if (data.action.to) {
    action = `Message: "${data.action.message}" to ${data.action.to}`;
  } else {
    action = JSON.stringify(data.action);
  }

  const tableBody = document.getElementById("network-table-body");
  const newRow = `
    <tr>
      <th scope="row">${clientId}</th>
      <td>${action}</td>
    </tr>
  `;

  tableBody.innerHTML += newRow;
};
