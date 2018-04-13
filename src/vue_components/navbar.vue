<template>
    <nav id="navbar" class="blue lighten-2">
        <div class="nav-wrapper">
            <div class="nav-container">
                <a href="./?/" class="brand-logo" v-on:click.prevent="goto('')">{{ ZiteName }}</a>
                <a href="#" data-target="mobile-nav" class="sidenav-trigger"><i class="material-icons">menu</i></a>
                <a @click.prevent="goto('search')" data-target="mobile-nav" class="right hide-on-small-only hide-on-large-only"><i class="material-icons left">search</i></a>
                <ul class="right hide-on-med-and-down">
                    <li><a @click.prevent="goto('search')"><i class="material-icons left">search</i>Search</a></li>
                    <!--
            <li>
              <a @click.prevent="downloadedToggle()">
                <div class="switch">
                  Downloaded
                  <label>
                    <input v-model="downloadedOnly" type="checkbox">
                    <span class="lever"></span>
                  </label>
                </div>
              </a>
            </li>
                    -->
                    <li><a @click.prevent="goto('nowplaying')"><i class="material-icons left">music_note</i>Now Playing</a></li>
                    <li><a @click.prevent="goto('playlists')"><i class="material-icons left">playlist_play</i>Playlists</a></li>
                    <li><a @click.prevent="goto('uploads')"><i class="material-icons left">cloud_upload</i>Uploads</a></li>
                    <li v-if="!isLoggedIn"><a @click.prevent="login()"><i class="material-icons left">person</i>Login</a></li>
                    <li v-else><a @click.prevent="login()"><i class="material-icons left">person</i>{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
                </ul>
                <ul id="mobile-nav" class="sidenav">
                    <li><h2 class="black-text center-align">{{ ZiteName }}</h2></li>
                    <li><h6 class="black-text center-align">{{ ziteVersion }}</h6></li>
                    <li><a @click.prevent="goto('')"><i class="material-icons left">home</i>Home</a></li>
                    <li><a @click.prevent="goto('search')"><i class="material-icons left">search</i>Search</a></li>
                    <li><a @click.prevent="goto('nowplaying')"><i class="material-icons left">music_note</i>Now Playing</a></li>
                    <li><a @click.prevent="goto('playlists')"><i class="material-icons left">playlist_play</i>Playlists</a></li>
                    <li><a @click.prevent="goto('uploads')"><i class="material-icons left">cloud_upload</i>Uploads</a></li>
                    <!--
            <li>
              <a @click.prevent="downloadedToggle()">
                <div class="switch">
                  Downloaded
                  <label>
                    <input v-model="downloadedOnly" type="checkbox">
                    <span class="lever"></span>
                  </label>
                </div>
              </a>
            </li>
                    -->
                    <li v-if="!isLoggedIn"><a @click.prevent="login()"><i class="material-icons left">person</i>Login</a></li>
                    <li v-else><a @click.prevent="login()"><i class="material-icons left">person</i>{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script>
  var Router = require("../libs/router.js");
  
    module.exports = {
        props: ["userInfo", "ziteVersion"],
        name: "navbar",
        data: () => {
            return {
                ZiteName: "ZeroLSTN",
                downloadedOnly: false,
                sidebar: null
            }
        },
        mounted: function() {
            var elem = document.querySelector('.sidenav');
      this.sidebar = new M.Sidenav(elem, {
        edge: "left",
        draggable: true
      });
        },
        computed: {
            isLoggedIn: function() {
                if (this.userInfo == null) return false;
                return this.userInfo.cert_user_id != null;
            }
        },
        methods: {
            goto: function(to) {
                // Hide sidebar by "clicking" the overlay
                var sidenavOverlay = document.querySelector(".sidenav-overlay");
                sidenavOverlay.click();
        
        // Go to specified page
        Router.navigate(to);
      },
            login: function() {
                page.selectUser();
                return false;
      },
      downloadedToggle: function() {
        // Toggle the downloaded switch
        // TODO: Place a rule in localstorage to remember this
        this.downloadedOnly = !this.downloadedOnly;
        console.log(this.downloadedOnly);
      }
        }
    }
</script>
