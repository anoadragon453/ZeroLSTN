<template>
  <div id="playlists">
    <!-- Modal Structure -->
    <div class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Create Playlist</h4>
        </div>
        <div class="row">
          <div class="input-field col s12">
            <input id="name" type="text" class="active" placeholder="My Playlist">
            <label id="name-label" for="title">Playlist Name</label>
          </div>
        </div>
        <div class="row">
          <!-- Create Button -->
          <a @click="createPlaylistModalClicked()" class="right waves-effect waves-light btn">Create Playlist</a>
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="row">
          <div class="col s12">
            <ul class="collection with-header">
              <li class="collection-header">
                <popper trigger="hover" :options="{placement: 'auto'}">
                  <div class="popper">Create Playlist</div>
                  <i slot="reference" @click.prevent="createPlaylist()" class="material-icons tooltip right">add</i>
                </popper>
                <h4>Playlists</h4>
              </li>
              <a href="#" v-for="playlist in playlists" :key="playlist.id" class="collection-item" @click.prevent="goToPlaylist(playlist.id)">
                <span v-if="playlist !== ''"><b>{{ playlist.name }}</b></span>
                <span v-else><b><i>Untitled</i></b></span>
              </a>
              <li v-if="playlists.length === 0" class="collection-item">No playlists. Press '+' to add.</li>
            </ul>
          </div>
        </div>
        <div class="row"></div>
        <div class="row"></div>
        <div class="row"></div>
      </div>
    </div>
  </div>
</template>

<script>
import Router from '../libs/router';
import Popper from 'vue-popperjs';
import PlayQueue from '../vue_components/play_queue.vue';

export default {
  components: {
    playQueue: PlayQueue,
    popper: Popper,
  },
  props: ['playQueueObj', 'queueIndex', 'currentSong'],
  name: 'playlists',
  data: () => ({
    createPlaylistModal: null,
    playlists: [],
  }),
  mounted() {
    const self = this;

    // Initialize modal view
    const modal = document.querySelector('.modal');
    const instance_modal = new M.Modal(modal, {});
    this.createPlaylistModal = modal;

    // Get playlists of the current user
    window.page.cmdp('siteInfo', {})
      .then((siteInfo) => {
        window.page.getPlaylistsByUser(siteInfo.auth_address).then((playlists) => {
          console.log('[playlists]', playlists);
          self.playlists = playlists;
        });
      });
  },
  methods: {
    createPlaylist() {
      // Make sure user is signed in first
      if (!window.page.isUserSignedIn()) {
        // Show sign in prompt
        window.page.selectUser();
        return;
      }

      // Open create playlist modal
      this.createPlaylistModal.M_Modal.open();

      // Reinitialize text fields.
      // Playlist name field gets stuck otherwise
      M.updateTextFields();
    },
    createPlaylistModalClicked() {
      const self = this;

      const name = document.getElementById('name').value;
      if (name === '') {
        M.toast({ html: 'Please enter a name.' });
        return;
      }

      // Close modal
      this.createPlaylistModal.M_Modal.close();

      // Save new playlist with desired name
      window.page.createPlaylist(name, () => {
        // Reload playlists from DB
        window.page.getPlaylistsByUser().then((playlists) => {
          self.playlists = playlists;
        });
      });
    },
    goToPlaylist(playlistID) {
      Router.navigate(`/playlist/${playlistID}`);
    },
  },
};
</script>
