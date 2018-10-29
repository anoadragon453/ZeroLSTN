<template>
  <div id="Music">
    <!-- Tab content -->
    <div class="row">
      <div class="col s12">
        <ul class="tabs tabs-fixed-width z-depth-1">
          <li class="tab"><a href="#artists">Artists</a></li>
          <li class="tab"><a href="#albums">Albums</a></li>
          <li class="tab"><a href="#years">Years</a></li>
        </ul>
      </div>
      <div id="artists" class="col s12">
        <ul v-if="artists.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Artists</h4></li>
          <a href="#" v-for="artist in artists" :key="artist.artist" class="collection-item" @click.prevent="goToArtist(artist)">
            <span v-if="artist != ''">{{artist}}</span>
            <span v-else><i>Blank</i></span>
          </a>
        </ul>
        <p v-else-if="loading" class="center">Loading content...</p>
        <p v-else class="center">No artists found. Add sites and refresh.</p>
      </div>
      <div id="albums" class="col s12">
        <ul v-if="albums.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Albums</h4></li>
          <a href="#" v-for="album in albums" :key="album.album" class="collection-item" @click.prevent="goToAlbum(album)">
            {{album.album}}
          </a>
        </ul>
        <p v-else-if="loading" class="center">Loading content...</p>
        <p v-else class="center">No albums found. Add sites and refresh.</p>
      </div>
      <div id="years" class="col s12">
        <ul v-if="decades.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Browse by Decade</h4></li>
          <a href="#" v-for="decade in decades" :key="decade.name" class="collection-item" @click.prevent="goToDecade(decade.name)">
            {{ decade.name }}
          </a>
        </ul>
      </div>
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
import Router from '../libs/router';

export default {
  props: ['siteInfo', 'currentTab'],
  name: 'Music',
  beforeMount() {
    // TODO: Paginate

    // Get all known artists
    const self = this;
    window.page.getAllArtists(20, 0)
      .then((artists) => {
        self.artists = artists;
      });

    // Get all known albums
    window.page.getAllAlbums(20, 0)
      .then((albums) => {
        self.loading = false; // Assume it's going to take longer to load albums than artists
        self.albums = albums;
      });
  },
  mounted() {
    const self = this;

    // Initialize tabs
    const tabs = document.querySelector('ul.tabs');
    self.tabSwitcher = new M.Tabs(tabs, {
      onShow: self.switchedTab,
    });

    // If there's a tab in the URL, switch to that
    window.page.bus.$on('currentTab', (currentTab) => {
      self.tabSwitcher.select(currentTab);
    });

    // Get decades
    window.page.getDecades().then((decades) => {
      self.decades = decades;
    });
    console.log('decades:', self.decades);
  },
  data: () => ({
    tabSwitcher: null,
    tabs: ['artists', 'albums', 'years'],
    artists: [],
    albums: [],
    decades: [],
    loading: true,
  }),
  methods: {
    switchedTab() {
      const currentTab = this.tabs[this.tabSwitcher.index];
      Router.navigate(`/tab/${currentTab}`);
    },
    goToArtist(artist) {
      // Go to the specified artist page
      if (artist === '') {
        Router.navigate(`/artist/Blank${artist}`);
        return;
      }
      Router.navigate(`/artist/${artist}`);
    },
    goToAlbum(album) {
      // Go to the specified album page
      if (album.compilation) {
        Router.navigate(`${'/compilation' + '/'}${album.album !== '' ? album.album : 'Blank'}`);
      } else {
        Router.navigate(`/album/${album.artist !== '' ? album.artist : 'Blank'}/${album.album !== '' ? album.album : 'Blank'}`);
      }
    },
    goToDecade(decade) {
      // Search by chosen decade
      Router.navigate(`/search/year:${encodeURIComponent(decade)}`);
    },
  },
};
</script>
