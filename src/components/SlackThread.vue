<script setup lang="ts">
import SlackMessage from "./SlackMessage.vue";

defineProps<{ message: any }>();
const emit = defineEmits(["close"]);

function close() {
  emit("close");
}
</script>

<template>
  <div class="thread">
    <div class="channel_name">
      <div class="name_date">スレッド</div>
      <div @click="close()"><font-awesome icon="xmark" class="close" /></div>
    </div>
    <div class="message_box">
      <SlackMessage :message="message" class="post" :isThread="true" />
      <hr />
      <SlackMessage
        :message="m"
        v-for="m in message.replies"
        v-bind:key="m.id"
      />
    </div>
  </div>
</template>

<style lang="scss">
.thread {
  .post {
    img {
      max-width: 240px;
    }
  }
}
</style>

<style scoped lang="scss">
.thread {
  height: 100vh;
  width: 380px;
  max-width: 380px;
  border-left: 1px solid #0003;
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

  .name_date {
    flex-grow: 1;
  }

  .close {
    cursor: pointer;
    font-size: 12pt;
    padding: 10px 12px;

    &:hover {
      background-color: #f0f0f0;
    }
  }

  .message_box {
    width: 100%;
    height: calc(100% - 58px - 32px);
    overflow-y: scroll;
    padding: 16px 0px;
  }

  hr {
    border: none;
    border-bottom: 1px solid #0003;
    margin: 12px 16px;
  }
}
</style>
