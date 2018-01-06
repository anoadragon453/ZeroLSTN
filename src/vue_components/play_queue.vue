<template>
    <div id="playqueuecomponent">
        <div class="row">
            <div id="queue" class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Play Queue</h4></li>
                    <li class="collection-item" v-if="!playQueue || playQueue.length == 0">No songs in queue.</li>
                    <!-- TODO: Add play (to skip to) and remove-from-queue buttons -->
                    <li class="collection-item" v-else v-for="song in playQueue.toArray()">{{ song.title }}</li>
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
    
    // TODO: Figure out Material Box zooming
    module.exports = {
        props: ["playQueue"],
        name: "playqueuecomponent",
        mounted: function() {
            if (this.playQueue) {
                console.log(this.playQueue.toArray());
            }
        },
        methods: {
            goto: function(to) {
                // Go to specified page
                Router.navigate(to);
            }
        }
    }
</script>