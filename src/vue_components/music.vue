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
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Artists</h4></li>
                    <li v-for="artist in artists" class="collection-item">
                        <a href="#!" @click.prevent="goToArtist(artist)">{{ artist }}</a>
                    </li>
                </ul>
            </div>
            <div id="albums" class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Albums</h4></li>
                    <li v-for="album in albums" class="collection-item">
                        <a href="#!" @click.prevent="goToAlbum(album)">{{ album }}</a>
                    </li>
                </ul>
            </div>
            <div id="songs" class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Songs</h4></li>
                    <songitem  v-for="song in songs" :editable="false" :song="song"></songitem>
                </ul>
            </div>
            <div id="genres" class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Genres</h4></li>
                    <li class="collection-item">Drum n' Bass</li>
                    <li class="collection-item">Rock</li>
                    <li class="collection-item">Metal</li>
                    <li class="collection-item">Spacebass</li>
                    <li class="collection-item">Drum n' Bass</li>
                    <li class="collection-item">Rock</li>
                    <li class="collection-item">Metal</li>
                    <li class="collection-item">Spacebass</li>
                    <li class="collection-item">Drum n' Bass</li>
                    <li class="collection-item">Rock</li>
                    <li class="collection-item">Metal</li>
                    <li class="collection-item">Spacebass</li>
                    <li class="collection-item">Drum n' Bass</li>
                    <li class="collection-item">Rock</li>
                    <li class="collection-item">Metal</li>
                    <li class="collection-item">Last</li>
                </ul>
            </div>
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
        mounted: function() {
            // Initialize tabs
            var tabs = document.querySelector("ul.tabs");
            var instance = new M.Tabs(tabs, {});

            // Initialize collapsible
            var collap = document.querySelector("ul.collapsible");
            var collapInstance = new M.Collapsible(collap, {});

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
        data: () => {
            return {
                tabs: [
                    { name: "Artists", icon: "people", active: false, show: "artists" },
                    { name: "Albums", icon: "album", active: false, show: "albums" },
                    { name: "Songs", icon: "music_note", active: true, show: "songs" },
                    { name: "Genres", icon: "library_music", active: false, show: "genres" },
                    { name: "Playlists", icon: "playlist_play", active: false, show: "playlists" }
                ],
                artists: [],
                albums: [],
                genres: [],
                songs: [],
                playlists: []
            }
        },
        methods: {
            goToArtist: function(artist) {
                // Tell the parent view to go to the specified artist's page
                this.$parent.goToArtistPage(artist)
            },
            goToAlbum: function(album) {
                // Tell the parent view to go to the specified album's page
                this.$parent.goToAlbumPage(album)
            }
        }
    }
</script>