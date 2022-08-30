<script setup lang="ts">
import { ref, watch } from "vue";
import SlackMessage from "./SlackMessage.vue";

const props = defineProps<{ channel: any }>();
const emit = defineEmits(["onOpenThread"]);

const messages = ref(props.channel.messages.filter((m: any) => m.text));
messages.value.sort((a: any, b: any) => a.ts - b.ts);

watch(
  () => props.channel.messages,
  (val) => {
    messages.value = val.filter((m: any) => m.text);
    messages.value.sort((a: any, b: any) => a.ts - b.ts);
  }
);

function openThread(message: any) {
  emit("onOpenThread", message);
}
</script>

<template>
  <div class="messages">
    <div class="channel_name">
      <font-awesome
        class="channel_icon"
        icon="lock"
        v-if="channel.is_private"
      /><font-awesome
        class="channel_icon"
        icon="hashtag"
        v-if="!channel.is_private"
      />{{ channel.name }}
    </div>
    <div class="message_box">
      <SlackMessage
        :message="message"
        v-for="message in messages"
        v-bind:key="message.id"
        @on-open-thread="openThread(message)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.messages {
  height: 100vh;
  max-width: calc(100vw - 280px);
  .channel_name {
    font-weight: bold;
    height: 57px;
    display: flex;
    align-items: center;
    padding: 0px 24px;
    border-bottom: 1px solid #0003;

    svg.channel_icon {
      margin-right: 4px;
    }
  }
  .message_box {
    height: calc(100% - 58px - 32px);
    overflow-y: scroll;
    padding: 16px 0px;
  }
}
</style>
