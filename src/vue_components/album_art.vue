<template>
    <div id="albumart">
        <img v-if="currentSong && currentSong.art && currentSong.art !== ''" class="materialboxed" :src="currentSong.art" width="100%">
        <img v-else class="materialboxed" src="./logo.png" width="100%">
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    
    module.exports = {
        props: ["currentSong"],
        name: "albumart",
        mounted: function() {
            // Initialize Material box
            // TODO: Image grows bigger than screen for some reason
            //var box = document.querySelector(".materialboxed");
            //var instance = new M.Materialbox(box, {});
        }
    }
</script>