import type { AnyContentEntity } from '../entities/ContentEntity';
import type { Serializable } from '../entities/serializable';

export type Id = number;
export type Uid = string;
export type ParentId = number;
export type PositionInAggregate = number;

export enum NodeType {
  ACTIVITY = 'A',
  CONTENT_CONTAINER = 'CC',
  CONTENT_ELEMENT = 'CE',
}

export interface GraphNode {
  id: Id;
  uid: Uid;
  type: NodeType;
  parentId: ParentId;
  positionInAggregate: PositionInAggregate;
}

export type GraphNodeArray = [
  Id,
  Uid,
  NodeType,
  ParentId,
  PositionInAggregate,
];

export class ContentGraph implements Serializable<ContentGraph> {
  static api: any;
  static DEFAULT_ENV_PATH = 'repository';

  envPath: string;
  repositoryId: number;
  nodes: GraphNodeArray[];
  activities: GraphNodeArray[];
  elements: GraphNodeArray[];

  // Optional repository reference for efficient entity loading
  // Not serialized - only used when graph is generated from repository
  private _repository?: any;

  // Lazy-loaded indexes for O(1) lookups
  // Built on first search operation, then reused for all subsequent searches
  private _indexed = false;
  private _nodesByUid!: Map<string, GraphNodeArray>;
  private _nodesById!: Map<number, GraphNodeArray>;
  private _activitiesById!: Map<number, GraphNodeArray>;
  private _elementsById!: Map<number, GraphNodeArray>;

  readonly serializableProps = ['nodes', 'repositoryId', 'envPath'] as const;

  constructor(
    nodes: GraphNodeArray[],
    repositoryId: number,
    envPath: string = ContentGraph.DEFAULT_ENV_PATH,
    repository?: any,
  ) {
    this.nodes = nodes;
    // Derived properties - computed from nodes, not serialized
    this.activities = this.nodes.filter((it) => it[2] !== NodeType.CONTENT_ELEMENT);
    this.elements = this.nodes.filter((it) => it[2] === NodeType.CONTENT_ELEMENT);
    this.repositoryId = repositoryId;
    this.envPath = envPath;
    this._repository = repository;
  }

  /**
   * Build index maps for fast O(1) lookups
   * Called lazily on first search operation
   * Single pass through nodes array to populate all indexes
   */
  private buildIndexes(): void {
    if (this._indexed)
      return;

    this._nodesByUid = new Map();
    this._nodesById = new Map();
    this._activitiesById = new Map();
    this._elementsById = new Map();

    // Single pass through all nodes to build all indexes
    for (const node of this.nodes) {
      const [id, uid, type] = node;

      // Index by UID (all nodes)
      this._nodesByUid.set(uid, node);

      // Index by ID (all nodes)
      this._nodesById.set(id, node);

      // Index by type-specific ID
      if (type === NodeType.CONTENT_ELEMENT) {
        this._elementsById.set(id, node);
      } else {
        // Activities and containers go into activities index
        this._activitiesById.set(id, node);
      }
    }

    this._indexed = true;
  }

  /**
   * Check if indexes are built
   * @returns true if indexes are ready for use
   */
  isIndexed(): boolean {
    return this._indexed;
  }

  /**
   * Manually rebuild indexes
   * Use this if you modify the nodes array directly (rare)
   * Clears existing indexes and rebuilds on next search
   */
  rebuildIndexes(): void {
    this._indexed = false;
    this.buildIndexes();
  }

  /**
   * Get index statistics
   * Useful for debugging and monitoring
   */
  getIndexStats() {
    if (!this._indexed) {
      return {
        indexed: false,
        nodeCount: this.nodes.length,
      };
    }

    return {
      indexed: true,
      nodeCount: this.nodes.length,
      nodesByUid: this._nodesByUid.size,
      nodesById: this._nodesById.size,
      activitiesById: this._activitiesById.size,
      elementsById: this._elementsById.size,
      memoryEstimate: this.estimateIndexMemory(),
    };
  }

  /**
   * Estimate memory used by indexes (in bytes)
   * Rough approximation for monitoring
   */
  private estimateIndexMemory(): number {
    // Each Map entry: ~8 bytes for key + ~8 bytes for reference
    const entrySize = 16;
    const mapOverhead = 32; // Rough overhead per Map

    return (
      (this._nodesByUid.size * entrySize + mapOverhead)
      + (this._nodesById.size * entrySize + mapOverhead)
      + (this._activitiesById.size * entrySize + mapOverhead)
      + (this._elementsById.size * entrySize + mapOverhead)
    );
  }

