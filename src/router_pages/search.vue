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
              <div id="all"></div>
              <div id="artists"></div>
              <div id="albums"></div>
              <div id="songs"></div>
              <div id="searchContent">Type a search query to begin</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  // Vue components that make up the search page
  var PlayQueue = require("../vue_components/play_queue.vue");

  module.exports = {
    components: {
      playQueue: PlayQueue,
    },
    props: ["playQueueObj", "queueIndex"],
    name: "search",
    data: () => {
      return {
        lastTab: "",              // Keep track of last tab, to not search again if clicked
        lastSearch: ""            // Keep track of last search term, to not search again if clicked
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

        // Conduct the search
        console.log("Searching: ", searchText);
        document.getElementById("searchContent").innerHTML = searchText;

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
      }
    }
  }
</script>