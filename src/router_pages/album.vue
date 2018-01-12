<template>
    <div id="album">
        <div class="row">
            <div class="col s1 m1 l4 hide-on-med-and-down">
                <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
            </div>
            <div class="col s12 m12 l8">
                <div class="row"></div>
                <a @click.prevent="goto('')" class="waves-effect waves-light btn">Back</a>
                <albumPage :album="album"></albumPage>
            </div>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    var AlbumPage = require("../vue_components/album_page.vue");
    var PlayQueue = require("../vue_components/play_queue.vue");

    module.exports = {
        components: {
            albumPage: AlbumPage,
            playQueue: PlayQueue
        },
        props: ["playQueueObj", "queueIndex"],
        name: "album",
        data: () => {
            return {
                album: ""
            }
        },
        mounted: function() {
            // Get album from URL
            this.album = decodeURI(Router.currentParams["album"]);
            if (this.album === "(Blank)") { this.album = "" }; // Account for blank albums
        },
        methods: {
            goto: function(to) {
                // Go to specified page
                Router.navigate(to);
            }
        }
    }
</script>