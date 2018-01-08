<template>
    <div id="playqueuecomponent">
        <div class="row">
            <div id="queue" class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Play Queue</h4></li>
                    <li class="collection-item" v-if="!playQueueObj || playQueueObj.length == 0">No songs in queue.</li>
                    <!-- TODO: Add play (to skip to) and remove-from-queue buttons -->
                    <a href="#" @click.prevent="playSongAtIndex(index)" class="collection-item" v-else v-for="(song, index) in playQueueObj.toArray()">
                        <span v-if="index == queueIndex"><b>{{ song.title }}</b></span>
                        <span v-else>{{ song.title }}</span>
                    </a>
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
    module.exports = {
        props: ["playQueueObj", "queueIndex"],
        name: "playqueuecomponent",
        mounted: function() {
        },
        methods: {
            goto: function(to) {
                // Go to specified page
                Router.navigate(to);
            },
            playSongAtIndex: function(index) {
                // Skip to clicked play queue song index
                page.playSongAtQueueIndex(index);
            }
        }
    }
</script>