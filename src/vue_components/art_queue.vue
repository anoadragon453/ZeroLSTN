<template>
    <div id="ArtQueue">
        Queue/Art
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    var M = require("materialize-css");
    // Use Materialize's Material Box for Album art, allows zooming
    module.exports = {
        props: [],
        name: "ArtQueue",
        mounted: function() {
            console.log("Hello world!");
        }
    }
</script>