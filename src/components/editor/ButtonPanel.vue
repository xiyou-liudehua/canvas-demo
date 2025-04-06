<template>
  <div class="panel-section">
    <h3>按钮{{ buttonIndex }}编辑</h3>
    <div class="style-selector">
      <span
        class="style-option"
        :class="{ active: layer.styleType === StyleType.COLOR }"
        @click="updateStyleType(StyleType.COLOR)"
        >纯色</span
      >
      <span
        class="style-option"
        :class="{ active: layer.styleType === StyleType.IMAGE }"
        @click="updateStyleType(StyleType.IMAGE)"
        >图片</span
      >
    </div>

    <div v-if="layer.styleType === StyleType.COLOR">
      <div class="color-picker">
        <label>背景颜色</label>
        <input type="color" v-model="bgColor" @input="updateBgColor" />
      </div>

      <div class="text-input">
        <label>按钮文案</label>
        <input type="text" v-model="text" @input="updateText" ref="textInput" />
      </div>

      <div class="text-color">
        <label>文字颜色</label>
        <input type="color" v-model="textColor" @input="updateTextColor" />
      </div>

      <div class="text-size">
        <label>字体大小</label>
        <div class="input-with-unit">
          <input
            type="number"
            v-model.number="fontSize"
            min="10"
            max="36"
            @input="updateFontSize"
          />
          <span>PX</span>
        </div>
      </div>
    </div>

    <div v-else class="image-uploader">
      <div v-if="layer.imageUrl" class="image-preview">
        <img :src="layer.imageUrl" alt="按钮图片" />
        <div class="button-row">
          <button @click="$emit('replace-image')">替换</button>
        </div>
      </div>
      <div v-else class="no-image">
        <button class="upload-img-btn" @click="$emit('replace-image')">
          点击上传图片
        </button>
      </div>
    </div>

    <div class="border-radius">
      <label>圆角大小</label>
      <div class="input-with-unit">
        <input
          type="number"
          v-model.number="borderRadius"
          min="0"
          max="50"
          @input="updateBorderRadius"
        />
        <span>PX</span>
      </div>
    </div>

    <div class="layout-controls">
      <h4>布局</h4>
      <div class="position-control">
        <label>距离弹窗顶部间距</label>
        <div class="input-with-unit">
          <input
            type="number"
            v-model.number="topMargin"
            @input="updateTopMargin"
          />
          <span>PX</span>
        </div>
      </div>
      <div class="position-control">
        <label>距离弹窗右侧间距</label>
        <div class="input-with-unit">
          <input
            type="number"
            v-model.number="rightMargin"
            @input="updateRightMargin"
          />
          <span>PX</span>
        </div>
      </div>
      <div class="size-control">
        <label>宽度</label>
        <div class="input-with-unit">
          <input
            type="number"
            v-model.number="width"
            min="30"
            @input="updateWidth"
          />
          <span>PX</span>
        </div>
      </div>
      <div class="size-control">
        <label>高度</label>
        <div class="input-with-unit">
          <input
            type="number"
            v-model.number="height"
            min="30"
            @input="updateHeight"
          />
          <span>PX</span>
        </div>
      </div>
    </div>

    <div class="delete-button">
      <button @click="$emit('delete')">删除当前组件</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { StyleType, type ButtonLayer } from "../../types";

