<template>
  <div id="playlist">
    <addtoplaylistmodal></addtoplaylistmodal>
    <linkmodal></linkmodal>
    <!-- Modal Structure -->
    <div class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Playlist Link</h4>
        </div>
        <div class="row">
          <div class="input-field col s6">
            <!-- TODO: Make a copy link modal vue component for song linking and whatever else -->
            <input placeholder="Placeholder" id="playlist_link" :value="playlistLink" type="text" class="validate" readonly>
            <label for="playlist_link" class="active">Link to Playlist</label>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="row"></div>
        <a @click.prevent="goBack()" class="waves-effect waves-light btn">Back</a>
        <div class="row">
          <div class="col s12">
            <ul class="collection with-header">
              <li class="collection-header">
                <popper trigger="hover" :options="{placement: 'auto'}">
                  <div class="popper">Delete Playlist</div>
                  <i slot="reference" @click.prevent="deletePlaylist()" class="material-icons tooltip right">delete</i>
                </popper>
                <popper trigger="hover" :options="{placement: 'auto'}">
                  <div class="popper">Get Link</div>
                  <i slot="reference" @click.prevent="getLinkToPlaylist()" class="material-icons tooltip right">link</i>
                </popper>
                <span v-if="songs.length > 0">
                  <popper trigger="hover" :options="{placement: 'auto'}">
                    <div class="popper">Download Playlist</div>
                    <i slot="reference" @click.prevent="downloadPlaylist()" class="material-icons tooltip right">cloud_download</i>
                  </popper>
                  <popper trigger="hover" :options="{placement: 'auto'}">
                    <div class="popper">Queue Playlist</div>
                    <i slot="reference" @click.prevent="queuePlaylist()" class="material-icons tooltip right">playlist_add</i>
                  </popper>
                  <popper trigger="hover" :options="{placement: 'auto'}">
                    <div class="popper">Play Playlist</div>
                    <i slot="reference" @click.prevent="playPlaylist()" class="material-icons tooltip right">play_arrow</i>
                  </popper>
                </span>
                <h4 v-if="playlist">{{ playlist.name }}</h4>
                <!-- TODO: Go to user profile -->
                <!--Created by <a @click.prevent="(artist)">{{ artist }}</a>-->
              </li>
              <songitem v-for="song in songs" :key="song.id" :editable="false" :deletable="true" :song="song" :current-song="currentSong" :audio-playing="audioPlaying"></songitem>
              <li v-if="songs.length === 0" class="collection-item">No songs here yet. Add some with the queue icon <i class="material-icons">playlist_add</i> as you browse.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
import Router from '../libs/router';
import Popper from 'vue-popperjs';
import SongItem from '../vue_components/song_item.vue';
import PlayQueue from '../vue_components/play_queue.vue';
import LinkModal from '../vue_components/link_modal.vue';
import AddToPlaylistModal from '../vue_components/add_playlist_modal.vue';

export default {
  components: {
    songitem: SongItem,
    playQueue: PlayQueue,
    popper: Popper,
    addtoplaylistmodal: AddToPlaylistModal,
    linkmodal: LinkModal,
  },
  props: ['playQueueObj', 'queueIndex', 'currentSong', 'audioPlaying'],
  name: 'playlist',
  data: () => ({
    playlist: null,
    songs: [],
    playlistLink: '',
  }),
  mounted() {
    const self = this;

    // Get playlist information from playlistID in URL
    window.page.getPlaylistByID(decodeURI(Router.currentParams.playlistID)).then((playlist) => {
      // Playlist is a javascript object with some playlist metadata
      console.log('[playlist]', playlist);
      self.playlist = playlist;
    });

    // Save link to current playlist to display later
    self.playlistLink = `http://127.0.0.1:43110/zerolstn.bit/playlist/${Router.currentParams.playlistID}`;

    // Load songs of this playlist
    this.loadSongs();
  },
  methods: {
    goBack() {
      // Go back to playlists
      Router.navigate('/playlists');
    },
    loadSongs() {
      const self = this;

      // Load songs of this playlist
      window.page.getPlaylistSongsByID(decodeURI(Router.currentParams.playlistID)).then((songs) => {
        // Playlist is a javascript object filled with songs and some meta information
        console.log('[playlist songs]', songs);
        self.songs = songs;
      });
    },
    playPlaylist() {
      // Queue songs and play the first one of the album
      const queueLength = window.page.getQueueLength();
      const queueIndex = window.page.getQueueIndex();

      window.page.queueSongs(this.songs);

      // Figure out where in the play queue to jump to
      if (queueLength === 0) {
        window.page.playSongAtQueueIndex(queueIndex);
      } else {
        window.page.playSongAtQueueIndex(queueLength);
      }
    },
    queuePlaylist() {
      // Queue songs
      window.page.bus.$emit('addToPlaylist', this.songs);
    },
    downloadPlaylist() {
      // this.downloadAlbumBySongOffset(this.songs, 0);
    },
    deletePlaylist() {
      const self = this;

      // Delete a user's playlist
      window.page.deletePlaylistByID(this.playlist.id, () => {
        // Show a toast message
        M.toast({ html: `Playlist ${self.playlist.name} deleted.` });

        // Go back to playlists page
        Router.navigate('/playlists');
      });
    },
    removeSong(song) {
      const self = this;

      window.page.removeSongFromPlaylist(song, this.playlist.id, () => {
        // Reload songs
        self.loadSongs();
      });
    },
    getLinkToPlaylist() {
      // Open playlist URL copy modal
      window.page.bus.$emit('copyLink', `http://127.0.0.1:43110/zerolstn.bit/?/playlist/${this.playlist.id}`);
    },
  },
};
</script>
