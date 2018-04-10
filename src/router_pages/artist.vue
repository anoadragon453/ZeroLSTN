<template>
  <div id="artist">
    <addtoplaylistmodal></addtoplaylistmodal>
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="row"></div>
        <a @click.prevent="goBack()" class="waves-effect waves-light btn">Back</a>
        <div class="row">
          <ul class="collection with-header">
            <li class="collection-header">
              <popper v-if="!downloaded" trigger="hover" :options="{placement: 'bottom'}">
                <div class="popper">Download Artist</div>
                <i slot="reference" @click.prevent="downloadArtist()" class="material-icons tooltip right">cloud_download</i>
              </popper>
              <popper v-if="downloaded == 1" trigger="hover" :options="{placement: 'bottom'}">
                <div class="popper">Remove Artist</div>
                <i slot="reference" @click.prevent="removeAlbum()" class="material-icons tooltip right">cloud_done</i>
              </popper>
              <popper trigger="hover" :options="{placement: 'bottom'}">
                <div class="popper">Queue Artist</div>
                <i slot="reference" @click.prevent="queueArtist()" class="material-icons tooltip right">playlist_add</i>
              </popper>
              <popper trigger="hover" :options="{placement: 'bottom'}">
                <div class="popper">Play Artist</div>
                <i slot="reference" @click.prevent="playArtist()" class="material-icons tooltip right">play_arrow</i>
              </popper>
              <h4 v-if="artist !== ''">{{ artist }}</h4>
              <h4 v-else><i>Blank</i></h4>
              <p>Artist</p>
            </li>
            <a href="#" v-for="album in albums" class="collection-item" @click.prevent="goToAlbum(album)">
              <span v-if="album !== ''"><b>{{ album }}</b></span>
              <span v-else><b><i>Blank</i></b></span>
            </a>
          </ul>
        </div>
      </div>
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var Popper = require("vue-popperjs");
  var SongItem = require("../vue_components/song_item.vue");
  var PlayQueue = require("../vue_components/play_queue.vue");
  var addToPlaylistModal = require("../vue_components/add_playlist_modal.vue");

  module.exports = {
    components: {
      songitem: SongItem,
      playQueue: PlayQueue,
      popper: Popper,
      addtoplaylistmodal: addToPlaylistModal
    },
    props: ["playQueueObj", "queueIndex", "currentSong", "audioPlaying"],
    name: "artist",
    data: () => {
      return {
        artist: "",
        albums: [],
        downloaded: page.store.state.downloadState.unknown
      }
    },
    beforeMount: function() {
      // Get artist from URL
      this.artist = decodeURI(Router.currentParams["artist"]);
      if (this.artist === "Blank") { this.artist = "" }; // Account for blank artists
      console.log("Artist:", this.artist)
    },
    mounted: function() {
      // Load albums
      var self = this;
      page.getAlbumsByArtist(this.artist).then((albums) => {
        console.log(albums)
        self.albums = albums;
      });
    },
    methods: {
      goBack: function() {
        // Hit the 'back' button
        window.history.go(-1);
      },
      goToAlbum: function(album) {
        // Go to album's page
        Router.navigate('/album/'+this.artist+'/'+album);
      },
      playArtist: function() {
        var self = this;

        // Queue songs and play the first one of the first album
        var queueLength = page.getQueueLength();
        var queueIndex = page.getQueueIndex();

        var songs = [];
        this.albums.forEach((album) => {
          page.getSongsInAlbum(album, self.artist)
          .then((songs) => {
            // Queue songs
            console.log("[queuing]", songs)
            page.queueSongs(songs);

            // Figure out where in the play queue to jump to
            if (queueLength == 0) {
              page.playSongAtQueueIndex(queueIndex);
            } else {
              page.playSongAtQueueIndex(queueLength);
            }
          });
        });
      },
      queueArtist: function() {
        var self = this;

        // Queue every album and song by this artist
        page.bus.$emit("addToPlaylistArtist", this.artist);
      },
      downloadArtist: function() {
        var self = this;
        page.getAlbumsByArtist(this.artist)
        .then((albums) => {
          var songs = [];
          albums.forEach((album) => {
            page.getSongsInAlbum(album, self.artist)
            .then((songs) => {
              songs.forEach((song) => {
                var filepath = "merged-ZeroLSTN2/" + song.site + "/" + song.directory + "/" + song.filename + "|all";
                page.cmdp("fileNeed", { inner_path: filepath, timeout: 30 });
              });
            });
          });
        });
      }
    }
  }
</script>
