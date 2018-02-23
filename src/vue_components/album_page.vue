<template>
  <div id="albumpage">
    <div class="row">
      <div class="col s12">
        <ul class="collection with-header">
          <li class="collection-header">
            <i v-if="downloaded" @click.prevent="removeAlbum()" class="material-icons right">cloud_done</i>
            <i v-else @click.prevent="downloadAlbum()" class="material-icons right">cloud_download</i>
            <i @click.prevent="queueAlbum()" class="material-icons right">playlist_add</i>
            <i @click.prevent="playAlbum()" class="material-icons right">play_arrow</i>
            
            <h4 v-if="album !== ''">{{ album }}</h4>
            <h4 v-else><i>Blank</i></h4>
            <p>{{ artist }}</p>
          </li>
          <songitem  v-for="song in songs" :editable="false" :song="song" :current-song="currentSong" :audio-playing="audioPlaying"></songitem>
        </ul>
      </div>
      <span v-if="!embedded">
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
      </span>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var SongItem = require("../vue_components/song_item.vue");
  var SpinnerColors = require("../vue_components/spinner_colors.vue");
  module.exports = {
    components: {
      songitem: SongItem,
      spinner: SpinnerColors
    },
    props: ["album", "artist", "currentSong", "audioPlaying", "embedded"],
    name: "albumpage",
    data: () => {
      return {
        songs: []
      }
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
            // TODO:
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