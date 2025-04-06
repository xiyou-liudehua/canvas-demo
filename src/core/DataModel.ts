import GraphNode from "./GraphNode";
import { TextNode, ImageNode } from "./UniversalNode";

/**
 * 数据模型类
 * 负责管理所有图形节点数据
 */
export default class DataModel {
  private nodes: Map<string, GraphNode>;
  private graphView: any;
  private selector: any;
  private nextId: number;

  /**
   * 构造函数
   * @param graphData 初始图形数据
   * @param graphView 画布对象
   * @param selector 选择器对象
   */
  constructor(graphData: any, graphView: any, selector: any) {
    this.nodes = new Map();
    this.graphView = graphView;
    this.selector = selector;
    this.nextId = 1;

    // 如果有初始数据，则加载
    if (graphData) {
      this.loadFromData(graphData);
    }
  }

  /**
   * 从数据对象加载节点
   * @param graphData 图形数据对象
   */
  public loadFromData(graphData: any): void {
    // 清空现有节点
    this.nodes.clear();

    // 初始化ID计数器
    this.nextId = 1;

    // 遍历数据对象，创建节点
    if (Array.isArray(graphData.nodes)) {
      graphData.nodes.forEach((nodeData: any) => {
        this.createNodeFromData(nodeData);
      });

      // 更新下一个ID
      const maxId =
        Math.max(
          ...Array.from(this.nodes.keys()).map((id) =>
            parseInt(id.replace("node", "")),
          ),
        ) || 0;
      this.nextId = maxId + 1;
    }
  }

  /**
   * 生成唯一ID
   * @returns 新的唯一ID
   */
  public generateId(): string {
    return `node${this.nextId++}`;
  }

  /**
   * 添加节点到数据模型
   * @param node 要添加的节点
   */
  public addNode(node: GraphNode): void {
    this.nodes.set(node.getId(), node);
  }

  /**
   * 创建节点
   * @param nodeData 节点数据
   * @returns 创建的节点
   */
  private createNodeFromData(nodeData: any): GraphNode | null {
    let node: GraphNode | null = null;

    // 根据类型创建不同的节点
    switch (nodeData.type) {
      case "text":
        node = new TextNode(this.graphView, nodeData.id || this.generateId(), {
          x: nodeData.x || 0,
          y: nodeData.y || 0,
          width: nodeData.width || 100,
          height: nodeData.height || 60,
          backgroundColor: nodeData.backgroundColor || "#3498db",
          borderColor: nodeData.borderColor || "#2980b9",
          borderWidth: nodeData.borderWidth || 0,
          borderRadius: nodeData.borderRadius || 0,
          opacity: nodeData.opacity !== undefined ? nodeData.opacity : 1,
          zIndex: nodeData.zIndex || 0,
          text: nodeData.text || "",
          textColor: nodeData.textColor || "#ffffff",
          fontSize: nodeData.fontSize || 14,
        });
        break;

      case "image":
        node = new ImageNode(this.graphView, nodeData.id || this.generateId(), {
          x: nodeData.x,
          y: nodeData.y,
          width: nodeData.width,
          height: nodeData.height,
          imageUrl: nodeData.imageUrl,
          backgroundColor: nodeData.backgroundColor,
          borderColor: nodeData.borderColor,
          borderWidth: nodeData.borderWidth,
          borderRadius: nodeData.borderRadius,
          opacity: nodeData.opacity,
          zIndex: nodeData.zIndex,
        });
        break;
      default:
        console.warn(`未知的节点类型: ${nodeData.type}`);
        break;
    }

    // 如果创建了节点，则添加到管理器中
    if (node) {
      this.addNode(node);
    }

    return node;
  }

  /**
   * 添加通用文本节点
   * @param attributes 节点属性
   * @returns 创建的文本节点
   */
  public addTextNode(attributes: {
    x: number;
    y: number;
    width: number;
    height: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    zIndex?: number;
    text?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
  }): TextNode {
    const node = new TextNode(this.graphView, this.generateId(), {
      ...attributes,
      zIndex:
        attributes.zIndex !== undefined ? attributes.zIndex : this.nextId++,
      opacity: attributes.opacity !== undefined ? attributes.opacity : 1,
    });

    this.addNode(node);
    return node;
  }

  /**
   * 添加通用图片节点
   * @param attributes 节点属性
   * @returns 创建的图片节点
   */
  public addImageNode(attributes: {
    x: number;
    y: number;
    width: number;
    height: number;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    opacity?: number;
    zIndex?: number;
    imageUrl?: string;
  }): ImageNode {
    const node = new ImageNode(this.graphView, this.generateId(), {
      ...attributes,
      zIndex:
        attributes.zIndex !== undefined ? attributes.zIndex : this.nextId++,
      opacity: attributes.opacity !== undefined ? attributes.opacity : 1,
    });

    this.addNode(node);
    return node;
  }

