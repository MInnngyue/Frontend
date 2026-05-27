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
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminDashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../views/MessagesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/claims',
      name: 'claims',
      component: () => import('../views/ClaimProgress.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/my-posts',
      name: 'myPosts',
      component: () => import('../views/MyPostsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else if (to.meta.requiresAdmin) {
    try {
      const ui = JSON.parse(localStorage.getItem('userInfo') || '{}')
      if (ui.role !== 1) {
        next('/')
        return
      }
    } catch { next('/'); return }
    next()
  } else {
    next()
  }
})

export default router
