<template>
  <div id="search">
    <addtoplaylistmodal></addtoplaylistmodal>
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="col s12 center">
          <div class="card">
            <div class="card-content">
              <div class="input-field">
                <i class="material-icons prefix">search</i>
                <input placeholder="Search artists, albums, songs..." id="searchField" type="text" class="" autofocus>
              </div>
            </div>
            <div class="card-tabs">
              <ul class="tabs tabs-fixed-width">
                <li class="tab"><a href="#all" class="active">All</a></li>
                <li class="tab"><a href="#artists">Artists</a></li>
                <li class="tab"><a href="#albums">Albums</a></li>
                <li class="tab"><a href="#songs">Songs</a></li>
              </ul>
            </div>
            <div class="card-content">
              <div id="all" class="container">
                <span v-if="allSongs.length != 0">
                  <h4>Songs</h4>
                  <ul class="collection">
                    <songitem :song="song" :key="song.id" :editable="false" v-for="song in allSongs"></songitem>
                  </ul>
                </span>
                <span v-if="allArtists.length != 0">
                  <h4>Artists</h4>
                  <ul class="collection left-align">
                    <li v-for="artist in allArtists" :key="artist.artist" class="collection-item">
                      <a href="#!" v-html="artist.artist !== '' ? artist.artist : '<i>Blank</i>'" @click.prevent="goToArtist(artist.artist)"></a>
                    </li>
                  </ul>
                </span>
                <span v-if="allAlbums.length != 0">
                  <h4>Albums</h4>
                  <ul class="collection left-align">
                    <li v-for="album in allAlbums" :key="album.album" class="collection-item">
                        <a href="#!" v-html="album.album !== '' ? album.album : '<i>Blank</i>'" @click.prevent="goToAlbum(album.album, album.artist)"></a>
                    </li>
                  </ul>
                </span>
                <span v-if="lastSearch != '' && allSongs.length == 0 && allAlbums.length == 0 && allArtists.length == 0">Nothing found.</span>
              </div>
              <div id="artists" class="container">
                <span v-if="artists.length != 0">
                  <h4>Artists</h4>
                  <ul class="collection left-align">
                    <li v-for="artist in artists" :key="artist.artist" class="collection-item">
                      <a href="#!" v-html="artist.artist !== '' ? artist.artist : '<i>Blank</i>'" @click.prevent="goToArtist(artist.artist)"></a>
                    </li>
                  </ul>
                </span>
                <span v-else>
                  <span v-if="lastSearch != ''">Nothing found.</span>
                </span>
              </div>
              <div id="albums" class="container">
                <span v-if="albums.length != 0">
                  <h4>Albums</h4>
                  <ul class="collection left-align">
                    <li v-for="album in albums" :key="album.album" class="collection-item">
                        <a href="#!" v-html="album.album !== '' ? album.album : '<i>Blank</i>'" @click.prevent="goToAlbum(album.album, album.artist)"></a>
                    </li>
                  </ul>
                </span>
                <span v-else>
                  <span v-if="lastSearch != ''">Nothing found.</span>
                </span>
              </div>
              <div id="songs" class="container">
                <span v-if="songs.length != 0">
                  <h4>Songs</h4>
                  <ul class="collection">
                    <songitem :song="song" :editable="false" v-for="song in songs" :key="song.id"></songitem>
                  </ul>
                </span>
                <span v-else>
                  <span v-if="lastSearch != ''">Nothing found.</span>
                </span>
              </div>
              <div v-if="lastSearch == ''" id="searchContent">Type a search query to begin</div>
            </div>
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

// Vue components that make up the search page
import PlayQueue from '../vue_components/play_queue.vue';
import SongItem from '../vue_components/song_item.vue';
import AddToPlaylistModal from '../vue_components/add_playlist_modal.vue';

