<template>
    <div id="songdetails">
        <div class="row center card">
            <div class="card-title">
                <b v-if="currentSong && currentSong.title !== ''">{{ currentSong.title }}</b>
                <b v-if="currentSong && currentSong.title === ''"><i>Blank</i></b>
                <b v-if="!currentSong">Nothing Playing</b>
            </div>
            <span v-if="currentSong && currentSong.album !== ''">{{ currentSong.album }}</span>
            <span v-if="currentSong && currentSong.album === ''"><i>Blank</i></span>
            <span v-if="!currentSong">Nothing Playing</span>
            <br>
            <b v-if="currentSong && currentSong.artist !== ''">{{ currentSong.artist }}</b>
            <b v-if="currentSong && currentSong.artist === ''"><i>Blank</i></b>
            <b v-if="!currentSong">Nothing Playing</b>
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