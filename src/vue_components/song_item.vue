<template>
    <li id="songitem" class="collection-item">
        <a href="#" v-if="editable" @click.prevent="songEditClicked(song)">
            {{ song.title }}<span class="hide-on-med-and-down"> - {{ song.artist }}</span>
        </a>
        <span v-else>
            {{ song.title }}
        </span>
        <a class="secondary-content">
            <a href="#" @click.prevent="songPlayClicked(song)"><i class="material-icons">play_arrow</i></a>
            <a href="#" @click.prevent="songQueueClicked(song)"><i class="material-icons">add</i></a>
            <a href="#" v-if="editable" @click.prevent="deleteClicked(song)"><i class="material-icons">delete</i></a>
        </a>
    </li>
</template>

<script>
    var Router = require("../libs/router.js");
    
    module.exports = {
        props: ["editable", "song"],
        name: "albumart",
        methods: {
            songEditClicked: function(song) {
                // Navigate to edit page with correct data
                Router.navigate('edit/'+song.site+"/"+song.id);
            },
            songPlayClicked: function(song) {
                // Immediately play song
                page.playSongImmediately(song);
            },
            songQueueClicked: function(song) {
                // Add song to the play queue
                page.queueSong(song);
            },
            deleteClicked: function(song) {
                page.deleteSong(song);
            }
        }
    }
</script>