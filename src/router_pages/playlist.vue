<template>
  <div id="playlist">
    <addtoplaylistmodal></addtoplaylistmodal>
    <!-- Modal Structure -->
    <div class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Playlist Link</h4>
        </div>
        <div class="row">
          <div class="input-field col s6">
            <!-- TODO: Make a copy link modal vue component for song linking and whatever else -->
            <input placeholder="Placeholder" id="playlist_link" :value="playlistLink" type="text" class="validate" readonly>
            <label for="playlist_link" class="active">Link to Playlist</label>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="row"></div>
        <a @click.prevent="goBack()" class="waves-effect waves-light btn">Back</a>
        <div class="row">
          <div class="col s12">
            <ul class="collection with-header">
              <li class="collection-header">
                <popper trigger="hover" :options="{placement: 'auto'}">
                  <div class="popper">Delete Playlist</div>
                  <i slot="reference" @click.prevent="deletePlaylist()" class="material-icons tooltip right">delete</i>
                </popper>
                <popper trigger="hover" :options="{placement: 'auto'}">
                  <div class="popper">Get Link</div>
                  <i slot="reference" @click.prevent="getLinkToPlaylist()" class="material-icons tooltip right">link</i>
                </popper>
                <span v-if="songs.length > 0">
                  <popper trigger="hover" :options="{placement: 'auto'}">
                    <div class="popper">Download Playlist</div>
                    <i slot="reference" @click.prevent="downloadPlaylist()" class="material-icons tooltip right">cloud_download</i>
                  </popper>
                  <popper trigger="hover" :options="{placement: 'auto'}">
                    <div class="popper">Queue Playlist</div>
                    <i slot="reference" @click.prevent="queuePlaylist()" class="material-icons tooltip right">playlist_add</i>
                  </popper>
                  <popper trigger="hover" :options="{placement: 'auto'}">
                    <div class="popper">Play Playlist</div>
                    <i slot="reference" @click.prevent="playPlaylist()" class="material-icons tooltip right">play_arrow</i>
                  </popper>
                </span>
                <h4 v-if="playlist">{{ playlist.name }}</h4>
                <!-- TODO: Go to user profile -->
                <!--Created by <a @click.prevent="(artist)">{{ artist }}</a>-->
              </li>
              <songitem v-for="song in songs" :editable="false" :deletable="true" :song="song" :current-song="currentSong" :audio-playing="audioPlaying"></songitem>
              <li v-if="songs.length === 0" class="collection-item">No songs here yet. Add some with the queue icon <i class="material-icons">playlist_add</i> as you browse.</li>
            </ul>
          </div>
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
    name: "playlist",
    data: () => {
      return {
        playlist: null,
        songs: [],
        playlistLink: ""
      }
    },
    mounted: function() {
      var self = this;

      // Get playlist information from playlistID in URL
      page.getPlaylistByID(decodeURI(Router.currentParams["playlistID"])).then((playlist) => {
        // Playlist is a javascript object with some playlist metadata
        console.log("[playlist]", playlist)
        self.playlist = playlist;
      });

      // Save link to current playlist to display later
      self.playlistLink = "http://127.0.0.1:43110/zerolstn.bit/playlist/" + Router.currentParams["playlistID"];

      // Load songs of this playlist
      this.loadSongs();
    },
    methods: {
      goBack: function() {
        // Hit the 'back' button
        // TODO: Check that the previous page was on ZeroLSTN
        Router.navigate("/playlists");
        //window.history.go(-1);
      },
      loadSongs: function() {
        var self = this;

        // Load songs of this playlist
        page.getPlaylistSongsByID(decodeURI(Router.currentParams["playlistID"])).then((songs) => {
          // Playlist is a javascript object filled with songs and some meta information
          console.log("[playlist songs]", songs)
          self.songs = songs;
        });
      },
      playPlaylist: function() {
        // Queue songs and play the first one of the album
        var queueLength = page.getQueueLength();
        var queueIndex = page.getQueueIndex();

        page.queueSongs(this.songs);

        // Figure out where in the play queue to jump to
        if (queueLength == 0) {
          page.playSongAtQueueIndex(queueIndex);
        } else {
          page.playSongAtQueueIndex(queueLength);
        }
      },
      queuePlaylist: function() {
        // Queue songs
        page.bus.$emit("addToPlaylist", this.songs);
      },
      downloadPlaylist: function() {
        //this.downloadAlbumBySongOffset(this.songs, 0);
      },
      deletePlaylist: function() {
        var self = this;

        // Delete a user's playlist
        page.deletePlaylistByID(this.playlist.id, function() {
          // Show a toast message
          M.toast({html: 'Playlist ' + self.playlist.name + ' deleted.'});

          // Go back to playlists page
          Router.navigate('/playlists');
        });
      },
      removeSong: function(song) {
        var self = this;

        page.removeSongFromPlaylist(song, this.playlist.id, function() {
          // Reload songs
          self.loadSongs();
        });
      },
      getLinkToPlaylist: function() {
        
      }
    }
  }
</script>
