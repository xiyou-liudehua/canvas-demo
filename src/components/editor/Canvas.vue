<template>
  <div class="canvas-container">
    <canvas
      ref="canvas"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @mousemove="handleMouseMove"
      @dblclick="handleDoubleClick"
    ></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, inject } from "vue";
import { LayerType, StyleType, type AnyLayer } from "../../types";

// 常量配置，便于后续修改和扩展
const CONSTANTS = {
  SELECTION: {
    HANDLE_SIZE: 10, // 调整大小控制点的尺寸
    MIN_SIZE: 30, // 图层最小尺寸
    BORDER_COLOR: "#0099ff", // 选择框颜色
    HANDLE_COLOR: "#0099ff", // 控制点颜色
  },
  DASH_PATTERN: [5, 5], // 选择框虚线样式
};

export default defineComponent({
  name: "EditorCanvas",

  props: {
    width: {
      type: Number,
      default: 375,
    },
    height: {
      type: Number,
      default: 667,
    },
    layers: {
      type: Array as () => AnyLayer[],
      required: true,
    },
    activeLayerId: {
      type: String as () => string | null,
      default: null,
    },
  },

  emits: ["update:activeLayerId", "layer-updated", "edit-text"],

  setup(props, { emit }) {
    const canvas = ref<HTMLCanvasElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);
    const isMouseDown = ref(false);
    const isResizing = ref(false);
    const resizeHandle = ref("");
    const resizeStartSize = ref({ width: 0, height: 0 });
    const dragStartPos = ref({ x: 0, y: 0 });

    // 从父组件注入图片缓存
    const imageCache = inject<Map<string, HTMLImageElement>>(
      "imageCache",
      new Map(),
    );

    /**
     * 处理鼠标按下事件
     * 根据点击位置判断是选中图层还是调整图层大小
     * @param e - 鼠标事件对象
     */
    const handleMouseDown = (e: MouseEvent): void => {
      const rect = canvas.value?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 从Z-index最高的层开始检查，找到点击的图层
      const layers = [...props.layers].sort((a, b) => b.zIndex - a.zIndex);

      // 首先检查是否点击了调整大小的控制点
      if (props.activeLayerId) {
        const activeLayer = props.layers.find(
          (layer) => layer.id === props.activeLayerId,
        );

        if (activeLayer && activeLayer.type !== LayerType.BACKGROUND) {
          const handleSize = CONSTANTS.SELECTION.HANDLE_SIZE;

          // 右下角调整大小控制点
          if (
            x >= activeLayer.position.x + activeLayer.size.width - handleSize &&
            x <= activeLayer.position.x + activeLayer.size.width + handleSize &&
            y >=
              activeLayer.position.y + activeLayer.size.height - handleSize &&
            y <= activeLayer.position.y + activeLayer.size.height + handleSize
          ) {
            isResizing.value = true;
            resizeHandle.value = "se";
            resizeStartSize.value = { ...activeLayer.size };
            dragStartPos.value = { x, y };
            return;
          }
        }
      }

      // 检查是否点击了图层本身
      for (const layer of layers) {
        if (layer.type === LayerType.BACKGROUND) continue; // 背景层不可拖动

        if (
          x >= layer.position.x &&
          x <= layer.position.x + layer.size.width &&
          y >= layer.position.y &&
          y <= layer.position.y + layer.size.height
        ) {
          emit("update:activeLayerId", layer.id);
          isMouseDown.value = true;
          dragStartPos.value = { x, y };
          redraw();
          return;
        }
      }

      // 如果点击空白区域，则选中背景
      emit("update:activeLayerId", "background");
      redraw();
    };

    /**
     * 处理鼠标移动事件
     * 根据当前状态处理拖动或调整大小
     * @param e - 鼠标事件对象
     */
    const handleMouseMove = (e: MouseEvent): void => {
      const rect = canvas.value?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 调整光标样式
      if (canvas.value) {
        canvas.value.style.cursor = "default";

        if (props.activeLayerId) {
          const activeLayer = props.layers.find(
            (layer) => layer.id === props.activeLayerId,
          );

          if (activeLayer && activeLayer.type !== LayerType.BACKGROUND) {
            const handleSize = CONSTANTS.SELECTION.HANDLE_SIZE;

            // 右下角调整大小控制点
            if (
              x >=
                activeLayer.position.x + activeLayer.size.width - handleSize &&
              x <=
                activeLayer.position.x + activeLayer.size.width + handleSize &&
              y >=
                activeLayer.position.y + activeLayer.size.height - handleSize &&
              y <= activeLayer.position.y + activeLayer.size.height + handleSize
            ) {
              canvas.value.style.cursor = "nwse-resize";
            } else if (
              x >= activeLayer.position.x &&
              x <= activeLayer.position.x + activeLayer.size.width &&
              y >= activeLayer.position.y &&
              y <= activeLayer.position.y + activeLayer.size.height
            ) {
              canvas.value.style.cursor = "move";
            }
          }
        }
      }

      // 处理调整大小
      if (isResizing.value && props.activeLayerId) {
        const activeLayer = props.layers.find(
          (layer) => layer.id === props.activeLayerId,
        );

        if (!activeLayer) return;

        const dx = x - dragStartPos.value.x;
        const dy = y - dragStartPos.value.y;

        if (resizeHandle.value === "se") {
          const newWidth = Math.max(
            CONSTANTS.SELECTION.MIN_SIZE,
            resizeStartSize.value.width + dx,
          );
          const newHeight = Math.max(
            CONSTANTS.SELECTION.MIN_SIZE,
            resizeStartSize.value.height + dy,
          );

          activeLayer.size.width = newWidth;
          activeLayer.size.height = newHeight;

          emit("layer-updated", activeLayer);
        }

        redraw();
        return;
      }

      // 处理拖动图层
      if (
        !isMouseDown.value ||
        !props.activeLayerId ||
        props.activeLayerId === "background"
      )
        return;

      const dx = x - dragStartPos.value.x;
      const dy = y - dragStartPos.value.y;

      const layer = props.layers.find(
        (layer) => layer.id === props.activeLayerId,
      );
      if (!layer) return;

      // 更新位置，确保不超出画布边界
      let newX = layer.position.x + dx;
      let newY = layer.position.y + dy;

      newX = Math.max(0, Math.min(newX, props.width - layer.size.width));
      newY = Math.max(0, Math.min(newY, props.height - layer.size.height));

      layer.position.x = newX;
      layer.position.y = newY;

      emit("layer-updated", layer);

      dragStartPos.value = { x, y };
      redraw();
    };

    /**
     * 处理鼠标松开事件
     * 重置拖拽和调整大小状态
     */
    const handleMouseUp = (): void => {
      isMouseDown.value = false;
      isResizing.value = false;
    };

    /**
     * 处理双击事件
     * 双击按钮或图片节点时开始编辑文字
     * @param e - 鼠标事件对象
     */
    const handleDoubleClick = (e: MouseEvent): void => {
      const rect = canvas.value?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 检查是否双击了某个图层
      const layers = [...props.layers].sort((a, b) => b.zIndex - a.zIndex);

      for (const layer of layers) {
        if (layer.type === LayerType.BACKGROUND) continue; // 背景层不可编辑文字

        if (
          x >= layer.position.x &&
          x <= layer.position.x + layer.size.width &&
          y >= layer.position.y &&
          y <= layer.position.y + layer.size.height
        ) {
          // 选中该图层
          emit("update:activeLayerId", layer.id);

          // 触发文字编辑事件
          emit("edit-text", layer.id);
          return;
        }
      }
    };

    /**
     * 绘制圆角矩形路径（不填充）
     * @param ctx - Canvas上下文
     * @param x - 矩形左上角X坐标
     * @param y - 矩形左上角Y坐标
     * @param width - 矩形宽度
     * @param height - 矩形高度
     * @param radius - 圆角半径
     */
    const roundRect = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
    ): void => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height,
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    /**
     * 绘制圆角图片
     * 使用裁剪路径绘制圆角图片
     * @param ctx - Canvas上下文
     * @param x - 图片左上角X坐标
     * @param y - 图片左上角Y坐标
     * @param width - 图片宽度
     * @param height - 图片高度
     * @param radius - 圆角半径
     * @param img - 图片对象
     */
    const roundRectImg = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number,
      img: HTMLImageElement,
    ): void => {
      ctx.save();
      roundRect(ctx, x, y, width, height, radius);
      ctx.clip();
      ctx.drawImage(img, x, y, width, height);
      ctx.restore();
    };

    /**
     * 绘制选中框和控制点
     * @param ctx - Canvas上下文
     * @param layer - 要绘制选中框的图层
     */
    const drawSelectionFrame = (
      ctx: CanvasRenderingContext2D,
      layer: AnyLayer,
    ): void => {
      if (layer.id !== props.activeLayerId || layer.id === "background") return;

      ctx.save();

      // 绘制选中框
      ctx.strokeStyle = CONSTANTS.SELECTION.BORDER_COLOR;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.setLineDash(CONSTANTS.DASH_PATTERN);
      ctx.strokeRect(
        layer.position.x - 2,
        layer.position.y - 2,
        layer.size.width + 4,
        layer.size.height + 4,
      );

      // 绘制调整大小的控制点
      ctx.setLineDash([]);
      ctx.fillStyle = CONSTANTS.SELECTION.HANDLE_COLOR;
      const handleSize = CONSTANTS.SELECTION.HANDLE_SIZE - 2; // 控制点实际显示尺寸

      // 右下角控制点
      ctx.fillRect(
        layer.position.x + layer.size.width - handleSize / 2,
        layer.position.y + layer.size.height - handleSize / 2,
        handleSize,
        handleSize,
      );

      ctx.restore();
    };

    /**
     * 重绘整个画布
     * 按z-index顺序绘制所有图层
     */
    const redraw = (): void => {
      if (!canvas.value || !ctx.value) return;

      // 清空画布
      ctx.value.clearRect(0, 0, props.width, props.height);

      // 按z-index排序图层
      const sortedLayers = [...props.layers].sort(
        (a, b) => a.zIndex - b.zIndex,
      );

      // 绘制每个图层
      for (const layer of sortedLayers) {
        ctx.value.save();

        // 设置透明度
        ctx.value.globalAlpha = layer.opacity / 100;

        if (layer.type === LayerType.BACKGROUND) {
          // 绘制背景
          if (layer.styleType === StyleType.COLOR && layer.color) {
            ctx.value.fillStyle = layer.color;
            ctx.value.fillRect(0, 0, props.width, props.height);
          } else if (layer.styleType === StyleType.IMAGE && layer.imageUrl) {
            // 使用缓存的图像
            const img = imageCache.get(layer.imageUrl);

            if (img) {
              ctx.value.drawImage(img, 0, 0, props.width, props.height);
            } else {
              const newImg = new Image();
              newImg.onload = () => {
                imageCache.set(layer.imageUrl!, newImg);
                redraw();
              };
              newImg.src = layer.imageUrl;
            }
          }
        } else if (layer.type === LayerType.BUTTON) {
          // 绘制按钮
          if (layer.styleType === StyleType.COLOR && layer.color) {
            ctx.value.fillStyle = layer.color;
            roundRect(
              ctx.value,
              layer.position.x,
              layer.position.y,
              layer.size.width,
              layer.size.height,
              layer.borderRadius,
            );
            ctx.value.fill();
          } else if (layer.styleType === StyleType.IMAGE && layer.imageUrl) {
            // 使用缓存的图像
            const img = imageCache.get(layer.imageUrl);

            if (img) {
              roundRectImg(
                ctx.value,
                layer.position.x,
                layer.position.y,
                layer.size.width,
                layer.size.height,
                layer.borderRadius,
                img,
              );
            } else {
              const newImg = new Image();
              newImg.onload = () => {
                imageCache.set(layer.imageUrl!, newImg);
                redraw();
              };
              newImg.src = layer.imageUrl;
            }
          }

          // 绘制按钮文字
          if (layer.text && layer.styleType === StyleType.COLOR) {
            ctx.value.fillStyle = layer.textColor || "#ffffff";
            ctx.value.font = `${layer.fontSize || 14}px Arial`;
            ctx.value.textAlign = "center";
            ctx.value.textBaseline = "middle";
            ctx.value.fillText(
              layer.text,
              layer.position.x + layer.size.width / 2,
              layer.position.y + layer.size.height / 2,
            );
          }
        } else if (layer.type === LayerType.IMAGE) {
          if (layer.styleType === StyleType.IMAGE && layer.imageUrl) {
            // 绘制图片
            const img = imageCache.get(layer.imageUrl);

            if (img) {
              if (layer.borderRadius && layer.borderRadius > 0) {
                roundRectImg(
                  ctx.value,
                  layer.position.x,
                  layer.position.y,
                  layer.size.width,
                  layer.size.height,
                  layer.borderRadius,
                  img,
                );
              } else {
                ctx.value.drawImage(
                  img,
                  layer.position.x,
                  layer.position.y,
                  layer.size.width,
                  layer.size.height,
                );
              }
            } else {
              const newImg = new Image();
              newImg.onload = () => {
                imageCache.set(layer.imageUrl!, newImg);
                redraw();
              };
              newImg.src = layer.imageUrl;
            }
          } else if (layer.styleType === StyleType.COLOR) {
            // 图片转为按钮模式
            ctx.value.fillStyle = layer.color || "#2187ff";
            roundRect(
              ctx.value,
              layer.position.x,
              layer.position.y,
              layer.size.width,
              layer.size.height,
              layer.borderRadius || 20,
            );
            ctx.value.fill();

            // 绘制文字
            if (layer.text && layer.styleType === StyleType.COLOR) {
              ctx.value.fillStyle = layer.textColor || "#ffffff";
              ctx.value.font = `${layer.fontSize || 14}px Arial`;
              ctx.value.textAlign = "center";
              ctx.value.textBaseline = "middle";
              ctx.value.fillText(
                layer.text,
                layer.position.x + layer.size.width / 2,
                layer.position.y + layer.size.height / 2,
              );
            }
          }
        }

        // 绘制选中框和控制点
        drawSelectionFrame(ctx.value, layer);

        ctx.value.restore();
      }
    };

    // 当图层或激活的图层ID改变时重绘
    watch(() => props.layers, redraw, { deep: true });
    watch(() => props.activeLayerId, redraw);

    // 组件挂载后初始化画布
    onMounted(() => {
      if (canvas.value) {
        canvas.value.width = props.width;
        canvas.value.height = props.height;
        ctx.value = canvas.value.getContext("2d");
        redraw();
      }
    });

    return {
      canvas,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      handleDoubleClick,
      redraw,
    };
  },
});
</script>

<style scoped>
.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e0e0e0;
  overflow: auto;
}

canvas {
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
