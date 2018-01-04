<<template>
  <div id="mainapp">
    <div class="row">
      <div class="col s4">
        <component :is="artQueue"></component>
      </div>
      <div class="col s8">
        <component :is="music"></component>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  // All the Vue components that make up the homepage
  var NavBar = require("../vue_components/navbar.vue");
  var Music = require("../vue_components/music.vue");
  var ArtQueue = require("../vue_components/art_queue.vue");

  module.exports = {
    props: [],
    name: "mainapp",
    data: () => {
      return {
        navbar: NavBar,
        music: Music,
        artQueue: ArtQueue
      }
    }
  }
</script>