import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";

import { library } from "@fortawesome/fontawesome-svg-core";
import { faLock, faHashtag } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useSlackStore } from "./stores/slack";
import { User } from "./types/user";
import team from "./data/team.json";

library.add(faLock);
library.add(faHashtag);

const app = createApp(App);

app.use(createPinia());

const slackStore = useSlackStore();
app.use(router);
app.component("font-awesome", FontAwesomeIcon);

Promise.all([
  Promise.all(
    team.channels.map(async (c) =>
      Object.assign({}, await import(`./data/channels/${c}.json`))
    )
  ).then((channels) => slackStore.setChannels(channels)),
  Promise.all(
    team.users.map(async (c) => {
      const user = await import(`./data/users/${c}.json`);
      if (user.id.startsWith("U")) {
        return new User(
          user.id,
          user.real_name,
          user.profile.display_name || user.real_name
        );
      } else {
        return new User(user.id, user.name, user.name);
      }
    })
  ).then((users) => slackStore.setUsers(users)),
]).then(() => {
  app.mount("#app");
});
