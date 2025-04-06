import GraphNode from "./GraphNode";

/**
 * 节点类型枚举
 */
export enum NodeType {
  TEXT = "text",
  IMAGE = "image",
}

/**
 * 通用节点基类
 */
export abstract class BaseNode extends GraphNode {
  protected borderRadius: number = 0;

  /**
   * 构造函数
   */
  constructor(
    graphView: any,
    id: string,
    attributes: {
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
    },
  ) {
    super(graphView, id, attributes);
    this.borderRadius = attributes.borderRadius || 0;
  }

  /**
   * 获取节点类型
   * @returns 节点类型
   */
  public abstract getType(): NodeType;

  /**
   * 设置圆角半径
   * @param radius 圆角半径
   */
  public setBorderRadius(radius: number): void {
    this.borderRadius = radius;
  }

  /**
   * 获取圆角半径
   * @returns 圆角半径
   */
  public getBorderRadius(): number {
    return this.borderRadius;
  }

  /**
   * 检查点是否在节点内部
   * @param x 点的X坐标
   * @param y 点的Y坐标
   * @returns 如果点在节点内部则返回true
   */
  public containsPoint(x: number, y: number): boolean {
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y &&
      y <= this.y + this.height
    );
  }

  /**
   * 绘制圆角矩形路径
   */
  protected drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }
}

/**
 * 文本节点类
 */
export class TextNode extends BaseNode {
  // 文本节点特有属性
  protected text: string = "";
  protected textColor: string = "#000000";
  protected fontSize: number = 14;
  protected fontFamily: string = "Arial";

  /**
   * 构造函数
   */
  constructor(
    graphView: any,
    id: string,
    attributes: {
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
    },
  ) {
    super(graphView, id, attributes);

    // 设置文本属性
    this.text = attributes.text || "";
    this.textColor = attributes.textColor || "#000000";
    this.fontSize = attributes.fontSize || 14;
    this.fontFamily = attributes.fontFamily || "Arial";
  }

  /**
   * 获取节点类型
   * @returns 文本节点类型
   */
  public getType(): NodeType {
    return NodeType.TEXT;
  }

  /**
   * 设置文本内容
   * @param text 文本内容
   */
  public setText(text: string): void {
    this.text = text;
  }

  /**
   * 获取文本内容
   * @returns 文本内容
   */
  public getText(): string {
    return this.text;
  }

  /**
   * 设置文本颜色
   * @param color 文本颜色
   */
  public setTextColor(color: string): void {
    this.textColor = color;
  }

  /**
   * 获取文本颜色
   * @returns 文本颜色
   */
  public getTextColor(): string {
    return this.textColor;
  }

  /**
   * 设置字体大小
   * @param size 字体大小
   */
  public setFontSize(size: number): void {
    this.fontSize = size;
  }

  /**
   * 获取字体大小
   * @returns 字体大小
   */
  public getFontSize(): number {
    return this.fontSize;
  }

  /**
   * 绘制文本节点
   * @param ctx Canvas上下文对象
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 设置透明度
    ctx.globalAlpha = this.opacity;

    // 创建裁剪路径（支持圆角）
    if (this.borderRadius > 0) {
      this.drawRoundedRect(
        ctx,
        this.x,
        this.y,
        this.width,
        this.height,
        this.borderRadius,
      );
      ctx.clip();
    }

    // 绘制背景
    if (this.borderRadius > 0) {
      this.drawRoundedRect(
        ctx,
        this.x,
        this.y,
        this.width,
        this.height,
        this.borderRadius,
      );
    } else {
      ctx.rect(this.x, this.y, this.width, this.height);
    }

    ctx.fillStyle = this.backgroundColor;
    ctx.fill();

    // 绘制边框
    if (this.borderWidth > 0) {
      if (this.borderRadius > 0) {
        this.drawRoundedRect(
          ctx,
          this.x,
          this.y,
          this.width,
          this.height,
          this.borderRadius,
        );
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.stroke();
      } else {
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
    }

    // 绘制文字
    if (this.text) {
      ctx.fillStyle = this.textColor;
      ctx.font = `${this.fontSize}px ${this.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // 计算文字位置（居中）
      const textX = this.x + this.width / 2;
      const textY = this.y + this.height / 2;

      ctx.fillText(this.text, textX, textY);
    }

    ctx.restore();
  }
}

/**
 * 图片节点类
 */
export class ImageNode extends BaseNode {
  // 图片节点特有属性
  private imageUrl: string = "";
  private imageObj: HTMLImageElement | null = null;
  private isImageLoaded: boolean = false;

