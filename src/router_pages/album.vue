<template>
  <div id="album">
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
                <popper v-if="downloaded" trigger="hover" :options="{placement: 'bottom'}">
                  <div class="popper">Remove Album</div>
                  <i slot="reference" @click.prevent="removeAlbum()" class="material-icons tooltip right">cloud_done</i>
                </popper>
                <popper v-else trigger="hover" :options="{placement: 'bottom'}">
                  <div class="popper">Download Album</div>
                  <i slot="reference" @click.prevent="downloadAlbum()" class="material-icons tooltip right">cloud_download</i>
                </popper>
                <popper trigger="hover" :options="{placement: 'bottom'}">
                  <div class="popper">Queue Album</div>
                  <i slot="reference" @click.prevent="queueAlbum()" class="material-icons tooltip right">playlist_add</i>
                </popper>
                <popper trigger="hover" :options="{placement: 'bottom'}">
                  <div class="popper">Play Album</div>
                  <i slot="reference" @click.prevent="playAlbum()" class="material-icons tooltip right">play_arrow</i>
                </popper>
                <h4 v-if="album !== ''">{{ album }}</h4>
                <h4 v-else><i>Blank</i></h4>
                <p>{{ artist }}</p>
              </li>
              <songitem  v-for="song in songs" :editable="false" :song="song" :current-song="currentSong" :audio-playing="audioPlaying"></songitem>
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

  module.exports = {
    components: {
      songitem: SongItem,
      playQueue: PlayQueue,
      popper: Popper
    },
    props: ["playQueueObj", "queueIndex", "currentSong", "audioPlaying"],
    name: "album",
    data: () => {
      return {
        album: "",
        artist: "",
        songs: []
      }
    },
    mounted: function() {
      // Get album/artist from URL
      this.artist = decodeURI(Router.currentParams["artist"]);
      this.album = decodeURI(Router.currentParams["album"]);

      // Account for blank titles
      if (this.artist === "Blank") { this.artist = "" };
      if (this.album === "Blank") { this.album = "" };
    },
    asyncComputed: {
      songInfo: {
        get() {
          var self = this;
          return page.getSongsInAlbum(self.album, self.artist)
          .then((songs) => {
            self.songs = songs;
            return true;
          });
        }
      },
      downloaded: {
        get() {
          // TODO: Start a timer that checks every so often for download progress on each song
          // Show progress on page, as well as check to see if they're all done
          if (!this.songInfo) {
            return false;
          }

          var self = this;
          return this.checkSongsFromOffset(this.songs, 0)
          .then((downloaded) => {
            if (!downloaded) {
              // Tell artist page we may be embedded in that we're not completely downloaded
              if (self.$parent.notDownloaded) {
                self.$parent.notDownloaded();
              }
            }
            return downloaded;
          });
        }
      }
    },
    methods: {
      goBack: function() {
        // Hit the 'back' button
        window.history.go(-1);
      },
      playAlbum: function() {
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
      queueAlbum: function() {
        // Queue songs
        page.queueSongs(this.songs);
      },
      downloadAlbum: function() {
        this.downloadAlbumBySongOffset(this.songs, 0);
      },
      removeAlbum: function() {
        page.cmdp("wrapperConfirm", ["Remove this album?", "Delete"])
        .then((confirmed) => {
          if (confirmed) {
            // TODO: Add hovering make the cloud change to delete cloud
            console.log("Deleting album...")
          }
        });
      },
      checkSongsFromOffset: function(songs, offset=0) {
        if (offset >= songs.length) {
          return true;
        }

        // Keep going to the next offset
        var self = this;
        return songs[offset].info.then((info) => {
          if (!info.is_downloaded) {
            return false;
          } else {
            return self.checkSongsFromOffset(songs, ++offset);
          }
        });
      },
      downloadAlbumBySongOffset: function(songs, offset=0) {
        // Download each song in the album

        // Check to see if we're at the end of the songs array
        if (offset >= songs.length) {
          this.currentlyDownloading = false;
          return;
        }

        console.log("Downloading at offset " + offset)

        // TODO: Think this can just be simplified to a for loop...

        // Don't try to redownload a song we already have
        if (songs[offset].info && !songs[offset].info.is_downloaded) {
          // Do donwload if we don't have it already
          var filepath = "merged-music/" + songs[offset].site + "/" + songs[offset].directory + "/" + songs[offset].filename + "|all";
          page.cmdp("fileNeed", { inner_path: filepath, timeout: 30 });
        }
        this.downloadAlbumBySongOffset(songs, ++offset);
      },
    }
  }
</script>
