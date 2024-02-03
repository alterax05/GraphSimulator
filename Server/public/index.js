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
var options = {
  edges: {
    arrows: {
      to: { enabled: true, scaleFactor: 1, type: "arrow" },
    },
  },
  layout: {
    clusterThreshold: 200,
  },
};
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
  ws.send(JSON.stringify({ command: "realtime-get-graph" }));
  ws.send(JSON.stringify({ command: "realtime-list-actions" }));
};
ws.onmessage = (message) => {
  console.log(message.data);
  const data = JSON.parse(message.data);

  if (data.graph) {
    updateNodes(data.graph);
  } else if (data.action) {
    updateTable(data);
  }
};

/* adjacency list is like [["B1",[]],["B2",["B1"]],["B3",[]],["inspector6948",[]]] */
const updateNodes = (graph) => {
  if (graph) {
    // search and delete old nodes and edges
    nodes.forEach((node) => {
      if (!graph.find((n) => n[0] === node.id)) {
        nodes.remove(node.id);

        // remove edges
        edges.forEach((edge) => {
          if (edge.from === node.id || edge.to === node.id) {
            edges.remove(edge.id);
          }
        });
      }
    });

    // remove old edges
    edges.forEach((edge) => {
      graph.forEach((node) => {
        if (!node[1].includes(edge.from) || !node[1].includes(edge.to)) {
          edges.remove(edge.id);
        }
      });
    });

    // add new nodes
    graph.forEach((node) => {
      if (!nodes.get(node[0]) && !node[0].startsWith("inspector")) {
        nodes.add({ id: node[0], label: node[0] });
      }

      // add new edges
      node[1].forEach((adjacentNode) => {
        if (
          !edges
            .get()
            .find((edge) => edge.from === node[0] && edge.to === adjacentNode)
        ) {
          edges.add({ from: node[0], to: adjacentNode });
        }
      });
    });

    // add new edges
    edges.forEach((edge) => {
      if (
        !graph.find(
          (node) => node[0] === edge.from && node[1].includes(edge.to)
        )
      ) {
        edges.remove(edge.id);
      }
    });

    // remove old edges
    edges.forEach((edge) => {
      if (
        !graph.find(
          (node) => node[0] === edge.from && node[1].includes(edge.to)
        )
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

  tableBody.innerHTML = newRow + tableBody.innerHTML;

  // remove old rows
  const oldRows = tableBody.getElementsByTagName("tr");
  if (oldRows.length > 50) {
    tableBody.removeChild(oldRows[oldRows.length - 1]);
  }
};
