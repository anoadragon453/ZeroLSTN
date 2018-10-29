<template>
  <div class="container" id="edit">
    <!-- Modal Structure -->
    <div id="mergesongmodal" class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Merge Song</h4>
        </div>
        <p>Enter the ID of the other song you want to merge into:</p>
        <div class="row">
          <div class="input-field col s10">
            <input id="songid" type="text" class="validate" v-model="otherSongID">
            <label id="songid-label" for="songid">Song ID</label>
          </div>
        </div>
        <div class="row">
          <a @click.prevent="mergeSong()" class="btn waves-effect waves-light right">Merge</a>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s2">
        <input pattern="\d+" id="track_number" type="number" min="1"
          onkeypress="return (event.charCode === 8 || event.charCode === 0 || event.charCode === 13) ? null : event.charCode >= 48 && event.charCode <= 57"
          class="validate" v-model="song.track_number">
        <label id="track_number-label" for="track_number">Track Number</label>
        <span class="helper-text" data-error="Must be > 0" data-success=""></span>
      </div>
      <div class="input-field col s10">
        <input id="title" type="text" class="validate" v-model="song.title">
        <label id="title-label" for="title">Title</label>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s2">
        <input pattern="\d+" id="year" type="number" min="1"
          onkeypress="return (event.charCode === 8 || event.charCode === 0 || event.charCode === 13) ? null : event.charCode >= 48 && event.charCode <= 57"
          class="validate" v-model="song.year">
        <label id="year-label" for="year">Year</label>
      </div>
      <div class="input-field col s10">
        <input id="album" type="text" class="validate" v-model="song.album">
        <label id="album-label" for="album">Album</label>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s12 no-margin-bottom">
        <input id="artist" type="text" class="validate" v-model="song.artist">
        <label id="artist-label" for="artist">Artist</label>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s12 no-margin-bottom">
        <label>
            <input type="checkbox" v-model="song.compilation" class="filled-in"/>
            <span>This song is part of a compilation album.</span>
        </label>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s12">
        <label id="genres-label">Genres</label>
        <br>
        <div id="genres" class="chips validate"></div>
      </div>
    </div>
    <div id="albumArtRow" style="display: none" class="row">
      <div class="col s12 m7 l7">
        <!-- Album art -->
        <img id="albumArt" :src="song.art" width="100%">
      </div>
    </div>
    <div class="row">
      <!-- Image Upload -->
      <div class="col s12 m7 l7">
        <a @click="uploadAlbumArt()" class="btn waves-effect waves-light">
          <i class="material-icons left">image</i>
          <span id="uploadImageText">Upload Art</span>
          <div class="file-field"><input id="artUpload" type="file" accept="image/x-png,image/jpeg"></div>
        </a>

        <!-- Delete Image Button -->
        <a v-if="song.art" @click="deleteImage()" class="btn-flat">Delete Art</a>
      </div>
      <div class="col s12 m5 l5">
        <!-- Save Button -->
        <a @click="saveClicked()" class="right waves-effect waves-light btn">Save</a>

        <!-- Cancel Button -->
        <a @click="cancelClicked()" class="right btn-flat">Cancel</a>
      </div>
      <!-- TODO: Ability to switch merger site? Have to have the other one downloaded. Delete from this merger and insert into other one, easy -->
    </div>
    <div class="row">
      <div class="col s6">
        <a @click="mergeClicked()" class="left btn-flat">Merge Song</a>
      </div>
      <div class="col s6">
        <a class="right btn-flat">Song ID:<span> {{ song.id }}</span></a>
      </div>
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
import Router from '../libs/router';

