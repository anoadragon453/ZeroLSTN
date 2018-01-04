<<template>
  <div id="edit">
    <!-- Floating action button -->
    <div class="fixed-action-btn">   
         <a @click.prevent="uploadClicked()" class="btn-floating btn-large waves-effect waves-light red"><i class="material-icons">add</i></a>
    </div>

    <!-- Show uploads if there are any -->
    <div v-if="existingUploads" class="container">
      <!-- TODO: Show existing uploads -->
      <!-- <ul>
        <li v-for="upload in uploads">
          ...
        </li>
      </ul>-->
    </div>
    <div v-else>
      <div class="container center">
        No uploads. Press the Add button to get started!
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  module.exports = {
    props: [],
    name: "uploads",
    data: () => {
      return {
        existingUploads: false
      }
    },
    mounted: function() {
      var action = document.querySelector("a.btn-floating");
			var instance = new M.FloatingActionButton(action, {});
    },
    computed: {
      existingUploads: function() {
        // TODO: Query to see if user has already uploaded anything
        return false;
      }
    },
    methods: {
      uploadClicked: function() {
        console.log("Uploaded!");

        // TODO: Select file then go to file edit screen where you can set details

        Router.navigate('edit');
      }
    }
  }
</script>