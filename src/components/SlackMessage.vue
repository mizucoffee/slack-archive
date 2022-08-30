<script setup lang="ts">
import { ref, watch } from "vue";
import { useSlackStore } from "../stores/slack";
import slackMessageParser, { NodeType } from "slack-message-parser";
import type { Node } from "slack-message-parser";
import SlackReaction from "./SlackReaction.vue";
import emojisJson from "../data/emojis.json";
import { codemap } from "../slack-codemap";
import twemoji from "twemoji";

const emojis: { [key: string]: string } = Object.assign({}, emojisJson);
const emit = defineEmits(["onOpenThread"]);

const { getUserById } = useSlackStore();
const props = withDefaults(
  defineProps<{ message: any; isThread?: boolean }>(),
  {
    isThread: false,
  }
);
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

function getFiles(files: any[], isImage: boolean) {
  return files
    ? files
        .filter((f) => f.mimetype?.startsWith("image") == isImage)
        .map((f) => {
          f.ext = f.name.split(".").pop();
          return f;
        })
    : [];
}

async function parseMessage() {
  let text = props.message.text;
  text = toHTML(slackMessageParser(text));
  text = text.replace(/<!channel>/g, `<span class="mention">@channel</span>`);
  text = text.replace(/<!here>/g, `<span class="mention">@here</span>`);
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
          `<a href="/channel/${channelId}?pwd=${
            import.meta.env.VITE_APP_PWD
          }"><span class="mention">#${channelName}</span></a>`
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

  const emoji = text.match(/:[^/~<>\n\r\s]+?:/g);
  if (emoji) {
    for (const e of emoji) {
      let path = "";
      const slackEmoji = codemap[`${e}`];
      if (slackEmoji) {
        const html = twemoji.parse(slackEmoji);
        const twiemojiPath = html.match(/src="(.+?)"/);
        if (twiemojiPath) {
          path = twiemojiPath[1];
        }
      }

      if (!path) {
        const emojiPath = emojis[e.replace(/:/g, "")];
        if (emojiPath) {
          path = `/${emojiPath}`;
        } else {
          continue;
        }
      }

      text = text.replace(e, `<img class="emoji" src="${path}" />`);
    }
  }

  const backquotes = text.match(/^&gt; .+$/gm);
  if (backquotes) {
    for (const backquote of backquotes) {
      const data = backquote.replace(/^&gt;\s+/gm, "");
      text = text.replace(backquote, `<blockquote>${data}</blockquote>`);
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

function openThread(message: any) {
  emit("onOpenThread", message);
}
</script>

<template>
  <div class="message">
    <img class="icon" :src="`/${user?.id}.png`" />
    <div class="message_area">
      <div class="message_user">
        {{ user?.display_name }}
      </div>
      <div class="message_text" v-html="messageText"></div>
      <div class="files">
        <div
          v-for="file in getFiles(props.message.files, true)"
          v-bind:key="file.id"
        >
          <a :href="`/${file.id}.${file.ext}`" target="_blank">
            <img
              class="photo"
              :src="`/${file.id}.${file.ext}`"
              :alt="file.name"
            />
          </a>
        </div>
        <div
          v-for="file in getFiles(props.message.files, false)"
          v-bind:key="file.id"
        >
          <a
            :href="`/${file.id}.${file.ext}`"
            target="_blank"
            class="file"
            :download="file.name"
          >
            <div class="file_type">{{ file.filetype }}</div>
            <div class="file_name">{{ file.name }}</div>
          </a>
        </div>
      </div>
      <div class="reactions" v-if="props.message.reactions">
        <SlackReaction
          v-for="reaction in props.message.reactions"
          v-bind:key="reaction.name"
          :emoji="reaction.name"
          :count="reaction.count"
        />
      </div>
      <div
        class="replies"
        v-if="props.message.reply_users && !isThread"
        @click="openThread(message)"
      >
        <div class="reply_users">
          <div
            class="reply_icon"
            v-for="user in props.message.reply_users.slice(0, 4)"
            v-bind:key="user"
          >
            <img :src="`/${user}.png`" />
          </div>
          <div
            class="reply_icon reply_icon_count"
            v-if="props.message.reply_users[4]"
          >
            <img :src="`/${props.message.reply_users[4]}.png`" />
            <div>+{{ props.message.reply_users.length - 5 }}</div>
          </div>
          <div class="reply_count">
            {{ props.message.reply_count }} 件の返信
          </div>
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
blockquote {
  border-left: 4px solid #dfdfdf;
  padding-left: 12px;
}

.message_text {
  * {
    overflow-wrap: break-word;
    word-break: break-all;
  }
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
    overflow: hidden;
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
  max-width: min(calc(100vw - 280px), 100%);

  &:hover {
    background-color: #f6f6f6;
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

  .message_area {
    width: calc(100% - 52px);
  }

  .message_text {
    // max-width: calc(100vw - 280px - 52px - 40px);
    overflow-wrap: break-word;
    word-break: break-all;
  }
  .json {
    display: none;
  }
  img.photo {
    width: 300px;
    height: auto;
    margin-top: 8px;
    border: 1px solid #eee;
    border-radius: 6px;
  }
}

.reactions {
  display: flex;
  margin-top: 8px;
  margin-bottom: 8px;
}

.reply_icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  margin-right: 4px;
}

.reply_users {
  display: flex;
  font-size: 12px;
  color: #1264a3;
  font-weight: bold;

  .reply_icon {
    width: 24px;
    height: 24px;

    img {
      width: 24px;
      height: 24px;
      border-radius: 4px;
    }
  }

  .reply_icon_count {
    position: relative;

    > * {
      position: absolute;
      top: 0px;
      left: 0px;
    }

    div {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background-color: #0005;
      color: white;
      font-weight: bold;
      border-radius: 4px;
    }
  }
}

.replies {
  box-sizing: border-box;
  padding: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.1s ease-in-out;
  width: 400px;
}

.replies:hover {
  background: #fff;
  border-color: #ccc;
  border-radius: 6px;
}

.reply_count {
  margin-left: 4px;
}
</style>
