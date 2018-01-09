<template>
    <div id="albumpage">
        <div class="row">
            <div class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header" v-html="album !== '' ? '<h4>' + album + '</h4>' : '<h4><i>(Blank)</i></h4>'"></li>
                    <songitem  v-for="song in songs" :editable="false" :song="song"></songitem>
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
        props: ["album"],
        name: "albumpage",
        data: () => {
            return {
                songs: []
            }
        },
        mounted: function() {
            // Get all songs in the album
            var self = this;
            page.getSongsInAlbum(this.album)
                .then((songs) => {
                    self.songs = songs;
                })
        }
    }
</script>