<<template>
  <div class="container" id="edit">
    <form class="col s12">
      <div class="row">
        <div class="input-field col s12">
          <input id="title" type="text" class="validate">
          <label id="title-label" for="title">Title</label>
        </div>
      </div>
      <div class="row">
        <div class="input-field col s6">
          <input id="album" type="text" class="validate">
          <label id="album-label" for="album">Album</label>
        </div>
        <div class="input-field col s6">
          <input id="artist" type="text" class="validate">
          <label id="artist-label" for="artist">Artist</label>
        </div>
      </div>
      <div class="row">
        <!-- Image Upload -->
        <div class="col s6">
          <div class="file-field input-field">
            <div class="btn waves-effect waves-light">
              <i class="material-icons left">image</i>
              <span>Upload Image</span>
              <input type="file">
            </div>
          </div>
        </div>

        <!-- TODO: Ability to switch genre? -->
      </div>
      <div class="row">
        <div class="col s12">
          <!-- Save Button -->
          <a @click="saveClicked()" class="right waves-effect waves-light btn">Save</a>

          <!-- Cancel Button -->
          <a @click="cancelClicked()" class="right btn-flat">Cancel</a>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  module.exports = {
    props: ["mergerZites"],
    name: "edit",
    data: () => {
      return {
        id: "",
        title: "",
        artist: "",
        album: ""
      }
    },
    mounted: function() {
      // Get file information
      console.log("Running?");

      page.cmdp("siteInfo", {})
			.then(siteInfo => {
        page.retrieveSongInfo(Router.currentParams["genre"], Router.currentParams["songID"], siteInfo.auth_address, function(song) {
          if(!song) {
            return page.cmdp("wrapperNotification", ["error", "Unable to retreive song information."]);
          }

          this.id = song.id;
          this.title = song.title;
          this.album = song.album;
          this.artist = song.artist;

          // Set data fields (sing v-model isn't working for some reason)
          // Make titles active so they don't cover the text.
          if (song.title != "") {
            document.getElementById("title").value = song.title;
            document.getElementById("title").classList.add('valid');
            document.getElementById("title-label").classList.add('active');
          }
          if (song.album != "") {
            document.getElementById("album").value = song.album;
            document.getElementById("album").classList.add('valid');
            document.getElementById("album-label").classList.add('active');
          }
          if (song.artist != "") {
            document.getElementById("artist").value = song.artist;
            document.getElementById("artist").classList.add('valid');
            document.getElementById("artist-label").classList.add('active');
          }
        });
      });
    },
    methods: {
      saveClicked: function() {
        // Save file along with details
        page.editSong(Router.currentParams["genre"], Router.currentParams["songID"], this.title, this.album, this.artist, function() {
          // Head back to uploads page
          Router.navigate('uploads');
        });
      },
      imageClicked: function() {
        console.log("Upload image!");

        // TODO: Grab image, convert to b64, store intelligently in db with reference.
        // Store reference with user file
        // Somehow deduplicate if already exists? Hash?
      },
      cancelClicked: function() {
        // Go back to the uploads back if they hit cancel
        Router.navigate('uploads');
      }
    }
  }
</script>