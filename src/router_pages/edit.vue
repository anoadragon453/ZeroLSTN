<template>
  <div class="container" id="edit">
    <div class="row">
      <div class="input-field col s2">
        <input pattern="\d+" id="tracknumber" type="number" min="1"
          onkeypress="return (event.charCode == 8 || event.charCode == 0 || event.charCode == 13) ? null : event.charCode >= 48 && event.charCode <= 57"
          class="validate" v-model="tracknumber">
        <label id="tracknumber-label" for="tracknumber">Track #</label>
        <span class="helper-text" data-error="Must be > 0" data-success=""></span>
      </div>
      <div class="input-field col s10">
        <input id="title" type="text" class="validate" v-model="title">
        <label id="title-label" for="title">Title</label>
      </div>
    </div>
    <div class="row">
      <div class="input-field col s6">
        <input id="album" type="text" class="validate" v-model="album">
        <label id="album-label" for="album">Album</label>
      </div>
      <div class="input-field col s6">
        <input id="artist" type="text" class="validate" v-model="artist">
        <label id="artist-label" for="artist">Artist</label>
      </div>
    </div>
    <div id="albumArtRow" style="display: none" class="row">
      <div class="col s12 m7 l7">
        <!-- Album art -->
        <img id="albumArt" :src="existingAlbumArt" width="100%">
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
        <a v-if="existingAlbumArt" @click="deleteImage()" class="btn-flat">Delete</a>
      </div>
      <div class="col s12 m5 l5">
        <!-- Save Button -->
        <a @click="saveClicked()" class="right waves-effect waves-light btn">Save</a>
        
        <!-- Cancel Button -->
        <a @click="cancelClicked()" class="right btn-flat">Cancel</a>
      </div>
      <!-- TODO: Ability to switch genre? Have to have the other one downloaded. Delete from this genre and insert into other one, easy -->
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  
  module.exports = {
    props: [],
    name: "edit",
    data: () => {
      return {
        id: "",
        tracknumber: "",
        title: "",
        artist: "",
        album: "",
        existingAlbumArt: "",
        uploadingFile: false
      }
    },
    mounted: function() {
      // Get file information
      var self = this;
      page.cmdp("siteInfo", {})
			.then(siteInfo => {
        page.retrieveSongInfo(Router.currentParams["genre"], Router.currentParams["songID"], siteInfo.auth_address, function(song) {
          if(!song) {
            return page.cmdp("wrapperNotification", ["error", "Unable to retreive song information."]);
          }
          
          self.tracknumber = song.tracknumber;
          self.id = song.id;
          self.title = song.title;
          self.album = song.album;
          self.artist = song.artist;
          if (song.art) {
            // Show img tag only if album art exists
            document.getElementById("albumArtRow").style.display = "";
            self.existingAlbumArt = song.art;
          }
          
          // Make labels active so they don't cover the text.
          if (song.tracknumber != "") {
            document.getElementById("tracknumber").classList.add('valid');
            document.getElementById("tracknumber-label").classList.add('active');
          }
          if (song.title != "") {
            document.getElementById("title").classList.add('valid');
            document.getElementById("title-label").classList.add('active');
          }
          if (song.album != "") {
            document.getElementById("album").classList.add('valid');
            document.getElementById("album-label").classList.add('active');
          }
          if (song.artist != "") {
            document.getElementById("artist").classList.add('valid');
            document.getElementById("artist-label").classList.add('active');
          }
        });
      });
    },
    methods: {
      saveClicked: function() {
        // Save file along with details
        page.editSong(Router.currentParams["genre"], Router.currentParams["songID"], this.tracknumber,
        this.title, this.album, this.artist, this.existingAlbumArt, function() {
          // Head back to uploads page
          Router.navigate('uploads');
        });
      },
      cancelClicked: function() {
        // Go back to the uploads page if they hit cancel
        Router.navigate('uploads');
      },
      deleteImage: function() {
        // Delete the image from the filesystem
        page.deleteImage(Router.currentParams["genre"], this.existingAlbumArt);
        
        // Hide the image view
        document.getElementById("albumArtRow").style.display = "none";
        this.existingAlbumArt = null;
      },
      uploadAlbumArt: function() {
        // Run when Upload Art button is clicked
        // Open file upload window
        var fileUploadButton = document.getElementById('artUpload');
        fileUploadButton.click();
        
        // Listen for when a file has been uploaded
        var self = this;
        fileUploadButton.addEventListener('change', function() {
          // Prevent this method from running twice on a single file upload
          if(self.uploadingFile) {
            return;
          }
          self.uploadingFile = true;
          
          // Return if no files were uploaded
          if (!this.files || !this.files[0]) {
            this.uploadingFile = false;
            return;
          }
          
          // Get selected user file
          var file = this.files[0];
          
          // Check if the file is one of approved filetype
          if (!file || typeof file !== "object" || !file.type.match("(image)\/.*(jpeg|png)")) {
            page.cmd("wrapperNotification", ["error", "File type " + file.type + " does not match jpeg/jpg/png."]);
            return;
          }
          
          console.log("Uploading " + file.name);
          console.log(file);
          
          // "Upload" the file to the user's 'artwork' folder
          
          // Create an object to read the file's data
          let reader = new FileReader();
          
          // Set what happens once file reading is complete
          reader.onload = function(event) {
            var filedata = btoa(event.target.result);
            var genreAddress = Router.currentParams["genre"];
            
            // Copy and set image as optional file
            page.uploadImage(file, filedata, genreAddress)
            .then((uploadURL) => {
              console.log("[URL]", uploadURL)
              // Display it on the page
              document.getElementById("albumArtRow").style.display = "";
              
              // Attach to song later
              self.existingAlbumArt = uploadURL;
              
              // Allow uploading further files
              self.uploadingFile = false;
            });
          }
          
          // Read the file's data
          reader.readAsBinaryString(file);
        });
      }
    }
  }
</script>