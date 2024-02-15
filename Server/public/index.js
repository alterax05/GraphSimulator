var nodes = new vis.DataSet([]);
var edges = new vis.DataSet([]);

// create a network
var networkElement = document.getElementById("network");
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
var network = new vis.Network(networkElement, data, options);

const currentHost = window.location.hostname;
const currentPort = window.location.port;
const currentProtocol = window.location.protocol == "https:" ? "wss" : "ws";

const randomId = Math.floor(Math.random() * 10000);
const ws = new WebSocket(
  `${currentProtocol}://${currentHost}:${currentPort}?id=inspector${randomId}`
);

let knownUsersList = [];

ws.onopen = () => {
  console.log("connected");
  ws.send(JSON.stringify({ command: "realtime-get-graph" }));
  ws.send(JSON.stringify({ command: "realtime-list-users" }));
  ws.send(JSON.stringify({ command: "realtime-list-actions" }));
};
ws.onmessage = (message) => {
  console.log(message.data);
  const data = JSON.parse(message.data);

  if (data.graph) {
    updateNodes(data.graph);
    // sinchronize the graph with the known users list
    updateUsersStates(knownUsersList);
  } else if (data.action) {
    updateTable(data);
  } else if (data.nodes) {
    updateUsersStates(data.nodes);
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

const updateUsersStates = (users) => {
  knownUsersList = users.filter((user) => !user.id.startsWith("inspector"));

  knownUsersList.forEach((user) => {
    // get color based on the state of the user
    const colors = generateStateColor(user.state);

    // find the respective node and update its color
    // in this function there is no need to add new nodes if they don't exist
    if (nodes.get(user.id)) {
      nodes.update({
        id: user.id,
        color: colors.background,
        font: { color: colors.foreground },
      });
    }

    // update legend with the unique instances of states found with their respective colors
    const legend = document.getElementById("legend");

    // add new legend elements if they don't exist
    if (!legend.querySelector(`[data-state="${user.state}"]`)) {
      const newLegendElement = document.createElement("div");
      newLegendElement.dataset.state = user.state;
      newLegendElement.style.display = "flex";
      newLegendElement.style.alignItems = "center";
      newLegendElement.style.margin = "5px 0";
      newLegendElement.innerHTML = `
        <div style="width: 20px; height: 20px; background: ${colors.background}; margin-right: 5px;"></div>
        <span>${user.state}</span>
      `;
      legend.appendChild(newLegendElement);
    }
  });
};

// associate each available state to a unique color generated from the hash of the state string
const generateStateColor = (state) => {
  // default color is a light blue background with black text
  if (!state) {
    return {
      background: "#87CEEB",
      foreground: "#000000",
    };
  }

  // hash function using DJB2 algorithm
  let hash = 5381;
  for (let i = 0; i < state.length; i++) {
    hash = (hash * 33) ^ state.charCodeAt(i);
  }

  // Convert hash to a six-digit hexadecimal color
  const backgroundColor = (hash >>> 0)
    .toString(16)
    .padStart(6, "0")
    .slice(0, 6);

  // generate a contrast color for the text
  const foregroundColor =
    parseInt(backgroundColor, 16) > 0xffffff / 2 ? "#000000" : "#ffffff";

  return {
    background: `#${backgroundColor}`,
    foreground: foregroundColor,
  };
};