export default {
  components: {
    playQueue: PlayQueue,
    songitem: SongItem,
    addtoplaylistmodal: AddToPlaylistModal,
  },
  props: ['playQueueObj', 'queueIndex'],
  name: 'search',
  data: () => ({
    tabSwitcher: null, // The tab switcher object, useful to know current tab
    lastTab: '', // Keep track of last tab, to not search again if clicked
    lastSearch: '', // Keep track of last search term, to not search again if clicked
    allSongs: [], // Songs that appear on the All tab
    allAlbums: [], // Albums that appear on the All tab
    allArtists: [], // Artists that appear on the All tab
    songs: [], // Songs that appear on the Songs tab
    albums: [], // Albums that appear on the Albums tab
    artists: [], // Artists that appear on the Artists tab
  }),
  mounted() {
    // Initialize tabs
    var self = this;
    const tabs = document.querySelector('ul.tabs');
    this.tabSwitcher = new M.Tabs(tabs, {
      onShow: self.tabClicked,
    });

    // Focus on search input field
    document.getElementById('searchField').focus();

    // Catch when user stops typing in search field
    var self = this;
    const keystoppedDelay = 600;
    let keystoppedTimer = null;
    const keystoppedInput = document.getElementById('searchField');
    keystoppedInput.addEventListener('keydown', (event) => {
      // Reset the timer if they start typing again
      clearTimeout(keystoppedTimer);
      keystoppedTimer = setTimeout(() => {
        // Run the searchStoppedTyping when the delay has been reached
        self.searchStoppedTyping(keystoppedInput.value, event.key);
      }, keystoppedDelay);
    }, false);

    // Grab search string from URL bar if present
    if (Router.currentParams.searchText) {
      const urlSearchText = decodeURI(Router.currentParams.searchText);
      document.getElementById('searchField').value = urlSearchText;
      this.search(urlSearchText);
    }
  },
  methods: {
    searchStoppedTyping(searchText, key) {
      // Don't auto-search search if less than 3 characters
      if (key != 'Enter' && searchText.length <= 3) {
        return;
      }

      // Don't re-run a search if the user hits enter again
      if (searchText === this.lastSearch) {
        return;
      }
      this.search(searchText);
    },
    search(searchText) {
      // Don't search on empty input
      if (searchText === '') {
        return;
      }

      // Search based on current tab
      const self = this;
      switch (this.tabSwitcher.index) {
        case 0:
          // Search songs
          window.page.search(searchText, 'song').then((songs) => {
            self.allSongs = songs;
          });

          // Search albums
          window.page.search(searchText, 'album').then((albums) => {
            console.log(albums);
            self.allAlbums = albums;
          });

          // Search artists
          window.page.search(searchText, 'artist').then((artists) => {
            self.allArtists = artists;
          });
          break;
        case 1:
          // Search songs
          window.page.search(searchText, 'song').then((songs) => {
            self.songs = songs;
          });
          break;
        case 2:
          // Search albums
          window.page.search(searchText, 'album').then((albums) => {
            self.albums = albums;
          });
          break;
        case 3:
          // Search artists
          window.page.search(searchText, 'artist').then((artists) => {
            self.artists = artists;
          });
          break;
      }

      // Conduct the search
      console.log('Searching:', searchText);

      // Set the URL to contain the search
      Router.navigate(`/search/${searchText}`);

      // Keep track of last search term
      this.lastSearch = searchText;
    },
    tabClicked() {
      // Don't re-run a search if the user clicks the current tab
      if (this.lastTab === this.currentTab()) {
        return;
      }

      // Make the search
      this.search(document.getElementById('searchField').value);

      // Keep track of last tab clicked
      this.lastTab = this.currentTab();
    },
    currentTab() {
      // Get the current tab
      return document.querySelector('.tab a.active').innerHTML;
    },
    goToArtist(artist) {
      // Go to the specified artist page
      console.log('Going to artist:', artist);
      if (artist === '') {
        Router.navigate(`/artist/Blank${artist}`);
        return;
      }
      Router.navigate(`/artist/${artist}`);
    },
    goToAlbum(album, artist) {
      console.log('Going to album:', album);
      // Go to the specified album page
      Router.navigate(`/album/${artist !== '' ? artist : 'Blank'}/${album !== '' ? album : 'Blank'}`);
    },
  },
};
</script>
