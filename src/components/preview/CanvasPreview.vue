<template>
  <div class="canvas-preview">
    <div class="preview-header">
      <h2>{{ title || "模板预览" }}</h2>
      <button v-if="showLoadButton" @click="loadFromStorage" class="load-btn">
        加载
      </button>
    </div>

    <div
      class="preview-container"
      :style="{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
        border: '1px solid #ddd',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }"
      ref="canvasContainer"
    >
      <!-- 背景图层 -->
      <div
        v-for="layer in backgroundLayers"
        :key="layer.id"
        class="preview-layer"
        :style="getLayerStyle(layer)"
      >
        <img
          v-if="layer.styleType === 'image' && layer.imageUrl"
          :src="layer.imageUrl"
          style="width: 100%; height: 100%"
        />
      </div>

      <!-- 其他图层（按钮和图片）-->
      <div
        v-for="layer in otherLayers"
        :key="layer.id"
        class="preview-layer"
        :style="getLayerStyle(layer)"
      >
        <!-- 图片样式 -->
        <img
          v-if="layer.styleType === 'image' && layer.imageUrl"
          :src="layer.imageUrl"
          style="width: 100%; height: 100%; object-fit: contain"
        />

        <!-- 按钮文字（仅当是按钮且为文字样式时显示）-->
        <div
          v-if="
            layer.type === 'button' && layer.styleType === 'color' && layer.text
          "
          class="preview-text"
          :style="getTextStyle(layer)"
        >
          {{ layer.text }}
        </div>
      </div>
    </div>

    <slot name="action-buttons"></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, type PropType } from "vue";
import type { CanvasData, AnyLayer } from "../../types";
import { StyleType, LayerType } from "../../types";

export default defineComponent({
  name: "CanvasPreview",

  props: {
    config: {
      type: Object as PropType<CanvasData>,
      default: null,
    },
    jsonConfig: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    showLoadButton: {
      type: Boolean,
      default: false,
    },
    localStorageKey: {
      type: String,
      default: "canvas-demo-data",
    },
  },

  emits: ["canvas-loaded"],

  setup(props, { emit }) {
    const canvasData = ref<CanvasData | null>(null);
    const canvasContainer = ref<HTMLElement | null>(null);
    const imageCache = new Map<string, HTMLImageElement>();

    // 计算画布的宽度和高度
    const width = computed(() => canvasData.value?.width || 375);
    const height = computed(() => canvasData.value?.height || 667);

    // 分离背景图层和其他图层
    const backgroundLayers = computed(
      () =>
        canvasData.value?.layers.filter(
          (layer) => layer.type === LayerType.BACKGROUND,
        ) || [],
    );

    const otherLayers = computed(
      () =>
        canvasData.value?.layers
          .filter((layer) => layer.type !== LayerType.BACKGROUND)
          .sort((a, b) => a.zIndex - b.zIndex) || [],
    );

    // 从配置加载画布数据
    const loadCanvasFromConfig = (config: CanvasData) => {
      canvasData.value = config;
      // 预加载所有图片
      preloadImages();
      emit("canvas-loaded", config);
    };

    // 从JSON字符串加载画布数据
    const loadCanvasFromJson = (jsonString: string) => {
      try {
        const config = JSON.parse(jsonString) as CanvasData;
        loadCanvasFromConfig(config);
      } catch (error) {
        console.error("无效的JSON格式:", error);
      }
    };

    // 从localStorage加载
    const loadFromStorage = () => {
      const savedData = localStorage.getItem(props.localStorageKey);
      if (savedData) {
        loadCanvasFromJson(savedData);
      } else {
        alert("未找到保存的画布数据");
      }
    };

    // 预加载图片以确保渲染时图片已准备好
    const preloadImages = () => {
      if (!canvasData.value) return;

      canvasData.value.layers.forEach((layer) => {
        if (layer.imageUrl && !imageCache.has(layer.imageUrl)) {
          const img = new Image();
          img.src = layer.imageUrl;
          imageCache.set(layer.imageUrl, img);
        }
      });
    };

    // 获取图层的样式
    const getLayerStyle = (layer: AnyLayer) => {
      return {
        position: "absolute",
        left: `${layer.position.x}px`,
        top: `${layer.position.y}px`,
        width: `${layer.size.width}px`,
        height: `${layer.size.height}px`,
        backgroundColor:
          layer.styleType === StyleType.COLOR ? layer.color : "transparent",
        borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : "0",
        opacity: layer.opacity / 100,
        zIndex: layer.zIndex,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
    };

    // 获取文字样式
    const getTextStyle = (layer: AnyLayer) => {
      return {
        color: layer.textColor || "#ffffff",
        fontSize: layer.fontSize ? `${layer.fontSize}px` : "14px",
        textAlign: "center",
        width: "100%",
      };
    };

    onMounted(() => {
      // 优先级: 1. props.config, 2. props.jsonConfig, 3. localStorage (如果showLoadButton === true)
      if (props.config) {
        loadCanvasFromConfig(props.config);
      } else if (props.jsonConfig) {
        loadCanvasFromJson(props.jsonConfig);
      } else if (
        props.showLoadButton &&
        localStorage.getItem(props.localStorageKey)
      ) {
        loadFromStorage();
      }
    });

    return {
      canvasContainer,
      canvasData,
      width,
      height,
      backgroundLayers,
      otherLayers,
      getLayerStyle,
      getTextStyle,
      loadFromStorage,
    };
  },
});
</script>

<style scoped>
.canvas-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin-bottom: 20px;
}

.preview-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.load-btn {
  background-color: #4a4af4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 15px;
  cursor: pointer;
  font-size: 14px;
}

.preview-text {
  width: 100%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
