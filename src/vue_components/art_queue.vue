<template>
    <div id="ArtQueue">
        <div class="row">
            <div class="col s12">
                <img class="materialboxed" width="100%" src="/1MQveQ3RPpimXX2wjW2geAGkNJ1GdXkvJ3/src/deleteme.jpg">
            </div>
            <div id="queue" class="col s12">
                <ul class="collection">
                    <li class="collection-item">Dream Drop Distance</li>
                    <li class="collection-item">Perfect Weather</li>
                    <li class="collection-item">Lost Tracks</li>
                    <li class="collection-item">Dream Drop Distance</li>
                    <li class="collection-item">Perfect Weather</li>
                    <li class="collection-item">Lost Tracks</li>
                </ul>
            </div>
            <div class="row"></div>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    
    // Use Materialize's Material Box for Album art, allows zooming
    module.exports = {
        props: [],
        name: "ArtQueue",
        mounted: function() {
            // Initialize image view
            var box = document.querySelector(".materialboxed");
            var instance = new M.Material(box, {});
        }
    }
</script>