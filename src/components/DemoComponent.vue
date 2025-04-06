<template>
  <div class="demo-component">
    <div class="toolbar">
      <div class="logo">通用节点演示</div>

      <!-- 添加背景设置按钮 -->
      <div class="canvas-settings">
        <button
          @click="showBackgroundSettings = !showBackgroundSettings"
          class="settings-btn"
        >
          背景设置
        </button>
        <!-- 背景设置弹窗 -->
        <div v-if="showBackgroundSettings" class="background-settings-panel">
          <div class="panel-header">
            <h3>背景设置</h3>
            <button class="close-btn" @click="showBackgroundSettings = false">
              ×
            </button>
          </div>

          <div class="settings-content">
            <div class="style-selector">
              <span
                class="style-option"
                :class="{ active: backgroundType === 'color' }"
                @click="backgroundType = 'color'"
                >颜色</span
              >
              <span
                class="style-option"
                :class="{ active: backgroundType === 'image' }"
                @click="backgroundType = 'image'"
                >图片</span
              >
            </div>

            <!-- 背景颜色选择器 -->
            <div v-if="backgroundType === 'color'" class="form-group">
              <label>背景颜色</label>
              <input
                type="color"
                v-model="canvasBackgroundColor"
                @change="setCanvasBackground"
              />
            </div>

            <!-- 背景图片选择器 -->
            <div v-if="backgroundType === 'image'" class="image-panel">
              <div class="image-preview bg-preview">
                <img
                  v-if="canvasBackgroundImage"
                  :src="canvasBackgroundImage"
                  alt="背景图片预览"
                />
                <div v-else class="no-image">
                  <button
                    class="upload-img-btn"
                    @click="openBackgroundFileSelector"
                  >
                    点击上传背景图片
                  </button>
                </div>
              </div>

              <div class="button-row" v-if="canvasBackgroundImage">
                <button @click="openBackgroundFileSelector">更换图片</button>
                <button @click="clearBackgroundImage" class="clear-btn">
                  清除图片
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="openPreview" class="preview-btn">预览</button>
        <button @click="saveCanvas" class="save-btn">保存</button>
        <button @click="loadCanvas" class="load-btn">加载</button>
      </div>
    </div>

    <div class="content-area">
      <div class="left-panel">
        <div class="panel-section">
          <h3>添加节点</h3>
          <button class="add-button" @click="addTextNode">添加文本节点</button>
          <button class="add-button" @click="addImageNode">添加图片节点</button>
        </div>
      </div>

      <div ref="editorContainer" class="editor-content"></div>

      <div class="right-panel">
        <div class="panel-section" v-if="selectedNode">
          <h3>节点属性</h3>

          <!-- 节点类型选择器 -->
          <div class="panel-title">节点类型</div>
          <div class="style-selector">
            <span
              class="style-option"
              :class="{ active: nodeType === 'text' }"
              @click="setNodeType('text')"
              >文本</span
            >
            <span
              class="style-option"
              :class="{ active: nodeType === 'image' }"
              @click="setNodeType('image')"
              >图片</span
            >
          </div>

          <!-- 基础属性分组 -->
          <div class="panel-title">基础属性</div>
          <div class="form-group">
            <label>背景颜色</label>
            <input
              type="color"
              v-model="backgroundColor"
              @change="updateNodeStyle"
            />
          </div>

          <!-- 只在文本模式下显示的边框属性 -->
          <template v-if="nodeType === 'text'">
            <div class="panel-title">边框设置</div>
            <div class="form-group">
              <label>边框颜色</label>
              <input
                type="color"
                v-model="borderColor"
                @change="updateNodeStyle"
              />
            </div>
            <div class="form-group">
              <label>边框宽度</label>
              <input
                type="number"
                min="0"
                max="10"
                v-model.number="borderWidth"
                @change="updateNodeStyle"
              />
            </div>
          </template>

          <div class="form-group">
            <label>圆角</label>
            <input
              type="number"
              min="0"
              max="50"
              v-model.number="borderRadius"
              @change="updateNodeStyle"
            />
          </div>
          <div class="form-group">
            <label>透明度</label>
            <div class="slider-container">
              <input
                type="range"
                min="0"
                max="100"
                v-model.number="opacity"
                @change="updateNodeStyle"
              />
              <span>{{ opacity }}%</span>
            </div>
          </div>

          <!-- 文本属性 (当节点是文本类型时显示) -->
          <template v-if="nodeType === 'text'">
            <div class="panel-title">文本设置</div>
            <div class="form-group">
              <label>文字内容</label>
              <input type="text" v-model="text" @change="updateNodeStyle" />
            </div>
            <div class="form-group">
              <label>文字颜色</label>
              <input
                type="color"
                v-model="textColor"
                @change="updateNodeStyle"
              />
            </div>
            <div class="form-group">
              <label>字体大小</label>
              <input
                type="number"
                min="8"
                max="36"
                v-model.number="fontSize"
                @change="updateNodeStyle"
              />
            </div>
          </template>

          <!-- 图片属性 (当节点是图片类型时显示) -->
          <template v-if="nodeType === 'image'">
            <div class="panel-title">图片设置</div>
            <!-- 当前节点是图片节点时才显示图片预览 -->
            <div class="image-preview" v-if="showImagePreview()">
              <img v-if="hasImage()" :src="imageUrl" alt="图片预览" />
              <div v-else class="no-image">
                <button class="upload-img-btn" @click="openFileSelector">
                  点击上传图片
                </button>
              </div>
            </div>
            <!-- 当前节点不是图片节点但UI选择了图片tab时显示转换提示 -->
            <div v-else class="image-preview convert-prompt">
              <p>请先将文本节点转换为图片节点</p>
              <button class="convert-btn" @click="setNodeType('image')">
                转换为图片节点
              </button>
            </div>
            <!-- 替换图片按钮 -->
            <div class="button-row" v-if="hasImage()">
              <button @click="openFileSelector">替换图片</button>
            </div>
          </template>

          <div class="form-actions">
            <button class="delete-btn" @click="deleteSelectedNode">
              删除节点
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件上传输入框 -->
    <input
      type="file"
      ref="fileInput"
      style="display: none"
      accept="image/*"
      @change="handleFileUpload"
    />

    <!-- 添加背景图片文件选择器 -->
    <input
      type="file"
      ref="bgFileInput"
      style="display: none"
      accept="image/*"
      @change="handleBackgroundFileUpload"
    />

    <!-- 添加预览组件 -->
    <CanvasPreview
      :visible="showPreview"
      :jsonData="previewData"
      :width="800"
      :height="600"
      @close="showPreview = false"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import { Editor, BaseNode, TextNode, ImageNode } from "../core";
