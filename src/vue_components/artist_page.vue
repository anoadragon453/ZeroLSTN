<template>
    <div id="artistpage">
        <div class="row">
            <div id="queue" class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>{{ artist }}</h4><p>Albums</p></li>
                </ul>
                <ul class="collapsible popout" data-collapsible="accordion">
                    <li v-for="album in albums">
                    <div class="collapsible-header"><b>{{ Object.keys(albums)[Object.values(albums).indexOf(album)] }}</b></div>
                    <div class="collapsible-body">
                        <div class="collection">
                            <li class="collection-item"><h4>{{ Object.keys(albums)[Object.values(albums).indexOf(album)] }}</h4></li>
                            <songitem  v-for="song in album" :editable="false" :song="song"></songitem>
                        </div>
                    </div>
                    </li>
                </ul>
            </div>
            <div class="row"></div>
            <div class="row"></div>
            <div class="row"></div>
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
        props: ["artist"],
        name: "artistpage",
        data: () => {
            return {
                albums: []
            }
        },
        mounted: function() {
            // Initialize all collapsibles
            var collap = document.querySelector(".collapsible");
            var instance = new M.Collapsible(collap, {});

            // Get all albums by this artist
            var self = this;
            page.getAlbumsWithSongsByArtist(this.artist)
                .then((albums) => {
                    // Albums are returned as an array with objects in the form of
                    // {"albumName": [song1, song2...]}
                    console.log("Got albums:")
                    console.log(albums);
                    console.log("Keys:")
                    console.log(Object.keys(albums));
                    self.albums = albums;
                });
        },
        methods: {
            goto: function(to) {
                // Go to specified page
                Router.navigate(to);
            }
        }
    }
</script>