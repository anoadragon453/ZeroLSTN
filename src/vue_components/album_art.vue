<template>
    <img id="albumart" class="materialboxed" src="./logo.png" width="100%">
</template>

<script>
    var Router = require("../libs/router.js");
    
    module.exports = {
        props: ["song"],
        name: "albumart",
        mounted: function() {
            // Initialize Material box
            // TODO: Image grows bigger than screen for some reason
            //var box = document.querySelector(".materialboxed");
            //var instance = new M.Materialbox(box, {});

            // TODO: Extract album art from song file
        }
    }
</script>