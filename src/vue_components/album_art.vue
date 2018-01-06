<template>
    <div id="albumart">
        <div class="row">
            <div class="col s12">
                <img class="materialboxed" width="100%" src="/1MQveQ3RPpimXX2wjW2geAGkNJ1GdXkvJ3/src/deleteme.jpg">
            </div>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    
    module.exports = {
        props: [],
        name: "albumart",
        mounted: function() {
            // Initialize Material box
            // TODO: Image grows bigger than screen for some reason
            //var box = document.querySelector(".materialboxed");
			//var instance = new M.Materialbox(box, {});
        }
    }
</script>