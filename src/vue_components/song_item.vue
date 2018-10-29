<template>
  <li class="collection-item avatar left-align">
    <i v-if="audioPlaying && currentSong && (currentSong.filename === song.filename)"
    @click.prevent="pauseSong(song)" class="material-icons circle blue darken-1">pause</i>
    <i v-else @click.prevent="playSong(song)" class="material-icons circle blue darken-1">play_arrow</i>
    <span class="title">{{ song.track_number ? song.track_number + '.' : '' }} {{ song.title }}</span>
    <p>{{songInfo ? songInfo.peer_seed : '?' }}
      <span v-if="songInfo && songInfo.peer_seed !== 1">seeds</span>
      <span v-else>seed</span>
      - <a href="" @click.prevent="goToArtist(song)">{{ song.artist }}</a>
      - <a href="" @click.prevent="goToAlbum(song)">{{ song.album }}</a>
      <br>
      {{ song.year ? song.year : "" }}
    </p>
    <a class="secondary-content s2">
      <popper trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Queue Song</div>
        <a class="tooltip" slot="reference" @click.prevent="queueSong(song)"><i class="material-icons switch-color">playlist_add</i></a>
      </popper>
      <popper trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Edit Song</div>
        <a class="tooltip" slot="reference" @click.prevent="editSong(song)"><i class="material-icons switch-color">edit</i></a>
      </popper>
      <popper v-if="!downloaded" trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Download Song</div>
        <a class="tooltip" slot="reference" @click.prevent="downloadSong(song)"><i class="material-icons switch-color">cloud_download</i></a>
      </popper>
      <popper v-else trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Remove Download</div>
        <a class="tooltip" slot="reference" @click.prevent="removeDownload(song)"><i class="material-icons switch-color">cloud_done</i></a>
      </popper>
      <popper v-if="deletable && deletable === true" trigger="hover" :options="{placement: 'auto'}">
        <div class="popper">Remove</div>
        <a class="tooltip" slot="reference" @click.prevent="removeSongParent(song)"><i class="material-icons switch-color">delete</i></a>
      </popper>
    </a>
  </li>
</template>

<script>
import Router from '../libs/router';
import Popper from 'vue-popperjs';

export default {
  components: {
    popper: Popper,
  },
  props: ['editable', 'deletable', 'song', 'currentSong', 'audioPlaying'],
  name: 'songitem',
  mounted() {
    const self = this;
    console.log('Getting info for song');
    window.page.cmdp('optionalFileInfo', [`merged-ZeroLSTN2/${this.song.path}/${this.song.filename}`])
      .then((info) => {
        if (!info) {
          return null;
        }

        // Sometimes there is no "peer_seed" attribute. Set it to peers attribute instead.
        if (!info.peer_seed) {
          info.peer_seed = info.peer;
        }

        self.songInfo = info;
        self.downloaded = info.is_downloaded;
      });
  },
  data: () => ({
    songInfo: null,
    downloaded: false,
  }),
  methods: {
    editSong(song) {
      if (!window.page.isUserSignedIn()) {
        window.page.cmd('certSelect', { accepted_domains: ['zeroid.bit'] });
        return;
      }

      // Navigate to edit page with correct data
      Router.navigate(`edit/${song.id}`);
    },
    playSong(song) {
      // Immediately play song
      window.page.playSongImmediately(song);
    },
    pauseSong(song) {
      // Pause this song
      window.page.pauseCurrentSong(song);
    },
    queueSong(song) {
      // Add song to playlist
      window.page.bus.$emit('addToPlaylist', [song]);
    },
    deleteSong(song) {
      window.page.deleteSong(song);
    },
    async removeDownload(song) {
      // Remove this song from the user's disk
      const res = await window.page.removeDownload(song);

      if (res === 'ok') {
        M.toast({ html: 'Download removed' });
        this.downloaded = false;
      } else {
        M.toast({ html: `Error: ${res}` });
      }
    },
    downloadSong(song) {
      // Show a confirmation
      M.toast({ html: 'Downloading...' });

      // Download this song to the user's disk
      const filepath = `merged-ZeroLSTN2/${song.path}/${song.filename}|all`;
      window.page.cmdp('fileNeed', { inner_path: filepath, timeout: 30 }).then((res) => {
        if (res === 'ok') {
          self.downloaded = true;
        }
      });
    },
    removeSongParent(song) {
      // Calls a method on the parent object relating to removing a song
      this.$parent.removeSong(song);
    },
    goToArtist(song) {
      const url = `/artist/${song.artist !== '' ? song.artist : 'Blank'}`;
      Router.navigate(url);
    },
    goToAlbum(song) {
      const artist = `${song.artist !== '' ? song.artist : 'Blank'}/`;
      const url = (!song.compilation ? `/album/${artist}` : '/compilation/') + (song.album !== '' ? song.album : 'Blank');
      Router.navigate(url);
    },
  },
};
</script>