  /**
   * 构造函数
   */
  constructor(
    graphView: any,
    id: string,
    attributes: {
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
    },
  ) {
    super(graphView, id, attributes);

    // 如果提供了图片URL，加载图片
    if (attributes.imageUrl) {
      this.loadImage(attributes.imageUrl);
    }
  }

  /**
   * 获取节点类型
   * @returns 图片节点类型
   */
  public getType(): NodeType {
    return NodeType.IMAGE;
  }

  /**
   * 加载图片
   * @param url 图片URL
   */
  public loadImage(url: string): void {
    this.imageUrl = url;

    if (!url) {
      this.isImageLoaded = false;
      this.imageObj = null;
      return;
    }

    const img = new Image();

    img.onload = () => {
      this.imageObj = img;
      this.isImageLoaded = true;
      // 通知视图重绘
      if (this.graphView) {
        this.graphView.redraw();
      }
    };

    img.onerror = () => {
      console.error("图片加载失败:", url);
      this.isImageLoaded = false;
      this.imageObj = null;
    };

    img.src = url;
  }

  /**
   * 获取图片URL
   * @returns 图片URL
   */
  public getImageUrl(): string {
    return this.imageUrl;
  }

  /**
   * 绘制图片节点
   * @param ctx Canvas上下文对象
   */
  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 设置透明度
    ctx.globalAlpha = this.opacity;

    // 创建裁剪路径（支持圆角）
    if (this.borderRadius > 0) {
      this.drawRoundedRect(
        ctx,
        this.x,
        this.y,
        this.width,
        this.height,
        this.borderRadius,
      );
      ctx.clip();
    }

    // 绘制图片或背景
    if (this.isImageLoaded && this.imageObj) {
      ctx.drawImage(this.imageObj, this.x, this.y, this.width, this.height);
    } else {
      // 绘制背景颜色作为占位
      if (this.borderRadius > 0) {
        this.drawRoundedRect(
          ctx,
          this.x,
          this.y,
          this.width,
          this.height,
          this.borderRadius,
        );
      } else {
        ctx.rect(this.x, this.y, this.width, this.height);
      }

      // 使用渐变色作为背景
      const gradient = ctx.createLinearGradient(
        this.x,
        this.y,
        this.x + this.width,
        this.y + this.height,
      );
      gradient.addColorStop(0, "#f5f5f5");
      gradient.addColorStop(1, "#e0e0e0");
      ctx.fillStyle = gradient;
      ctx.fill();

      // 绘制图片占位符图标
      const iconSize = Math.min(this.width, this.height) * 0.3;
      const centerX = this.x + this.width / 2;
      const centerY = this.y + this.height / 2;

      // 绘制图片框
      ctx.strokeStyle = "#999999";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(
        centerX - iconSize / 2,
        centerY - iconSize / 2,
        iconSize,
        iconSize,
      );
      ctx.stroke();

      // 绘制山峰
      ctx.beginPath();
      ctx.moveTo(centerX - iconSize * 0.3, centerY + iconSize * 0.2);
      ctx.lineTo(centerX - iconSize * 0.1, centerY - iconSize * 0.1);
      ctx.lineTo(centerX + iconSize * 0.3, centerY + iconSize * 0.2);
      ctx.stroke();

      // 绘制太阳
      ctx.beginPath();
      ctx.arc(
        centerX + iconSize * 0.15,
        centerY - iconSize * 0.15,
        iconSize * 0.12,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      // 绘制提示文字
      ctx.fillStyle = "#666666";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("点击上传图片", centerX, centerY + iconSize * 0.5 + 16);
    }

    // 绘制边框
    if (this.borderWidth > 0) {
      if (this.borderRadius > 0) {
        this.drawRoundedRect(
          ctx,
          this.x,
          this.y,
          this.width,
          this.height,
          this.borderRadius,
        );
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.stroke();
      } else {
        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = this.borderWidth;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
      }
    }

    ctx.restore();
  }
}

/**
 * 节点工厂类
 * 用于创建和转换不同类型的节点
 */
export class NodeFactory {
  /**
   * 创建节点
   * @param type 节点类型
   * @param graphView 画布视图
   * @param id 节点ID
   * @param attributes 节点属性
   * @returns 创建的节点
   */
  public static createNode(
    type: NodeType,
    graphView: any,
    id: string,
    attributes: any,
  ): BaseNode {
    switch (type) {
      case NodeType.TEXT:
        return new TextNode(graphView, id, attributes);

      case NodeType.IMAGE:
        return new ImageNode(graphView, id, attributes);

      default:
        // 默认创建文本节点
        return new TextNode(graphView, id, attributes);
    }
  }

