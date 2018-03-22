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
        <a @click.prevent="showModal()" class="btn waves-effect waves-light right"><i class="material-icons left">add</i>
          Upload<span v-if="newSongs && newSongs.length != 0"> more</span> Songs
        </a>
        <a id="publishsongs" v-if="newSongs && newSongs.length != 0" @click.prevent="publishSongs()"
          :class="{ 'disabled' : publishing }" style="margin-right: 1em" class="btn waves-effect waves-light right">
          <i class="material-icons left">cloud_upload</i>
          Publish Songs
        </a>
      </div>
      <div v-if="newSongs && newSongs.length != 0" class="row">
        <h5>Ready to Upload</h5>
        <ul class="collection">
          <a href="#!" v-for="(songObject, index) in newSongs" @click.prevent="editNewSong(index)" class="collection-item">
            {{ (songObject.song.track_number ? songObject.song.track_number : '?') + '. ' }}
            {{ songObject.song.artist }} - 
            {{ songObject.song.album }} - 
            {{ songObject.song.title }}
          </a>
        </ul>
      </div>
      <div v-if="songs" class="row">
        <h5>Uploads</h5>
        <ul v-if="songs.length != 0 || (newSongs && newSongs.length != 0)" class="collection">
          <a href="#!" v-for="(song, index) in songs" @click.prevent="editSong(song)" class="collection-item">
            {{ (song.track_number ? song.track_number : '?') + '. ' }}
            {{ song.artist }} -
            {{ song.album }} -
            {{ song.title }}
          </a>
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
        uploadingFile: false,
        publishing: false
      }
    },
    beforeMount: function() {
      // Show "Ready to Upload" songs if they are available in the store
      if (page.store.state.newSongs.length != 0) {
        this.newSongs = page.store.state.newSongs;
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

      // Get and show list of uploaded songs
      page.cmdp("siteInfo", {})
      .then(siteInfo => {
        page.getSongsByUser(siteInfo.auth_address)
        .then((songs) => {
          // Store and list songs on page
          this.songs = songs;
        });
      });
    },
    methods: {
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
          if(self.muploadingFile) {
            return;
          }
          self.uploadingFile = true;

          // Iterate through uploaded files and scrape tags
          var newSongs = [];
          var fullLength = this.files.length;
          for (var i = 0; i < fullLength; i++) {
            var file = this.files[i];
            // Check if the file is one of approved filetype
            if (!file || typeof file !== "object" || !file.type.match("(audio)\/.*(mp3|flac|ogg|opus|m4a|mpeg|mp4|webm)")) {
              console.log("Filetype not supported");
              continue;
            }

            // Read the ID3 tags
            self.readTags(file, {
              onSuccess: function(filename, tag) {
                // Add the file with the tags into filesWithTags
                // DEBUG: console.log("file is", filename)
                newSongs.push(self.craftSongObject(filename, tag.tags));

                // Run this once all songs are scraped
                if (newSongs.length == fullLength) {
                  // Add uploaded files to Vuex store to access later on edit page
                  page.store.commit('addNewSongs', newSongs);
                  self.newSongs = page.store.state.newSongs;

                  // Sort songs by track/album
                  self.newSongs.sort(function(a, b) {
                    return (a.song.album < b.song.album) ? -1 : (a.song.album > b.song.album) ? 1 : 0;
                  });

                  // Close upload modal
                  self.uploadingFile = false;
                  self.uploadModal.M_Modal.close();
                }
              },
              onError: function(file, error) {
                console.log("[jsmediatags]:", error.type, error.info);
                newSongs.push({});
              }
            });
          }
        });
      },
      craftSongObject: function(file, tags) {
        var song = {};

        song['id'] = Date.now();
        song['title'] = tags.title ? tags.title : '';
        song['album'] = tags.album ? tags.album : '';
        song['artist'] = tags.artist ? tags.artist : '';
        song['year'] = tags.year ? tags.year : '';

        // Transform "x/y" -> "x" and "0x" -> "x"
        if (tags.track) {
          // Convert track to a string
          tags.track = '' + tags.track;
          tags.track = tags.track.split('/')[0];
          tags.track = tags.track.replace(/^0+/, '');
          song['track_number'] = tags.track;
        }

        // Convert album art from uint8 array to base64
        if (tags.picture) {
          var imageData = tags.picture.data;
          var base64String = "";
          for (var i = 0; i < imageData.length; i++) {
            base64String += String.fromCharCode(imageData[i]);
          }

          // Save image URL as base64 string
          song['art'] = "data:" + tags.picture.format + ";base64," + btoa(base64String);
        }

        return {"file": file, "song": song};
      },
      editSong: function(song) {
        Router.navigate('edit/'+song.site+"/"+song.id);
      },
      editNewSong: function(songIndex) {
        // Head to edit page with index of new song
        Router.navigate('/edit/store/' + songIndex);
      },
      publishSongs: function() {
        var self = this;
        var totalSongs = this.newSongs.length;
        var publishCount = 0;

        var publishButton = document.getElementById("publishsongs");
        publishButton.innerHTML = "Publishing...";

        self.publishing = true;

        // Upload all songs in newSongs
        for (var i in this.newSongs) {
          // Upload each song file
          this.newSongs[i].song.filename = page.uploadSongBigFile(this.newSongs[i].song.year, this.newSongs[i].file, function() {
              // Count the progress we've made in uploading
              publishCount++;

              // Show progress in publish button
              publishButton.innerHTML = "Publishing... (" + publishCount + "/" + totalSongs + ")";

              // Once we've published all songs, hide publish button
              if (publishCount == totalSongs){
                console.log("Done")

                // Add the published song to the list of uploaded songs
                if (!self.songs) { self.songs = []; }

                // Extract songs from newSongs array
                var songObjs = self.newSongs.map(a => a.song);
                self.songs.push.apply(self.songs, songObjs);

                // Clear newSongs arrays
                self.newSongs = [];
                page.store.commit('clearNewSongs');

                self.publishing = false;

                publishButton.innerHTML = "Publish Songs";
              }
          });
        }

        // Extract songs from newSongs array
        var songObjs = self.newSongs.map(a => a.song);

        // Publish the new list of songs in the user's data.json
        console.log('Publishing songs:', songObjs)
        page.createSongObjects(songObjs, false);
      },
      // Wrapper function for jsmediatags. We need to link the file object to
      // the tags for BigFile uploading, and this wrapper allows us to do so.
      readTags: function(file, func) {
        jsmediatags.read(file, {
          onSuccess: func.onSuccess.bind(this, file),
          onError: func.onError.bind(this, file)
        });
      }
    }
  }
</script>