import CanvasPreview from "./CanvasPreview.vue";

export default defineComponent({
  name: "DemoComponent",
  components: {
    CanvasPreview,
  },

  setup() {
    const editorContainer = ref<HTMLElement | null>(null);
    const editor = ref<Editor | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);
    const bgFileInput = ref<HTMLInputElement | null>(null);

    // 添加背景设置相关状态
    const showBackgroundSettings = ref(false);
    const backgroundType = ref<string>("color");
    const canvasBackgroundColor = ref("#f5f5f5");
    const canvasBackgroundImage = ref<string | null>(null);

    // 选中节点的属性
    const selectedNode = ref<BaseNode | null>(null);
    const backgroundColor = ref("#3498db");
    const borderColor = ref("#2980b9");
    const borderWidth = ref(2);
    const borderRadius = ref(8);
    const text = ref("文本节点");
    const textColor = ref("#ffffff");
    const fontSize = ref(14);
    const opacity = ref(100);
    const imageUrl = ref("");

    // 节点类型
    const nodeType = ref<string>("text");

    // 添加预览相关状态
    const showPreview = ref(false);
    const previewData = ref("");
    const previewWidth = ref(800);
    const previewHeight = ref(600);

    // 当组件挂载后初始化编辑器
    onMounted(() => {
      if (editorContainer.value) {
        // 创建编辑器实例
        editor.value = new Editor(editorContainer.value, {
          width: 800,
          height: 600,
          backgroundColor: canvasBackgroundColor.value,
        });

        // 添加示例节点
        addSampleNode();

        // 监听选择变化
        monitorSelectionChange();
      }
    });

    // 监听编辑器选择变化
    const monitorSelectionChange = () => {
      if (!editor.value) return;

      editor.value.addSelectionChangeListener((node: any) => {
        if (node instanceof BaseNode) {
          selectedNode.value = node;
          updatePropertiesFromNode();
        } else {
          selectedNode.value = null;
        }
      });
    };

    // 从当前选中节点更新属性控件
    const updatePropertiesFromNode = () => {
      if (!selectedNode.value) return;

      // 节点类型
      nodeType.value = selectedNode.value.getType();

      // 基本属性
      backgroundColor.value = selectedNode.value.getBackgroundColor();
      borderColor.value = selectedNode.value.getBorderColor();
      borderWidth.value = selectedNode.value.getBorderWidth();
      borderRadius.value = selectedNode.value.getBorderRadius();
      opacity.value = Math.round(selectedNode.value.getOpacity() * 100);

      // 文本属性
      if (selectedNode.value instanceof TextNode) {
        text.value = selectedNode.value.getText();
        textColor.value = selectedNode.value.getTextColor();
        fontSize.value = selectedNode.value.getFontSize();
      }

      // 图片属性
      if (selectedNode.value instanceof ImageNode) {
        imageUrl.value = selectedNode.value.getImageUrl();
      } else {
        // 如果不是图片节点，清空图片URL
        imageUrl.value = "";
      }
    };

    // 更新节点样式
    const updateNodeStyle = () => {
      if (!selectedNode.value) return;

      // 更新基本属性
      selectedNode.value.setBackgroundColor(backgroundColor.value);
      selectedNode.value.setBorderColor(borderColor.value);
      selectedNode.value.setBorderWidth(borderWidth.value);
      selectedNode.value.setBorderRadius(borderRadius.value);
      selectedNode.value.setOpacity(opacity.value / 100);

      // 更新文本属性
      if (selectedNode.value instanceof TextNode) {
        selectedNode.value.setText(text.value);
        selectedNode.value.setTextColor(textColor.value);
        selectedNode.value.setFontSize(fontSize.value);
      }

      // 立即重绘
      editor.value?.redraw();
    };

    // 设置节点类型
    const setNodeType = (type: string) => {
      if (!selectedNode.value || !editor.value) return;
      if (type === "text") {
        editor.value.convertImageToText(selectedNode.value.getId());
      } else if (type === "image") {
        editor.value.convertTextToImage(selectedNode.value.getId());
      }
      nodeType.value = type;
      // 重绘
      editor.value?.redraw();
    };

    // 添加示例节点
    const addSampleNode = () => {
      if (!editor.value) return;

      editor.value.addTextNode({
        x: 300,
        y: 200,
        width: 200,
        height: 100,
        backgroundColor: "#e74c3c",
        borderColor: "#c0392b",
        borderWidth: 2,
        borderRadius: 8,
        text: "示例文本节点",
        textColor: "#ffffff",
        fontSize: 16,
      });
    };

    // 添加文本节点
    const addTextNode = () => {
      if (!editor.value) return;

      const x = Math.random() * (editor.value.getWidth() - 200);
      const y = Math.random() * (editor.value.getHeight() - 100);

      editor.value.addTextNode({
        x,
        y,
        width: 200,
        height: 100,
        backgroundColor: getRandomColor(),
        borderColor: "#333333",
        borderWidth: 2,
        borderRadius: 8,
        text: "文本节点",
        textColor: "#ffffff",
        fontSize: 14,
      });
    };

    // 添加图片节点
    const addImageNode = () => {
      if (!editor.value) return;

      // 直接打开文件选择器，不预先创建节点
      if (fileInput.value) {
        // 标记当前是新增图片节点操作
        fileInput.value.dataset.action = "add";
        fileInput.value.click();
      }
    };

    // 打开文件选择器
    const openFileSelector = () => {
      if (fileInput.value) {
        // 标记当前是修改现有节点操作
        fileInput.value.dataset.action = "edit";
        fileInput.value.click();
      }
    };

    // 处理文件上传
    const handleFileUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (
        !target ||
        !target.files ||
        target.files.length === 0 ||
        !editor.value
      )
        return;

      const file = target.files[0];
      const reader = new FileReader();
      const action = target.dataset.action || "";
      const nodeId = target.dataset.nodeId || "";

      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && e.target.result && editor.value) {
          const imageData = e.target.result as string;

          // 根据操作类型处理图片
          if (action === "add") {
            // 新增图片节点
            const x = Math.random() * (editor.value.getWidth() - 200);
            const y = Math.random() * (editor.value.getHeight() - 150);

            // 添加图片节点并立即设置图片
            const node = editor.value.addImageNode({
              x,
              y,
              width: 200,
              height: 150,
              backgroundColor: "#ffffff",
              borderColor: "#333333",
              borderWidth: 0,
              borderRadius: 8,
              imageUrl: imageData,
            });

            // 自动选中新添加的节点
            if (node) {
              editor.value.selectNode(node.getId());
            }
          } else if (action === "convert" && nodeId) {
            // 从文本节点转换为图片节点，并使用新选择的图片
            const convertedNode = editor.value.convertTextToImage(
              nodeId,
              imageData,
            );
            if (convertedNode) {
              imageUrl.value = imageData;
              nodeType.value = "image";
            }
          } else if (action === "edit" && selectedNode.value) {
            // 编辑现有节点的图片
            imageUrl.value = imageData;

            if (selectedNode.value instanceof ImageNode) {
              // 如果是图片节点，更新图片
              selectedNode.value.loadImage(imageUrl.value);
            }
          }

          // 重绘
          editor.value.redraw();
        }
      };

      reader.readAsDataURL(file);
      target.value = ""; // 重置input
    };

    // 删除选中的节点
    const deleteSelectedNode = () => {
      if (!editor.value || !selectedNode.value) return;

      editor.value.removeNode(selectedNode.value.getId());
      selectedNode.value = null;
    };

    // 生成随机颜色
    const getRandomColor = (): string => {
      const letters = "0123456789ABCDEF";
      let color = "#";
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };

    // 保存画布
    const saveCanvas = () => {
      if (!editor.value) return;

      const jsonData = editor.value.exportToJSON();
      localStorage.setItem("universal-node-demo", jsonData);
      alert("保存成功");
    };

    // 加载画布
    const loadCanvas = () => {
      if (!editor.value) return;

      const jsonData = localStorage.getItem("universal-node-demo");
      if (jsonData) {
        editor.value.loadFromJSON(jsonData);

        // 更新背景状态
        try {
          const data = JSON.parse(jsonData);
          if (data.backgroundColor) {
            canvasBackgroundColor.value = data.backgroundColor;
          }

          if (data.backgroundImage) {
            canvasBackgroundImage.value = data.backgroundImage;
            backgroundType.value = "image";
          } else {
            backgroundType.value = "color";
          }
        } catch (error) {
          console.error("解析背景数据失败:", error);
        }

        alert("加载成功");
      } else {
        alert("没有找到保存的数据");
      }
    };

    // 图片属性面板 - 只有在显示图片tab且当前节点是图片节点时，才显示图片预览和上传按钮
    const showImagePreview = () => {
      return (
        nodeType.value === "image" && selectedNode.value instanceof ImageNode
      );
    };

    // 图片属性面板 - 检查当前图片节点是否有图片
    const hasImage = () => {
      return showImagePreview() && imageUrl.value !== "";
    };

    // 图片属性面板 - 是否显示上传按钮
    const showUploadButton = () => {
      return showImagePreview() && !hasImage();
    };

    // 设置画布背景
    const setCanvasBackground = () => {
      if (!editor.value) return;

      if (backgroundType.value === "color") {
        editor.value.setBackgroundColor(canvasBackgroundColor.value);
        canvasBackgroundImage.value = null;
      } else if (
        backgroundType.value === "image" &&
        canvasBackgroundImage.value
      ) {
        editor.value.setBackgroundImage(canvasBackgroundImage.value);
      }
    };

    // 打开背景图片文件选择器
    const openBackgroundFileSelector = () => {
      if (bgFileInput.value) {
        bgFileInput.value.click();
      }
    };

    // 处理背景图片上传
    const handleBackgroundFileUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (
        !target ||
        !target.files ||
        target.files.length === 0 ||
        !editor.value
      )
        return;

      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target && e.target.result && editor.value) {
          const imageData = e.target.result as string;
          canvasBackgroundImage.value = imageData;
          editor.value.setBackgroundImage(imageData);
        }
      };

      reader.readAsDataURL(file);
      target.value = ""; // 重置input
    };

    // 清除背景图片
    const clearBackgroundImage = () => {
      if (!editor.value) return;

      canvasBackgroundImage.value = null;
      editor.value.clearBackgroundImage();
      backgroundType.value = "color";
    };

    // 打开预览
    const openPreview = () => {
      console.log("打开预览");

      try {
        if (!editor.value) {
          console.error("编辑器未初始化");
          return;
        }

        // 导出当前数据为JSON
        const jsonData = editor.value.exportToJSON();

        console.log("预览数据:", jsonData.slice(0, 100) + "...");

        // 设置预览数据和大小
        previewData.value = jsonData;
        previewWidth.value = 800;
        previewHeight.value = 600;

        // 显示预览组件
        showPreview.value = true;
      } catch (error) {
        console.error("生成预览数据失败:", error);
      }
    };

    return {
      editorContainer,
      fileInput,
      bgFileInput,
      selectedNode,
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius,
      text,
      textColor,
      fontSize,
      opacity,
      imageUrl,
      nodeType,
      addTextNode,
      addImageNode,
      deleteSelectedNode,
      updateNodeStyle,
      setNodeType,
      openFileSelector,
      handleFileUpload,
      saveCanvas,
      loadCanvas,
      showImagePreview,
      hasImage,
      showUploadButton,
      showBackgroundSettings,
      backgroundType,
      canvasBackgroundColor,
      canvasBackgroundImage,
      setCanvasBackground,
      openBackgroundFileSelector,
      handleBackgroundFileUpload,
      clearBackgroundImage,
      showPreview,
      previewData,
      previewWidth,
      previewHeight,
      openPreview,
    };
  },
});
</script>