  /**
   * 根据ID获取节点
   * @param id 节点ID
   * @returns 节点实例或null
   */
  public getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * 获取所有节点
   * @returns 所有节点的数组
   */
  public getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * 按ZIndex排序的节点数组
   * @returns 按ZIndex排序的节点数组
   */
  public getSortedNodes(): GraphNode[] {
    return this.getAllNodes().sort((a, b) => a.getZIndex() - b.getZIndex());
  }

  /**
   * 删除节点
   * @param id 要删除的节点ID
   * @returns 是否删除成功
   */
  public removeNode(id: string): boolean {
    // 如果节点正在被选择，先取消选择
    if (this.selector.getSelectedNode()?.getId() === id) {
      this.selector.clearSelection();
    }

    return this.nodes.delete(id);
  }

  /**
   * 查找包含指定点的节点
   * @param x 点的X坐标
   * @param y 点的Y坐标
   * @returns 包含该点的节点，按ZIndex从高到低排序，找不到返回null
   */
  public findNodeByPoint(x: number, y: number): GraphNode | null {
    // 按ZIndex从高到低排序，这样可以先选中上层的节点
    const sortedNodes = this.getAllNodes().sort(
      (a, b) => b.getZIndex() - a.getZIndex(),
    );

    for (const node of sortedNodes) {
      if (node.containsPoint(x, y)) {
        return node;
      }
    }

    return null;
  }

  /**
   * 将画布数据导出为JSON
   * @returns 画布数据的JSON字符串
   */
  public exportToJSON(): string {
    const nodeData = this.getAllNodes().map((node) => {
      // 基本属性
      const data: any = {
        id: node.getId(),
        type:
          node instanceof TextNode
            ? "text"
            : node instanceof ImageNode
            ? "image"
            : "unknown",
        ...node.getPosition(),
        ...node.getSize(),
        zIndex: node.getZIndex(),
      };

      // 根据类型添加特定属性
      if (node instanceof ImageNode) {
        data.imageUrl = node.getImageUrl();
        data.borderRadius = node.getBorderRadius();
      }

      // 添加样式属性
      data.backgroundColor = node.getBackgroundColor();
      data.borderColor = node.getBorderColor();
      data.borderWidth = node.getBorderWidth();
      data.opacity = node.getOpacity();

      // 文字属性
      if (node instanceof TextNode) {
        data.text = node.getText();
        data.textColor = node.getTextColor();
        data.fontSize = node.getFontSize();
        data.borderRadius = node.getBorderRadius();
      }

      return data;
    });

    return JSON.stringify({ nodes: nodeData });
  }

  /**
   * 清空所有节点
   */
  public clear(): void {
    this.nodes.clear();
    this.selector.clearSelection();
  }

  /**
   * 从JSON字符串加载数据
   * @param jsonString JSON字符串或对象
   */
  public loadFromJSON(jsonString: string | object): void {
    let data: any;

    // 解析JSON字符串
    if (typeof jsonString === "string") {
      try {
        data = JSON.parse(jsonString);
      } catch (error) {
        console.error("解析JSON失败:", error);
        return;
      }
    } else {
      data = jsonString;
    }

    // 清空现有节点
    this.clear();

    // 加载节点
    if (data.nodes && Array.isArray(data.nodes)) {
      for (const nodeData of data.nodes) {
        // 根据类型创建节点
        if (nodeData.type === "text") {
          this.addTextNode({
            x: nodeData.x,
            y: nodeData.y,
            width: nodeData.width || 100,
            height: nodeData.height || 60,
            backgroundColor: nodeData.backgroundColor,
            borderColor: nodeData.borderColor,
            borderWidth: nodeData.borderWidth,
            borderRadius: nodeData.borderRadius,
            opacity: nodeData.opacity,
            zIndex: nodeData.zIndex,
            text: nodeData.text || "",
            textColor: nodeData.textColor,
            fontSize: nodeData.fontSize,
          });
        } else if (nodeData.type === "image") {
          this.addImageNode({
            x: nodeData.x,
            y: nodeData.y,
            width: nodeData.width || 100,
            height: nodeData.height || 100,
            backgroundColor: nodeData.backgroundColor,
            borderColor: nodeData.borderColor,
            borderWidth: nodeData.borderWidth,
            borderRadius: nodeData.borderRadius,
            opacity: nodeData.opacity,
            zIndex: nodeData.zIndex,
            imageUrl: nodeData.imageUrl,
          });
        }
      }
    }
  }
}
