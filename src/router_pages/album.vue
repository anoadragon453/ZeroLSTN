<template>
  <div id="album">
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="row"></div>
        <a @click.prevent="goBack()" class="waves-effect waves-light btn">Back</a>
        <albumPage :album="album" :artist="artist" :current-song="currentSong" :audio-playing="audioPlaying"></albumPage>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var AlbumPage = require("../vue_components/album_page.vue");
  var PlayQueue = require("../vue_components/play_queue.vue");
  
  module.exports = {
    components: {
      albumPage: AlbumPage,
      playQueue: PlayQueue
    },
    props: ["playQueueObj", "queueIndex", "currentSong", "audioPlaying"],
    name: "album",
    data: () => {
      return {
        album: "",
        artist: ""
      }
    },
    mounted: function() {
      // Get album/artist from URL
      this.artist = decodeURI(Router.currentParams["artist"]);
      this.album = decodeURI(Router.currentParams["album"]);
      
      // Account for blank titles
      if (this.artist === "Blank") { this.artist = "" };
      if (this.album === "Blank") { this.album = "" };
    },
    methods: {
      goBack: function() {
        // Hit the 'back' button
        window.history.go(-1)
      }
    }
  }
</script>