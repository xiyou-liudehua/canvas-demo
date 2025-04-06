/**
 * 图形节点基类
 * 定义所有图形节点共有的属性和方法
 */
export default abstract class GraphNode {
  protected id: string;
  protected x: number;
  protected y: number;
  protected width: number;
  protected height: number;
  protected backgroundColor: string;
  protected borderColor: string;
  protected borderWidth: number;
  protected opacity: number;
  protected zIndex: number;
  protected graphView: any; // 引用的画布对象

  /**
   * 构造函数
   * @param graphView 画布对象
   * @param id 节点唯一标识
   * @param attributes 节点属性
   */
  constructor(
    graphView: any,
    id: string,
    attributes: {
      x: number;
      y: number;
      width?: number;
      height?: number;
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
      opacity?: number;
      zIndex?: number;
    },
  ) {
    this.graphView = graphView;
    this.id = id;
    this.x = attributes.x;
    this.y = attributes.y;
    this.width = attributes.width || 0;
    this.height = attributes.height || 0;
    this.backgroundColor = attributes.backgroundColor || "#ffffff";
    this.borderColor = attributes.borderColor || "#000000";
    this.borderWidth = attributes.borderWidth || 0;
    this.opacity = attributes.opacity !== undefined ? attributes.opacity : 1;
    this.zIndex = attributes.zIndex || 0;
  }

  /**
   * 获取节点ID
   * @returns 节点ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * 设置节点位置
   * @param x X坐标
   * @param y Y坐标
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * 获取节点位置
   * @returns 节点位置对象
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  /**
   * 设置节点大小
   * @param width 宽度
   * @param height 高度
   */
  public setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  /**
   * 获取节点大小
   * @returns 节点大小对象
   */
  public getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * 设置背景颜色
   * @param color 背景颜色
   */
  public setBackgroundColor(color: string): void {
    this.backgroundColor = color;
  }

  /**
   * 获取背景颜色
   * @returns 背景颜色
   */
  public getBackgroundColor(): string {
    return this.backgroundColor;
  }

  /**
   * 设置边框颜色
   * @param color 边框颜色
   */
  public setBorderColor(color: string): void {
    this.borderColor = color;
  }

  /**
   * 获取边框颜色
   * @returns 边框颜色
   */
  public getBorderColor(): string {
    return this.borderColor;
  }

  /**
   * 设置边框宽度
   * @param width 边框宽度
   */
  public setBorderWidth(width: number): void {
    this.borderWidth = width;
  }

  /**
   * 获取边框宽度
   * @returns 边框宽度
   */
  public getBorderWidth(): number {
    return this.borderWidth;
  }

  /**
   * 设置透明度
   * @param opacity 透明度值(0-1)
   */
  public setOpacity(opacity: number): void {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * 获取透明度
   * @returns 透明度值
   */
  public getOpacity(): number {
    return this.opacity;
  }

  /**
   * 设置Z轴序号（决定重叠顺序）
   * @param zIndex Z轴序号
   */
  public setZIndex(zIndex: number): void {
    this.zIndex = zIndex;
  }

  /**
   * 获取Z轴序号
   * @returns Z轴序号
   */
  public getZIndex(): number {
    return this.zIndex;
  }

  /**
   * 检查点是否在图形内部
   * @param x 点的X坐标
   * @param y 点的Y坐标
   * @returns 如果点在图形内部则返回true
   */
  public abstract containsPoint(x: number, y: number): boolean;

  /**
   * 绘制图形
   * @param ctx Canvas上下文对象
   */
  public abstract draw(ctx: CanvasRenderingContext2D): void;
}
