<<template>
  <div id="edit">
    <!-- Modal Structure -->
    <div class="modal">
      <div class="modal-content">
        <div class="row">
          <div class="col s12 m6 l6">
            <h4>Upload Song</h4>
            <div class="row">
              <div class="input-field col s12">
                <i class="material-icons prefix">video_library</i>
                <input type="text" id="autocomplete-input" class="autocomplete">
                <label for="autocomplete-input">Genre</label>
              </div>
            </div>
          </div>
          <div class="col s12 m6 l6">
            <!-- Upload button -->
            <a id="uploadButton" @click="uploadClicked()" class="right disabled waves-effect waves-light btn">
              Upload
              <div class="file-field"><input type="file" accept="audio/*"></div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Show uploads if there are any -->
    <div class="container">
      <div class="row"></div>
      <div class="row">
        <div class="col s12">
          <a @click.prevent="uploadModal.M_Modal.open()" class="btn waves-effect waves-light right"><i class="material-icons left">cloud_upload</i>New Song</a>
        </div>
      </div>
      <div class="row">
        <ul v-if="songs && songs.length != 0" class="collection with-header">
            <li class="collection-header">Uploads</li>
            <songitem  v-for="song in songs" :editable="true" :song="song"></songitem>
        </ul>
        <p v-else>No uploads. Press the Add button to get started!</p>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var SongItem = require("../vue_components/song_item.vue");

  module.exports = {
    components: {
      songitem: SongItem
    },
    props: ["mergerZites"],
    name: "uploads",
    data: () => {
      return {
        uploadModal: null,
        genres: null,
        songs: null,
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

      // Keep a reference to ourself
      var self = this;

      // Get list of merger zites
      page.cmdp("mergerSiteList", [true])
        .then((mergerZites) => {
          // Compute genres from Merger Zites
          var genres = {};
          for (var ziteAddress in mergerZites) {
            // Each item: genres['rock'] = 1abcxyz
            genres[mergerZites[ziteAddress].content.title] = ziteAddress;
          }
          
          // Store these genres
          self.genres = genres;

          // Generate map of genre titles
          // TODO: Have a genre image stored with each mergerZite?
          var genreTitles = {};
          for (var genre in genres) {
            // Add genre title, null image
            genreTitles[genre] = null;
          }

          // Initialize autcomplete in modal
          var autocomplete = document.querySelector(".autocomplete");
          var instance = new M.Autocomplete(autocomplete, {
            data: genreTitles,
            limit: 5, // Max amount of results shown at once
            onAutocomplete: self.autocompleteChanged,
            minLength: 1
          });
          
          // Add event listener for whenever autocomplete field is edited
          autocomplete.addEventListener('keyup', self.autocompleteChanged);

          // Show list of uploads
          page.cmdp("siteInfo", {})
			      .then(siteInfo => {
              page.getSongsByUser(siteInfo.auth_address)
                .then((songs) => {
                  // Store and later list songs on page
                  this.songs = songs;
                });
            });
        });
    },
    methods: {
      validateGenre: function() {
        // Return whether the genre in the autocomplete field is valid
        return this.genres.hasOwnProperty(document.getElementById("autocomplete-input").value);
      },
      autocompleteChanged: function() {
        // Check to see if selected genre is correct
        var uploadButton = document.getElementById("uploadButton");
        if(this.validateGenre()){
          // If so, enable upload button
          uploadButton.classList.remove("disabled");
        } else {
          // Disable upload button
          if(!uploadButton.classList.contains("disabled")) {
            uploadButton.classList.add("disabled");
          }
        }
      },
      uploadClicked: function() {
        // Query user info

        // Open file upload window
        var fileUploadButton = document.querySelector('input[type=file]');
        fileUploadButton.click();

        // Keep a reference to ourself
        var self = this;

        // Listen for when a file has been uploaded
        fileUploadButton.addEventListener('change', function() {
          // Prevent this method from running twice on a single file upload
          if(this.uploadingFile) {
            return;
          }
          this.uploadingFile = true;

          // Get selected user file
          var file = this.files[0];

          // Check if the file is one of approved filetype
          if (!file || typeof file !== "object" || !file.type.match("(audio)\/(mp3|flac|ogg|m4a|mp4)")) {
            page.cmd("wrapperNotification", ["error", "File type " + file.type + " does not match mp3/flac/ogg/m4a/mp4."]);
            return
          }
          
          console.log("Uploading " + file.name);

          // Get the current genre and its address
          var genre = document.getElementById("autocomplete-input").value;
          console.log(genre);
          var genreAddress = self.genres[genre];

          // "Upload" the file
          page.uploadBigFile(genreAddress, file, function(fileNameWithDate) {
            // Add default song information to data.json
            // TODO: Infer this data from file
            page.uploadSong(genreAddress, fileNameWithDate, fileNameWithDate, "", "", function(songID) {
              // Navigate to the edit page. Prefill the title with genre/songID
              console.log("Routing to edit/"+genreAddress+"/"+songID);
              Router.navigate('edit/'+genreAddress+"/"+songID);
            });
          });
        });
      }
    }
  }
</script>