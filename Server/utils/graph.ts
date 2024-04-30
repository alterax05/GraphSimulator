import { Client } from "../types/socket";

/**
 * Represents a graph data structure.
 */
class Graph {
  private nodes: Map<string, Client>;
  private adjacencyList: Map<string, string[]>;
  private numberOfNodes: number;

  constructor() {
    this.numberOfNodes = 0;
    this.adjacencyList = new Map<string, string[]>();
    this.nodes = new Map<string, Client>();
  }

  /**
   * Adds a node to the graph.
   * 
   * @param client - The client object representing the node to be added.
   */
  public addNode(client: Client): void {
    if (!this.nodes.has(client.id)) {
      this.nodes.set(client.id, client);
      this.adjacencyList.set(client.id, []);
      this.numberOfNodes++;
    }
  }

  /**
   * Checks if two nodes are neighbors in the graph.
   * @param fromNode - The starting node.
   * @param toNode - The target node.
   * @returns A boolean indicating whether the nodes are neighbors.
   */
  public areNeighbours(fromNode: string, toNode: string): boolean {
    if (fromNode === toNode) return true;
    const neighbours = this.adjacencyList.get(fromNode);
    if (neighbours) {
      return neighbours.includes(toNode);
    }
    return false;
  }

  /**
   * Adds a neighbour to a given node in the graph.
   * 
   * @param fromNode - The node to add the neighbour to.
   * @param toNode - The neighbour node to be added.
   */
  public addNeighbour(fromNode: string, toNode: string): void {
    if (!this.nodes.has(fromNode) || !this.nodes.has(toNode)) return;

    let neighbours = this.adjacencyList.get(fromNode);
    if (neighbours && !neighbours.find((edge) => edge === toNode)) {
      neighbours.push(toNode);
    }
  }

  /**
   * Sets the neighbours of a given node in the graph.
   * 
   * @param fromNode - The node for which to set the neighbours.
   * @param neighbours - An array of strings representing the neighbours of the node.
   */
  public setNeighbours(fromNode: string, neighbours: string[]): void {
    if (!this.nodes.has(fromNode)) return;
    const existingNeighbours = neighbours.filter((neighbour) =>
      this.nodes.has(neighbour)
    );

    this.adjacencyList.set(fromNode, existingNeighbours);
  }

  /**
   * Deletes a node from the graph.
   * @param nodeId - The ID of the node to be deleted.
   */
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

  /**
   * Retrieves the nodes of the graph.
   * @returns An array of nodes.
   */
  public getNodes() {
    return this.nodes;
  }

  /**
   * Returns the adjacency list of the graph.
   * 
   * @returns The adjacency list of the graph.
   */
  public getAdjacencyList() {
    return this.adjacencyList;
  }

  /**
   * Prints the connections of each node in the graph.
   */
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

  /**
   * Checks if a node with the specified ID exists in the graph.
   * 
   * @param nodeId - The ID of the node to check.
   * @returns `true` if a node with the specified ID exists, `false` otherwise.
   */
  public hasNode(nodeId: string) {
    return this.nodes.has(nodeId);
  }

  /**
   * Retrieves a node from the graph based on its ID.
   * @param nodeId - The ID of the node to retrieve.
   * @returns The node object if found, or undefined if not found.
   */
  public getNode(nodeId: string) {
    return this.nodes.get(nodeId);
  }
}

export default Graph;
