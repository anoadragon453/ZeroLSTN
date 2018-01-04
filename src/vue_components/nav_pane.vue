<template>
    <div id="NavPane">
        <div class="collection">
            <a href="#!" v-for="area in navs" class="collection-item" 
                :class="{ active:area.active }" @click.prevent="navPaneClick(area)">
                <label class="label-icon" :for="area.icon">
                    <i class="material-icons">{{ area.icon }}</i>
                </label>
                {{ area.name }}
            </a>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");

    module.exports = {
        props: [],
        name: "NavPane",
        mounted: function() {
            console.log("Hello world!");
        },
        data: () => {
            return {
                navs: [
                    { name: "Artists", icon: "people", active: false, show: "artists" },
                    { name: "Albums", icon: "album", active: false, show: "albums" },
                    { name: "Songs", icon: "music_note", active: true, show: "songs" },
                    { name: "Genres", icon: "library_music", active: false, show: "genres" },
                    { name: "Playlists", icon: "playlist_play", active: false, show: "playlists" }
                ]
            }
        },
        methods: {
            navPaneClick: function(area) {
                // Unhighlight all navigation items
                this.navs.forEach(el => {
                    el.active = false;
                });
                
                // Highlight our selected one
                area.active = true;

                console.log("Clicked " + area.name);
            }
        }
    }
</script>