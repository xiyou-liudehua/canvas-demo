<script lang="ts">
import { defineComponent, ref } from "vue";
import EditorContainer from "./components/editor/EditorContainer.vue";
import CanvasPreview from "./components/preview/CanvasPreview.vue";
import type { CanvasData } from "./types";

export default defineComponent({
  name: "App",
  components: {
    EditorContainer,
    CanvasPreview,
  },
  setup() {
    const activeTab = ref("editor");
    const previewData = ref<CanvasData | null>(null);

    const handleCanvasLoaded = (data: CanvasData) => {
      previewData.value = data;
      console.log("预览画布已加载:", data);
    };

    return {
      activeTab,
      previewData,
      handleCanvasLoaded,
    };
  },
});
</script>

<template>
  <div id="app">
    <div class="app-tabs">
      <button
        :class="{ active: activeTab === 'editor' }"
        @click="activeTab = 'editor'"
      >
        编辑器
      </button>
      <button
        :class="{ active: activeTab === 'preview' }"
        @click="activeTab = 'preview'"
      >
        预览
      </button>
    </div>

    <div class="app-content">
      <EditorContainer v-if="activeTab === 'editor'" />
      <CanvasPreview
        v-else
        :showLoadButton="true"
        title="模板预览"
        @canvas-loaded="handleCanvasLoaded"
      />
    </div>
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-tabs {
  display: flex;
  background-color: #f5f5f5;
  border-bottom: 1px solid #ddd;
  padding: 0 20px;
}

.app-tabs button {
  padding: 12px 20px;
  border: none;
  background: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-right: 10px;
}

.app-tabs button.active {
  border-bottom-color: #4a4af4;
  color: #4a4af4;
}

.app-content {
  flex-grow: 1;
  overflow: auto;
}
</style>