  findNodeByUid(uid: string): GraphNode | null {
    this.buildIndexes();
    const node = this._nodesByUid.get(uid);
    return node ? this.formatNode(node) : null;
  }

  findNodeById(id: number): GraphNode | null {
    this.buildIndexes();
    const node = this._nodesById.get(id);
    return node ? this.formatNode(node) : null;
  }

  findActivityById(id: number): GraphNode | null {
    this.buildIndexes();
    const node = this._activitiesById.get(id);
    return node ? this.formatNode(node) : null;
  }

  findElementById(id: number): GraphNode | null {
    this.buildIndexes();
    const node = this._elementsById.get(id);
    return node ? this.formatNode(node) : null;
  }

  getNodePath(uid: string) {
    if (!uid)
      throw new Error('uid is required');
    const node = this.findNodeByUid(uid);
    if (!node)
      return null;
    if (
      node.type !== NodeType.CONTENT_CONTAINER
      && node.type !== NodeType.CONTENT_ELEMENT
    ) {
      throw new Error('Node must be a content element or a container!');
    }
    return node.type === NodeType.CONTENT_ELEMENT
      ? this.getElementPath(uid)
      : this.getContainerPath(uid);
  }

  getContainerPath(id: number | string) {
    if (!id)
      throw new Error('id is required');
    const node = typeof id === 'number'
      ? this.findActivityById(id)
      : this.findNodeByUid(id);
    if (!node)
      return null;
    if (node.type !== NodeType.CONTENT_CONTAINER)
      throw new Error('Node must be a container!');
    const [activity, ...subPath] = this.resolveNodeLocation(node.parentId);
    const [rootContainer, ...nestedContainers] = subPath?.length > 0
      ? [...subPath, node]
      : [node];
    const containerInActivityPathPrefix = this.getContainerInActivityPathPrefix(
      rootContainer.positionInAggregate,
    );
    const containerPath = nestedContainers?.length
      ? this.constructContainerPath(nestedContainers)
      : null;
    const activityPath = containerInActivityPathPrefix
      + (containerPath ? `.${containerPath}` : '');
    return {
      outline: this.getAncestors(rootContainer.uid),
      activity,
      activityPath,
      contentContainer: rootContainer,
      contentContainerPath: containerPath,
    };
  }

  getElementPath(id: number | string) {
    if (!id)
      throw new Error('id is required');
    const node = typeof id === 'number'
      ? this.findElementById(id)
      : this.findNodeByUid(id);
    if (!node)
      return null;
    if (node.type !== NodeType.CONTENT_ELEMENT)
      throw new Error('Node must be a content element!');
    const [activity, container, ...subPath]
      = this.resolveNodeLocation(node.parentId);
    const containerInActivityPathPrefix = this.getContainerInActivityPathPrefix(
      container.positionInAggregate,
    );
    const containerPath = this.constructElementPath(subPath, node);
    const activityPath = `${containerInActivityPathPrefix}.${containerPath}`;
    return {
      outline: this.getAncestors(container.uid),
      activity,
      activityPath,
      contentContainer: container,
      contentContainerPath: containerPath,
    };
  }

  // Loveable naming
  private getContainerInActivityPathPrefix(positionInAggregate: number) {
    return `contentContainers.${positionInAggregate}`;
  }

  private constructContainerPath(
    subPath: Array<GraphNode> = [],
  ): string {
    return subPath.reduce((acc, it) => {
      if (acc !== '')
        acc += '.';
      return `${acc}containers.${it.positionInAggregate}`;
    }, '');
  }

  private constructElementPath(
    subPath: Array<GraphNode> = [],
    node: GraphNode,
  ): string {
    const rootPath = subPath.reduce((acc, it) => {
      return `${acc}containers.${it.positionInAggregate}.`;
    }, '');
    return `${rootPath}elements.${node.positionInAggregate}`;
  }

  // Go up the tree until we find an Activity node
  private resolveNodeLocation(
    parentActivityId: number,
    path: Array<GraphNode> = [],
  ): Array<GraphNode> {
    const node = this.findActivityById(parentActivityId);
    if (!node)
      throw new Error(`Activity with id ${parentActivityId} not found`);
    if (node.type === NodeType.ACTIVITY)
      return [node, ...path];
    return this.resolveNodeLocation(node.parentId, [node, ...path]);
  }

