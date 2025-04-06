<template>
  <div class="canvas-editor">
    <div class="toolbar">
      <div class="logo">多adb组件模板</div>
      <div class="back-btn">
        <span>列表</span>
      </div>
      <div class="action-buttons">
        <button @click="loadCanvasFromStorage" class="load-btn">
          加载模板
        </button>
        <button @click="saveCanvas" class="save-btn">保存提交</button>
      </div>
    </div>

    <div class="content-area">
      <div class="left-panel">
        <div class="panel-section">
          <h3>弹窗按钮</h3>
          <div class="button-creator">
            <button class="add-button" @click="addButton">按钮</button>
          </div>
          <div class="image-uploader">
            <div class="upload-box" @click="openFileSelectorForNewImage()">
              <div class="plus-icon">+</div>
              <div class="upload-text">使用自定义图片</div>
            </div>
          </div>
        </div>
      </div>

      <EditorCanvas
        :width="canvasWidth"
        :height="canvasHeight"
        :layers="state.layers"
        :active-layer-id="state.activeLayerId"
        @update:active-layer-id="state.activeLayerId = $event"
        @layer-updated="handleLayerUpdate"
        @edit-text="handleEditText"
      />

      <div class="right-panel">
        <template v-if="activeLayer">
          <BackgroundPanel
            v-if="activeLayer.type === LayerType.BACKGROUND"
            :layer="activeLayer"
            @update="updateLayer"
            @upload-bg-image="openFileSelector(true)"
          />

          <ImagePanel
            v-else-if="activeLayer.type === LayerType.IMAGE"
            :layer="activeLayer"
            @update="updateLayer"
            @replace-image="openFileSelector(false)"
            @delete="deleteLayer"
          />

          <ButtonPanel
            v-else-if="activeLayer.type === LayerType.BUTTON"
            :layer="activeLayer"
            :button-index="getButtonNumber(activeLayer.id)"
            :canvas-width="canvasWidth"
            @update="updateLayer"
            @delete="deleteLayer"
            @replace-image="openFileSelector(false)"
            ref="buttonPanelRef"
          />
        </template>
      </div>
    </div>

    <!-- 文件上传输入框 -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept="image/*"
      @change="handleFileUpload"
      multiple
    />
    <input
      type="file"
      ref="fileInputForBg"
      style="display: none"
      accept="image/*"
      @change="handleBackgroundImageUpload"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, provide } from "vue";
import {
  LayerType,
  StyleType,
  type CanvasState,
  type ButtonLayer,
  type ImageLayer,
  type BackgroundLayer,
  type AnyLayer,
  type CanvasData,
} from "../../types";
import EditorCanvas from "./Canvas.vue";
import BackgroundPanel from "./BackgroundPanel.vue";
import ButtonPanel from "./ButtonPanel.vue";
import ImagePanel from "./ImagePanel.vue";

// 配置选项，便于将来扩展
const CONFIG = {
  CANVAS: {
    WIDTH: 375,
    HEIGHT: 667,
  },
  LIMITS: {
    MAX_NODES: 10, // 最大节点数（不包括背景）
  },
  LAYER_DEFAULTS: {
    BUTTON: {
      WIDTH: 150,
      HEIGHT: 40,
      COLOR: "#2187ff",
      TEXT: "获取微信号",
      TEXT_COLOR: "#ffffff",
      BORDER_RADIUS: 20,
      FONT_SIZE: 14,
    },
    IMAGE: {
      MAX_WIDTH_RATIO: 0.8, // 相对于画布宽度的最大比例
      MAX_HEIGHT_RATIO: 0.4, // 相对于画布高度的最大比例
    },
    BACKGROUND: {
      COLOR: "#333333",
      OPACITY: 80,
    },
  },
};

