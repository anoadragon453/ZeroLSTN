<template>
    <div id="songdetails">
        <div class="row center card">
            <div class="card-title">
                <b>{{ currentSong ? currentSong.title : "Nothing Playing" }}</b>
            </div>
            {{ currentSong ? currentSong.album : "Nothing Playing" }}<br>
            <b>{{ currentSong ? currentSong.artist : "Nothing Playing" }}</b>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    
    module.exports = {
        props: ["currentSong"],
        name: "songdetails",
        mounted: function() {
            
        }
    }
</script>