  private formatNode(node: GraphNodeArray): GraphNode {
    const [id, uid, type, parentId, positionInAggregate] = node;
    return { id, uid, type, parentId, positionInAggregate };
  }

  getAncestors(uid: string): Array<GraphNode> {
    const node = this.findNodeByUid(uid);
    if (!node)
      throw new Error(`Node with uid ${uid} not found`);
    if (!node.parentId)
      return [];
    return this.getActivityAncestors(node.parentId);
  }

  private getActivityAncestors(
    id: number,
    path: Array<GraphNode> = [],
  ): Array<GraphNode> {
    const node = this.findActivityById(id);
    if (!node)
      throw new Error(`Node with id ${id} not found`);
    const lineage = [node, ...path];
    if (!node.parentId)
      return lineage;
    return this.getActivityAncestors(node.parentId, lineage);
  }

  /**
   * Serialize content graph to JSON
   * Returns object with nodes, repositoryId, and envPath for reconstruction
   * Note: Derived properties (activities, elements) and indexes are not serialized
   * Indexes will be rebuilt lazily when needed after deserialization
   */
  toJSON(): {
    nodes: GraphNodeArray[];
    repositoryId: number;
    envPath: string;
  } {
    return {
      nodes: this.nodes,
      repositoryId: this.repositoryId,
      envPath: this.envPath,
    };
  }

  /**
   * Deserialize content graph from JSON data
   * Handles both string (from Redis) and object (from memory cache)
   */
  static fromJSON(data: any): ContentGraph {
    // Handle string format (from Redis)
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    if (!parsed.repositoryId || !parsed.envPath) {
      const msg = 'ContentGraph requires repositoryId and envPath';
      throw new Error(`${msg} for deserialization`);
    }

    return new ContentGraph(
      parsed.nodes || [],
      parsed.repositoryId,
      parsed.envPath,
    );
  }

  /**
   * Create a shallow clone of the content graph
   * Note: Indexes are not copied - they will be rebuilt lazily on the clone
   */
  clone(): ContentGraph {
    const cloned = new ContentGraph([...this.nodes], this.repositoryId, this.envPath);
    // Indexes are intentionally not copied - they'll be rebuilt lazily on first search
    return cloned;
  }

  /**
   * Get S3 path for storing the content graph
   * Graph is stored at repository root as 'content_graph.json'
   * @param repositoryId - Repository ID
   * @param envPath - Environment path
   * @returns S3 path for the graph file
   */
  static getGraphPath(repositoryId: number, envPath: string): string {
    return `${envPath}/${repositoryId}/content_graph.json`;
  }

  /**
   * Save the content graph to S3 at repository root
   * Stores as 'content_graph.json' for fast loading without loading all content
   * @returns Promise that resolves when saved
   */
  async save(): Promise<void> {
    if (!ContentGraph.api)
      throw new Error('ContentGraph.api is not configured');

    const path = ContentGraph.getGraphPath(this.repositoryId, this.envPath);
    const data = this.toJSON();

    await ContentGraph.api.saveObject(path, JSON.stringify(data));
  }

  /**
   * Load content graph from S3 for a given repository
   * @param repositoryId - Repository ID to load graph for
   * @param envPath - Environment path (e.g., 'repository', 'snapshot')
   * @returns ContentGraph instance
   */
  static async load(repositoryId: number, envPath: string): Promise<ContentGraph> {
    if (!ContentGraph.api)
      throw new Error('ContentGraph.api is not configured');

    const path = ContentGraph.getGraphPath(repositoryId, envPath);
    const { content } = await ContentGraph.api.getObject(path);
    const parsed = JSON.parse(content);

    return new ContentGraph(
      parsed.nodes || [],
      parsed.repositoryId || repositoryId,
      parsed.envPath || envPath,
    );
  }

