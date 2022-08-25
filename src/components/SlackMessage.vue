<script setup lang="ts">
import { ref, watch } from "vue";
import { useSlackStore } from "../stores/slack";
import slackMessageParser, { NodeType } from "slack-message-parser";
import type { Node } from "slack-message-parser";
import uEmojiParser from "universal-emoji-parser";
import emojisJson from "../data/emojis.json";

const emojis: { [key: string]: string } = Object.assign({}, emojisJson);
// for (const key in emojiData) {
//   emojis.push({
//     name: key,
//     url: emojiData[key],
//   });
// }

const { getUserById } = useSlackStore();
const props = defineProps<{
  message: any;
}>();
const user = ref(getUserById(props.message.user || props.message.bot_id));
const messageText = ref("");

const toHTML = (node: Node): string => {
  switch (node.type) {
    case NodeType.Root:
      return `<p>${node.children.map(toHTML).join("")}</p>`;
    case NodeType.Text:
      return node.text;
    case NodeType.Bold:
      return `<strong>${node.children.map(toHTML).join("")}</strong>`;
    case NodeType.Italic:
      return `<i>${node.children.map(toHTML).join("")}</i>`;
    case NodeType.Strike:
      return `<del>${node.children.map(toHTML).join("")}</del>`;
    default:
      return node.source;
  }
};

async function parseMessage() {
  let text = props.message.text;
  text = toHTML(slackMessageParser(text));
  text = text.replace(/<!channel>/g, `<span class="mention">@channel</span>`);
  text = text.replace(/<!here>/g, `<span class="mention">@here</span>`);
  text = text.replace(/:\+1:/g, `:thumbsup:`);
  text = uEmojiParser.parse(text);
  const links = text.match(/<http.*?>/g);
  if (links) {
    for (const link of links) {
      const data = link.replace(/<|>/g, "");
      const [url, title] = data.split("|");
      text = text.replace(
        link,
        `<a target="_blank" href="${url}">${title || url}</a>`
      );
    }
  }

  const mentions = text.match(/<@.*?>/g);
  if (mentions) {
    for (const mention of mentions) {
      const userId = mention.replace(/<|@|>/g, "");
      const user = getUserById(userId);
      if (user) {
        text = text.replace(
          mention,
          `<span class="mention">@${user.display_name}</span>`
        );
      }
    }
  }

  const channels = text.match(/<#.*?>/g);
  if (channels) {
    for (const channel of channels) {
      const data = channel.replace(/<|#|>/g, "");
      const [channelId, channelName] = data.split("|");
      if (channel) {
        text = text.replace(
          channel,
          `<a href="/channel/${channelId}"><span class="mention">#${channelName}</span></a>`
        );
      }
    }
  }

  const codeBlocks = text.match(/```[\s\S]+?```/gm);
  if (codeBlocks) {
    for (const codeBlock of codeBlocks) {
      const data = codeBlock.replace(/```/g, "");
      text = text.replace(codeBlock, `<pre>${data}</pre>`);
    }
  }

  const codes = text.match(/`.+?`/gm);
  if (codes) {
    for (const code of codes) {
      const data = code.replace(/`/g, "");
      text = text.replace(code, `<b class="code-b">${data}</b>`);
    }
  }

  const bolds = text.match(/\*.+?\*/gm);
  if (bolds) {
    for (const bold of bolds) {
      const data = bold.replace(/\*/g, "");
      text = text.replace(bold, `<b>${data}</b>`);
    }
  }

  const emoji = text.match(/:.+?:/g);
  if (emoji) {
    for (const e of emoji) {
      const data = e.replace(/:/g, "");
      const emoji = emojis[data];
      if (emoji) {
        text = text.replace(
          e,
          `<img class="emoji" src="/${emoji}" alt="${data}" />`
        );
      }
    }
  }

  messageText.value = text;
}

parseMessage();

watch(
  () => props.message,
  (val) => {
    user.value = getUserById(val.user || val.bot_id);
    parseMessage();
  }
);
</script>

<template>
  <div class="message">
    <img class="icon" :src="`/${user?.id}.png`" />
    <div>
      <div class="message_user">
        {{ user?.display_name }}
      </div>
      <div class="message_text" v-html="messageText"></div>
      <div class="files">
        <div
          v-for="file in props.message.files.filter((f: any) =>
            f.mimetype?.startsWith('image')
          )"
          v-bind:key="file.id"
        >
          <a :href="`/${file.filepath}`" target="_blank">
            <img class="photo" :src="`/${file.filepath}`" :alt="file.name" />
          </a>
        </div>
        <div
          v-for="file in props.message.files.filter((f: any) =>
            !f.mimetype?.startsWith('image')
          )"
          v-bind:key="file.id"
        >
          <a :href="`/${file.filepath}`" target="_blank" class="file">
            <div class="file_type">{{ file.filetype }}</div>
            <div class="file_name">{{ file.name }}</div>
          </a>
        </div>
      </div>
      <div class="json">{{ message }}</div>
    </div>
  </div>
</template>

<style lang="scss">
.mention {
  color: #1264a3;
  background-color: #1d9bd118;
  line-height: 1em;
  padding: 0px 2px 2px 2px;
  border-radius: 4px;
}
a {
  color: #1264a3;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
pre {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px 6px;
  margin: 10px 0px;
  border: 1px solid #e1e1e1;
  font-size: 12px;
  line-height: 1.4em;
}
b.code-b {
  color: #e01e5a;
  background: #f5f5f5;
  border-radius: 4px;
  padding: 0px 4px;
  border: 1px solid #e1e1e1;
  font-size: 12px;
}
.emoji {
  height: 20px;
  vertical-align: sub;
  margin: 0px 2px;
}
</style>

<style scoped lang="scss">
.file {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  width: 300px;
  margin-top: 8px;
  margin-bottom: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  color: #000;
  text-decoration: none;
  background-color: white;

  &:hover {
    opacity: 0.8;
  }

  .file_type {
    width: 40px;
    height: 40px;
    max-width: 40px;
    max-height: 40px;
    margin: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: white;
    background-color: #f0b372;
    border-radius: 4px;
  }

  .file_name {
    font-size: 0.8em;
    font-weight: bold;
  }
}
.message {
  font-size: 14px;
  line-height: 1.5em;
  white-space: pre-wrap;
  display: flex;
  padding: 6px 16px;
  max-width: calc(100vw - 280px);

  &:hover {
    background-color: #f4f4f4;
  }

  img.icon {
    width: 44px;
    height: 44px;
    border-radius: 4px;
    margin-right: 8px;
  }

  .message_user {
    font-weight: bold;
    font-size: 14px;
  }

  .message_text {
    max-width: calc(100vw - 280px - 52px - 40px);
    overflow-wrap: break-word;
  }
  .json {
    display: none;
  }
  img.photo {
    width: 300px;
    height: auto;
    margin-top: 8px;
    margin-bottom: 8px;
    border: 1px solid #eee;
    border-radius: 6px;
  }
}
</style>
