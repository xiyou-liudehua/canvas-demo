/**
 * GraphView 类
 * 负责画布的DOM创建和事件监听
 */
export default class GraphView {
  private width: number;
  private height: number;
  private backgroundColor: string;
  private backgroundImage: string | null;
  private scale: number;
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private container: HTMLElement;
  private eventListeners: Map<
    string,
    Array<(event: MouseEvent, point: { x: number; y: number }) => void>
  >;
  private isMouseDown: boolean;
  private lastMousePoint: { x: number; y: number };

  /**
   * 构造函数
   * @param container 包含画布的容器元素
   * @param options 画布配置选项
   */
  constructor(
    container: HTMLElement,
    options: {
      width: number;
      height: number;
      backgroundColor?: string;
      scale?: number;
    },
  ) {
    this.width = options.width;
    this.height = options.height;
    this.backgroundColor = options.backgroundColor || "#ffffff";
    this.backgroundImage = null;
    this.scale = options.scale || 1;
    this.canvas = null;
    this.ctx = null;
    this.container = container;
    this.eventListeners = new Map();
    this.isMouseDown = false;
    this.lastMousePoint = { x: 0, y: 0 };

    // 初始化画布
    this.init();
  }

  /**
   * 初始化画布
   */
  private init(): void {
    // 创建canvas的DOM
    this.canvas = document.createElement("canvas");
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.backgroundColor = this.backgroundColor;

    // 添加到容器
    this.container.appendChild(this.canvas);

    // 获取绘图上下文
    this.ctx = this.canvas.getContext("2d");

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定画布事件
   */
  private bindEvents(): void {
    if (!this.canvas) return;

    // 鼠标按下事件
    this.canvas.addEventListener("mousedown", (event) => {
      this.isMouseDown = true;
      const point = this.getCanvasPointOfEvent(event);
      this.lastMousePoint = point;
      this.triggerEventListeners("mousedown", event, point);
    });

    // 鼠标移动事件
    this.canvas.addEventListener("mousemove", (event) => {
      const point = this.getCanvasPointOfEvent(event);
      if (this.isMouseDown) {
        this.triggerEventListeners("mousemove", event, point);
      }
      this.lastMousePoint = point;
    });

    // 鼠标松开事件
    this.canvas.addEventListener("mouseup", (event) => {
      if (this.isMouseDown) {
        const point = this.getCanvasPointOfEvent(event);
        this.triggerEventListeners("mouseup", event, point);
        this.isMouseDown = false;
      }
    });

    // 键盘删除事件
    document.addEventListener("keydown", (event) => {
      if (event.key === "Delete") {
        this.triggerEventListeners(
          "delete",
          event as unknown as MouseEvent,
          this.lastMousePoint,
        );
      }
    });
  }

  /**
   * 触发事件监听器
   * @param eventType 事件类型
   * @param event 原始事件对象
   * @param point 画布上的点坐标
   */
  private triggerEventListeners(
    eventType: string,
    event: MouseEvent,
    point: { x: number; y: number },
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => callback(event, point));
    }
  }

  /**
   * 获取鼠标事件在画布上的坐标
   * @param event 鼠标事件
   * @returns 画布坐标
   */
  public getCanvasPointOfEvent(event: MouseEvent): { x: number; y: number } {
    if (!this.canvas) return { x: 0, y: 0 };

    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / this.scale,
      y: (event.clientY - rect.top) / this.scale,
    };
  }

  /**
   * 添加事件监听器
   * @param eventType 事件类型（mousedown, mousemove, mouseup, delete）
   * @param callback 回调函数
   */
  public addEventListener(
    eventType: string,
    callback: (event: MouseEvent, point: { x: number; y: number }) => void,
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)?.push(callback);
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param callback 要移除的回调函数
   */
  public removeEventListener(
    eventType: string,
    callback: (event: MouseEvent, point: { x: number; y: number }) => void,
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 清空画布
   */
  public clear(): void {
    if (!this.ctx) return;

    // 清空整个画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 填充背景色
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 如果有背景图，绘制背景图
    if (this.backgroundImage) {
      const img = new Image();
      img.onload = () => {
        // 绘制背景图片，使其适应画布大小
        if (this.ctx) {
          this.ctx.drawImage(img, 0, 0, this.width, this.height);
        }
      };
      img.src = this.backgroundImage;
    }
  }

  public redraw(): void {
    this.dispatchEvent("redraw", {});
  }

  /**
   * 设置背景颜色
   * @param color 背景颜色值
   */
  public setBackgroundColor(color: string): void {
    this.backgroundColor = color;
    this.backgroundImage = null;

    // 使用现有的清除方法
    this.clear();

    // 通知外部重绘
    this.dispatchEvent("redraw", {});
  }

  /**
   * 设置背景图片
   * @param imageUrl 图片URL
   */
  public setBackgroundImage(imageUrl: string): void {
    this.backgroundImage = imageUrl;

    // 使用现有的清除方法
    this.clear();

    // 通知外部重绘
    this.dispatchEvent("redraw", {});
  }

  /**
   * 获取画布上下文
   * @returns 画布2D上下文
   */
  public getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }

  /**
   * 获取画布元素
   * @returns 画布元素
   */
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /**
   * 获取画布宽度
   * @returns 画布宽度
   */
  public getWidth(): number {
    return this.width;
  }

  /**
   * 获取画布高度
   * @returns 画布高度
   */
  public getHeight(): number {
    return this.height;
  }

  /**
   * 设置缩放比例
   * @param scale 缩放比例
   */
  public setScale(scale: number): void {
    this.scale = scale;
    // 需要重新绘制所有内容
  }

  /**
   * 分发自定义事件
   * @param eventType 事件类型
   * @param data 事件数据
   */
  public dispatchEvent(eventType: string, data: any): void {
    this.triggerEventListeners(eventType, {} as MouseEvent, {
      x: 0,
      y: 0,
      ...data,
    });
  }
}
