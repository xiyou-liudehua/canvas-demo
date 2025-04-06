<template>
  <div class="panel-section">
    <h3>弹窗图片编辑</h3>
    <div class="style-selector">
      <span
        class="style-option"
        :class="{ active: layer.styleType === StyleType.IMAGE }"
        @click="updateStyleType(StyleType.IMAGE)"
        >图片</span
      >
      <span
        class="style-option"
        :class="{ active: layer.styleType === StyleType.COLOR }"
        @click="updateStyleType(StyleType.COLOR)"
        >文字</span
      >
    </div>

    <div v-if="layer.styleType === StyleType.IMAGE" class="image-preview">
      <img v-if="layer.imageUrl" :src="layer.imageUrl" alt="图片预览" />
      <div v-else class="no-image">
        <button class="upload-img-btn" @click="$emit('replace-image')">
          点击上传图片
        </button>
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
      <div class="button-row">
        <button @click="$emit('replace-image')">替换</button>
        <button @click="$emit('delete')">删除</button>
      </div>
    </div>

    <div v-else>
      <div class="text-input">
        <label>按钮文案</label>
        <input type="text" v-model="text" @input="updateText" />
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
      <div class="color-picker">
        <label>背景颜色</label>
        <input type="color" v-model="bgColor" @input="updateBgColor" />
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
    </div>

    <div class="size-controls">
      <h4>尺寸</h4>
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
      <div class="position-control">
        <label>X坐标</label>
        <div class="input-with-unit">
          <input type="number" v-model.number="posX" @input="updatePosition" />
          <span>PX</span>
        </div>
      </div>
      <div class="position-control">
        <label>Y坐标</label>
        <div class="input-with-unit">
          <input type="number" v-model.number="posY" @input="updatePosition" />
          <span>PX</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { StyleType, type ImageLayer } from "../../types";

export default defineComponent({
  name: "ImagePanel",

  props: {
    layer: {
      type: Object as () => ImageLayer,
      required: true,
    },
  },

  emits: ["update", "replace-image", "delete"],

  setup(props, { emit }) {
    // 本地状态与props同步
    const text = ref(props.layer.text || "按钮文字");
    const textColor = ref(props.layer.textColor || "#ffffff");
    const fontSize = ref(props.layer.fontSize || 14);
    const bgColor = ref(props.layer.color || "#2187ff");
    const borderRadius = ref(props.layer.borderRadius || 0);
    const width = ref(props.layer.size.width);
    const height = ref(props.layer.size.height);
    const posX = ref(props.layer.position.x);
    const posY = ref(props.layer.position.y);

    // 当layer属性变化时更新本地状态
    watch(
      () => props.layer,
      () => {
        text.value = props.layer.text || "按钮文字";
        textColor.value = props.layer.textColor || "#ffffff";
        fontSize.value = props.layer.fontSize || 14;
        bgColor.value = props.layer.color || "#2187ff";
        borderRadius.value = props.layer.borderRadius || 0;
        width.value = props.layer.size.width;
        height.value = props.layer.size.height;
        posX.value = props.layer.position.x;
        posY.value = props.layer.position.y;
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
        // 切换到文字模式时，确保存在默认文字
        if (!props.layer.text) {
          emit("update", {
            ...props.layer,
            styleType,
            text: "按钮文字",
            textColor: textColor.value,
            fontSize: fontSize.value,
            color: bgColor.value,
          });
        } else {
          emit("update", { ...props.layer, styleType });
        }
      }
    };

    // 更新文字
    const updateText = () => {
      // 即使输入为空也保存更新，允许空文本状态
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

    // 更新背景颜色
    const updateBgColor = () => {
      emit("update", { ...props.layer, color: bgColor.value });
    };

    // 更新圆角大小
    const updateBorderRadius = () => {
      emit("update", { ...props.layer, borderRadius: borderRadius.value });
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

    // 更新位置
    const updatePosition = () => {
      const newPosition = { x: posX.value, y: posY.value };
      emit("update", { ...props.layer, position: newPosition });
    };

    return {
      StyleType,
      text,
      textColor,
      fontSize,
      bgColor,
      borderRadius,
      width,
      height,
      posX,
      posY,
      updateStyleType,
      updateText,
      updateTextColor,
      updateFontSize,
      updateBgColor,
      updateBorderRadius,
      updateWidth,
      updateHeight,
      updatePosition,
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

.image-preview {
  margin-bottom: 15px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.image-preview img {
  max-width: 100%;
  max-height: 150px;
  border: 1px solid #ddd;
  margin-bottom: 10px;
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

.button-row button:last-child {
  background-color: #f44336;
}

.text-input,
.text-color,
.color-picker,
.border-radius,
.text-size {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.size-controls {
  margin-top: 15px;
}

.size-control,
.position-control {
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
</style>
