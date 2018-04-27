<template>
  <div id="playqueuecomponent">
    <div class="row">
      <div id="queue" class="col s12">
        <ul class="collection with-header">
          <li class="collection-header">
            <i @click.prevent="clearPlayQueue()" class="material-icons right">clear_all</i>
            <h4>Play Queue</h4>
          </li>
          <li class="collection-item" v-if="!playQueueObj || playQueueObj.length == 0">No songs in queue.</li>
          <!-- TODO: Add remove-from-queue buttons and swipe to delete on mobile -->
          <li class="collection-item" v-else v-for="(song, index) in playQueueObj">
            <a href="#" @click.prevent="playSongAtIndex(index)">
              <span v-if="index == queueIndex"><b>{{ song.title }}</b></span>
              <span v-else>{{ song.title }}</span>
            </a>
            <i @click.prevent="removeFromQueue(index)" class="material-icons right">close</i>
          </li>
        </ul>
      </div>
      <div class="row"></div>
      <div class="row"></div>
      <div class="row"></div>
      <div class="row"></div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  module.exports = {
    props: ["playQueueObj", "queueIndex"],
    name: "playqueuecomponent",
    methods: {
      goto: function(to) {
        // Go to specified page
        Router.navigate(to);
      },
      playSongAtIndex: function(index) {
        // Skip to clicked play queue song index
        page.playSongAtQueueIndex(index);
      },
      removeFromQueue: function(index) {
        // Remove a single song from the PlayQueue
        page.removeSongFromQueue(index);
      },
      clearPlayQueue: function() {
        // Remove all the songs in the play queue
        page.clearPlayQueue();
      }
    }
  }
</script>
