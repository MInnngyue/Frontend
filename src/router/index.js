import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    // user routes
    {
      path: '/',
      name: 'square',
      component: () => import('../views/PostSquare.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    {
      path: '/publish',
      name: 'publish',
      component: () => import('../views/PostPublish.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    {
      path: '/post/:id',
      name: 'postDetail',
      component: () => import('../views/PostDetail.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/HomeView.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    {
      path: '/messages',
      name: 'messages',
      component: () => import('../views/MessagesView.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    {
      path: '/claims',
      name: 'claims',
      component: () => import('../views/ClaimProgress.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    {
      path: '/my-posts',
      name: 'myPosts',
      component: () => import('../views/MyPostsView.vue'),
      meta: { requiresAuth: true, requiresUser: true },
    },
    // admin routes — separate layout
    {
      path: '/admin',
      component: () => import('../views/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'adminDashboard',
          component: () => import('../views/AdminDashboard.vue'),
        },
        {
          path: 'posts',
          name: 'adminPosts',
          component: () => import('../views/AdminDashboard.vue'),
        },
        {
          path: 'users',
          name: 'adminUsers',
          component: () => import('../views/AdminDashboard.vue'),
        },
        {
          path: 'categories',
          name: 'adminCategories',
          component: () => import('../views/AdminDashboard.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  let role = 0
  try {
    const ui = JSON.parse(localStorage.getItem('userInfo') || '{}')
    role = ui.role || 0
  } catch {}

  // not logged in → login
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  // already logged in, accessing /login → redirect by role
  if (to.path === '/login' && token) {
    next(role === 1 ? '/admin' : '/')
    return
  }
  // admin accessing user pages → redirect to admin
  if (to.meta.requiresUser && role === 1) {
    next('/admin')
    return
  }
  // user accessing admin pages → redirect to square
  if (to.meta.requiresAdmin && role !== 1) {
    next('/')
    return
  }
  next()
})

export default router
