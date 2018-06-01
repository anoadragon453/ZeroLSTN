<template>
  <div id="addplaylistmodal" class="row center card">
    <!-- Modal Structure -->
    <div id="playlistmodal" class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Add to Playlist</h4>
        </div>
        <div class="row">
          <!-- Close on selecting playlist -->
          <ul class="collection with-header">
            <a href="#" class="collection-item" @click.prevent="addToPlayQueue()"><b><i>Current Queue</i></b></a>
            <a href="#" v-for="playlist in playlists" class="collection-item" @click.prevent="addToPlaylist(playlist.id)">
              <span v-if="playlist !== ''"><b>{{ playlist.name }}</b></span>
              <span v-else><b><i>Untitled</i></b></span>
            </a>
            <a href="#" class="collection-item" @click.prevent="goToPlaylists()"><i>New Playlist</i></a>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  module.exports = {
    name: "addplaylistmodal",
    data: () => {
      return {
        addToPlaylistModal: null,
        playlists: [],
        playlist_songs: []
      }
    },
    mounted: function() {
      var self = this;

      // Initialize modal view
      var modal = document.getElementById("playlistmodal");
      var instance_modal = new M.Modal(modal, {
        onCloseEnd: function() {
          // Fix scrolling after modal closes
          // https://github.com/Dogfalo/materialize/issues/4622
          document.querySelector('body').style.overflow = 'visible';
        }
      });
      this.addToPlaylistModal = modal;

      // Get playlists of the current user
      page.cmdp("siteInfo", {})
      .then((siteInfo) => {
        page.getPlaylistsByUser(siteInfo.auth_address).then((playlists) => {
          console.log("[user playlists]", playlists)
          self.playlists = playlists;
        });
      });

      // Pop up modal when someone calls addToPlaylist
      page.bus.$on("addToPlaylist", function(songs) {
        // Show the modal
        self.addToPlaylistModal.M_Modal.open();

        // Save desired songs
        console.log("Adding to playlist:", songs)
        self.playlist_songs = songs;
      });

      page.bus.$on("addToPlaylistArtist", function(artist) {
        // Show the modal
        self.addToPlaylistModal.M_Modal.open();
        console.log("Adding artist's worth of songs!")

        // Save desired from artist
        page.getAlbumsByArtist(artist)
        .then((albums) => {
          albums.forEach((album) => {
            page.getSongsInAlbumByArtist(album, artist)
            .then((songs) => {
              self.playlist_songs = self.playlist_songs.concat(songs);
              console.log("Adding artist", self.playlist_songs)
            });
          });
        });
      });
    },
    methods: {
      addToPlaylist: function(id) {
        var self = this;

        // Add selected song id(s) to chosen playlist
        page.addSongsToPlaylist(this.playlist_songs, id, function() {
          // Clear the songs array
          self.playlist_songs.length = 0;

          // Close the modal
          self.addToPlaylistModal.M_Modal.close()
        });
      },
      addToPlayQueue: function() {
        // Add songs to playQueue
        page.queueSongs(this.playlist_songs);

        // Clear the songs array
        this.playlist_songs.length = 0;

        // Close the modal
        this.addToPlaylistModal.M_Modal.close()
      },
      goToPlaylists: function() {
        Router.navigate("/playlists");
      }
    }
  }
</script>
