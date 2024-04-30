// Create a DataSet for nodes and edges
// https://visjs.github.io/vis-network/docs/network/
var nodes = new vis.DataSet([]);
var edges = new vis.DataSet([]);

// Create a network
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

// Get current host, port, and protocol
const currentHost = window.location.hostname;
const currentPort = window.location.port;
const currentProtocol = window.location.protocol == "https:" ? "wss" : "ws";

// Generate a random ID for the inspector
const randomId = Math.floor(999 + Math.random() * 9000);

// Create a WebSocket connection
const ws = new WebSocket(
  `${currentProtocol}://${currentHost}:${currentPort}?id=inspector${randomId}`
);

// Initialize known users list
let knownUsersList = [];

// WebSocket event handlers
ws.onopen = () => {
  console.log("connected");

  // Send commands to the server
  ws.send(JSON.stringify({ command: "realtime-get-graph" }));
  ws.send(JSON.stringify({ command: "realtime-list-users" }));
  ws.send(JSON.stringify({ command: "realtime-list-actions" }));
};

ws.onmessage = (message) => {
  console.log(message.data);
  const data = JSON.parse(message.data);

  if (data.graph) {
    updateNodes(data.graph);
    updateUsersStates(knownUsersList);
  } else if (data.action) {
    updateTable(data);
  } else if (data.nodes) {
    updateUsersStates(data.nodes);
  }
};

/**
 * Updates the nodes and edges of the graph based on the provided adjacency list.
 * @param {Array} graph - The adjacency list representing the graph.
 */
const updateNodes = (graph) => {
  if (graph) {
    // Search and delete old nodes and edges
    nodes.forEach((node) => {
      if (!graph.find((n) => n[0] === node.id)) {
        nodes.remove(node.id);

        // Remove edges
        edges.forEach((edge) => {
          if (edge.from === node.id || edge.to === node.id) {
            edges.remove(edge.id);
          }
        });
      }
    });

    // Remove old edges
    edges.forEach((edge) => {
      graph.forEach((node) => {
        if (!node[1].includes(edge.from) || !node[1].includes(edge.to)) {
          edges.remove(edge.id);
        }
      });
    });

    // Add new nodes
    graph.forEach((node) => {
      if (!nodes.get(node[0]) && !node[0].startsWith("inspector")) {
        nodes.add({ id: node[0], label: node[0] });
      }

      // Add new edges
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

    // Add new edges
    edges.forEach((edge) => {
      if (
        !graph.find(
          (node) => node[0] === edge.from && node[1].includes(edge.to)
        )
      ) {
        edges.remove(edge.id);
      }
    });

    // Remove old edges
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

/**
 * Updates the table with the latest action data.
 * @param {Object} data - The action data.
 */
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

  // Remove old rows
  const oldRows = tableBody.getElementsByTagName("tr");
  if (oldRows.length > 50) {
    tableBody.removeChild(oldRows[oldRows.length - 1]);
  }
};

/**
 * Updates the states of known users.
 * @param {Array} users - The list of users.
 */
const updateUsersStates = (users) => {
  knownUsersList = users.filter((user) => !user.id.startsWith("inspector"));

  knownUsersList.forEach((user) => {
    // Get color based on the state of the user
    const colors = generateStateColor(user.state);

    // Find the respective node and update its color
    if (nodes.get(user.id)) {
      nodes.update({
        id: user.id,
        color: colors.background,
        font: { color: colors.foreground },
      });
    }

    // Update legend with the unique instances of states found with their respective colors
    const legend = document.getElementById("legend");

    // Add new legend elements if they don't exist
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

/**
 * Generates a color based on the provided state.
 * @param {string} state - The state.
 * @returns {Object} - The generated color.
 */
const generateStateColor = (state) => {
  // Default color is a light blue background with black text
  if (!state) {
    return {
      background: "#87CEEB",
      foreground: "#000000",
    };
  }

  // Hash function using DJB2 algorithm
  let hash = 5381;
  for (let i = 0; i < state.length; i++) {
    hash = (hash * 33) ^ state.charCodeAt(i);
  }

  // Convert hash to a six-digit hexadecimal color
  const backgroundColor = (hash >>> 0)
    .toString(16)
    .padStart(6, "0")
    .slice(0, 6);

  // Generate a contrast color for the text
  const foregroundColor =
    parseInt(backgroundColor, 16) > 0xffffff / 2 ? "#000000" : "#ffffff";

  return {
    background: `#${backgroundColor}`,
    foreground: foregroundColor,
  };
};
