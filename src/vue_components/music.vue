<template>
  <div id="Music">
    <!-- Tab content -->
    <div class="row">
      <div class="col s12">
        <ul class="tabs tabs-fixed-width z-depth-1">
          <li v-for="tab in tabs" class="tab col s3">
            <a :href="'#' + tab.show">{{ tab.name }}</a>
          </li>
        </ul>
      </div>
      <div id="artists" class="col s12">
        <ul v-if="artists.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Artists</h4></li>
          <li v-for="artist in artists" class="collection-item">
            <a href="#!" v-html="artist !== '' ? artist : '<i>Blank</i>'" @click.prevent="goToArtist(artist)"></a>
          </li>
        </ul>
        <p v-else class="center">No artists found.</p>
      </div>
      <div id="albums" class="col s12">
        <ul v-if="albums.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Albums</h4></li>
          <li v-for="album in albums" class="collection-item">
            <a href="#!" v-html="album.album !== '' ? album.album : '<i>Blank</i>'" @click.prevent="goToAlbum(album)"></a>
          </li>
        </ul>
        <p v-else class="center">No albums found.</p>
      </div>
      <div id="years" class="col s12">
        <div class="row"></div>
        <ul v-if="decades.length != 0" class="collection with-header">
          <li class="collection-header"><h4>Browse by Decade</h4></li>
          <a href="#" v-for="(decade, address) in decades" class="collection-item">
            {{ decade.name }}
          </a>
        </ul>
      </div>
      <!--
        <div id="playlists" class="col s12">
          <ul class="collapsible" data-collapsible="expandable">
            <li>
              <div class="collapsible-header"><i class="material-icons">playlist_play</i>Best Songs 2017</div>
              <div class="collapsible-body">
                <div class="row">
                  <div class="col s12">
                    <ul class="collection with-header">
                      <li class="collection-header"><h4>Best Songs 2017</h4></li>
                      <li class="collection-item">Strawberry Swing</li>
                      <li class="collection-item">Past Winters</li>
                      <li class="collection-item">Snowcone</li>
                      <li class="collection-item">Here We Play</li>
                    </ul>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <div class="collapsible-header"><i class="material-icons">playlist_play</i>Second</div>
              <div class="collapsible-body"><span>Lorem ipsum dolor sit amet.</span></div>
            </li>
            <li>
              <div class="collapsible-header"><i class="material-icons">playlist_play</i>Third</div>
              <div class="collapsible-body"><span>Lorem ipsum dolor sit amet.</span></div>
            </li>
          </ul>
        </div>
      -->
    </div>
    <div class="row"></div>
    <div class="row"></div>
    <div class="row"></div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  module.exports = {
    props: ["siteInfo"],
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
        self.albums = albums;
      });
    },
    mounted: function() {
      var self = this;

      // Initialize tabs
      var tabs = document.querySelector("ul.tabs");
      var instance = new M.Tabs(tabs, {});

      // Initialize collapsible
      // TODO: Uncomment when playlists are live again
      //var collap = document.querySelector("ul.collapsible");
      //var collapInstance = new M.Collapsible(collap, {});

      // Pull decades from a local file
      page.cmdp("fileGet", { inner_path: "./decades.json" })
      .then((decades) => {
        // If the file doesn't exist, we won't show the listing
        self.decades  = decades ? JSON.parse(decades) : {};
      });
    },
    data: () => {
      return {
        tabs: [
          { name: "Artists", icon: "people", active: false, show: "artists" },
          { name: "Albums", icon: "album", active: false, show: "albums" },
          { name: "Years", icon: "library_music", active: false, show: "years" }
          //{ name: "Playlists", icon: "playlist_add", active: false, show: "playlists" }
        ],
        artists: [],
        albums: [],
        playlists: [],
        decades: []
      }
    },
    methods: {
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
        Router.navigate('/album/' + (album.artist !== '' ? album.artist : 'Blank') + '/' + (album.album !== '' ? album.album : 'Blank'));
      }
    }
  }
</script>
