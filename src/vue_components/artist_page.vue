<template>
    <div id="artistpage">
        <div class="row">
            <div class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header">
                        <i v-if="downloaded" @click.prevent="removeAlbum()" class="material-icons right">cloud_done</i>
                        <i v-else @click.prevent="downloadArtist()" class="material-icons right">cloud_download</i>
                        <i @click.prevent="queueArtist()" class="material-icons right">playlist_add</i>
                        <h4 v-if="artist !== ''">{{ artist }}</h4>
                        <h4 v-else><i>(Blank)</i></h4>
                        <p>Artist</p>
                    </li>
                </ul>
                <ul class="collapsible popout" data-collapsible="accordion">
                    <li v-for="(album, index) in albums">
                        <div class="collapsible-header">
                            <span v-if="album !== ''"><b>{{ album }}</b></span>
                            <span v-else><b><i>(Blank)</i></b></span>
                        </div>
                        <div class="collapsible-body">
                            <albumPage :album="album" :artist="artist" :embedded="true"></albumPage>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    var SongItem = require("../vue_components/song_item.vue");
    var AlbumPage = require("../vue_components/album_page.vue");

    module.exports = {
        components: {
            songitem: SongItem,
            albumPage: AlbumPage
        },
        props: ["artist"],
        name: "artistpage",
        mounted: function() {
            // Initialize all collapsibles
            var collap = document.querySelector(".collapsible");
            var instance = new M.Collapsible(collap, {});
        },
        data: () => {
            return {
                downloaded: true
            }
        },
        asyncComputed: {
            albums: {
                get() {
                    // Get all albums by this artist
                    var self = this;
                    return page.getAlbumsByArtist(this.artist);
                }
            },
            songs: {
                get() {
                    // Check if all songs on all albums of this artist are downloaded
                    var self = this;
                    return page.getAlbumsByArtist(this.artist)
                    .then((albums) => {
                        var songs = [];
                        albums.forEach((album) => {
                            page.getSongsInAlbum(album, self.artist)
                                .then((albumSongs) => {
                                    songs.concat(albumSongs);
                                });
                        });
                        return songs;
                    });
                }
            }
        },
        methods: {
            goto: function(to) {
                // Go to specified page
                Router.navigate(to);
            },
            queueArtist: function() {
                // Queue every album by this artist
                var self = this;
                page.getAlbumsByArtist(this.artist)
                    .then((albums) => {
                        var songs = [];
                        albums.forEach((album) => {
                            page.getSongsInAlbum(album, self.artist)
                                .then((songs) => {
                                    page.queueSongs(songs);
                                });
                        });
                    });
            },
            downloadArtist: function() {
                var self = this;
                page.getAlbumsByArtist(this.artist)
                    .then((albums) => {
                        var songs = [];
                        albums.forEach((album) => {
                            page.getSongsInAlbum(album, self.artist)
                                .then((songs) => {
                                    songs.forEach((song) => {
                                        var filepath = "merged-ZeroLSTN/" + song.site + "/" + song.directory + "/" + song.filename + "|all";
                                        page.cmdp("fileNeed", { inner_path: filepath, timeout: 30 });
                                    });
                                });
                        });
                    });
            },
            notDownloaded: function() {
                // Called by album's when they realize they're not completely downloaded.
                this.downloaded = false;
            }
        }
    }
</script>