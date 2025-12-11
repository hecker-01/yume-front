import { createRouter, createWebHistory } from "vue-router";
import Home from "@/pages/Home.vue";
import Orders from "@/pages/Orders.vue";
import OrderDetail from "@/pages/OrderDetail.vue";
import Account from "@/pages/Account.vue";
import Login from "@/pages/Login.vue";
import Signup from "@/pages/Signup.vue";
import NotFound from "@/pages/NotFound.vue";
import authService from "@/services/authService.js";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { title: "Home • Yume Ramen" },
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { title: "Login • Yume Ramen" },
  },
  {
    path: "/signup",
    name: "Signup",
    component: Signup,
    meta: { title: "Sign Up • Yume Ramen" },
  },
  {
    path: "/orders",
    name: "Orders",
    component: Orders,
    meta: {
      title: "Orders • Yume Ramen",
      requiresAuth: true,
    },
  },
  {
    path: "/orders/:id",
    name: "OrderDetail",
    component: OrderDetail,
    meta: {
      title: "Order Details • Yume Ramen",
      requiresAuth: true,
    },
  },
  {
    path: "/account",
    name: "Account",
    component: Account,
    meta: {
      title: "Account • Yume Ramen",
      requiresAuth: true,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
    meta: { title: "404 Not Found • Yume Ramen" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || "Yume Ramen";

  // Check if the route requires authentication
  if (to.meta.requiresAuth) {
    // Only check if user data exists in localStorage (not validating token)
    // Token validation happens via HTTP-only cookies on API calls
    if (!authService.isAuthenticated()) {
      // No user data, redirect to login
      next({
        name: "Login",
        query: { redirect: to.fullPath },
      });
      return;
    }
  }

  // If going to login page and already logged in, redirect to account or intended destination
  if (to.name === "Login" && authService.isAuthenticated()) {
    const redirectTo = to.query.redirect || "/account";
    next(redirectTo);
    return;
  }

  next();
});

export default router;
