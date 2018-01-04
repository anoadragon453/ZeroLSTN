<<template>
  <div class="container" id="edit">
    <form class="col s12">
      <div class="row">
        <div class="input-field col s12">
          <input v-bind="title" id="title" type="text" class="validate">
          <label for="title">Title</label>
        </div>
      </div>
      <div class="row">
        <div class="input-field col s6">
          <input id="album" type="text" class="validate">
          <label for="album">Album</label>
        </div>
        <div class="input-field col s6">
          <input id="artist" type="text" class="validate">
          <label for="artist">Artist</label>
        </div>
      </div>
      <div class="row">
        <!-- Image Upload -->
        <div class="file-field input-field">
          <div class="btn waves-effect waves-light">
            <i class="material-icons left">image</i>
            <span>Upload Image</span>
            <input type="file">
          </div>
        </div>
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
    props: ["uploadID"],
    name: "edit",
    data: () => {
      return {
        title: "",
        artist: ""
      }
    },
    methods: {
      saveClicked: function() {
        console.log("Saved " + this.title + "!");

        // TODO: Save file along with details
        Router.navigate('uploads');
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