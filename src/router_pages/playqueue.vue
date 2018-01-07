<<template>
  <playQueueComponent :play-queue="playQueue"></playQueueComponent>
</template>

<script>
  var Router = require("../libs/router.js");

  // This page is only necessary for mobile devices. It's a separate instance
  // of the Play Queue screen which normally appears on the home page but on
  // mobile has its own separate page.
  var PlayQueueComponent = require("../vue_components/play_queue.vue");

  module.exports = {
    components: {
      playQueueComponent: PlayQueueComponent
    },
    props: ["playQueue"],
    name: "playqueue",
    data: () => {
      return {};
    }
  }
</script>