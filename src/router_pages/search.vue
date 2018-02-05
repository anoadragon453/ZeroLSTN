<template>
  <div id="search">
    <div class="row">
      <div class="col s1 m1 l4 hide-on-med-and-down">
        <playQueue :play-queue-obj="playQueueObj" :queue-index="queueIndex"></playQueue>
      </div>
      <div class="col s12 m12 l8">
        <div class="input-field col s12 center">
          <div class="card">
            <div class="card-content">
              <i class="material-icons prefix black-text">search</i>
              <input placeholder="Search Artists, Albums, Songs..." id="searchField" type="text" class="">
              <label for="search_field black-text">Search</label>
            </div>
            <div class="card-tabs">
              <ul class="tabs tabs-fixed-width">
                <li class="tab"><a href="#all" class="active">All</a></li>
                <li class="tab"><a href="#artists">Artists</a></li>
                <li class="tab"><a href="#albums">Albums</a></li>
                <li class="tab"><a href="#songs">Songs</a></li>
              </ul>
            </div>
            <div class="card-content grey lighten-4">
              <div id="all" class="container">
                <span v-if="allSongs.length != 0">
                  <h4>Songs</h4>
                  <ul class="collection">
                    <songitem :song="song" :editable="false" v-for="song in allSongs"></songitem>
                  </ul>
                </span>
                <span v-if="allArtists.length != 0">
                  <h4>Artists</h4>
                  <ul class="collection left-align">
                    <li v-for="artist in allArtists" class="collection-item">
                      <a href="#!" v-html="artist.artist !== '' ? artist.artist : '<i>Blank</i>'" @click.prevent="goToArtist(artist.artist)"></a>
                    </li>
                  </ul>
                </span>
                <span v-if="allAlbums.length != 0">
                  <h4>Albums</h4>
                  <ul class="collection left-align">
                    <li v-for="album in allAlbums" class="collection-item">
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
                    <li v-for="artist in artists" class="collection-item">
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
                    <li v-for="album in albums" class="collection-item">
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
                    <songitem :song="song" :editable="false" v-for="song in songs"></songitem>
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
  var Router = require("../libs/router.js");
  
  // Vue components that make up the search page
  var PlayQueue = require("../vue_components/play_queue.vue");
  var SongItem = require("../vue_components/song_item.vue");
  
  module.exports = {
    components: {
      playQueue: PlayQueue,
      songitem: SongItem
    },
    props: ["playQueueObj", "queueIndex"],
    name: "search",
    data: () => {
      return {
        lastTab: "",              // Keep track of last tab, to not search again if clicked
        lastSearch: "",           // Keep track of last search term, to not search again if clicked // TODO: Store this in Vuex
        allSongs: [],             // Songs that appear on the All tab
        allAlbums: [],            // Albums that appear on the All tab
        allArtists: [],           // Artists that appear on the All tab
        songs: [],                // Songs that appear on the Songs tab
        albums: [],               // Albums that appear on the Albums tab
        artists: []               // Artists that appear on the Artists tab
      }
    },
    mounted: function() {
      // Initialize tabs
      var self = this;
      var tabs = document.querySelector("ul.tabs");
      var instance = new M.Tabs(tabs, {
        onShow: self.tabClicked
      });
      
      // Catch when user stops typing in search field
      var self = this;
      var keystoppedDelay = 600;
      var keystoppedTimer = null;
      var keystoppedInput = document.getElementById('searchField');
      keystoppedInput.addEventListener('keydown', function(event){
        // Reset the timer if they start typing again
        clearTimeout(keystoppedTimer);
        keystoppedTimer = setTimeout(function() {;
          // Run the searchStoppedTyping when the delay has been reached
          self.searchStoppedTyping(keystoppedInput.value, event.key);
        }, keystoppedDelay);
      }, false);
    },
    methods: {
      searchStoppedTyping: function(searchText, key) {
        // Don't auto-search search if less than 3 characters
        if (key != "Enter" && searchText.length <= 3) {
          return;
        }
        
        // Don't re-run a search if the user hits enter again
        if (searchText === this.lastSearch) {
          return;
        }
        this.search(searchText);
      },
      search: function(searchText) {
        // Don't search on empty input
        if (searchText === "") {
          return;
        }
        
        // Get current tab
        console.log("currentTab:", this.currentTab());

        // Search based on current tab
        var self = this;
        switch (this.currentTab()) {
          case 'All':
            // Search songs
            page.search(searchText, "song").then((songs) => {
              self.allSongs = songs;
            });

            // Search albums
            page.search(searchText, "album").then((albums) => {
              console.log(albums)
              self.allAlbums = albums;
            });

            // Search artists
            page.search(searchText, "artist").then((artists) => {
              self.allArtists = artists;
            });
            break;
          case 'Songs':
            // Search songs
            page.search(searchText, "song").then((songs) => {
              self.songs = songs;
            });
            break;
          case 'Albums':
            // Search albums
            page.search(searchText, "album").then((albums) => {
              self.albums = albums;
            });
            break;
          case 'Artists':
            // Search artists
            page.search(searchText, "artist").then((artists) => {
              self.artists = artists;
            });
            break;
        }
        
        // Conduct the search
        console.log("Searching: ", searchText);
        
        // Keep track of last search term
        this.lastSearch = searchText;
      },
      tabClicked: function() {
        // Don't re-run a search if the user clicks the current tab
        if (this.lastTab === this.currentTab()) {
          return;
        }
        
        // Make the search
        this.search(document.getElementById('searchField').value);
        
        // Keep track of last tab clicked
        this.lastTab = this.currentTab();
      },
      currentTab: function() {
        // Get the current tab
        return document.querySelector(".tab a.active").innerHTML;
      },
      goToArtist: function(artist) {
        // Go to the specified artist page
        console.log("Going to artist:", artist)
        if (artist === '') {
          Router.navigate('/artist/Blank' + artist);
          return;
        }
        Router.navigate('/artist/' + artist);
      },
      goToAlbum: function(album, artist) {
        console.log("Going to album:", album)
        // Go to the specified album page
        Router.navigate('/album/' + (artist !== '' ? artist : 'Blank') + '/' + (album !== '' ? album : 'Blank'));
      }
    }
  }
</script>