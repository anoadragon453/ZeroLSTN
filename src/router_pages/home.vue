<template>
  <div id="home">
    <div v-if="addGenre">
      <indexGenre :genre-name="genreName" :genre-address="genreAddress"></indexGenre>
    </div>
    <div v-else class="row">
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
  var IndexGenre = require("../vue_components/index_genre.vue"); // TODO: Move this to it's own page

  module.exports = {
    components: {
      music: Music,
      playQueue: PlayQueue,
      indexGenre: IndexGenre
    },
    props: ["playQueueObj", "queueIndex"],
    name: "home",
    data: () => {
      return {
        addGenre: false,
        genreName: "",
        genreAddress: ""
      }
    },
    mounted: function() {
      // Check if someone is coming here from creating a new genre
      if (Router.currentParams["genreName"] && Router.currentParams["genreAddress"]) {
        // If so, show the index genre vue component
        console.log(Router.currentParams["genreName"] + "/" + Router.currentParams["genreAddress"])
        this.addGenre = true;
        this.genreName = Router.currentParams["genreName"];
        this.genreAddress = Router.currentParams["genreAddress"];

        // Catch genre index updates
        var self = this;
        this.$parent.$on("genreIndexUpdate", function() {
          // Hide genre add screen once we have finished adding
          self.addGenre = false;
        });

        // Catch home logo clicks
        // TODO: Figure out why not catching
        this.$parent.$on("goHome", function() {
          console.log("Caught it!")
          self.currentPage = "music";
        });
      }
    }
  }
</script>