  /**
   * Load full entity data for a graph node by traversing the repository hierarchy
   * If graph was created from a repository, uses that instance directly (efficient)
   * Otherwise loads repository from storage
   *
   * @param uid - Node UID to load
   * @returns Fully loaded and typed entity (Activity | ContentContainer | ContentElement)
   *
   * @example
   * Load any entity by UID (uses cached repository if available)
   * const entity = await graph.loadEntity('activity-uid')
   * if (ContentEntity.isActivity(entity)) {
   *   console.log(entity.type)
   * }
   *
   * @example
   * Load and make public
   * const entity = await graph.loadEntity('uid')
   * await entity.makePublic()
   */
  async loadEntity(uid: string): Promise<AnyContentEntity> {
    const node = this.findNodeByUid(uid);
    if (!node)
      throw new Error(`Node with uid ${uid} not found in graph`);

    // Get repository - use cached instance if available
    const repository = await this.getRepository();

    // Ensure repository is fully loaded
    if (!repository.isLoaded) {
      await repository.load();
    }

    // Navigate hierarchy based on node type
    switch (node.type) {
      case NodeType.ACTIVITY:
        return this.findActivityInRepository(repository, node.id);

      case NodeType.CONTENT_CONTAINER:
        return this.findContainerInRepository(repository, node);

      case NodeType.CONTENT_ELEMENT:
        return this.findElementInRepository(repository, node);

      default:
        throw new Error(`Cannot load entity: unsupported node type "${node.type}"`);
    }
  }

  /**
   * Get repository instance for entity loading
   * Returns cached repository if available, otherwise loads from storage
   */
  private async getRepository(): Promise<any> {
    // If we have a cached repository, use it
    if (this._repository) {
      return this._repository;
    }

    // Otherwise load from storage
    if (!ContentGraph.api) {
      throw new Error('ContentGraph.api is not configured');
    }

    if (!ContentGraph.api.getRepository) {
      throw new Error('ContentGraph.api.getRepository is not implemented');
    }

    const repository = await ContentGraph.api.getRepository(
      this.repositoryId,
      this.envPath,
    );

    // Cache it for future use
    this._repository = repository;

    return repository;
  }

  /**
   * Find activity by ID in repository structure
   */
  private findActivityInRepository(repository: any, activityId: number): any {
    const activity = repository.structure.find((a: any) => a.id === activityId);
    if (!activity) {
      throw new Error(`Activity with id ${activityId} not found in repository structure`);
    }
    return activity;
  }

  /**
   * Find container by navigating through parent activity/container hierarchy
   * Uses resolveNodeLocation to walk up the tree to find the root activity
   * then walks down through the container path
   */
  private findContainerInRepository(repository: any, node: GraphNode): any {
    // Get full path: [activity, ...containerPath, targetContainer]
    // resolveNodeLocation gives us [activity, container1, container2, ...]
    const locationPath = this.resolveNodeLocation(node.parentId);
    const [activity, ...containerPath] = locationPath;

    // Find root activity in repository
    const activityEntity = this.findActivityInRepository(
      repository,
      activity.id,
    );

    // If target container is direct child of activity (no containerPath)
    if (containerPath.length === 0) {
      const container = activityEntity.contentContainers?.find(
        (c: any) => c.id === node.id,
      );
      if (!container) {
        const msg = `Container with id ${node.id} not found in activity`;
        throw new Error(`${msg} ${activity.id}`);
      }
      return container;
    }

    // Navigate through nested container path
    let current: any = activityEntity;
    for (const pathNode of containerPath) {
      // First level uses contentContainers, nested uses containers
      const containers = current.contentContainers
        || current.containers || [];
      current = containers.find((c: any) => c.id === pathNode.id);
      if (!current) {
        const msg = `Container with id ${pathNode.id}`;
        throw new Error(`${msg} not found in hierarchy`);
      }
    }

    // Find target container in the last parent's containers
    const targetContainer = current.containers?.find(
      (c: any) => c.id === node.id,
    );
    if (!targetContainer) {
      const msg = `Container with id ${node.id} not found in parent`;
      throw new Error(`${msg} container ${current.id}`);
    }

    return targetContainer;
  }

  /**
   * Find element within its parent container
   * Elements have parentId pointing directly to their container
   */
  private findElementInRepository(repository: any, node: GraphNode): any {
    // parentId for elements points to their container
    const parentContainerNode = this.findActivityById(node.parentId);
    if (
      !parentContainerNode
      || parentContainerNode.type !== NodeType.CONTENT_CONTAINER
    ) {
      const msg = `Parent container with id ${node.parentId}`;
      throw new Error(`${msg} not found for element ${node.id}`);
    }
    // Find the parent container
    const container = this.findContainerInRepository(repository, parentContainerNode);

    // Find element within container's elements array
    const element = container.elements?.find((e: any) => e.id === node.id);
    if (!element) {
      const msg = `Element with id ${node.id} not found in container`;
      throw new Error(`${msg} ${container.id}`);
    }

    return element;
  }
}
