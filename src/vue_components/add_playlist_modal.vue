<template>
  <div id="addplaylistmodal" class="row center card">
    <!-- Modal Structure -->
    <div id="playlistmodal" class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Add to Playlist</h4>
        </div>
        <div class="row">
          <!-- Close on selecting playlist -->
          <ul class="collection with-header">
            <a href="#" class="collection-item" @click.prevent="addToPlayQueue()"><b><i>Current Queue</i></b></a>
            <a href="#" v-for="playlist in playlists" :key="playlist.id" class="collection-item" @click.prevent="addToPlaylist(playlist.id)">
              <span v-if="playlist !== ''"><b>{{ playlist.name }}</b></span>
              <span v-else><b><i>Untitled</i></b></span>
            </a>
            <a href="#" class="collection-item" @click.prevent="goToPlaylists()"><i>New Playlist</i></a>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Router from '../libs/router';

export default {
  name: 'addplaylistmodal',
  data: () => ({
    addToPlaylistModal: null,
    playlists: [],
    playlist_songs: [],
  }),
  mounted() {
    const self = this;

    // Initialize modal view
    const modal = document.getElementById('playlistmodal');
    const instance_modal = new M.Modal(modal, {
      onCloseEnd() {
        // Fix scrolling after modal closes
        // https://github.com/Dogfalo/materialize/issues/4622
        document.querySelector('body').style.overflow = 'visible';
      },
    });
    this.addToPlaylistModal = modal;

    // Get playlists of the current user
    window.page.cmdp('siteInfo', {})
      .then((siteInfo) => {
        window.page.getPlaylistsByUser(siteInfo.auth_address).then((playlists) => {
          console.log('[user playlists]', playlists);
          self.playlists = playlists;
        });
      });

    // Pop up modal when someone calls addToPlaylist
    window.page.bus.$on('addToPlaylist', (songs) => {
      // Show the modal
      self.addToPlaylistModal.M_Modal.open();

      // Save desired songs
      console.log('Adding to playlist:', songs);
      self.playlist_songs = songs;
    });

    window.page.bus.$on('addToPlaylistArtist', (artist) => {
      // Show the modal
      self.addToPlaylistModal.M_Modal.open();
      console.log("Adding artist's worth of songs!");

      // Clear the playlist_songs array
      self.playlist_songs.length = 0;

      // Save desired from artist
      window.page.getAlbumsByArtist(artist)
        .then((albums) => {
          albums.forEach((album) => {
            window.page.getSongsInAlbumByArtist(album, artist)
              .then((songs) => {
                self.playlist_songs.push(...self.playlist_songs, ...songs);
                console.log('Adding artist with songs:', self.playlist_songs);
              });
          });
        });
    });
  },
  methods: {
    addToPlaylist(id) {
      const self = this;

      // Add selected song id(s) to chosen playlist
      window.page.addSongsToPlaylist(this.playlist_songs, id, () => {
        // Clear the playlist_songs array
        self.playlist_songs.length = 0;

        // Close the modal
        self.addToPlaylistModal.M_Modal.close();
      });
    },
    addToPlayQueue() {
      // Add songs to playQueue
      window.page.queueSongs(this.playlist_songs);

      // Close the modal
      this.addToPlaylistModal.M_Modal.close();
    },
    goToPlaylists() {
      Router.navigate('/playlists');
    },
  },
};
</script>
