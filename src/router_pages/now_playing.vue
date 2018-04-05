<template>
  <div id="nowplaying">
    <div class="row">
      <div class="col s12 m4 l3">
        <div class="row">
          <albumArt :current-song="currentSong"></albumArt>
        </div>
        <div class="row">
          <songDetails :current-song="currentSong"></songDetails>
        </div>
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
      </div>
      <div class="col hide-on-small-only m8 l9">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  // All the Vue components that make up the homepage
  var AlbumArt = require("../vue_components/album_art.vue");
  var PlayQueue = require("../vue_components/play_queue.vue");
  var SongDetails = require("../vue_components/song_details.vue");

  module.exports = {
    components: {
      albumArt: AlbumArt,
      playQueue: PlayQueue,
      songDetails: SongDetails
    },
    props: ["playQueueObj", "queueIndex", "currentSong"],
    name: "nowplaying"
  }
</script>
