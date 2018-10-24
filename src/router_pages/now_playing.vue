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
      </div>
      <div class="col s12 m8 l9">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
    </div>
  </div>
</template>

<script>
import Router from '../libs/router.js';

// All the Vue components that make up the homepage
import AlbumArt from '../vue_components/album_art.vue';
import PlayQueue from '../vue_components/play_queue.vue';
import SongDetails from '../vue_components/song_details.vue';

export default {
  components: {
    albumArt: AlbumArt,
    playQueue: PlayQueue,
    songDetails: SongDetails,
  },
  props: ['playQueueObj', 'queueIndex', 'currentSong'],
  name: 'nowplaying',
};
</script>
