import { Client, Edge } from "../types/socket";

class Graph {
  private nodes: Map<string, Client>;
  private adjacencyList: Map<string, Edge[]>;
  private numberOfNodes: number;

  constructor() {
    this.numberOfNodes = 0;
    this.adjacencyList = new Map<string, Edge[]>();
    this.nodes = new Map<string, Client>();
  }

  public addNode(client: Client): void {
    if (!this.nodes.has(client.id)) {
      this.nodes.set(client.id, client);
      this.adjacencyList.set(client.id, []);
      this.numberOfNodes++;
    }
  }

  public addEdge(fromNode: string, toNode: string): void {
    if (!this.nodes.has(fromNode) || !this.nodes.has(toNode)) return;

    // TODO: edges have orientation for now
    let edges = this.adjacencyList.get(fromNode);
    if (edges && !edges.find(edge => edge.toNodeId === toNode)) {
      edges.push({
        fromNodeId: fromNode,
        toNodeId: toNode,
      });
    }
  }

  public deleteNode(nodeId: string) {
    this.nodes.delete(nodeId);
    this.adjacencyList.delete(nodeId);

    for (let edgesInfo of this.adjacencyList) {
      const edgesFromNodeId = edgesInfo[0];
      const newEdges = edgesInfo[1].filter(edge => edge.toNodeId !== nodeId);

      this.adjacencyList.set(edgesFromNodeId, newEdges);
    }

    this.numberOfNodes--;
  }

  public getNodes() {
    return this.nodes;
  }

  public getAdjacencyList() {
    return this.adjacencyList;
  }

  public printConnections() {
    const allNodes = this.adjacencyList.keys();
    for (let node of allNodes) {
      let nodeConnections = this.adjacencyList.get(node)!;
      let connections = "";
      if (nodeConnections.length > 0) {
        for (let vertex of nodeConnections) {
          connections += vertex.toNodeId + " ";
        }
      }
      console.log(node + "--> [ " + connections + " ]");
    }
  }
}

export default Graph;
