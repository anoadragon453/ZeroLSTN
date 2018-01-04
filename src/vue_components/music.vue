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
                
            </div>
            <div id="albums" class="col s12">Test 2</div>
            <div id="songs" class="col s12">Test 3</div>
            <div id="genres" class="col s12">Test 4</div>
            <div id="playlists" class="col s12">Test 5</div>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");

    module.exports = {
        props: [],
        name: "Music",
        mounted: function() {
            // Initialize tabs
            var tabs = document.querySelector("ul.tabs");
            var instance = new M.Tabs(tabs, {});
        },
        data: () => {
            return {
                tabs: [
                    { name: "Artists", icon: "people", active: false, show: "artists" },
                    { name: "Albums", icon: "album", active: false, show: "albums" },
                    { name: "Songs", icon: "music_note", active: true, show: "songs" },
                    { name: "Genres", icon: "library_music", active: false, show: "genres" },
                    { name: "Playlists", icon: "playlist_play", active: false, show: "playlists" }
                ]
            }
        },
        methods: {
        }
    }
</script>