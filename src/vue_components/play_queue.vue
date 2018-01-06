<template>
    <div id="playqueuecomponent">
        <div class="row">
            <div id="queue" class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header"><h4>Play Queue</h4></li>
                    <li class="collection-item">Dream Drop Distance</li>
                    <li class="collection-item">Perfect Weather</li>
                    <li class="collection-item">Lost Tracks</li>
                    <li class="collection-item">Dream Drop Distance</li>
                    <li class="collection-item">Perfect Weather</li>
                    <li class="collection-item">Lost Tracks</li>
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
        props: [],
        name: "playqueuecomponent",
        mounted: function() {
            // TODO: Set up listeners for play queue changes
        }
    }
</script>