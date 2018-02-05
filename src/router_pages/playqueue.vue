<template>
  <div id="playQueuePage">
    <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  
  // This page is only necessary for mobile devices. It's a separate instance
  // of the Play Queue screen which normally appears on the home page but on
  // mobile has its own separate page.
  var PlayQueue = require("../vue_components/play_queue.vue");
  
  module.exports = {
    components: {
      playQueue: PlayQueue
    },
    props: ["playQueueObj", "queueIndex"],
    name: "playQueuePage"
  }
</script>