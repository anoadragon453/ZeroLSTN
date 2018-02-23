<template>
  <div id="uploads">
    <!-- Modal Structure -->
    <div class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Upload Songs</h4>
        </div>
        <div v-if="!uploadingFile" class="row center">
          <div @click.prevent="uploadClicked()" class="upload-box">
            <p class="valign-center center grey-text text-darken-2">
              Drag a song or folder here<br>
              Or click to select
            </p>
          </div>
          <input type="file" id="fileupload" style="display: none" webkitdirectory directory multiple>
        </div>
        <div v-else class="row center">
          <p>Reading song info...</p>
          <div class="progress">
            <div class="indeterminate"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Show uploads if there are any -->
    <!-- TODO: Show new uploads in a different way from existing in the list. Show a "Publish Changes" button that doesn't publish
      until you tell it to. Have editing a song not publish in this instance with a prop sent to it. -->
    <div class="container">
      <div class="row"></div>
      <div class="row">
        <div class="col s6">
          <h5 class="hide-on-med-and-down">Uploads</h5>
        </div>
        <div class="col s6">
          <a @click.prevent="showModal()" class="btn waves-effect waves-light right"><i class="material-icons left">cloud_upload</i>Upload Songs</a>
        </div>
      </div>
      <div v-if="newSongs && newSongs.length != 0" class="row">
        <h5>Ready to Upload</h5>
        <ul class="collection">
          <a href="#!" v-for="songObject in newSongs" class="collection-item">{{ songObject.song.title }}</a>
        </ul>
      </div>
      <div class="row">
        <ul v-if="songs && songs.length != 0" class="collection">
          <songitem v-for="song in songs" :song="song"></songitem>
        </ul>
        <p class="center" v-else><b>Nothing here yet...</b><br>Press the Upload button to get started.</p>
      </div>
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var SongItem = require("../vue_components/song_item.vue");

  // Import JSMediaTags
  var jsmediatags = require('jsmediatags');

  module.exports = {
    components: {
      songitem: SongItem
    },
    props: [],
    name: "uploads",
    data: () => {
      return {
        uploadModal: null,
        songs: null,
        newSongs: null,
        uploadingFile: false
      }
    },
    mounted: function() {
      // Initialize floating button
      var action = document.querySelector("a.btn-floating");
      var instance = new M.FloatingActionButton(action, {});

      // Initialize modal view
      var modal = document.querySelector(".modal");
      var instance_modal = new M.Modal(modal, {});
      this.uploadModal = modal;
    },
    methods: {
      getSongs: function() {
        // Get and show list of uploads
        /*
        page.cmdp("siteInfo", {})
        .then(siteInfo => {
          page.getSongsByUser(siteInfo.auth_address)
          .then((songs) => {
            console.log(songs);
            // Store and list songs on page
            this.songs = songs;
          });
        });
        */
      },
      showModal: function() {
        // Make sure user is signed in first
        if(!page.isUserSignedIn()) {
          // Show sign in prompt
          page.selectUser();
          return;
        }

        // Reveal the upload modal
        this.uploadModal.M_Modal.open()
      },
      uploadClicked: function() {
        // Open file upload window
        var fileUploadButton = document.getElementById('fileupload');
        fileUploadButton.click();

        // Keep a reference to ourselves
        var self = this;

        // Listen for when a file has been uploaded
        fileUploadButton.addEventListener('change', function() {
          // Prevent this method from running twice on a single file upload
          if(self.uploadingFile) {
            return;
          }
          self.uploadingFile = true;
            
          // Iterate through uploaded files and scrape tags
          if (!self.newSongs) { self.newSongs = []; }
          var newSongs = [];
          var fullLength = this.files.length;
          for (var i = 0; i < fullLength; i++) {
            var file = this.files[i];
            // Check if the file is one of approved filetype
            if (!file || typeof file !== "object" || !file.type.match("(audio)\/.*(mp3|flac|ogg|m4a|mpeg|mp4|webm)")) {
              console.log("Filetype not supported")
              continue;
            }

            // Read the ID3 tags
            jsmediatags.read(file, {
              onSuccess: function(tag) {
                // Add the file with the tags into filesWithTags
                newSongs.push(self.craftSongFile(file, tag.tags));

                // Run this once all songs are scraped
                if (newSongs.length == fullLength) {
                  // Add uploaded files to new songs list
                  self.newSongs.push.apply(self.newSongs, newSongs);
                  self.uploadingFile = false;

                  // Close upload modal
                  console.log('[newSongs]', self.newSongs)
                  self.uploadModal.M_Modal.close();
                }
              },
              onError: function(error) {
                console.log("[worker] Tag reading error:", error)
                newSongs.push({});
              }
            });
          }
        });
      },
      craftSongFile: function(file, tags) {
        var song = {};

        song['track_number'] = tags.track ? tags.track : '';
        song['title'] = tags.title ? tags.title : '';
        song['album'] = tags.album ? tags.album : '';
        song['artist'] = tags.artist ? tags.artist : '';
        song['year'] = tags.year ? tags.year : '';
        // TODO: song['art'] = tags.picture ? tags.picture.data : '';
        song['date_added'] = Date.now();
        song['is_edit'] = false;

        return {"file": file, "song": song};
      }
    }
  }
</script>
