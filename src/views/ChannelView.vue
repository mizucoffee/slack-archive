<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { useSlackStore } from "../stores/slack";
import SlackMessages from "../components/SlackMessages.vue";
import { ref, watch } from "vue";
import SlackThread from "../components/SlackThread.vue";

const { team, channels, getChannelById } = useSlackStore();

const route = useRoute();
const router = useRouter();
const channel = ref(getChannelById(`${route.params.channel}`));
const threadMessage = ref<any | null>(null);
if (!channel.value) {
  router.push(`/channel/${channels[0].id}`);
}

watch(
  () => route.params.channel,
  () => {
    channel.value = getChannelById(`${route.params.channel}`);
  }
);

function onOpenThread(message: any) {
  threadMessage.value = message;
}
function close() {
  threadMessage.value = null;
}
</script>

<template>
  <main v-if="channel">
    <div class="channels">
      <div class="workspace">
        <img :src="`/${team.id}.png`" />
        <div>{{ team.name }}</div>
      </div>
      <div class="channel_list">
        <router-link
          v-for="c in channels"
          v-bind:key="c.id"
          :to="`/channel/${c.id}`"
          :class="`channel ${c.is_private ? 'private' : ''} ${
            channel.id == c.id ? 'selected' : ''
          }`"
        >
          <div>
            <font-awesome
              class="channel_icon"
              icon="lock"
              v-if="c.is_private"
            /><font-awesome
              class="channel_icon"
              icon="hashtag"
              v-if="!c.is_private"
            />{{ c.name }}
          </div>
        </router-link>
      </div>
    </div>
    <SlackMessages @on-open-thread="onOpenThread" :channel="channel" />
    <SlackThread @close="close" :message="threadMessage" v-if="threadMessage" />
  </main>
</template>

<style scoped lang="scss">
main {
  display: flex;
  height: 100%;
}
.channels {
  background: #4a154b;
  width: 280px;
  height: 100vh;

  .workspace {
    border-bottom: 1px solid #fff3;
    display: flex;
    align-items: center;
    padding: 0px 8px;
    height: 57px;
    img {
      width: 40px;
      height: 40px;
      margin-right: 8px;
      border-radius: 8px;
    }
    div {
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
}

.channel_list {
  height: calc(100% - 58px - 16px);
  overflow-y: scroll;
  -ms-overflow-style: none;
  scrollbar-width: none;
  padding-top: 8px;
  padding-bottom: 8px;
  &::-webkit-scrollbar {
    display: none;
  }
}

.channel {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background: #fff1;
  }

  &.selected {
    background: #1164a3;
    div {
      color: #fff;
    }
  }

  div {
    color: #fffc;
    font-size: 14px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    line-height: 1em;
  }
  svg.channel_icon {
    color: #fffc;
    margin-right: 6px;
  }
}
.messages {
  flex: 1;
  overflow-y: auto;
}
</style>
