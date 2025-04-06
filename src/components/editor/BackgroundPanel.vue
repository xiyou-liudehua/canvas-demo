<template>
  <div class="panel-section">
    <h3>遮罩层编辑</h3>
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
    <div class="opacity-control">
      <label>透明度</label>
      <div class="slider-container">
        <input
          type="range"
          min="0"
          max="100"
          v-model.number="opacity"
          @input="updateOpacity"
        />
        <span>{{ opacity }}%</span>
      </div>
    </div>
    <div v-if="layer.styleType === StyleType.COLOR" class="color-picker">
      <label>背景颜色</label>
      <input type="color" v-model="color" @input="updateColor" />
    </div>
    <div v-if="layer.styleType === StyleType.IMAGE" class="bg-image-uploader">
      <button class="upload-bg-btn" @click="$emit('upload-bg-image')">
        上传背景图片
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { StyleType, type BackgroundLayer } from "../../types";

export default defineComponent({
  name: "BackgroundPanel",

  props: {
    layer: {
      type: Object as () => BackgroundLayer,
      required: true,
    },
  },

  emits: ["update", "upload-bg-image"],

  setup(props, { emit }) {
    // 本地状态与props同步
    const opacity = ref(props.layer.opacity);
    const color = ref(props.layer.color || "#333333");

    // 当layer属性变化时更新本地状态
    watch(
      () => props.layer,
      () => {
        opacity.value = props.layer.opacity;
        color.value = props.layer.color || "#333333";
      },
      { deep: true },
    );

    // 更新样式类型
    const updateStyleType = (styleType: StyleType) => {
      emit("update", { ...props.layer, styleType });
    };

    // 更新透明度
    const updateOpacity = () => {
      emit("update", { ...props.layer, opacity: opacity.value });
    };

    // 更新颜色
    const updateColor = () => {
      emit("update", { ...props.layer, color: color.value });
    };

    return {
      StyleType,
      opacity,
      color,
      updateStyleType,
      updateOpacity,
      updateColor,
    };
  },
});
</script>

<style scoped>
.panel-section {
  margin-bottom: 20px;
}

.panel-section h3 {
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

.opacity-control {
  margin-bottom: 15px;
}

.slider-container {
  display: flex;
  align-items: center;
}

.slider-container input {
  flex: 1;
  margin-right: 10px;
}

.color-picker {
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.upload-bg-btn {
  width: 100%;
  background-color: #2187ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
  margin-top: 10px;
}

.bg-image-uploader {
  margin-top: 15px;
}
</style>
