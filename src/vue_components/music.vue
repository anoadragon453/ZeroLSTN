<template>
    <div id="Music">
        <!-- Genre Edit Modal -->
        <div class="modal">
            <div class="modal-content">
            <div class="row">
                <h4>Edit Genre</h4>
                <div class="row">
                    <div class="input-field col">
                        <input id="genreName" type="text" class="validate">
                        <label id="genreName-label" for="genreName">Name</label>
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

        <!-- Tab content -->
        <div class="row">
            <div class="col s12">
                <ul class="tabs tabs-fixed-width">
                    <li v-for="tab in tabs" class="tab col s3">
                        <a :href="'#' + tab.show">{{ tab.name }}</a>
                    </li>
                </ul>
                
            </div>
            <div id="artists" class="col s12">
                <ul v-if="artists.length != 0" class="collection with-header">
                    <li class="collection-header"><h4>Artists</h4></li>
                    <li v-for="artist in artists" class="collection-item">
                        <a href="#!" v-html="artist !== '' ? artist : '<i>(Blank)</i>'" @click.prevent="goToArtist(artist)"></a>
                    </li>
                </ul>
                <p v-else class="center">No artists found. Try adding some genres!</p>
            </div>
            <div id="albums" class="col s12">
                <ul v-if="albums.length != 0" class="collection with-header">
                    <li class="collection-header"><h4>Albums</h4></li>
                    <li v-for="album in albums" class="collection-item">
                        <a href="#!" v-html="album !== '' ? album : '<i>(Blank)</i>'" @click.prevent="goToAlbum(album)"></a>
                    </li>
                </ul>
                <p v-else class="center">No albums found. Try adding some genres!</p>
            </div>
            <div id="songs" class="col s12">
                <ul v-if="songs.length != 0" class="collection with-header">
                    <li class="collection-header"><h4>Songs</h4></li>
                    <songitem  v-for="song in songs" :editable="false" :song="song"></songitem>
                </ul>
                <p v-else class="center">No songs found. Try adding some genres!</p>
            </div>
            <div id="genres" class="col s12">
                <div class="row"></div>
                <div class="row">
                    <div class="col s12">
                        <a @click.prevent="createNewGenre()" class="btn waves-effect waves-light right"><i class="material-icons left">add</i>Add Genre</a>
                    </div>
                </div>
                <ul v-if="genres && genres.length != 0" class="collection with-header">
                    <li class="collection-header"><h4>Genres</h4></li>
                    <li v-for="(genre, index) in genres" class="collection-item">
                        <a @click.prevent="goToGenre(index)">{{ genre.name }}</a>
                        <a class="secondary-content">
                            <a href="#" v-if="genre.ours" @click.prevent="editGenre(genre.name, Object.keys(genres)[Object.values(genres).indexOf(genre)])"><i class="material-icons">edit</i></a>
                            <a href="#" v-if="!genre.connected" @click.prevent="addGenre(Object.keys(genres)[Object.values(genres).indexOf(genre)])"><i class="material-icons">add_circle_outline</i></a>
                            <a href="#" v-else @click.prevent="removeGenre(Object.keys(genres)[Object.values(genres).indexOf(genre)])"><i class="material-icons">clear</i></a>
                        </a>
                    </li>
                </ul>
                <p v-else class="center">No genres found. Make sure you have the <a href="/1iNdEXm7ZNDpwyHHTtsh7QMiMDyx2wUZB">index</a> downloaded!</p>
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
    var SongItem = require("../vue_components/song_item.vue");

    module.exports = {
        components: {
            songitem: SongItem
        },
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

            // Get all known songs
            page.getAllSongs(limit=20, offset=0)
                .then((songs) => {
                    self.songs = songs;
                });
        },
        mounted: function() {
            // Initialize tabs
            var tabs = document.querySelector("ul.tabs");
            var instance = new M.Tabs(tabs, {});

            // Initialize modal view
            var modal = document.querySelector(".modal");
            var instance_modal = new M.Modal(modal, {});
            this.editGenreModal = modal;

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
                    { name: "Songs", icon: "music_note", active: true, show: "songs" },
                    { name: "Genres", icon: "library_music", active: false, show: "genres" }
                    //{ name: "Playlists", icon: "playlist_add", active: false, show: "playlists" }
                ],
                artists: [],
                albums: [],
                songs: [],
                playlists: [],
                editGenreModal: null
            }
        },
        asyncComputed: { // TODO: Figure out how to update these values, or does it happen automatically?
            genres: {
                get: function() {
                    console.log("Getting genres...")
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
                            
                            // Get song count for each genre
                            for (var genreAddress in knownGenres) {
                                page.countSongsInGenre(genreAddress)
                                    .then((count) => {
                                        console.log(count);
                                        knownGenres[genreAddress].songCount = count;
                                    });
                            }
                            
                            return knownGenres;
                        });
                }
            }
        },
        methods: {
            goToArtist: function(artist) {
                // Go to the specified artist page
                if (artist === "") {
                    Router.navigate('/artist/(Blank)' + artist);
                    return;
                }
                Router.navigate('/artist/' + artist);
            },
            goToAlbum: function(album) {
                // Go to the specified album page
                if (album === "") {
                    Router.navigate('/album/(Blank)' + album);
                    return;
                }
                Router.navigate('/album/' + album);
            },
            addGenre: function(address) {
                // Add a genre by clicking the '+' on the genre page
                page.addMerger(address);
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
                console.log(Object.keys(this.genres))
                return
                // Make sure they're signed in first
                if(!page.isUserSignedIn()) {
                    // Show sign in prompt
                    page.selectUser();
                    return;
                }

                // Clone and navigate to the default genre site
                page.cmdp("siteClone", ["1GEnReVHyvRwC4BR32UnVwHX7npUmxVpiY"]);
            },
            goToGenre: function(address) {
                // Navigate to the genre's ZeroNet page. Necessary to do this due to iframes
                page.cmd("wrapperOpenWindow", ['/' + address, "_blank", ""]);
                return false;
            }
        }
    }
</script>