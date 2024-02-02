import { Client, Edge } from "../types/socket";

class Graph {
  private nodes: Map<string, Client>;
  private adjacencyList: Map<string, string[]>;
  private numberOfNodes: number;

  constructor() {
    this.numberOfNodes = 0;
    this.adjacencyList = new Map<string, string[]>();
    this.nodes = new Map<string, Client>();
  }

  public addNode(client: Client): void {
    if (!this.nodes.has(client.id)) {
      this.nodes.set(client.id, client);
      this.adjacencyList.set(client.id, []);
      this.numberOfNodes++;
    }
  }

  public addNeighbour(fromNode: string, toNode: string): void {
    if (!this.nodes.has(fromNode) || !this.nodes.has(toNode)) return;

    let neighbours = this.adjacencyList.get(fromNode);
    if (neighbours && !neighbours.find((edge) => edge === toNode)) {
      neighbours.push(toNode);
    }
  }

  public setNeighbours(fromNode: string, neighbours: string[]): void {
    if (!this.nodes.has(fromNode)) return;
    const existingNeighbours = neighbours.filter((neighbour) =>
      this.nodes.has(neighbour)
    );

    this.adjacencyList.set(fromNode, existingNeighbours);
  }

  public deleteNode(nodeId: string) {
    this.nodes.delete(nodeId);
    this.adjacencyList.delete(nodeId);

    for (let edgesInfo of this.adjacencyList) {
      const edgesFromNodeId = edgesInfo[0];
      const newEdges = edgesInfo[1].filter(
        (neighbours) => neighbours !== nodeId
      );

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
          connections += vertex + " ";
        }
      }
      console.log(node + "--> [ " + connections + " ]");
    }
  }

  public hasNode(nodeId: string) {
    return this.nodes.has(nodeId);
  }

  public getNode(nodeId: string) {
    return this.nodes.get(nodeId);
  }
}

export default Graph;