  /**
   * 将文本节点转换为图片节点
   * @param textNode 文本节点
   * @param imageUrl 图片URL（可选）
   * @returns 图片节点
   */
  public static convertTextToImage(
    textNode: TextNode & ImageNode,
    imageUrl?: string,
  ): TextNode & ImageNode {
    const attributes = {
      x: textNode.getPosition().x,
      y: textNode.getPosition().y,
      width: textNode.getSize().width,
      height: textNode.getSize().height,
      backgroundColor: textNode.getBackgroundColor(),
      borderColor: textNode.getBorderColor(),
      borderWidth: textNode.getBorderWidth(),
      borderRadius: textNode.getBorderRadius(),
      opacity: textNode.getOpacity(),
      zIndex: textNode.getZIndex(),
      imageUrl:
        imageUrl || ("getImageUrl" in textNode ? textNode.getImageUrl() : ""),
    };

    const newNode = new ImageNode(
      textNode["graphView"],
      textNode.getId(),
      attributes,
    );

    (newNode as unknown as TextNode)["text"] = textNode.getText();
    (newNode as unknown as TextNode)["getText"] = () => textNode.getText();
    (newNode as unknown as TextNode)["fontSize"] = textNode.getFontSize();
    (newNode as unknown as TextNode)["getFontSize"] = () =>
      textNode.getFontSize();
    (newNode as unknown as TextNode)["textColor"] = textNode.getTextColor();
    (newNode as unknown as TextNode)["getTextColor"] = () =>
      textNode.getTextColor();

    return newNode as TextNode & ImageNode;
  }

  /**
   * 将图片节点转换为文本节点
   * @param imageNode 图片节点
   * @param text 文本内容（可选）
   * @returns 文本节点
   */
  public static convertImageToText(
    imageNode: TextNode & ImageNode,
    text?: string,
  ): TextNode & ImageNode {
    const attributes = {
      x: imageNode.getPosition().x,
      y: imageNode.getPosition().y,
      width: imageNode.getSize().width,
      height: imageNode.getSize().height,
      backgroundColor: imageNode.getBackgroundColor(),
      borderColor: imageNode.getBorderColor(),
      borderWidth: imageNode.getBorderWidth(),
      borderRadius: imageNode.getBorderRadius(),
      opacity: imageNode.getOpacity(),
      zIndex: imageNode.getZIndex(),
      text: text || ("getText" in imageNode ? imageNode.getText() : ""),
      fontSize: "getFontSize" in imageNode ? imageNode.getFontSize() : 14,
      textColor:
        "getTextColor" in imageNode ? imageNode.getTextColor() : "#000000",
    };

    const newNode = new TextNode(
      imageNode["graphView"],
      imageNode.getId(),
      attributes,
    );

    (newNode as unknown as ImageNode)["imageUrl"] = imageNode.getImageUrl();
    (newNode as unknown as ImageNode)["getImageUrl"] = () =>
      imageNode.getImageUrl();

    return newNode as TextNode & ImageNode;
  }
}
