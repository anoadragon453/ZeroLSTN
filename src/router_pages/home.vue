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
  var Router = require("../libs/router.js");

  // All the Vue components that make up the homepage
  var Music = require("../vue_components/music.vue");
  var PlayQueue = require("../vue_components/play_queue.vue");

  module.exports = {
    components: {
      music: Music,
      playQueue: PlayQueue
    },
    props: ["playQueueObj", "queueIndex"], // TODO: Move to store
    name: "home",
    data: () => {},
    mounted: function() {
      console.log('song count', page.store.state.count);
    }
  }
</script>
