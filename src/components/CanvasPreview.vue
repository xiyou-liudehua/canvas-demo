<template>
  <div class="canvas-preview" v-if="visible">
    <div class="preview-header">
      <h3>预览</h3>
      <div class="preview-actions">
        <button @click="exportPNG" class="export-btn">导出图片</button>
        <button @click="close" class="close-btn">关闭</button>
      </div>
    </div>

    <div class="preview-container" ref="previewContainer"></div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  nextTick,
  onUnmounted,
} from "vue";
import GraphView from "../core/GraphView";
import DataModel from "../core/DataModel";
import Selector from "../core/Selector";

export default defineComponent({
  name: "CanvasPreview",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    jsonData: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      default: 800,
    },
    height: {
      type: Number,
      default: 600,
    },
  },

  emits: ["close"],

  setup(props, { emit }) {
    const previewContainer = ref<HTMLElement | null>(null);
    const graphView = ref<GraphView | null>(null);
    const dataModel = ref<DataModel | null>(null);

    // 初始化预览
    const initPreview = async () => {
      // 等待DOM更新完成，确保previewCanvas已渲染
      await nextTick();

      console.log("initPreview", previewContainer.value, props.jsonData);
      if (!previewContainer.value || !props.jsonData) {
        console.error("预览初始化失败：组件元素未找到");
        return;
      }

      try {
        // 解析数据
        const data = JSON.parse(props.jsonData);

        console.log("data", data);

        // 创建GraphView实例
        const gView = new GraphView(previewContainer.value, {
          width: props.width,
          height: props.height,
          backgroundColor: data.backgroundColor || "#ffffff",
        });

        gView.addEventListener("redraw", (event) => {
          console.log("redraw", event);
          renderPreview();
        });

        graphView.value = gView;

        // 创建选择器（不会显示选择框，仅用于数据结构需要）
        const selector = new Selector(gView);
        selector.setEnabled(false); // 禁用选择功能

        // 创建数据模型
        dataModel.value = new DataModel(null, gView, selector);

        // 设置背景
        if (data.backgroundColor) {
          gView.setBackgroundColor(data.backgroundColor);
        }

        if (data.backgroundImage) {
          gView.setBackgroundImage(data.backgroundImage);
        }

        // 加载节点数据
        if (data.nodes) {
          dataModel.value.loadFromJSON(data.nodes);
        }

        // 绘制预览
        renderPreview();
      } catch (error) {
        console.error("预览初始化失败:", error);
      }
    };

    // 绘制预览
    const renderPreview = () => {
      if (!graphView.value || !dataModel.value) return;

      // 清空画布（会绘制背景）
      graphView.value.clear();

      // 获取所有节点并按Z轴排序
      const nodes = dataModel.value.getSortedNodes();

      // 获取绘图上下文
      const ctx = graphView.value.getContext();
      if (!ctx) return;

      // 绘制所有节点
      for (const node of nodes) {
        node.draw(ctx);
      }
    };

    // 导出PNG图片
    const exportPNG = async () => {
      await nextTick();

      if (!graphView.value) {
        console.error("无法导出：画布未初始化");
        return;
      }

      try {
        // 确保渲染最新状态
        renderPreview();

        // 创建一个新的canvas用于导出，保持图像质量
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = props.width;
        exportCanvas.height = props.height;
        const ctx = exportCanvas.getContext("2d");

        if (!ctx) {
          console.error("无法获取导出画布上下文");
          return;
        }

        // 使用GraphView提供的getCanvas和getContext方法获取背景信息
        const viewCanvas = graphView.value.getCanvas();

        // 绘制背景颜色（白色作为默认值）
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, props.width, props.height);

        // 直接将原始canvas内容复制到导出canvas（这会包含背景图和背景色）
        if (viewCanvas) {
          ctx.drawImage(viewCanvas, 0, 0);
        } else {
          console.error("无法获取导出画布");
        }

        // 创建下载链接
        const dataURL = exportCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        link.download = `canvas-export-${timestamp}.png`;
        link.href = dataURL;
        link.click();
      } catch (error) {
        console.error("导出图片失败:", error);
      }
    };

    // 关闭预览
    const close = () => {
      emit("close");
    };

    // 监听visible状态变化
    watch(
      () => props.visible,
      async (newVal) => {
        console.log("预览可见性变化:", newVal);
        if (newVal) {
          // 当组件变为可见时初始化预览
          await nextTick();
          initPreview();
        }
      },
    );

    // 组件挂载完成
    onMounted(() => {
      console.log("预览组件已挂载");
    });

    // 组件销毁
    onUnmounted(() => {
      console.log("预览组件销毁");
      // 清理资源
      graphView.value = null;
      dataModel.value = null;
    });

    return {
      previewContainer,
      exportPNG,
      renderPreview,
      close,
    };
  },
});
</script>

<style scoped>
.canvas-preview {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-header {
  width: 100%;
  max-width: 840px;
  padding: 15px;
  background-color: #fff;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.preview-actions {
  display: flex;
  gap: 10px;
}

.preview-container {
  width: 100%;
  max-width: 840px;
  padding: 20px;
  background-color: #fff;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  display: flex;
  justify-content: center;
}

.export-btn {
  background-color: #4a4af4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

.close-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

canvas {
  border: 1px solid #ddd;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
