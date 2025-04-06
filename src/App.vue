<script lang="ts">
import { defineComponent } from "vue";
import DemoComponent from "./components/DemoComponent.vue";

export default defineComponent({
  name: "App",
  components: {
    DemoComponent,
  },
});
</script>

<template>
  <div class="app">
    <DemoComponent />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  font-family: Arial, sans-serif;
}

.app {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
}
</style>