export default {
  props: [],
  name: 'edit',
  data: () => ({
    song: {},
    genres: null,
    uploadingFile: false,
    mergeSongModal: null,
    otherSongID: '',
  }),
  mounted() {
    const self = this;

    // Initialize modal view
    const modal = document.getElementById('mergesongmodal');
    const instance_modal = new M.Modal(modal, {
      onCloseEnd() {
        // Fix scrolling after modal closes
        // https://github.com/Dogfalo/materialize/issues/4622
        document.querySelector('body').style.overflow = 'visible';
      },
    });
    this.mergeSongModal = modal;

    // If we're editing a not-yet-uploaded song, present data from its index in the store
    if (Router.currentParams.index) {
      // Make a deep copy so v-model doesn't change the state
      self.song = Object.assign({}, window.page.store.state.newSongs[Router.currentParams.index].song);
      window.page.getAllGenres().then((allGenresResult) => {
        // Organize all known genres for autocompletion
        const allGenres = {};
        for (const i in allGenresResult) {
          allGenres[allGenresResult[i].genre] = null;
        }

        // Get autodetected genre from song tags if present
        const genres = self.song.genre ? [{ tag: self.song.genre }] : [];

        // Initialize autocompletion of genres
        const elem = document.querySelector('.chips');
        self.genres = M.Chips.init(elem, {
          data: genres,
          autocompleteOptions: {
            data: allGenres,
          },
          placeholder: 'Genres',
        });
      });
      self.presentSongData();
    } // If we're editing a not-yet-uploaded song, whose tags were considered a duplicate of an existing song
    else if (Router.currentParams.dupindex) {
      // Make a deep copy so v-model doesn't change the state
      self.song = Object.assign({}, window.page.store.state.duplicateSongsTags[Router.currentParams.dupindex].song);
      window.page.getAllGenres().then((allGenresResult) => {
        // Organize all known genres for autocompletion
        const allGenres = {};
        for (const i in allGenresResult) {
          allGenres[allGenresResult[i].genre] = null;
        }

        // Get autodetected genre from song tags if present
        const genres = self.song.genre ? [{ tag: self.song.genre }] : [];

        // Initialize autocompletion of genres
        const elem = document.querySelector('.chips');
        self.genres = M.Chips.init(elem, {
          data: genres,
          autocompleteOptions: {
            data: allGenres,
          },
          placeholder: 'Genres',
        });
      });
      self.presentSongData();
    } else {
      // Get already uploaded song info from the DB
      window.page.retrieveSongInfo(Router.currentParams.songID).then((song) => {
        if (!song) {
          console.log('Unable to retrieve song from DB.');
          return;
        }

        self.song = song;
        self.presentSongData();
      });

      // Retrieve genres
      window.page.getGenresFromSong(Router.currentParams.songID).then((genresResult) => {
        console.log('[songGenres]', genresResult);

        // Organize genres returned from DB for display
        self.song.genres = [];
        for (const i in genresResult) {
          self.song.genres.push({ tag: genresResult[i].genre });
        }

        window.page.getAllGenres().then((allGenresResult) => {
          // Organize all known genres for autocompletion
          const allGenres = {};
          for (const i in allGenresResult) {
            allGenres[allGenresResult[i].genre] = null;
          }

          // Initialize autocompletion of genres
          const elem = document.querySelector('.chips');
          self.genres = M.Chips.init(elem, {
            data: self.song.genres,
            autocompleteOptions: {
              data: allGenres,
            },
            placeholder: 'Genres',
          });
        });
      });
    }
  },
  methods: {
    presentSongData() {
      console.log('Editing song:', this.song);
      if (this.song.art) {
        // Show img tag only if album art exists
        document.getElementById('albumArtRow').style.display = '';
      }

      // Make labels active so they don't cover the text.
      if (this.song.year !== '') {
        document.getElementById('year').classList.add('valid');
        document.getElementById('year-label').classList.add('active');
      }
      if (this.song.track_number !== '') {
        document.getElementById('track_number').classList.add('valid');
        document.getElementById('track_number-label').classList.add('active');
      }
      if (this.song.title !== '') {
        document.getElementById('title').classList.add('valid');
        document.getElementById('title-label').classList.add('active');
      }
      if (this.song.album !== '') {
        document.getElementById('album').classList.add('valid');
        document.getElementById('album-label').classList.add('active');
      }
      if (this.song.artist !== '') {
        document.getElementById('artist').classList.add('valid');
        document.getElementById('artist-label').classList.add('active');
      }
    },
    saveClicked() {
      // Save song details
      // Save genre information
      this.song.genres = this.genres.chipsData;

      // If we're editing a non-uploaded-yet song, save details to the store
      if (Router.currentParams.index) {
        window.page.store.commit('saveSong', { song: this.song, index: parseInt(Router.currentParams.index) });
        history.back();
      } else if (Router.currentParams.dupindex) {
        window.page.store.commit('saveDuplicateSongTags', { song: this.song, index: parseInt(Router.currentParams.dupindex) });
        history.back();
      } else {
        console.log('Uploading edit of song:', this.song);
        // Otherwise, edit the already uploaded song
        window.page.createSongObjects([this.song], true, () => {
          // Head back to the previous page
          history.back();
        });
      }
    },
    cancelClicked() {
      // Go back to the previous page if they hit cancel
      history.back();
    },
    deleteImage() {
      // Delete the image from the filesystem
      window.page.deleteImage(Router.currentParams.mergerAddress, this.song.art);

      // Hide the image view
      document.getElementById('albumArtRow').style.display = 'none';
      this.song.art = '';
    },
    uploadAlbumArt() {
      // Run when Upload Art button is clicked
      // Open file upload window
      const fileUploadButton = document.getElementById('artUpload');
      fileUploadButton.click();

      // Listen for when a file has been uploaded
      const self = this;
      fileUploadButton.addEventListener('change', function () {
        // Prevent this method from running twice on a single file upload
        if (self.uploadingFile) {
          return;
        }
        self.uploadingFile = true;

        // Return if no files were uploaded
        if (!this.files || !this.files[0]) {
          this.uploadingFile = false;
          return;
        }

        // Get selected user file
        const file = this.files[0];

        // Check if the file is one of approved filetype
        if (!file || typeof file !== 'object' || !file.type.match('(image)\/.*(jpeg|png)')) {
          window.page.cmd('wrapperNotification', ['error', `File type ${file.type} does not match jpeg/jpg/png.`]);
          return;
        }

        // "Upload" the file to the user's 'artwork' folder

        // Create an object to read the file's data
        const reader = new FileReader();

        // Set what happens once file reading is complete
        reader.onload = function (event) {
          const filedata = btoa(event.target.result);
          const mergerAddress = Router.currentParams.index ? window.page.getAddressFromYear(self.song.year) : self.song.site;

          if (Router.currentParams.index) {
            // This is a yet-to-be-uploaded song, just set the art property to the filedata
            // We'l actually upload this later
            self.song.art = `data:image/jpeg;base64,${filedata}`;
            return;
          }

          // Copy and set image as optional file
          window.page.uploadImage(file, filedata, mergerAddress)
            .then((uploadURL) => {
              console.log('[URL]', uploadURL);
              // Display it on the page
              document.getElementById('albumArtRow').style.display = '';

              // Attach to song
              self.song.art = uploadURL;

              // Allow uploading further files
              self.uploadingFile = false;
            });
        };

        // Read the file's data
        reader.readAsBinaryString(file);
      });
    },
    mergeClicked() {
      // Open the merge modal
      this.mergeSongModal.M_Modal.open();
    },
    async mergeSong() {
      // Merge the current song and the foreign song
      if (this.song.id === this.otherSongID) {
        M.toast({ html: "Can't merge song into itself." });
        return;
      }

      console.log('Merging song', this.song.id, 'into song', this.otherSongID);
      res = await window.page.mergeSongs(this.song, this.otherSongID);
      if (res !== 'ok') {
        M.toast({ html: res });
        return;
      }

      // Close the modal
      this.mergeSongModal.M_Modal.close();

      // Come out from song
      history.back();
    },
  },
};
</script>
