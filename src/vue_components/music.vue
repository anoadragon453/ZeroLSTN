<template>
    <div id="Music">
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
                <ul v-if="genres.length != 0" class="collection with-header">
                    <li class="collection-header"><h4>Genres</h4></li>
                    <li v-for="genre in genres" class="collection-item">
                        {{ genre.name }}
                        <a class="secondary-content">
                            <a href="#" v-if="!genre.connected" @click.prevent="addGenre(genre.address)"><i class="material-icons">add</i></a>
                            <a href="#" v-if="genre.ours" @click.prevent="deleteGenre(genre.address)"><i class="material-icons">delete</i></a>
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
        props: [],
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

            // Query and display genres
            this.getGenres();
        },
        mounted: function() {
            // Initialize tabs
            var tabs = document.querySelector("ul.tabs");
            var instance = new M.Tabs(tabs, {});

            // Initialize collapsible
            // TODO: Uncomment when playlists are live again
            //var collap = document.querySelector("ul.collapsible");
            //var collapInstance = new M.Collapsible(collap, {});

            // Catch genre index updates
			this.$parent.$parent.$on("genreIndexUpdate", this.getGenres);
        },
        data: () => {
            return {
                tabs: [
                    { name: "Artists", icon: "people", active: false, show: "artists" },
                    { name: "Albums", icon: "album", active: false, show: "albums" },
                    { name: "Songs", icon: "music_note", active: true, show: "songs" },
                    { name: "Genres", icon: "library_music", active: false, show: "genres" }
                    //{ name: "Playlists", icon: "playlist_play", active: false, show: "playlists" }
                ],
                artists: [],
                albums: [],
                genres: [],
                songs: [],
                playlists: [],
                genreModal: null
            }
        },
        methods: {
            getGenres: function() {
                console.log("Getting genres...")
                // Get genres/mergers listed in the index
                var self = this;
                page.getGenresFromIndex()
                    .then((indexedGenres) => {
                        self.genres = indexedGenres;

                        // Get genres we've already added
                        page.getConnectedGenres()
                            .then((connectedGenres) => {
                                connectedGenres.forEach(genre => {
                                    // Ignore index and default genre sites
                                    if (genre.address !== "1GenreVSsWvgZNnVvgf5nSFzxwNw6nECvR" &&
                                        genre.address !== "1iNdEXm7ZNDpwyHHTtsh7QMiMDyx2wUZB") {
                                        // Check if we've already seen this genre in the index. If so, set its
                                        // "connected" attribute
                                        var wasInThere = false;
                                        for (var i = 0; i < self.genres.length; i++) {
                                            if (genre.address === self.genres[i].address) {
                                                self.genres[i].connected = true;
                                                wasInThere = true;
                                                break;
                                            } 
                                        }
                                        if (!wasInThere) {
                                            // Otherwise add it to the list
                                            genre.connected = true;
                                            self.genres.push(genre);
                                        }
                                    }
                                });
                                  
                                // TODO: Fix race conditions
                                //self.loadMyGenres();    
                            });
                    });
            },
            loadMyGenres: function() {
                // Get the genres we've personally added
                var self = this;
                page.getMyGenresFromIndex()
                .then((myGenres) => {
                    // Set all of our genres with the 'ours' attribute
                    myGenres.forEach(genre => {
                        for (var i = 0; i < self.genres.length; i++) {
                            self.genres[i].ours = false;
                            if (genre.address === self.genres[i].address) {
                                console.log("Ours " + genre.name)
                                self.genres[i].ours = true;
                                console.log(self.genres[i])
                            }
                        }
                    });
                });
            },
            goToArtist: function(artist) {
                // Tell the parent view to go to the specified artist's page
                this.$parent.goToArtistPage(artist)
            },
            goToAlbum: function(album) {
                // Tell the parent view to go to the specified album's page
                this.$parent.goToAlbumPage(album)
            },
            addGenre: function(address) {
                // Add a genre by clicking the '+' on the genre page
                console.log("Adding: " + address)
                var self = this;
                page.addMerger(address);
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
            }
        }
    }
</script>