<template>
    <li class="collection-item avatar" :class="{ 'teal accent-4' : downloaded }">
        <i @click.prevent="songPlayClicked(song)" class="material-icons circle red">play_arrow</i>
        <span class="title">{{ song.title }}</span>
        <p>{{songInfo ? songInfo.peer_seed : '?' }} {{ songInfo && songInfo.peer_seed != 1 ? 'seeds' : 'seed' }}<br>
            Genre: {{ genre }}
        </p>
        <a href="#" class="secondary-content s2">
            <a @click.prevent="songQueueClicked(song)"><i class="material-icons black-text">playlist_add</i></a>
            <a v-if="editable" @click.prevent="deleteClicked(song)"><i class="material-icons black-text">delete</i></a>
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
            downloaded: {
                get() {
                    return this.songInfo && this.songInfo.is_downloaded;
                }
            },
            genre: {
                get() {
                    return page.getGenreNameFromAddress(this.song.site)
                        .then((name) => {
                            return name[0].name;
                        });
                }
            }
        },
        methods: {
            songEditClicked: function(song) {
                // Navigate to edit page with correct data
                Router.navigate('edit/'+song.site+"/"+song.id);
            },
            songPlayClicked: function(song) {
                // Immediately play song
                console.log(song)
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