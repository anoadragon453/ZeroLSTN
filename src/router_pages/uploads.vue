<template>
  <div id="uploads">
    <!-- Modal Structure -->
    <div class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Upload Songs</h4>
        </div>
        <span v-if="!uploadingFile">
          <div class="row no-margin-bottom">
            <p>Supported filetypes: mp3, flac, ogg, opus, m4a, mpeg, mp4, webm</p>
          </div>
          <div class="row no-margin-bottom">
            <div @click.prevent="uploadClicked('file')" class="col s12 upload-box center">
              <span class="valign-center center">
                <i class="large material-icons">music_video</i>
                <p class="grey-text text-darken-2">
                  Click to upload one or more songs<br>
                </p>
              </span>
            </div>
            <input type="file" id="fileupload" style="display: none" multiple>
            <div @click.prevent="uploadClicked('folder')" @ondrop="filesDropped" @ondragover="filesDropped" class="col s12 upload-box center">
              <span class="valign-center center">
                <i class="large material-icons">folder_open</i>
                <p class="grey-text text-darken-2">
                  Click to upload a folder of songs<br>
                </p>
              </span>
            </div>
            <input type="file" id="folderupload" style="display: none" required multiple webkitdirectory directory>
          </div>
        </span>
        <div v-else class="row center">
          <p>Reading song info...</p>
          <div class="progress">
            <div class="indeterminate"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Show uploads if there are any -->
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
      <div v-if="newSongs.length > 0 || duplicateSongsFile.length > 0 || duplicateSongsTags.length > 0" class="row">
        <span v-if="duplicateSongsTags.length > 0">
          <h5>Song Tags That Already Exist</h5>
          <ul class="collection">
            <li v-for="(duplicateSong, index) in duplicateSongsTags" class="collection-item">
              <a href="" @click.prevent="editExistingTagsSong(index)" class="teal-text">
              {{ (duplicateSong.song.track_number ? duplicateSong.song.track_number : '?') + '. ' }}
              {{ duplicateSong.song.artist }} -
              {{ duplicateSong.song.album }} -
              {{ duplicateSong.song.title }}
              </a>
              <i @click.prevent="removeSongWithIndex(duplicateSongsTags, index)" class="material-icons right">close</i>
            </li>
          </ul>
        </span>
        <span v-if="duplicateSongsFile.length > 0">
          <h5>Song Files That Already Exist</h5>
          <ul class="collection">
            <li v-for="(duplicateSong, index) in duplicateSongsFile" class="collection-item">
              <a href="" @click.prevent="navigateToSongID(duplicateSong.existingSongID)" class="teal-text">
              {{ duplicateSong.title }}
              </a>
              <i @click.prevent="removeSongWithIndex(duplicateSongsFile, index)" class="material-icons right">close</i>
            </li>
          </ul>
        </span>
        <span v-if="newSongs.length > 0">
          <h5>Ready to Upload</h5>
          <ul class="collection">
            <li v-for="(songObject, index) in newSongs" class="collection-item">
              <a href="" @click.prevent="editNewSong(index)" class="teal-text">
              {{ (songObject.song.track_number ? songObject.song.track_number : '?') + '. ' }}
              {{ songObject.song.artist }} -
              {{ songObject.song.album }} -
              {{ songObject.song.title }}
              </a>
              <i @click.prevent="removeSongWithIndex(newSongs, index)" class="material-icons right">close</i>
            </li>
          </ul>
        </span>
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
  let Router = require('../libs/router.js');
  let SongItem = require('../vue_components/song_item.vue');

  let jsmediatags = require('jsmediatags');

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
        newSongs: [],
        duplicateSongsFile: [],
        duplicateSongsTags: [],
        uploadingFile: false,
        publishing: false,
        publishCount: 0,
        uploadBatchSize: 30
      }
    },
    beforeMount: async function() {
      // Show "Ready to Upload" songs if they are available in the store
      if (page.store.state.newSongs.length != 0) {
        // We need to check on load if the metadata has now changed to something that does already exist
        this.newSongs = page.store.state.newSongs;
        for (let i = 0; i < this.newSongs.length; i++) {
          if (await page.isDuplicateSongByTags(this.newSongs[i].song)) {
            // If this is now a duplicate song, add it to the duplicate songs array
            this.duplicateSongsTags.push(this.newSongs[i]);
            // And remove it from the newSongs array
            this.newSongs.splice(i, 1);
            i--;
          }
        }

        // Update state
        page.store.commit('setNewSongs', this.newSongs);
      }

      // Show duplicated tags songs if they are available in the store
      if (page.store.state.duplicateSongsTags.length != 0) {
        // We need to check on load if the metadata has now changed to something that doesn't exist
        this.duplicateSongsTags = page.store.state.duplicateSongsTags;
        for (let i = 0; i < this.duplicateSongsTags.length; i++) {
          if (!(await page.isDuplicateSongByTags(this.duplicateSongsTags[i].song))) {
            // If this is no longer a duplicate song, add it to the new songs array
            this.newSongs.push(this.duplicateSongsTags[i]);

            // And remove it from the duplicate songs array
            this.duplicateSongsTags.splice(i, 1);
            i--;
          }
        }

        // Update state
        page.store.commit('setDuplicateSongsTags', this.duplicateSongsTags);
      }

      // Show duplicated filename/size songs if they are available in the store
      if (page.store.state.duplicateSongsFile.length != 0) {
        this.duplicateSongsFile = page.store.state.duplicateSongsFile;
      }
    },
    mounted: function() {
      // Initialize floating button
      let action = document.querySelector("a.btn-floating");
      let instance = new M.FloatingActionButton(action, {});

      // Initialize modal view
      let modal = document.querySelector(".modal");
      let instance_modal = new M.Modal(modal, {});
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
      // TODO: Figure out file/folder dropping
      filesDropped: function(event) {
        event.preventDefault();
        console.log("Dropped")

        this.processUploadedFiles(event.target.files);
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
      uploadClicked: function(type) {
        // Open file upload window
        let uploadButton;
        if (type == "file") {
          uploadButton = document.getElementById('fileupload');
        } else {
          uploadButton = document.getElementById('folderupload');
        }
        uploadButton.click();

        // Keep a reference to ourselves
        let self = this;

        // Listen for when a file has been uploaded
        uploadButton.onchange = function() {
          // Start uploading the files
          self.processUploadedFiles(this.files);
        };
      },
      processUploadedFiles: async function(files) {
        let self = this;
        self.uploadingFile = true;

        // Iterate through uploaded files and scrape tags
        let newSongs = [];
        let incompatibleFiles = 0;
        for (let i = 0; i < files.length; i++) {
          console.log(i+1 + "/" + files.length)
          let file = files[i];

          // Check if the file is one of approved filetype
          if (!file || typeof file !== "object" || !file.type.match("(audio|video)\/.*(mp3|flac|ogg|opus|m4a|mpeg|mp4|webm)")) {
            console.log(file.name, "Filetype not supported. Skipping...");
            incompatibleFiles++;
            continue;
          }

          // Check for duplicate by filename/filesize
          let dupSongIDs = await page.isDuplicateSongByNameSize(file);
          if (dupSongIDs.length > 0) {
            // Store the ID of the song that shares this file on the songObj,
            // so that we can later link to it
            self.duplicateSongsFile.push({title: file.name, existingSongID: dupSongIDs[0].id});
            continue;
          }

          // Read the song's tags
          await self.readTags(file, {
            onSuccess: async function(loadedFile, tag) {
              // Check if this song is already in the database
              let songObj = self.craftSongObject(loadedFile.name, tag.tags);
              
              if (await page.isDuplicateSongByTags(tag.tags)) {
                // Was a duplicate, add to the duplicate pile
                self.duplicateSongsTags.push({file: loadedFile, song: songObj});
              } else {
                // Stage the song for upload
                newSongs.push({file: loadedFile, song: songObj});
              }
            },
            onError: function(loadedFile, error) {
              console.log("[jsmediatags err]:", loadedFile.name, error.type, error.info);
              newSongs.push({file: loadedFile, song: self.craftSongObject(loadedFile.name, {})});
            }
          });
        }

        self.finishUploading(newSongs);

        // Show a toast to warn users if any files weren't proper formats
        if (incompatibleFiles > 0) {
          M.toast({html: incompatibleFiles + ' files with incompatible filetype.'});
        }
      },
      
      finishUploading: function(newSongs) {
        console.log("Finishing upload...")
        // Add uploaded files to Vuex store to access later on edit page
        page.store.commit('addNewSongs', newSongs);
        this.newSongs = page.store.state.newSongs;

        page.store.commit('addDuplicateSongsTags', this.duplicateSongsTags);
        page.store.commit('addDuplicateSongsFile', this.duplicateSongsFile);

        // Sort songs by track/album
        this.newSongs.sort(function(a, b) {
          return (a.song.album < b.song.album) ? -1 : (a.song.album > b.song.album) ? 1 : 0;
        });

        // Close upload modal
        this.uploadingFile = false;
        this.uploadModal.M_Modal.close();
      },
      craftSongObject: function(filename, tags) {
        // Create a song object with all relevant tags
        let song = {};

        // Set song information
        song['id'] = Date.now();
        song['title'] = tags.title ? tags.title : '';
        song['album'] = tags.album ? tags.album : '';
        song['artist'] = tags.artist ? tags.artist : '';
        song['year'] = tags.year ? tags.year : '';
        song['genre'] = tags.genre && tags.genre != "Unknown Genre" ? tags.genre : '';

        // Convert year to correct format
        song['year'] = (new Date(song['year'])).getFullYear();

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
          let imageData = tags.picture.data;
          let base64String = "";
          for (let i = 0; i < imageData.length; i++) {
            base64String += String.fromCharCode(imageData[i]);
          }

          // Save image URL as base64 string
          song['art'] = "data:" + tags.picture.format + ";base64," + btoa(base64String);
        }

        // Mark song as untagged if tags is null
        if (Object.keys(tags).length == 0) {
          song['untagged'] = true;
          song['title'] = filename;
          song['artist'] = 'Unknown';
          song['album'] = 'Unknown';
          song['track_number'] = 1;
          song['year'] = (new Date()).getFullYear(); // Default to current year
        }

        return song;
      },
      editSong: function(song) {
        Router.navigate('edit/'+song.id);
      },
      editNewSong: function(songIndex) {
        // Head to edit page with index of new song
        Router.navigate('/edit/store/' + songIndex);
      },
      editExistingTagsSong: function(songIndex) {
        // Head to edit page with index of a song detected as having duplicate tags
        // Allow to user to edit tags to make them different
        Router.navigate('/edit/existingStore/' + songIndex);
      },
      publishSongs: function() {
        // Make sure user is signed in first
        if(!page.isUserSignedIn()) {
          // Show sign in prompt
          page.selectUser();
          return;
        }

        // All songs might've been duplicates. In that case, just return
        if (this.newSongs.length == 0) {
          return;
        }

        let publishButton = document.getElementById("publishsongs");
        publishButton.innerHTML = "Publishing...";

        this.publishing = true;

        // Upload all songs in newSongs
        this.publishCount = 0;
        this.runBatchPublish(0);
      },
      runBatchPublish: function(offset) {
        // Upload a batch of songs
        let totalSongs = this.newSongs.length;
        let batchCount = totalSongs / this.uploadBatchSize;
        let publishButton = document.getElementById("publishsongs");

        for (let i = offset; i < offset + this.uploadBatchSize && i < totalSongs; i++) {
          // Upload each song file
          let self = this;
          console.log("Publishing:", i)
          this.newSongs[i].song.filesize = this.newSongs[i].file.size;
          this.newSongs[i].song.filename = page.uploadSongBigFile(this.newSongs[i].song.year, this.newSongs[i].file, i, function(index) {
            console.log("Nullifying index:", index)
            self.newSongs[index].file = null;

            // Count the progress we've made in uploading
            self.publishCount++;

            // Show progress in publish button
            publishButton.innerHTML = "Publishing... (" + self.publishCount + "/" + totalSongs + ")";

            // Once we've published all songs, hide publish button
            if (self.publishCount == totalSongs){
              console.log("Done publishing all batches");

              // Add the published songs to the list of uploaded songs
              if (!self.songs) { self.songs = []; }

              // Extract songs from newSongs array
              let songObjs = self.newSongs.map(a => a.song);
              self.songs.push.apply(self.songs, songObjs);

              // Publish the new list of songs in the user's data.json
              page.createSongObjects(songObjs, false);

              // Clear array of new songs
              self.newSongs = [];
              page.store.commit('clearNewSongs');

              self.publishing = false;
              publishButton.innerHTML = "Publish Songs";
            } else if (self.publishCount == offset + self.uploadBatchSize) {
              // We still need to publish another batch
              console.log("Done publishing batch, moving to next one...")
              self.runBatchPublish(offset + self.uploadBatchSize);
            }
          });
        }
      },
      // Wrapper function for jsmediatags. We need to link the file object to
      // the tags for BigFile uploading, and this wrapper allows us to do so.
      readTags: function(file, func) {
        return new Promise((resolve, reject) => {
          jsmediatags.read(file, {
            onSuccess: async function(tags) {
              await func.onSuccess(file, tags);
              resolve();
            },
            onError: async function(error) {
              await func.onError(file, error);
              resolve();
            }
          });
        })
      },
      // Remove specified song from newSongs array
      removeSongWithIndex: function(songArr, index) {
        songArr.splice(index, 1);
      },
      // Navigate to a songID
      navigateToSongID: function(id) {
        Router.navigate('/edit/'+id);
      }
    }
  }
</script>
