<<template>
  <div id="mainapp">
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <component :is="albumArt"></component>
        <component :is="playQueue"></component>
      </div>
      <div class="col s12 m12 l8">
        <component :is="music"></component>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  // All the Vue components that make up the homepage
  var Music = require("../vue_components/music.vue");
  var AlbumArt = require("../vue_components/album_art.vue");
  var PlayQueue = require("../vue_components/play_queue.vue");

  module.exports = {
    props: ["mergerZites"],
    name: "mainapp",
    data: () => {
      return {
        music: Music,
        albumArt: AlbumArt,
        playQueue: PlayQueue
      }
    }
  }
</script>