import GraphView from "./GraphView";
import DataModel from "./DataModel";
import Selector from "./Selector";
import { TextNode, ImageNode, NodeType, NodeFactory } from "./UniversalNode";

/**
 * 编辑器类
 * 整合GraphView、DataModel和Selector，提供完整的画布编辑功能
 */
export default class Editor {
  private container: HTMLElement;
  private graphView: GraphView;
  private dataModel: DataModel;
  private selector: Selector;
  private dragState: {
    dragging: boolean;
    resizing: boolean;
    resizeHandle: string | null;
    startPoint: { x: number; y: number };
    startNodePos: { x: number; y: number };
    startNodeSize: { width: number; height: number };
  };

  /**
   * 构造函数
   * @param container 包含画布的容器元素
   * @param options 编辑器配置选项
   */
  constructor(
    container: HTMLElement,
    options: {
      width: number;
      height: number;
      backgroundColor?: string;
    },
  ) {
    this.container = container;

    // 创建画布视图
    this.graphView = new GraphView(container, {
      width: options.width,
      height: options.height,
      backgroundColor: options.backgroundColor,
    });

    // 创建选择器
    this.selector = new Selector(this.graphView);

    // 创建数据模型
    this.dataModel = new DataModel(null, this.graphView, this.selector);

    // 初始化拖拽状态
    this.dragState = {
      dragging: false,
      resizing: false,
      resizeHandle: null,
      startPoint: { x: 0, y: 0 },
      startNodePos: { x: 0, y: 0 },
      startNodeSize: { width: 0, height: 0 },
    };

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件处理
   */
  private bindEvents(): void {
    // 鼠标按下事件
    this.graphView.addEventListener("mousedown", (event, point) => {
      // 检查是否点击了选中节点的调整大小控制点
      const handle = this.selector.getResizeHandleAt(point.x, point.y);

      if (handle) {
        // 开始调整大小
        this.dragState.resizing = true;
        this.dragState.resizeHandle = handle;
        this.dragState.startPoint = { ...point };

        const selectedNode = this.selector.getSelectedNode();
        if (selectedNode) {
          this.dragState.startNodePos = { ...selectedNode.getPosition() };
          this.dragState.startNodeSize = { ...selectedNode.getSize() };
        }
      } else {
        // 查找点击的节点
        const node = this.dataModel.findNodeByPoint(point.x, point.y);

        if (node) {
          // 选中节点
          this.selector.select(node);

          // 准备拖动
          this.dragState.dragging = true;
          this.dragState.startPoint = { ...point };
          this.dragState.startNodePos = { ...node.getPosition() };
        } else {
          // 如果点击空白处，取消选择
          this.selector.clearSelection();
        }
      }

      // 重绘画布
      this.redraw();
    });

    // 鼠标移动事件
    this.graphView.addEventListener("mousemove", (event, point) => {
      // 计算移动距离
      const dx = point.x - this.dragState.startPoint.x;
      const dy = point.y - this.dragState.startPoint.y;

      const selectedNode = this.selector.getSelectedNode();

      if (this.dragState.resizing && selectedNode) {
        // 处理调整大小
        this.handleResize(selectedNode, dx, dy);
      } else if (this.dragState.dragging && selectedNode) {
        // 处理拖动
        const newX = this.dragState.startNodePos.x + dx;
        const newY = this.dragState.startNodePos.y + dy;

        // 确保不超出画布边界
        const maxX = this.graphView.getWidth() - selectedNode.getSize().width;
        const maxY = this.graphView.getHeight() - selectedNode.getSize().height;

        selectedNode.setPosition(
          Math.max(0, Math.min(newX, maxX)),
          Math.max(0, Math.min(newY, maxY)),
        );
      }

      // 重绘画布
      this.redraw();
    });

    // 鼠标松开事件
    this.graphView.addEventListener("mouseup", (event, point) => {
      // 重置拖拽状态
      this.dragState.dragging = false;
      this.dragState.resizing = false;
      this.dragState.resizeHandle = null;
    });

    // 键盘删除事件
    this.graphView.addEventListener("delete", (event) => {
      const selectedNode = this.selector.getSelectedNode();
      if (selectedNode) {
        this.dataModel.removeNode(selectedNode.getId());
        this.redraw();
      }
    });

    this.graphView.addEventListener("redraw", (event) => {
      this.redraw();
    });
  }

  /**
   * 处理调整大小
   * @param node 要调整大小的节点
   * @param dx X方向的移动距离
   * @param dy Y方向的移动距离
   */
  private handleResize(node: any, dx: number, dy: number): void {
    const minSize = 20; // 最小尺寸
    const startPos = this.dragState.startNodePos;
    const startSize = this.dragState.startNodeSize;

    switch (this.dragState.resizeHandle) {
      case "lt": // 左上
        // 调整位置和大小
        const newWidthLT = Math.max(minSize, startSize.width - dx);
        const newHeightLT = Math.max(minSize, startSize.height - dy);
        const newXLT = startPos.x + (startSize.width - newWidthLT);
        const newYLT = startPos.y + (startSize.height - newHeightLT);
        node.setPosition(newXLT, newYLT);
        node.setSize(newWidthLT, newHeightLT);
        break;

      case "rt": // 右上
        // 调整宽度和Y位置
        const newWidthRT = Math.max(minSize, startSize.width + dx);
        const newHeightRT = Math.max(minSize, startSize.height - dy);
        const newYRT = startPos.y + (startSize.height - newHeightRT);
        node.setPosition(startPos.x, newYRT);
        node.setSize(newWidthRT, newHeightRT);
        break;

      case "lb": // 左下
        // 调整X位置和高度
        const newWidthLB = Math.max(minSize, startSize.width - dx);
        const newHeightLB = Math.max(minSize, startSize.height + dy);
        const newXLB = startPos.x + (startSize.width - newWidthLB);
        node.setPosition(newXLB, startPos.y);
        node.setSize(newWidthLB, newHeightLB);
        break;

      case "rb": // 右下
        // 只调整大小
        const newWidthRB = Math.max(minSize, startSize.width + dx);
        const newHeightRB = Math.max(minSize, startSize.height + dy);
        node.setSize(newWidthRB, newHeightRB);
        break;
    }
  }

  /**
   * 重绘画布
   */
  public redraw(): void {
    const ctx = this.graphView.getContext();
    if (!ctx) return;

    // 清空画布 (这会绘制背景色和背景图片)
    this.graphView.clear();

    // 获取排序后的节点
    const nodes = this.dataModel.getSortedNodes();

    // 绘制所有节点
    for (const node of nodes) {
      node.draw(ctx);
    }

    // 绘制选择框
    this.selector.drawSelection(ctx);
  }

  /**
   * 选择节点
   * @param nodeId 要选择的节点ID
   */
  public selectNode(nodeId: string): void {
    const node = this.dataModel.getNode(nodeId);
    if (node) {
      this.selector.select(node);
      this.redraw();
    }
  }

  /**
   * 清空选择
   */
  public clearSelection(): void {
    this.selector.clearSelection();
    this.redraw();
  }

  /**
   * 获取当前选中的节点
   * @returns 当前选中的节点
   */
  public getSelectedNode(): any {
    return this.selector.getSelectedNode();
  }

  /**
   * 删除节点
   * @param nodeId 要删除的节点ID
   * @returns 是否删除成功
   */
  public removeNode(nodeId: string): boolean {
    const result = this.dataModel.removeNode(nodeId);
    this.redraw();
    return result;
  }

  /**
   * 清空所有节点
   */
  public clear(): void {
    this.dataModel.clear();
    this.redraw();
  }

  /**
   * 将当前编辑器状态导出为JSON字符串
   * @returns JSON字符串
   */
  public exportToJSON(): string {
    // 获取所有节点的数据
    const nodesData = this.dataModel.exportToJSON();

    // 添加背景设置数据
    const editorData = {
      backgroundColor: this.getBackgroundColor(),
      backgroundImage: this.getBackgroundImage(),
      nodes: JSON.parse(nodesData),
    };

    return JSON.stringify(editorData);
  }

  /**
   * 从JSON字符串中加载编辑器状态
   * @param jsonString JSON字符串
   */
  public loadFromJSON(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);

      // 加载背景设置
      if (data.backgroundColor) {
        this.setBackgroundColor(data.backgroundColor);
      }

      if (data.backgroundImage) {
        this.setBackgroundImage(data.backgroundImage);
      }

      // 加载节点数据
      if (data.nodes) {
        this.dataModel.loadFromJSON(data.nodes);
      }

      // 重绘
      this.redraw();
    } catch (error) {
      console.error("Failed to load from JSON:", error);
    }
  }

  /**
   * 获取画布宽度
   * @returns 画布宽度
   */
  public getWidth(): number {
    return this.graphView.getWidth();
  }

  /**
   * 获取画布高度
   * @returns 画布高度
   */
  public getHeight(): number {
    return this.graphView.getHeight();
  }

  /**
   * 添加节点选择事件监听
   * @param callback 节点选择变化的回调函数
   */
  public addSelectionChangeListener(callback: (node: any) => void): void {
    this.selector.addSelectionChangeListener(callback);
  }

  /**
   * 移除节点选择事件监听
   * @param callback 要移除的回调函数
   */
  public removeSelectionChangeListener(callback: (node: any) => void): void {
    this.selector.removeSelectionChangeListener(callback);
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
    const node = this.dataModel.addTextNode(attributes);
    this.redraw();
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
    const node = this.dataModel.addImageNode(attributes);
    this.redraw();
    return node;
  }

  /**
   * 将文本节点转换为图片节点
   * @param textNodeId 文本节点ID
   * @param imageUrl 图片URL
   * @returns 转换后的图片节点
   */
  public convertTextToImage(
    textNodeId: string,
    imageUrl?: string,
  ): ImageNode | null {
    const node = this.dataModel.getNode(textNodeId);
    if (!(node instanceof TextNode)) return null;

    // 创建新的图片节点
    const imageNode = NodeFactory.convertTextToImage(
      node as TextNode & ImageNode,
      imageUrl,
    );

    // 移除原来的文本节点
    this.dataModel.removeNode(textNodeId);

    // 添加新的图片节点
    this.dataModel.addNode(imageNode);

    // 选中新的节点
    this.selector.select(imageNode);

    // 重绘
    this.redraw();

    return imageNode;
  }

  /**
   * 将图片节点转换为文本节点
   * @param imageNodeId 图片节点ID
   * @param text 文本内容
   * @returns 转换后的文本节点
   */
  public convertImageToText(
    imageNodeId: string,
    text?: string,
  ): TextNode | null {
    const node = this.dataModel.getNode(imageNodeId);
    if (!(node instanceof ImageNode)) return null;

    // 创建新的文本节点
    const textNode = NodeFactory.convertImageToText(
      node as TextNode & ImageNode,
      text,
    );

    // 移除原来的图片节点
    this.dataModel.removeNode(imageNodeId);

    // 添加新的文本节点
    this.dataModel.addNode(textNode);

    // 选中新的节点
    this.selector.select(textNode);

    // 重绘
    this.redraw();

    return textNode;
  }

  /**
   * 设置画布背景颜色
   * @param color 背景颜色值
   */
  public setBackgroundColor(color: string): void {
    this.graphView.setBackgroundColor(color);
  }

  /**
   * 设置画布背景图片
   * @param imageUrl 图片URL
   */
  public setBackgroundImage(imageUrl: string): void {
    this.graphView.setBackgroundImage(imageUrl);
  }

  /**
   * 获取当前背景颜色
   * @returns 当前背景颜色
   */
  public getBackgroundColor(): string {
    return this.graphView["backgroundColor"];
  }

  /**
   * 获取当前背景图片
   * @returns 当前背景图片URL或null
   */
  public getBackgroundImage(): string | null {
    return this.graphView["backgroundImage"];
  }

  /**
   * 清除背景图片
   */
  public clearBackgroundImage(): void {
    this.graphView.setBackgroundColor(this.graphView["backgroundColor"]);
  }
}
