<template>
    <li id="songitem" class="collection-item">
        <a href="#" v-if="editable" @click.prevent="songEditClicked(song)">
            <span v-html="song.title !== '' ? song.title : '<i>(Blank)</i>'"></span><span class="hide-on-med-and-down" v-html="song.artist !== '' ? ' - ' + song.artist : ' - <i>(Blank)</i>'"></span>
        </a>
        <span v-else>
            {{ song.title !== "" ? song.title : "(Blank)" }}
        </span>
        <a class="secondary-content">
            {{ songInfo ? "Seeds: " + songInfo.peer_seed : "Seeds: ?"}}
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
        name: "songitem",
        asyncComputed: {
            songInfo: {
                get() {
                    return page.cmdp("optionalFileInfo", ["merged-ZeroLSTN/" + this.song.site + "/" + this.song.directory + "/" + this.song.filename])
                        .then((info) => {
                            if (!info) {
                                return null;
                            }
                            
                            // Sometimes there is no "peer_seed" attribute. Set it to peers attribute instead.
                            if (!info.peer_seed) {
                                info.peer_seed = info.peer;
                            }
                            return info;
                        });
                }
            },
        },
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