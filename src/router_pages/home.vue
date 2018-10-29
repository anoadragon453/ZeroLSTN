<template>
  <div id="home">
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <music></music>
      </div>
    </div>
  </div>
</template>

<script>
import Router from '../libs/router';

// All the Vue components that make up the homepage
import Music from '../vue_components/music.vue';
import PlayQueue from '../vue_components/play_queue.vue';

export default {
  components: {
    music: Music,
    playQueue: PlayQueue,
  },
  props: ['playQueueObj', 'queueIndex'], // TODO: Move to store
  name: 'home',
  data: () => {},
  mounted() {
    // Tell the music component to switch to the right tab if it is
    // specified in the URL
    if (Router.currentParams.currentTab) {
      window.page.bus.$emit('currentTab', Router.currentParams.currentTab);
    }
  },
};
</script>
