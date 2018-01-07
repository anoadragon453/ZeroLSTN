<<template>
  <div id="mainapp">
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <span  v-if="currentPage != 'music'">
          <div class="row"></div>
          <a @click.prevent="backPressed()" class="waves-effect waves-light btn">Back</a>
        </span>
        <music v-if="currentPage == 'music'"></music>
        <artistPage v-if="currentPage == 'artist'" :artist="artist"></artistPage>
        <albumPage v-if="currentPage == 'album'" :album="album"></albumPage>
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
  var ArtistPage = require("../vue_components/artist_page.vue");
  var AlbumPage = require("../vue_components/album_page.vue");

  module.exports = {
    components: {
      music: Music,
      albumArt: AlbumArt,
      playQueue: PlayQueue,
      artistPage: ArtistPage,
      albumPage: AlbumPage
    },
    props: [],
    name: "mainapp",
    data: () => {
      return {
        currentPage: "music",
        artist: "",
        album: ""
      }
    },
    methods: {
      backPressed: function() {
        // Go back to the main music page
        this.currentPage = 'music';
      },
      goToArtistPage: function(artist) {
        // Show the desired artist's page
        console.log("Going to artist: " + artist);
        this.artist = artist;
        this.currentPage = "artist";
      },
      goToAlbumPage: function(album) {
        // Show the desired albums's page
        console.log("Going to album: " + album);
        this.album = album;
        this.currentPage = "album";
      }
    }
  }
</script>