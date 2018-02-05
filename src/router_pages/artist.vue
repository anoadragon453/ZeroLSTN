<template>
  <div id="artist">
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="row"></div>
        <a @click.prevent="goBack()" class="waves-effect waves-light btn">Back</a>
        <artistPage :artist="artist" :current-song="currentSong" :audio-playing="audioPlaying"></artistPage>
      </div>
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var ArtistPage = require("../vue_components/artist_page.vue");
  var PlayQueue = require("../vue_components/play_queue.vue");
  
  module.exports = {
    components: {
      artistPage: ArtistPage,
      playQueue: PlayQueue
    },
    props: ["playQueueObj", "queueIndex", "currentSong", "audioPlaying"],
    name: "artist",
    data: () => {
      return {
        artist: ""
      }
    },
    mounted: function() {
      // Get artist from URL
      this.artist = decodeURI(Router.currentParams["artist"]);
      if (this.artist === "Blank") { this.artist = "" }; // Account for blank artists
    },
    methods: {
      goBack: function() {
        // Hit the 'back' button
        window.history.go(-1)
      }
    }
  }
</script>