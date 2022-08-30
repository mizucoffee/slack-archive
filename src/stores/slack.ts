import { defineStore } from "pinia";
import team from "../data/team.json";

export const useSlackStore = defineStore("slack", {
  state: () => ({
    team: team,
    channels: [] as any[],
    users: [] as any[],
  }),
  getters: {
    getChannelById: (state) => (id: string) => {
      return state.channels.find((c) => c.id === id);
    },
    getUserById: (state) => (id: string) => {
      return state.users.find((u) => u.id === id);
    },
  },
  actions: {
    setChannels(channels: any[]) {
      this.channels = channels;
    },
    setUsers(users: any[]) {
      this.users = users;
    },
  },
});
