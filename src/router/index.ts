import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/page/:pageId',
      name: 'index',
      component: HomeView,
    },
    {
      path: '/post/:slug',
      name: 'post',
      component: () => import('../views/PostView.vue')
    },
  ],
})

export default router
