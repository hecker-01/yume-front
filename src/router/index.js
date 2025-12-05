import { createRouter, createWebHistory } from "vue-router";
import Home from "@/pages/Home.vue";
import Orders from "@/pages/Orders.vue";
import Account from "@/pages/Account.vue";
import NotFound from "@/pages/NotFound.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: { title: "Home • Yume Ramen" },
  },
  {
    path: "/orders",
    name: "Orders",
    component: Orders,
    meta: { title: "Orders • Yume Ramen" },
  },
  {
    path: "/account",
    name: "Account",
    component: Account,
    meta: { title: "Account • Yume Ramen" },
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

router.beforeEach((to, _, next) => {
  document.title = to.meta.title || "Yume Ramen";
  next();
});

export default router;
