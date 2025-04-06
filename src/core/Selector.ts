import GraphView from "./GraphView";

/**
 * 选择器类
 * 负责管理选中的图形节点
 */
export default class Selector {
  private graphView: GraphView;
  private selectedNode: any | null;
  private selectionBorderColor: string;
  private resizeHandleSize: number;
  private selectionChangeListeners: Array<(node: any) => void>;

  /**
   * 构造函数
   * @param graphView 画布对象
   */
  constructor(graphView: GraphView) {
    this.graphView = graphView;
    this.selectedNode = null;
    this.selectionBorderColor = "#3498db";
    this.resizeHandleSize = 8;
    this.selectionChangeListeners = [];
  }

  /**
   * 选择节点
   * @param node 要选择的节点
   */
  public select(node: any): void {
    if (this.selectedNode !== node) {
      this.selectedNode = node;
      this.notifySelectionChange();
    }
  }

  /**
   * 清除选择
   */
  public clearSelection(): void {
    if (this.selectedNode) {
      this.selectedNode = null;
      this.notifySelectionChange();
    }
  }

  /**
   * 获取当前选中的节点
   * @returns 选中的节点或null
   */
  public getSelectedNode(): any | null {
    return this.selectedNode;
  }

  /**
   * 绘制选择框和调整大小控制点
   * @param ctx Canvas上下文
   */
  public drawSelection(ctx: CanvasRenderingContext2D): void {
    if (!this.selectedNode) return;

    const { x, y } = this.selectedNode.getPosition();
    const { width, height } = this.selectedNode.getSize();

    // 保存上下文状态
    ctx.save();

    // 绘制选择框
    ctx.strokeStyle = this.selectionBorderColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);

    // 绘制调整大小控制点
    ctx.fillStyle = this.selectionBorderColor;
    ctx.setLineDash([]);

    // 左上角
    this.drawResizeHandle(ctx, x, y);
    // 右上角
    this.drawResizeHandle(ctx, x + width, y);
    // 左下角
    this.drawResizeHandle(ctx, x, y + height);
    // 右下角
    this.drawResizeHandle(ctx, x + width, y + height);

    // 恢复上下文状态
    ctx.restore();
  }

  /**
   * 绘制调整大小控制点
   * @param ctx Canvas上下文
   * @param x 控制点x坐标
   * @param y 控制点y坐标
   */
  private drawResizeHandle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
  ): void {
    const halfSize = this.resizeHandleSize / 2;
    ctx.fillRect(
      x - halfSize,
      y - halfSize,
      this.resizeHandleSize,
      this.resizeHandleSize,
    );
  }

  /**
   * 检查点是否在调整大小的控制点上
   * @param x 点的x坐标
   * @param y 点的y坐标
   * @returns 控制点位置，如果不在任何控制点上则返回null
   */
  public getResizeHandleAt(x: number, y: number): string | null {
    if (!this.selectedNode) return null;

    const nodePos = this.selectedNode.getPosition();
    const nodeSize = this.selectedNode.getSize();
    const handleSize = this.resizeHandleSize;
    const halfHandleSize = handleSize / 2;

    // 检查左上角
    if (
      Math.abs(x - nodePos.x) <= halfHandleSize &&
      Math.abs(y - nodePos.y) <= halfHandleSize
    ) {
      return "lt";
    }

    // 检查右上角
    if (
      Math.abs(x - (nodePos.x + nodeSize.width)) <= halfHandleSize &&
      Math.abs(y - nodePos.y) <= halfHandleSize
    ) {
      return "rt";
    }

    // 检查左下角
    if (
      Math.abs(x - nodePos.x) <= halfHandleSize &&
      Math.abs(y - (nodePos.y + nodeSize.height)) <= halfHandleSize
    ) {
      return "lb";
    }

    // 检查右下角
    if (
      Math.abs(x - (nodePos.x + nodeSize.width)) <= halfHandleSize &&
      Math.abs(y - (nodePos.y + nodeSize.height)) <= halfHandleSize
    ) {
      return "rb";
    }

    return null;
  }

  /**
   * 添加选择变化监听器
   * @param listener 监听函数
   */
  public addSelectionChangeListener(listener: (node: any) => void): void {
    this.selectionChangeListeners.push(listener);
  }

  /**
   * 移除选择变化监听器
   * @param listener 要移除的监听函数
   */
  public removeSelectionChangeListener(listener: (node: any) => void): void {
    const index = this.selectionChangeListeners.indexOf(listener);
    if (index !== -1) {
      this.selectionChangeListeners.splice(index, 1);
    }
  }

  /**
   * 通知所有选择变化监听器
   */
  private notifySelectionChange(): void {
    for (const listener of this.selectionChangeListeners) {
      listener(this.selectedNode);
    }
  }
}
