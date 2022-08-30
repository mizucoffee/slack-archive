<script setup lang="ts">
import { ref } from "vue";
import emojisJson from "../data/emojis.json";
import { codemap } from "../slack-codemap";
import twemoji from "twemoji";

const emojis: { [key: string]: string } = Object.assign({}, emojisJson);
const props = defineProps<{ emoji: any }>();

const path = ref("");
const e = ref(props.emoji);
const slackEmoji = codemap[`:${e.value}:`];
if (slackEmoji) {
  const html = twemoji.parse(slackEmoji);
  const twiemojiPath = html.match(/src="(.+?)"/);
  if (twiemojiPath) {
    path.value = twiemojiPath[1];
  }
}

if (!path.value) {
  path.value = `/${emojis[e.value]}`;
}
</script>

<template>
  <img :src="`${path}`" :alt="e" />
</template>