export default defineComponent({
  name: "ButtonPanel",

  props: {
    layer: {
      type: Object as () => ButtonLayer,
      required: true,
    },
    buttonIndex: {
      type: Number,
      default: 1,
    },
    canvasWidth: {
      type: Number,
      required: true,
    },
  },

  emits: ["update", "delete", "replace-image"],

  setup(props, { emit }) {
    // 本地状态与props同步
    const bgColor = ref(props.layer.color || "#2187ff");
    const text = ref(props.layer.text || "");
    const textColor = ref(props.layer.textColor || "#ffffff");
    const fontSize = ref(props.layer.fontSize || 14);
    const borderRadius = ref(props.layer.borderRadius || 0);
    const topMargin = ref(props.layer.position.y);
    const width = ref(props.layer.size.width);
    const height = ref(props.layer.size.height);
    const iconType = ref("");
    const textInput = ref<HTMLInputElement | null>(null);

    // 计算右侧边距
    const rightMargin = ref(
      props.canvasWidth - (props.layer.position.x + props.layer.size.width),
    );

    // 当layer属性变化时更新本地状态
    watch(
      () => props.layer,
      () => {
        bgColor.value = props.layer.color || "#2187ff";
        text.value = props.layer.text || "";
        textColor.value = props.layer.textColor || "#ffffff";
        fontSize.value = props.layer.fontSize || 14;
        borderRadius.value = props.layer.borderRadius || 0;
        topMargin.value = props.layer.position.y;
        width.value = props.layer.size.width;
        height.value = props.layer.size.height;
        rightMargin.value =
          props.canvasWidth - (props.layer.position.x + props.layer.size.width);
      },
      { deep: true },
    );

    // 更新样式类型
    const updateStyleType = (styleType: StyleType) => {
      if (styleType === StyleType.IMAGE) {
        // 切换到图片模式时，清除文字相关属性
        emit("update", {
          ...props.layer,
          styleType,
          text: "", // 清空文字
        });
      } else {
        // 切换到文字模式时，设置默认文字（如果为空）
        if (!props.layer.text) {
          emit("update", {
            ...props.layer,
            styleType,
            text: "按钮文案",
          });
        } else {
          emit("update", { ...props.layer, styleType });
        }
      }
    };

    // 更新背景颜色
    const updateBgColor = () => {
      emit("update", { ...props.layer, color: bgColor.value });
    };

    // 更新按钮文字
    const updateText = () => {
      emit("update", { ...props.layer, text: text.value });
    };

    // 更新文字颜色
    const updateTextColor = () => {
      emit("update", { ...props.layer, textColor: textColor.value });
    };

    // 更新字体大小
    const updateFontSize = () => {
      emit("update", { ...props.layer, fontSize: fontSize.value });
    };

    // 更新圆角大小
    const updateBorderRadius = () => {
      emit("update", { ...props.layer, borderRadius: borderRadius.value });
    };

    // 更新顶部边距
    const updateTopMargin = () => {
      const newPosition = { ...props.layer.position, y: topMargin.value };
      emit("update", { ...props.layer, position: newPosition });
    };

    // 更新右侧边距
    const updateRightMargin = () => {
      const newX = props.canvasWidth - width.value - rightMargin.value;
      const newPosition = { ...props.layer.position, x: newX };
      emit("update", { ...props.layer, position: newPosition });
    };

    // 更新宽度
    const updateWidth = () => {
      const newSize = { ...props.layer.size, width: width.value };
      emit("update", { ...props.layer, size: newSize });
    };

    // 更新高度
    const updateHeight = () => {
      const newSize = { ...props.layer.size, height: height.value };
      emit("update", { ...props.layer, size: newSize });
    };

    /**
     * 开始文本编辑
     * 用于响应双击事件，聚焦并选中文本输入框
     */
    const startTextEdit = () => {
      // 确保按钮处于文字模式
      if (props.layer.styleType !== StyleType.COLOR) {
        emit("update", { ...props.layer, styleType: StyleType.COLOR });
      }

      // 延迟执行以确保DOM已更新
      setTimeout(() => {
        if (textInput.value) {
          textInput.value.focus();
          textInput.value.select();
        }
      }, 50);
    };

    return {
      StyleType,
      bgColor,
      text,
      textColor,
      fontSize,
      borderRadius,
      topMargin,
      rightMargin,
      width,
      height,
      iconType,
      textInput,
      updateStyleType,
      updateBgColor,
      updateText,
      updateTextColor,
      updateFontSize,
      updateBorderRadius,
      updateTopMargin,
      updateRightMargin,
      updateWidth,
      updateHeight,
      startTextEdit,
    };
  },
});
</script>

<style scoped>
.panel-section {
  margin-bottom: 20px;
}

.panel-section h3,
h4 {
  margin-top: 0;
  padding-bottom: 5px;
  border-bottom: 2px solid #4a4af4;
}

.style-selector {
  display: flex;
  margin-bottom: 15px;
}

.style-option {
  flex: 1;
  text-align: center;
  padding: 8px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.style-option.active {
  border-color: #4a4af4;
  color: #4a4af4;
}

.text-input,
.text-color,
.color-picker,
.text-size,
.border-radius,
.image-selector {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.image-options {
  display: flex;
  gap: 10px;
  margin-top: 5px;
}

.image-option {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.image-option.active {
  border-color: #4a4af4;
  box-shadow: 0 0 0 2px rgba(74, 74, 244, 0.3);
}

.image-option img {
  max-width: 90%;
  max-height: 90%;
}

.layout-controls {
  margin-top: 20px;
}

.position-control,
.size-control {
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.input-with-unit {
  display: flex;
  align-items: center;
}

.input-with-unit input {
  width: 60px;
  margin-right: 5px;
}

.delete-button {
  margin-top: 20px;
}

.delete-button button {
  width: 100%;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
}

.image-preview {
  margin-bottom: 15px;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 150px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
}

.no-image {
  width: 100%;
  height: 120px;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
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
}

.button-row button {
  flex: 1;
  background-color: #2187ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
}

.image-uploader {
  margin-bottom: 15px;
}
</style>
