import Vue from 'vue'
import App from './App.vue'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

//vue-iclient3d-webgl组件库
import '@supermap/vue-iclient3d-webgl/dist/styles/vue-iclient3d-webgl.min.css';
import VueiClient from '@supermap/vue-iclient3d-webgl';

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.use(VueiClient);

new Vue({
  render: h => h(App),
}).$mount('#app')