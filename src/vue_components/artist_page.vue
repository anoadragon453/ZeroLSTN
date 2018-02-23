<template>
  <div id="artistpage">
    <div class="row">
      <div class="col s12">
        <ul class="collection with-header">
          <li class="collection-header">
            <i v-if="downloaded" @click.prevent="removeAlbum()" class="material-icons right">cloud_done</i>
            <i v-else @click.prevent="downloadArtist()" class="material-icons right">cloud_download</i>
            <i @click.prevent="queueArtist()" class="material-icons right">playlist_add</i>
            <i @click.prevent="playArtist()" class="material-icons right">play_arrow</i>
            
            <h4 v-if="artist !== ''">{{ artist }}</h4>
            <h4 v-else><i>Blank</i></h4>
            <p>Artist</p>
          </li>
        </ul>
        <ul class="collapsible popout" data-collapsible="accordion">
          <li v-for="(album, index) in albums">
            <div class="collapsible-header">
              <span v-if="album !== ''"><b>{{ album }}</b></span>
              <span v-else><b><i>Blank</i></b></span>
            </div>
            <div class="collapsible-body">
              <albumPage :current-song="currentSong" :audio-playing="audioPlaying" :album="album" :artist="artist" :embedded="true"></albumPage>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var SongItem = require("../vue_components/song_item.vue");
  var AlbumPage = require("../vue_components/album_page.vue");
  
  module.exports = {
    components: {
      songitem: SongItem,
      albumPage: AlbumPage
    },
    props: ["artist", "currentSong", "audioPlaying"],
    name: "artistpage",
    mounted: function() {
      // Initialize all collapsibles
      var collap = document.querySelector(".collapsible");
      var instance = new M.Collapsible(collap, {});
    },
    data: () => {
      return {
        downloaded: true
      }
    },
    asyncComputed: {
      albums: {
        get() {
          // Get all albums by this artist
          var self = this;
          return page.getAlbumsByArtist(this.artist);
        }
      }
    },
    methods: {
      goto: function(to) {
        // Go to specified page
        Router.navigate(to);
      },
      playArtist: function() {
        // Queue songs and play the first one of the album
        var queueLength = page.getQueueLength();
        var queueIndex = page.getQueueIndex();
        
        // Get all songs by this artist
        var self = this;
        page.getAlbumsByArtist(this.artist)
        .then((albums) => {
          var songs = [];
          albums.forEach((album) => {
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
        });
      },
      queueArtist: function() {
        // Queue every album by this artist
        var self = this;
        page.getAlbumsByArtist(this.artist)
        .then((albums) => {
          var songs = [];
          albums.forEach((album) => {
            page.getSongsInAlbum(album, self.artist)
            .then((songs) => {
              page.queueSongs(songs);
            });
          });
        });
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
      },
      notDownloaded: function() {
        // Called by album's when they realize they're not completely downloaded.
        this.downloaded = false;
      }
    }
  }
</script>