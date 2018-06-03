<template>
  <div id="Music">
    <!-- Tab content -->
    <div class="row">
      <div class="col s12">
        <ul class="tabs tabs-fixed-width z-depth-1">
          <li v-for="tab in tabs" class="tab col s3">
            <a :href="'#' + tab.name.toLowerCase()">{{ tab.name }}</a>
          </li>
        </ul>
      </div>
      <div id="artists" class="col s12">
        <ul v-if="artists.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Artists</h4></li>
          <a href="#" v-for="artist in artists" class="collection-item" @click.prevent="goToArtist(artist)">
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
          <a href="#" v-for="album in albums" class="collection-item" @click.prevent="goToAlbum(album)">
            {{album.album}}
          </a>
        </ul>
        <p v-else-if="loading" class="center">Loading content...</p>
        <p v-else class="center">No albums found. Add sites and refresh.</p>
      </div>
      <div id="years" class="col s12">
        <ul v-if="decades.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Browse by Decade</h4></li>
          <a href="#" v-for="(decade, address) in decades" class="collection-item" @click.prevent="goToDecade(decade.name)">
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
  var Router = require("../libs/router.js");

  module.exports = {
    props: ["siteInfo", "currentTab"],
    name: "Music",
    beforeMount: function() {
      // TODO: Paginate

      // Get all known artists
      var self = this;
      page.getAllArtists(limit=20, offset=0)
      .then((artists) => {
        self.artists = artists;
      });

      // Get all known albums
      page.getAllAlbums(limit=20, offset=0)
      .then((albums) => {
        self.loading = false; // Assume it's going to take longer to load albums than artists
        self.albums = albums;
      });
    },
    mounted: function() {
      var self = this;

      // Initialize tabs
      var tabs = document.querySelector("ul.tabs");
      self.tabSwitcher = new M.Tabs(tabs, {
        onShow: self.switchedTab
      });

      // If there's a tab in the URL, switch to that
      page.bus.$on("currentTab", function(currentTab) {
        self.tabSwitcher.select(currentTab.toLowerCase());
      });

      // Get decades
      page.getDecades().then((decades) => {
        self.decades = decades;
      });
      console.log('decades:', self.decades)
    },
    data: () => {
      return {
        tabSwitcher: null,
        tabs: [
          { name: "Artists", icon: "people", active: false },
          { name: "Albums", icon: "album", active: false },
          { name: "Years", icon: "library_music", active: false }
        ],
        artists: [],
        albums: [],
        decades: [],
        loading: true
      }
    },
    methods: {
      switchedTab: function() {
        var currentTab = this.tabs[this.tabSwitcher.index].name;
        Router.navigate('/tab/' + currentTab);
      },
      goToArtist: function(artist) {
        // Go to the specified artist page
        if (artist === '') {
          Router.navigate('/artist/Blank' + artist);
          return;
        }
        Router.navigate('/artist/' + artist);
      },
      goToAlbum: function(album) {
        // Go to the specified album page
        if (album.compilation) {
          Router.navigate('/album/compilation' + '/' + (album.album !== '' ? album.album : 'Blank'));
        } else {
          Router.navigate('/album/' + (album.artist !== '' ? album.artist : 'Blank') + '/' + (album.album !== '' ? album.album : 'Blank'));
        }
      },
      goToDecade: function(decade) {
        // Search by chosen decade
        Router.navigate('/search/year:' + encodeURIComponent(decade));
      }
    }
  }
</script>
