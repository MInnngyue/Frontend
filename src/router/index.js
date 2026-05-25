import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      name: 'square',
      component: () => import('../views/PostSquare.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/publish',
      name: 'publish',
      component: () => import('../views/PostPublish.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/post/:id',
      name: 'postDetail',
      component: () => import('../views/PostDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // 需要登录但没有token → 跳转登录页
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登录却访问登录页 → 跳转首页
    next('/')
  } else {
    next()
  }
})

export default router
