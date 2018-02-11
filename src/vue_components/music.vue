<template>
  <div id="Music">
    <!-- Genre Edit Modal -->
    <div id="edit-modal" class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Edit Genre</h4>
          <div class="row">
            <div class="input-field col">
              <input id="genreName" type="text" class="validate">
              <label for="genreName" class="active">Name</label>
            </div>
            <input id="genreAddress" type="hidden">
          </div>
        </div>
        <div class="row">
          <div class="col s6">
            <!-- Delete button -->
            <a id="deleteButton" @click="deleteGenreConfirm()" class="waves-effect waves-light btn red"><i class="material-icons left">delete</i>Delete</a>
          </div>
          <div class="col s6">
            <!-- Save button -->
            <a id="saveButton" @click="saveGenreModal()" class="right waves-effect waves-light btn">Save</a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Genre Add Modal -->
    <div id="add-modal" class="modal">
      <div class="modal-content">
        <div class="row">
          <h4 id="addGenreTitle">Add Genre</h4>
          <p>Click <b>Download</b> below to be taken to the new genre page. When you add a genre you will get access to all songs available under it.</p>
          <p>Songs will only be available if the genre page downloads successfully. Once the page loads, you can close the tab and refresh this page to see new content.</p>
          <div class="row">
            <input id="genreAddress" type="hidden">
          </div>
        </div>
        <div class="row">
          <div class="col s12">
            <!-- Save button -->
            <a id="addGenreButton" @click="goToModalGenre()" class="right waves-effect waves-light btn"><i class="material-icons left">add</i>Download Genre</a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tab content -->
    <div class="row">
      <div class="col s12">
        <ul class="tabs tabs-fixed-width z-depth-1">
          <li v-for="tab in tabs" class="tab col s3">
            <a :href="'#' + tab.show">{{ tab.name }}</a>
          </li>
        </ul>
        
      </div>
      <div id="artists" class="col s12">
        <ul v-if="artists.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Artists</h4></li>
          <li v-for="artist in artists" class="collection-item">
            <a href="#!" v-html="artist !== '' ? artist : '<i>Blank</i>'" @click.prevent="goToArtist(artist)"></a>
          </li>
        </ul>
        <p v-else class="center">No artists found. Try adding some genres!</p>
      </div>
      <div id="albums" class="col s12">
        <ul v-if="albums.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Albums</h4></li>
          <li v-for="album in albums" class="collection-item">
            <a href="#!" v-html="album.album !== '' ? album.album : '<i>Blank</i>'" @click.prevent="goToAlbum(album)"></a>
          </li>
        </ul>
        <p v-else class="center">No albums found. Try adding some genres!</p>
      </div>
      <div id="genres" class="col s12">
        <div class="row"></div>
        <div class="row">
          <div class="col s12">
            <a @click.prevent="createNewGenre()" class="btn waves-effect waves-light right"><i class="material-icons left">add</i>Create Genre</a>
          </div>
        </div>
        <ul v-if="recommendedGenres" class="collection with-header">
          <li class="collection-header"><h4>Recommended Genres</h4></li>
          <li v-for="(genre, address) in recommendedGenres" class="collection-item">
            {{ genre.name }}
            <a class="secondary-content">
              <!--<a href="#" v-if="genre.ours" @click.prevent="editGenre(genre.name, address)"><i class="material-icons">edit</i></a>-->
              <!-- TODO: Uncomment when we can delete <a href="#" v-if="genre.connected" @click.prevent="removeGenre(address)"><i class="material-icons">clear</i></a> -->
              <a href="#" v-if="!genre.connected" @click.prevent="addGenre(genre.name, address)"><i class="material-icons">add_circle_outline</i></a>
            </a>
          </li>
        </ul>
        <ul v-if="genres && genres.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Community Genres</h4></li>
          <li v-for="(genre, address) in genres" class="collection-item">
            {{ genre.name }}
            <a class="secondary-content">
              <a href="#" v-if="genre.ours" @click.prevent="editGenre(genre.name, address)"><i class="material-icons">edit</i></a>
              <!-- TODO: Uncomment when we can delete <a href="#" v-if="genre.connected" @click.prevent="removeGenre(address)"><i class="material-icons">clear</i></a> -->
              <a href="#" v-if="!genre.connected" @click.prevent="addGenre(genre.name, address)"><i class="material-icons">add_circle_outline</i></a>
            </a>
          </li>
        </ul>
      </div>
      <!--
        <div id="playlists" class="col s12">
          <ul class="collapsible" data-collapsible="expandable">
            <li>
              <div class="collapsible-header"><i class="material-icons">playlist_play</i>Best Songs 2017</div>
              <div class="collapsible-body">
                <div class="row">
                  <div class="col s12">
                    <ul class="collection with-header">
                      <li class="collection-header"><h4>Best Songs 2017</h4></li>
                      <li class="collection-item">Strawberry Swing</li>
                      <li class="collection-item">Past Winters</li>
                      <li class="collection-item">Snowcone</li>
                      <li class="collection-item">Here We Play</li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div class="collapsible-header"><i class="material-icons">playlist_play</i>Second</div>
              <div class="collapsible-body"><span>Lorem ipsum dolor sit amet.</span></div>
            </li>
            <li>
              <div class="collapsible-header"><i class="material-icons">playlist_play</i>Third</div>
              <div class="collapsible-body"><span>Lorem ipsum dolor sit amet.</span></div>
            </li>
          </ul>
        </div>
      -->
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  
  module.exports = {
    props: ["siteInfo"],
    name: "Music",
    beforeMount: function() {
      // TODO: Paginate
      
      // Get all known artists
      var self = this;
      page.getAllArtists(limit=20, offset=0)
      .then((artists) => {
        self.artists = artists;
      });
      
      // Get all known albums
      page.getAllAlbums(limit=20, offset=0)
      .then((albums) => {
        self.albums = albums;
      });
    },
    mounted: function() {
      // Initialize tabs
      var tabs = document.querySelector("ul.tabs");
      var instance = new M.Tabs(tabs, {});
      
      // Initialize edit modal
      var editModal = document.getElementById("edit-modal");
      var instanceEditModal = new M.Modal(editModal, {});
      this.editGenreModal = editModal;
      
      // Initialize add modal
      var addModal = document.getElementById("add-modal");
      var instanceAddModal = new M.Modal(addModal, {});
      this.addGenreModal = addModal;
      
      // Initialize collapsible
      // TODO: Uncomment when playlists are live again
      //var collap = document.querySelector("ul.collapsible");
      //var collapInstance = new M.Collapsible(collap, {});
      
      // Catch genre index updates
			//this.$parent.$parent.$on("genreIndexUpdate", this.getGenres);
    },
    data: () => {
      return {
        tabs: [
        { name: "Artists", icon: "people", active: false, show: "artists" },
        { name: "Albums", icon: "album", active: false, show: "albums" },
        { name: "Genres", icon: "library_music", active: false, show: "genres" }
        //{ name: "Playlists", icon: "playlist_add", active: false, show: "playlists" }
        ],
        artists: [],
        albums: [],
        playlists: [],
        editGenreModal: null,
        addGenreModal: null
      }
    },
    asyncComputed: {
      genres: {
        get: function() {
          console.log("Getting genres...")
          if (!this.recommendedGenres) {
            return;
          }
          
          // Get genres/mergers listed in the index
          var self = this;
          let knownGenres, ourGenres;
          return page.getGenresFromIndex()
          .then((indexedGenres) => {
            knownGenres = indexedGenres;
            
            // Get our auth address
            return page.cmdp("siteInfo", {});
          }).then((siteInfo) => {
            // See which genres we can edit
            return page.getUserGenresFromIndex(siteInfo.auth_address);
          }).then((genres) => {
            ourGenres = genres;
            
            // Get genres we've already added
            return page.getConnectedGenres();
          }).then((connectedGenres) => {
            for (var genreAddress in connectedGenres) {
              // Ignore index and default genre sites
              if (genreAddress === "1GenreVSsWvgZNnVvgf5nSFzxwNw6nECvR" ||
              genreAddress === "1iNdEXm7ZNDpwyHHTtsh7QMiMDyx2wUZB") {
                continue;
              }
              
              // Check if we've already seen this genre in the index. If so, set its
              // "connected" attribute
              if (genreAddress in knownGenres) {
                knownGenres[genreAddress].connected = true;
                
                // If this is our genre, allow us to edit it by setting the 
                // "our" attribute
                if (genreAddress in ourGenres) {
                  knownGenres[genreAddress].ours = true;
                }
              } else {
                // Add this non-indexed genre to the list
                knownGenres[genreAddress] = connectedGenres[genreAddress]
              }
            }
            
            // Iterate through all known genres
            for (var genreAddress in knownGenres) {
              // Remove recommended genres from this list
              if (genreAddress in this.recommendedGenres) {
                delete knownGenres[genreAddress];
                continue;
              }
              
              // Get song count
              page.countSongsInGenre(genreAddress)
              .then((count) => {
                console.log(count);
                knownGenres[genreAddress].songCount = count;
              });
            }
            
            return knownGenres;
          });
        }
      },
      recommendedGenres: {
        get() {
          // Pull the recommended genres from a local file
          return page.cmdp("fileGet", { inner_path: "./recommended.json" })
          .then((recommendedGenres) => {
            // If the file doesn't exist, we won't show the listing
            if (recommendedGenres) {
              recommendedGenres = JSON.parse(recommendedGenres);
            }
            
            // Check if we're already connected
            // Get genres we've already added
            return page.getConnectedGenres()
            .then((connectedGenres) => {
              for (var genreAddress in recommendedGenres) {
                Object.keys(connectedGenres).forEach((address) => {
                  if (genreAddress === address) {
                    recommendedGenres[genreAddress].connected = true;
                  }
                });
              }
              
              return recommendedGenres;
            });
          });
        }
      }
    },
    methods: {
      goToArtist: function(artist) {
        // Go to the specified artist page
        if (artist === '') {
          Router.navigate('/artist/Blank' + artist);
          return;
        }
        Router.navigate('/artist/' + artist);
      },
      goToAlbum: function(album) {
        // Go to the specified album page
        Router.navigate('/album/' + (album.artist !== '' ? album.artist : 'Blank') + '/' + (album.album !== '' ? album.album : 'Blank'));
      },
      addGenre: function(name, address) {
        // Add a genre by clicking the '+' on the genre page
        // Store genre address and name in modal for later reference
        document.getElementById("addGenreTitle").innerHTML = "Add " + name;
        document.getElementById("genreName").value = name;
        document.getElementById("genreAddress").value = address;
        
        // Show genre edit modal
        this.addGenreModal.M_Modal.open();
      },
      editGenre: function(name, address) {
        // Store genre address and name in modal for later reference
        document.getElementById("genreName").value = name;
        document.getElementById("genreAddress").value = address;
        
        // Show genre edit modal
        this.editGenreModal.M_Modal.open();
      },
      removeGenre: function(address) {
        // Remove a genre from your local merger zites
        page.removeMerger(address);
      },
      deleteGenreConfirm: function() {
        // Confirm with an alert making sure they want to delete the genre
        var self = this;
        page.cmdp("wrapperConfirm", ["Are you sure? This will not delete any songs, just the genre listing on ZeroLSTN.", "Yes"])
        .then((clicked) => {
          if (clicked) {
            self.deleteGenre();
          }
        });
      },
      deleteGenre: function() {
        // TODO: Re-enable when this works again
        // Delete a genre from the index
        var address = document.getElementById("genreAddress").value;
        var self = this;
        console.log("I'm removing: " + address);
        page.removeGenre(address)
        .then((res) => {
          // If successful, close the modal
          self.editGenreModal.M_Modal.close();
          page.cmd("wrapperNotification", ["done", "Genre removed from index. Reload to see changes."]);
        })
      },
      saveGenreModal: function() {
        // Saves genre details
        var nameField = document.getElementById("genreName");
        var address = document.getElementById("genreAddress").value;
        var name = nameField.value;
        
        // Make sure fields are active
        nameField.className += "active";
        
        // Edit the genre
        var self = this;
        page.editGenre(name, address)
        .then((res) => {
          // If successful, close the modal
          self.editGenreModal.M_Modal.close();
        });
      },
      createNewGenre: function() {
        // Make sure they're signed in first
        if(!page.isUserSignedIn()) {
          // Show sign in prompt
          page.selectUser();
          return;
        }
        
        // Clone and navigate to the default genre site
        page.cmdp("siteClone", ["1GEnReVHyvRwC4BR32UnVwHX7npUmxVpiY"]);
      },
      goToModalGenre: function() {
        // Navigate to the genre's ZeroNet page. Necessary to do this due to iframes
        var address = document.getElementById("genreAddress").value;
        page.cmd("wrapperOpenWindow", ['/' + address, "_blank", ""]);
        
        // Hide genre add modal
        this.addGenreModal.M_Modal.close();
      }
    }
  }
</script>