<template>
  <div id="app">
    <CesiumMap />
  </div>
</template>

<script>
import CesiumMap from './components/CesiumMap.vue'

export default {
  name: 'App',
  components: {
    CesiumMap
  }
}
</script>

<style>
.cesium-viewer-bottom,
.cesium-viewer-zoomIndicatorContainer,
.cesium-viewer-navigationContainer {
  display: none;
}
</style>
