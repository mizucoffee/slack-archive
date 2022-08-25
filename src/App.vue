<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";

const route = useRoute();
const isValidPwd = import.meta.env.VITE_APP_PWD == route.query.pwd;
</script>

<template>
  <div v-if="isValidPwd">
    <RouterView />
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap");
* {
  margin: 0;
  padding: 0;
  font-family: "Noto Sans JP", sans-serif;
}
</style>

<style scoped></style>