export default defineComponent({
  name: "EditorContainer",

  components: {
    EditorCanvas,
    BackgroundPanel,
    ButtonPanel,
    ImagePanel,
  },

  setup() {
    const fileInput = ref<HTMLInputElement | null>(null);
    const fileInputForBg = ref<HTMLInputElement | null>(null);
    const buttonPanelRef = ref<{ startTextEdit: () => void } | null>(null);
    const canvasWidth = CONFIG.CANVAS.WIDTH;
    const canvasHeight = CONFIG.CANVAS.HEIGHT;

    /**
     * 图片缓存 - 存储所有加载的图片，避免重复加载和闪烁问题
     * key: 图片URL或路径
     * value: 已加载的图片对象
     */
    const imageCache = ref<Map<string, HTMLImageElement>>(new Map());

    // 提供图片缓存给子组件，使用依赖注入
    provide("imageCache", imageCache.value);

    /**
     * 画布状态 - 存储整个编辑器的核心数据
     * layers: 所有图层的数组
     * activeLayerId: 当前选中的图层ID
     * nextZIndex: 下一个图层的z-index值
     */
    const state = ref<CanvasState>({
      layers: [],
      activeLayerId: null,
      nextZIndex: 1,
    });

    /**
     * 当前选中的图层对象
     * 通过计算属性获取，确保始终获取最新的图层数据
     */
    const activeLayer = computed(() => {
      return state.value.layers.find(
        (layer) => layer.id === state.value.activeLayerId,
      );
    });

    /**
     * 初始化背景层
     * 创建默认的背景图层并添加到layers数组中
     */
    const initBackground = (): void => {
      const backgroundLayer: BackgroundLayer = {
        id: "background",
        type: LayerType.BACKGROUND,
        position: { x: 0, y: 0 },
        size: { width: canvasWidth, height: canvasHeight },
        zIndex: 0,
        opacity: CONFIG.LAYER_DEFAULTS.BACKGROUND.OPACITY,
        styleType: StyleType.COLOR,
        color: CONFIG.LAYER_DEFAULTS.BACKGROUND.COLOR,
      };
      state.value.layers.push(backgroundLayer);
    };

    /**
     * 生成唯一ID
     * @param prefix - ID前缀，用于区分不同类型的图层
     * @returns 格式为 "prefix_timestamp_randomNum" 的唯一ID
     */
    const generateId = (prefix: string): string => {
      return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    };

    /**
     * 获取按钮序号
     * @param id - 按钮图层ID
     * @returns 按钮的序号（从1开始）
     */
    const getButtonNumber = (id: string): number => {
      const buttonLayers = state.value.layers.filter(
        (layer) => layer.type === LayerType.BUTTON,
      );
      const index = buttonLayers.findIndex((layer) => layer.id === id);
      return index + 1;
    };

    /**
     * 检查是否已达到最大节点数量限制
     * @returns 是否已达到节点数量上限
     */
    const isNodeLimitReached = (): boolean => {
      const nonBackgroundLayers = state.value.layers.filter(
        (layer) => layer.type !== LayerType.BACKGROUND,
      );
      return nonBackgroundLayers.length >= CONFIG.LIMITS.MAX_NODES;
    };

    /**
     * 添加按钮图层
     * 创建新的按钮图层并添加到layers数组中
     */
    const addButton = (): void => {
      // 检查是否已达到上限
      if (isNodeLimitReached()) {
        alert(`已达到最大节点数量限制（${CONFIG.LIMITS.MAX_NODES}个）`);
        return;
      }

      // 创建新按钮图层
      const buttonLayer: ButtonLayer = {
        id: generateId("button"),
        type: LayerType.BUTTON,
        position: {
          x: canvasWidth / 2 - CONFIG.LAYER_DEFAULTS.BUTTON.WIDTH / 2,
          y: canvasHeight / 2 - CONFIG.LAYER_DEFAULTS.BUTTON.HEIGHT / 2,
        },
        size: {
          width: CONFIG.LAYER_DEFAULTS.BUTTON.WIDTH,
          height: CONFIG.LAYER_DEFAULTS.BUTTON.HEIGHT,
        },
        zIndex: state.value.nextZIndex++,
        opacity: 100,
        styleType: StyleType.COLOR,
        color: CONFIG.LAYER_DEFAULTS.BUTTON.COLOR,
        text: CONFIG.LAYER_DEFAULTS.BUTTON.TEXT,
        textColor: CONFIG.LAYER_DEFAULTS.BUTTON.TEXT_COLOR,
        borderRadius: CONFIG.LAYER_DEFAULTS.BUTTON.BORDER_RADIUS,
        fontSize: CONFIG.LAYER_DEFAULTS.BUTTON.FONT_SIZE,
      };

      state.value.layers.push(buttonLayer);
      state.value.activeLayerId = buttonLayer.id;
    };

    /**
     * 打开文件选择器
     * @param forBackground - 是否为背景图片选择
     * @param forNewImage - 是否用于创建新图片而不是替换
     */
    const openFileSelector = (forBackground = false): void => {
      if (forBackground) {
        fileInputForBg.value?.click();
      } else {
        fileInput.value?.click();
      }
    };

    /**
     * 打开文件选择器用于创建新图片
     * 这是从左侧面板专门用于添加新图片的函数
     */
    const openFileSelectorForNewImage = (): void => {
      // 临时清除选中状态，这样handleFileUpload会创建新图层而不是替换
      state.value.activeLayerId = null;

      // 打开文件选择器
      fileInput.value?.click();

      // 注意：不需要恢复之前的选中状态
      // handleFileUpload函数会自动选中新创建的图片节点
    };

    /**
     * 处理背景图片上传
     * 读取选择的文件并设置为背景图片
     * @param event - 文件上传事件
     */
    const handleBackgroundImageUpload = (event: Event): void => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          const backgroundLayer = state.value.layers.find(
            (layer) => layer.id === "background",
          ) as BackgroundLayer;

          if (backgroundLayer) {
            backgroundLayer.imageUrl = imageUrl;
            backgroundLayer.styleType = StyleType.IMAGE;

            // 创建和缓存图像，避免重复加载
            const img = new Image();
            img.onload = () => {
              imageCache.value.set(imageUrl, img);
            };
            img.src = imageUrl;
          }
        };

        reader.readAsDataURL(file);
        // 重置input使得同一文件可以重复选择
        target.value = "";
      }
    };

    /**
     * 处理图片上传
     * 读取选择的文件，根据当前状态替换已有图片或创建新图层
     * @param event - 文件上传事件
     */
    const handleFileUpload = (event: Event): void => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        // 检查当前选中状态
        const needNewLayer =
          !state.value.activeLayerId ||
          state.value.activeLayerId === "background";

        // 如果当前有选中图层且不是背景，则只处理第一张图片作为替换
        if (!needNewLayer) {
          // 处理选中图层的图片替换
          const file = target.files[0];
          processImageUpload(file, true);
        } else {
          // 处理批量上传创建新图层
          const filesToProcess = Array.from(target.files);

          // 检查是否超出最大节点数量限制
          const availableSlots =
            CONFIG.LIMITS.MAX_NODES - (state.value.layers.length - 1);
          if (availableSlots <= 0) {
            alert(`已达到最大节点数量限制（${CONFIG.LIMITS.MAX_NODES}个）`);
            return;
          }

          // 如果文件数量超出可用槽位，给出提示并截取可用数量
          if (filesToProcess.length > availableSlots) {
            alert(
              `选择的图片数量超出限制，将只添加前 ${availableSlots} 张图片`,
            );
            filesToProcess.length = availableSlots;
          }

          // 处理每一个文件
          filesToProcess.forEach((file, index) => {
            // 为最后一张图片设置为选中状态
            const isLastImage = index === filesToProcess.length - 1;
            processImageUpload(file, false, isLastImage);
          });
        }

        // 重置input使得同一文件可以重复选择
        target.value = "";
      }
    };

    /**
     * 处理单个图片上传
     * @param file - 图片文件
     * @param isReplacement - 是否为替换模式
     * @param setAsActive - 是否将创建的图层设为活动图层
     */
    const processImageUpload = (
      file: File,
      isReplacement: boolean,
      setAsActive = true,
    ): void => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const currentActiveLayer = activeLayer.value;

        // 替换模式：更新当前选中的图层
        if (
          isReplacement &&
          currentActiveLayer &&
          state.value.activeLayerId &&
          state.value.activeLayerId !== "background"
        ) {
          // 创建图片缓存
          const img = new Image();
          img.onload = () => {
            imageCache.value.set(imageUrl, img);

            // 区分按钮和图片类型，处理图片更新
            if (currentActiveLayer.type === LayerType.BUTTON) {
              // 更新按钮图层为图片样式
              const buttonLayer = currentActiveLayer as ButtonLayer;
              updateLayer({
                ...buttonLayer,
                styleType: StyleType.IMAGE,
                imageUrl: imageUrl,
              });
            } else if (currentActiveLayer.type === LayerType.IMAGE) {
              // 更新图片图层
              const imageLayer = currentActiveLayer as ImageLayer;
              updateLayer({
                ...imageLayer,
                styleType: StyleType.IMAGE,
                imageUrl: imageUrl,
              });
            }
          };
          img.src = imageUrl;
        }
        // 创建模式：添加新的图片图层
        else {
          const img = new Image();

          img.onload = () => {
            // 计算适当的尺寸，保持原始宽高比
            let width = img.width;
            let height = img.height;
            const maxWidth =
              canvasWidth * CONFIG.LAYER_DEFAULTS.IMAGE.MAX_WIDTH_RATIO;
            const maxHeight =
              canvasHeight * CONFIG.LAYER_DEFAULTS.IMAGE.MAX_HEIGHT_RATIO;

            // 等比例缩放到最大宽度
            if (width > maxWidth) {
              const ratio = maxWidth / width;
              width = maxWidth;
              height *= ratio;
            }

            // 进一步等比例缩放到最大高度（如果需要）
            if (height > maxHeight) {
              const ratio = maxHeight / height;
              width *= ratio;
              height = maxHeight;
            }

            // 缓存图像
            imageCache.value.set(imageUrl, img);

            // 创建新图层
            const imageLayer: ImageLayer = {
              id: generateId("image"),
              type: LayerType.IMAGE,
              position: {
                x: (canvasWidth - width) / 2,
                y: (canvasHeight - height) / 2,
              },
              size: { width, height },
              zIndex: state.value.nextZIndex++,
              opacity: 100,
              styleType: StyleType.IMAGE,
              imageUrl,
              borderRadius: 0,
              fontSize: 14,
            };

            state.value.layers.push(imageLayer);

            // 设置为活动图层（如果需要）
            if (setAsActive) {
              state.value.activeLayerId = imageLayer.id;
            }
          };

          img.src = imageUrl;
        }
      };

      reader.readAsDataURL(file);
    };

    /**
     * 更新图层
     * 根据图层ID在状态中查找并更新图层数据
     * @param layer - 更新后的图层数据
     */
    const updateLayer = (layer: AnyLayer): void => {
      const index = state.value.layers.findIndex((l) => l.id === layer.id);
      if (index !== -1) {
        state.value.layers[index] = layer;
      }
    };

    /**
     * 处理图层更新事件
     * 由子组件触发的图层更新事件的处理函数
     * @param layer - 更新后的图层数据
     */
    const handleLayerUpdate = (layer: AnyLayer): void => {
      updateLayer(layer);
    };

    /**
     * 处理双击编辑文字事件
     * 当用户双击节点时触发文字编辑功能
     * @param layerId - 被双击的图层ID
     */
    const handleEditText = (layerId: string): void => {
      const layer = state.value.layers.find((l) => l.id === layerId);

      if (layer && layer.type === LayerType.BUTTON) {
        // 如果当前为图片模式，先切换到文字模式
        if (layer.styleType === StyleType.IMAGE) {
          layer.styleType = StyleType.COLOR;
          if (!layer.text) {
            layer.text = "按钮文案";
          }
          updateLayer(layer);
        }

        // 延迟执行以确保面板组件已渲染
        setTimeout(() => {
          if (buttonPanelRef.value) {
            buttonPanelRef.value.startTextEdit();
          }
        }, 50);
      }
    };

    /**
     * 删除图层
     * 删除当前选中的图层（背景层除外）
     */
    const deleteLayer = (): void => {
      if (
        !state.value.activeLayerId ||
        state.value.activeLayerId === "background"
      )
        return;

      const index = state.value.layers.findIndex(
        (layer) => layer.id === state.value.activeLayerId,
      );

      if (index !== -1) {
        state.value.layers.splice(index, 1);
        state.value.activeLayerId = null;
      }
    };

    /**
     * 保存画布
     * 将当前画布状态转换为JSON并打印到控制台
     * 只保存会实际显示在画布上的图层数据
     */
    const saveCanvas = (): void => {
      // 获取所有有效图层
      const validLayers = state.value.layers.map((layer) => {
        // 创建图层的复制，避免修改原始对象
        const layerCopy = JSON.parse(JSON.stringify(layer));

        // 删除非必要数据
        if ("imageUrl" in layerCopy && !layerCopy.imageUrl) {
          delete layerCopy.imageUrl;
        }

        // 如果是图片模式，删除文字相关属性
        if (layerCopy.styleType === StyleType.IMAGE) {
          delete layerCopy.text;
          delete layerCopy.textColor;
          delete layerCopy.fontSize;
        }

        // 如果是文字模式，删除图片相关属性
        if (
          layerCopy.styleType === StyleType.COLOR &&
          "imageUrl" in layerCopy
        ) {
          delete layerCopy.imageUrl;
        }

        return layerCopy;
      });

      // 构建要保存的数据结构
      const canvasData = {
        width: canvasWidth,
        height: canvasHeight,
        layers: validLayers,
      };

      // 将数据转换为JSON并打印到控制台
      const jsonData = JSON.stringify(canvasData, null, 2);
      console.log("保存的画布数据:");
      console.log(jsonData);

      // 保存到localStorage方便测试
      localStorage.setItem("canvas-demo-data", jsonData);

      // 提示用户保存成功
      alert("画布已保存，数据已在控制台打印");
    };

    /**
     * 从JSON配置初始化画布
     * @param jsonConfig - JSON格式的画布配置或配置对象
     */
    const initCanvasFromConfig = (jsonConfig: string | CanvasData): void => {
      let config: CanvasData;

      // 如果传入的是字符串，则解析为JSON对象
      if (typeof jsonConfig === "string") {
        try {
          config = JSON.parse(jsonConfig);
        } catch (error) {
          console.error("无效的JSON配置:", error);
          return;
        }
      } else {
        config = jsonConfig;
      }

      // 清空现有图层并重置状态
      state.value.layers = [];
      state.value.activeLayerId = null;
      state.value.nextZIndex = 1;

      // 预加载所有图片，确保渲染时图片已准备好
      const imagePromises: Promise<void>[] = [];

      config.layers.forEach((layer) => {
        if (layer.imageUrl) {
          const imageUrl = layer.imageUrl; // 创建本地变量来避免类型问题
          const promise = new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              imageCache.value.set(imageUrl, img);
              resolve();
            };
            img.onerror = () => {
              console.warn(`无法加载图片: ${imageUrl}`);
              resolve(); // 即使加载失败也继续
            };
            img.src = imageUrl;
          });
          imagePromises.push(promise);
        }
      });

      // 当所有图片加载完成后，添加图层到画布
      Promise.all(imagePromises).then(() => {
        // 按zIndex排序图层，确保正确的绘制顺序
        const sortedLayers = [...config.layers].sort(
          (a, b) => a.zIndex - b.zIndex,
        );

        // 找到最大的zIndex值
        let maxZIndex = 0;
        sortedLayers.forEach((layer) => {
          maxZIndex = Math.max(maxZIndex, layer.zIndex);

          // 确保每个图层都有一个唯一的ID
          if (!layer.id) {
            layer.id = generateId(layer.type);
          }

          // 添加图层到状态
          state.value.layers.push(layer as AnyLayer);
        });

        // 设置下一个zIndex值
        state.value.nextZIndex = maxZIndex + 1;
      });
    };

    /**
     * 从localStorage加载画布数据
     */
    const loadCanvasFromStorage = (): void => {
      const savedData = localStorage.getItem("canvas-demo-data");
      if (savedData) {
        initCanvasFromConfig(savedData);
        alert("已从本地存储加载画布数据");
      } else {
        alert("未找到保存的画布数据");
      }
    };

    // 初始化背景层
    initBackground();

    return {
      fileInput,
      fileInputForBg,
      buttonPanelRef,
      state,
      canvasWidth,
      canvasHeight,
      activeLayer,
      LayerType,
      addButton,
      openFileSelector,
      openFileSelectorForNewImage,
      handleFileUpload,
      handleBackgroundImageUpload,
      updateLayer,
      handleLayerUpdate,
      handleEditText,
      deleteLayer,
      getButtonNumber,
      saveCanvas,
      initCanvasFromConfig,
      loadCanvasFromStorage,
    };
  },
});
</script>

<style scoped>
.canvas-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.logo {
  font-weight: bold;
  font-size: 18px;
}

.back-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.load-btn,
.save-btn {
  background-color: #4a4af4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 20px;
  cursor: pointer;
  margin-left: 10px;
}

.content-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel,
.right-panel {
  width: 250px;
  background-color: #f5f5f5;
  padding: 15px;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 20px;
}

.panel-section h3 {
  margin-top: 0;
  padding-bottom: 5px;
  border-bottom: 2px solid #4a4af4;
}

.button-creator {
  margin-bottom: 15px;
}

.add-button {
  width: 100%;
  background-color: #2187ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  font-size: 16px;
}

.image-uploader,
.upload-box {
  width: 100%;
  height: 100px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.plus-icon {
  font-size: 24px;
  font-weight: bold;
  color: #999;
}

.upload-text {
  font-size: 14px;
  color: #999;
}
</style>
