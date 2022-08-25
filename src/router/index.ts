import { createRouter, createWebHistory } from "vue-router";
import ChannelView from "../views/ChannelView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "root",
      redirect: { name: "channel" },
    },
    {
      path: "/channel",
      name: "channel",
      component: ChannelView,
    },
    {
      path: "/channel/:channel",
      name: "channel_page",
      component: ChannelView,
    },
  ],
});

export default router;
