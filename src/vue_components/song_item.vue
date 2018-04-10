<template>
  <li class="collection-item avatar left-align">
    <i v-if="audioPlaying && currentSong && (currentSong.filename === song.filename)" 
    @click.prevent="pauseSong(song)" class="material-icons circle blue darken-1">pause</i>
    <i v-else @click.prevent="playSong(song)" class="material-icons circle blue darken-1">play_arrow</i>
    <span class="title">{{ song.track_number ? song.track_number + '.' : '' }} {{ song.title }}</span>
    <p>{{songInfo ? songInfo.peer_seed : '?' }} {{ songInfo && songInfo.peer_seed != 1 ? 'seeds' : 'seed' }}
      - {{ song.artist }} - {{ song.album }}
      <br>
      Year: {{ song.year }}
    </p>
    <a class="secondary-content s2">
      <popper trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Queue Song</div>
        <a class="tooltip" slot="reference" @click.prevent="queueSong(song)"><i class="material-icons black-text">playlist_add</i></a>
      </popper>
      <popper trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Edit Song</div>
        <a class="tooltip" slot="reference" @click.prevent="editSong(song)"><i class="material-icons black-text">edit</i></a>
      </popper>
      <popper v-if="!downloaded" trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Download Song</div>
        <a class="tooltip" slot="reference" @click.prevent="downloadSong(song)"><i class="material-icons black-text">cloud_download</i></a>
      </popper>
      <popper v-else trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Remove Download</div>
        <a class="tooltip" slot="reference" @click.prevent="removeDownload(song)"><i class="material-icons black-text">cloud_done</i></a>
      </popper>
      <popper trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Remove</div>
        <a class="tooltip" slot="reference" @click.prevent="removeSongParent(song)"><i class="material-icons black-text">delete</i></a>
      </popper>
    </a>
  </li>
</template>

<script>
  var Router = require("../libs/router.js");
  var Popper = require("vue-popperjs");

  module.exports = {
    components: {
      popper: Popper,
    },
    props: ["editable", "deletable", "song", "currentSong", "audioPlaying"],
    name: "songitem",
    mounted: function() {
      var self = this;
      console.log("Getting info for song")
      page.cmdp("optionalFileInfo", ["merged-ZeroLSTN2/" + this.song.path + "/" + this.song.filename])
      .then((info) => {
        if (!info) {
          return null;
        }

        // Sometimes there is no "peer_seed" attribute. Set it to peers attribute instead.
        if (!info.peer_seed) {
          info.peer_seed = info.peer;
        }

        console.log('[got info]', info)
        self.songInfo = info;
        self.downloaded = info.is_downloaded;
      });
    },
    data: () => {
      return {
        songInfo: null,
        downloaded: false
      }
    },
    methods: {
      editSong: function(song) {
        // Navigate to edit page with correct data
        Router.navigate('edit/'+song.id);
      },
      playSong: function(song) {
        // Immediately play song
        page.playSongImmediately(song);
      },
      pauseSong: function(song) {
        // Pause this song
        page.pauseCurrentSong(song);
      },
      queueSong: function(song) {
        // Add song to playlist
        page.bus.$emit("addToPlaylist", [song]);
      },
      deleteSong: function(song) {
        page.deleteSong(song);
      },
      removeDownload: function(song) {
        // Remove this song from the user's disk
        var self = this;
        page.removeDownload(song).then(() => {
          self.downloaded = false;
        });
      },
      downloadSong: function(song) {
        // Download this song to the user's disk
        var filepath = "merged-ZeroLSTN2/" + song.site + "/" + song.directory + "/" + song.filename + "|all";
        page.cmdp("fileNeed", { inner_path: filepath, timeout: 30 }).then((res) => {
          if (res === "ok") {
            self.downloaded = true;
          }
        });
      },
      removeSongParent: function(song) {
      // Calls a method on the parent object relating to removing a song
        this.$parent.removeSong(song);
      }
    }
  }
</script>
