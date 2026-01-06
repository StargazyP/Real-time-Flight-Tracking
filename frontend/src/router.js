import { createRouter, createWebHistory } from 'vue-router'
import openskymap from './components/openskymap.vue'
const routes = [
  { path: '/', component: openskymap }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
