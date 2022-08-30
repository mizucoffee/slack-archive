<script setup lang="ts">
import SlackEmoji from "./SlackEmoji.vue";
defineProps<{ count: number; emoji: string }>();
</script>

<template>
  <div class="reaction">
    <SlackEmoji class="icon" :emoji="emoji" />
    <div class="count">{{ count }}</div>
  </div>
</template>

<style lang="scss">
.reaction {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-radius: 14px;
  height: 20px;
  padding: 2px 8px;
  margin-right: 4px;
  .icon {
    width: 18px;
    height: 18px;
  }
  .count {
    margin-left: 4px;
    font-size: 10pt;
  }
}
</style>