<style scoped>
.demo-component {
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

.canvas-settings {
  position: relative;
}

.settings-btn {
  background-color: #4a4af4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 20px;
  cursor: pointer;
}

.background-settings-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 280px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
  margin-top: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.settings-content {
  padding: 16px;
}

.bg-preview {
  margin-bottom: 12px;
}

.clear-btn {
  background-color: #e74c3c;
}

.action-buttons {
  display: flex;
  align-items: center;
}

.preview-btn,
.save-btn,
.load-btn {
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

.add-button {
  width: 100%;
  background-color: #2187ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 10px;
}

.editor-content {
  flex: 1;
  height: 100%;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
}

.form-group input[type="text"],
.form-group input[type="number"] {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group input[type="color"] {
  width: 100%;
  height: 30px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.slider-container {
  display: flex;
  align-items: center;
}

.slider-container input {
  flex: 1;
  margin-right: 10px;
}

.form-actions {
  margin-top: 20px;
}

.delete-btn {
  width: 100%;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
}

.style-selector {
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #ddd;
}

.style-option {
  flex: 1;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  border-bottom: 3px solid transparent;
}

.style-option.active {
  border-bottom-color: #4a4af4;
  font-weight: bold;
}

.image-preview {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  overflow: hidden;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
}

.upload-img-btn {
  background-color: #2187ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
}

.button-row {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.button-row button {
  flex: 1;
  background-color: #2187ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 0;
  cursor: pointer;
}

.panel-title {
  font-weight: bold;
  margin: 15px 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
  color: #2187ff;
}

.panel-title:first-of-type {
  margin-top: 0;
}

.convert-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.convert-btn {
  background-color: #2187ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 15px;
  cursor: pointer;
  margin-top: 10px;
}
</style>
