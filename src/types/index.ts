/**
 * 图层类型枚举
 * 定义画布中可能的图层类型
 */
export enum LayerType {
  BACKGROUND = "background", // 背景图层
  BUTTON = "button", // 按钮图层
  IMAGE = "image", // 图片图层
}

/**
 * 样式类型枚举
 * 定义图层的呈现样式
 */
export enum StyleType {
  COLOR = "color", // 纯色样式
  IMAGE = "image", // 图片样式
}

/**
 * 位置接口
 * 表示图层在画布中的坐标位置
 */
export interface Position {
  x: number; // X坐标
  y: number; // Y坐标
}

/**
 * 尺寸接口
 * 表示图层的宽度和高度
 */
export interface Size {
  width: number; // 宽度
  height: number; // 高度
}

/**
 * 基础图层接口
 * 所有类型图层的共有属性
 */
export interface Layer {
  id: string; // 图层唯一标识
  type: LayerType; // 图层类型
  position: Position; // 图层位置
  size: Size; // 图层尺寸
  zIndex: number; // 图层层级顺序
  opacity: number; // 图层透明度 (0-100)
  styleType: StyleType; // 图层样式类型

  // 样式属性 - 根据styleType的值判断使用哪些属性
  color?: string; // 当styleType为COLOR时使用的颜色
  imageUrl?: string; // 当styleType为IMAGE时使用的图片URL

  // 文字相关属性 - 仅在styleType为COLOR且type不是BACKGROUND时使用
  text?: string; // 文字内容
  textColor?: string; // 文字颜色
  fontSize?: number; // 文字大小

  // 外观属性
  borderRadius?: number; // 边框圆角半径
}

/**
 * 背景图层接口
 * 特定于背景图层的属性
 */
export interface BackgroundLayer extends Layer {
  type: LayerType.BACKGROUND;
}

/**
 * 按钮图层接口
 * 特定于按钮图层的属性
 */
export interface ButtonLayer extends Layer {
  type: LayerType.BUTTON;
  // 文字相关属性在styleType为COLOR时是必须的
  text: string; // 按钮文字
  textColor: string; // 文字颜色
  borderRadius: number; // 按钮圆角
  fontSize: number; // 文字大小
}

/**
 * 图片图层接口
 * 特定于图片图层的属性
 */
export interface ImageLayer extends Layer {
  type: LayerType.IMAGE;
  // 当styleType为IMAGE时，imageUrl是必须的
  imageUrl: string; // 图片URL
  borderRadius?: number; // 图片圆角
  // 当styleType为COLOR时，以下属性是必须的
  text?: string; // 文字内容
  textColor?: string; // 文字颜色
  fontSize?: number; // 文字大小
}

/**
 * 任意图层类型
 * 用于处理可能是任何一种图层类型的情况
 */
export type AnyLayer = BackgroundLayer | ButtonLayer | ImageLayer;

/**
 * 画布状态接口
 * 表示整个画布的状态数据
 */
export interface CanvasState {
  layers: AnyLayer[]; // 画布中的所有图层
  activeLayerId: string | null; // 当前激活的图层ID
  nextZIndex: number; // 下一个图层的z-index值
}

/**
 * 画布数据接口
 * 用于保存和加载画布配置
 */
export interface CanvasData {
  width: number; // 画布宽度
  height: number; // 画布高度
  layers: AnyLayer[]; // 画布中的所有图层
}
