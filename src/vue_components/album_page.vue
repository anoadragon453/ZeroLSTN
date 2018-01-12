<template>
    <div id="albumpage">
        <div class="row">
            <div class="col s12">
                <ul class="collection with-header">
                    <li class="collection-header">
                        <span v-if="currentlyDownloading">
                            <spinner class="right" :size="small"></spinner>
                        </span>
                        <span v-else>
                            <i v-if="downloaded" @click.prevent="removeAlbum()" class="material-icons right">cloud_done</i>
                            <i v-else @click.prevent="downloadAlbum()" class="material-icons right">cloud_download</i>
                        </span>
                        
                        <h4 v-if="album !== ''">{{ album }}</h4>
                        <h4 v-else><i>(Blank)</i></h4>
                        <p>Album</p>
                    </li>
                    <songitem  v-for="song in songs" :editable="false" :song="song"></songitem>
                </ul>
            </div>
            <div class="row"></div>
            <div class="row"></div>
            <div class="row"></div>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    var SongItem = require("../vue_components/song_item.vue");
    var SpinnerColors = require("../vue_components/spinner_colors.vue");
    module.exports = {
        components: {
            songitem: SongItem,
            spinner: SpinnerColors
        },
        props: ["album"],
        name: "albumpage",
        data: () => {
            return {
                songs: [],
                currentlyDownloading: false
            }
        },
        asyncComputed: {
            songInfo: {
                get() {
                    var self = this;
                    return page.getSongsInAlbum(this.album)
                        .then((songs) => {
                        self.songs = songs;
                        console.log(songs[0].info)
                        return true;
                    });
                }
            },
            downloaded: {
                get() {
                    // TODO: Start a timer that checks every so often for download progress on each song
                    // Show progress on page, as well as check to see if they're all done
                    if (!this.songInfo) {
                        return false;
                    }

                    return this.checkSongsFromOffset(this.songs, 0);
                }
            }
        },
        methods: {
            downloadAlbum() {
                this.currentlyDownloading = true;
                this.downloadAlbumBySongOffset(this.songs, 0);
            },
            removeAlbum() {
                page.cmdp("wrapperConfirm", ["Remove this album?", "Delete"])
                    .then((confirmed) => {
                        if (confirmed) {
                            // TODO:
                            // TODO: Add hovering make the cloud change to delete cloud
                            console.log("Deleting album...")
                        }
                    });
            },
            checkSongsFromOffset: function(songs, offset=0) {
                if (offset >= songs.length) {
                    return true;
                }

                // Keep going to the next offset
                var self = this;
                return songs[offset].info.then((info) => {
                    console.log("[info]", songs[offset].info);
                    if (!info.is_downloaded) {
                        return false;
                    } else {
                        return self.checkSongsFromOffset(songs, ++offset);
                    }
                });
            },
            downloadAlbumBySongOffset: function(songs, offset=0) {
                // Download each song in the album

                // Check to see if we're at the end of the songs array
                if (offset >= songs.length) {
                    this.currentlyDownloading = false;
                    return;
                }

                // TODO: Think this can just be simplified to a for loop...

                // Don't try to redownload a song we already have
                if (songs[offset].info && !songs[offset].info.is_downloaded) {
                    var filepath = "merged-ZeroLSTN/" + songs[offset].site + "/" + songs[offset].directory + "/" + songs[offset].filename + "|all";
                    page.cmdp("fileNeed", { inner_path: filepath, timeout: 5 });   
                }
                this.downloadAlbumBySongOffset(songs, ++offset);
            },
        }
    }
</script>