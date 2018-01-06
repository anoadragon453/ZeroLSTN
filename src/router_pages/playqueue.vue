<<template>
  <component :is="playQueue"></component>
</template>

<script>
  var Router = require("../libs/router.js");

  // This page is only necessary for mobile devices. It's a separate instance
  // of the Play Queue screen which normally appears on the home page but on
  // mobile has its own separate page.
  var PlayQueue = require("../vue_components/play_queue.vue");

  module.exports = {
    props: ["mergerZites"],
    name: "playqueue",
    data: () => {
      return {
        playQueue: PlayQueue
      }
    }
  }
</script>