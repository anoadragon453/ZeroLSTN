<template>
    <nav id="navbar" class="sitebar">
        <div class="nav-wrapper">
            <div class="nav-container">
                <a href="./?/" class="brand-logo" v-on:click.prevent="goto('')">{{ ZiteName }}</a>
                <a href="#" data-target="mobile-nav" class="sidenav-trigger"><i class="material-icons">menu</i></a>
                <a @click.prevent="goto('search')" data-target="mobile-nav" class="right hide-on-small-only hide-on-large-only"><i class="material-icons left">search</i></a>
                <ul class="right hide-on-med-and-down">
                    <li><a @click.prevent="goto('')"><i class="material-icons left">home</i>Home</a></li>
                    <li><a @click.prevent="goto('search')"><i class="material-icons left">search</i>Search</a></li>
                    <li><a @click.prevent="goto('nowplaying')"><i class="material-icons left">music_note</i>Now Playing</a></li>
                    <li><a @click.prevent="goto('playlists')"><i class="material-icons left">queue_music</i>Playlists</a></li>
                    <li><a @click.prevent="goto('uploads')"><i class="material-icons left">cloud_upload</i>Uploads</a></li>
                    <li v-if="!isLoggedIn"><a @click.prevent="login()"><i class="material-icons left">person</i>Login</a></li>
                    <li v-else><a @click.prevent="login()"><i class="material-icons left">person</i>{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
                    <li><a @click.prevent="toggleDarkTheme()"><i class="material-icons left">{{siteTheme == "light" ? "brightness_2" : "wb_sunny"}}</i></a></li>
                </ul>
                <ul id="mobile-nav" class="sidenav">
                    <li><h2 class="center-align switch-color">{{ ZiteName }}</h2></li>
                    <li><h6 class="center-align switch-color">{{ ziteVersion }}</h6></li>
                    <li><a @click.prevent="goto('')"><i class="material-icons switch-color left">home</i>Home</a></li>
                    <li><a @click.prevent="goto('search')"><i class="material-icons switch-color left">search</i>Search</a></li>
                    <li><a @click.prevent="goto('nowplaying')"><i class="material-icons switch-color left">music_note</i>Now Playing</a></li>
                    <li><a @click.prevent="goto('playlists')"><i class="material-icons switch-color left">queue_music</i>Playlists</a></li>
                    <li><a @click.prevent="goto('uploads')"><i class="material-icons switch-color left">cloud_upload</i>Uploads</a></li>
                    <li v-if="!isLoggedIn"><a @click.prevent="login()"><i class="material-icons switch-color left">person</i>Login</a></li>
                    <li v-else><a @click.prevent="login()"><i class="material-icons switch-color left">person</i>{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
                    <li><a @click.prevent="toggleDarkTheme()"><i class="material-icons switch-color left">{{siteTheme == "light" ? "brightness_2" : "wb_sunny"}}</i>{{siteTheme == "light" ? "Dark Theme" : "Light Theme"}}</a></li>
                </ul>
            </div>
        </div>
    </nav>
</template>

<script>
import Router from '../libs/router.js';

export default {
  props: ['userInfo', 'ziteVersion'],
  name: 'navbar',
  data: () => ({
    ZiteName: 'ZeroLSTN',
    downloadedOnly: false,
    siteTheme: 'light',
    sidebar: null,
  }),
  mounted() {
    const self = this;
    const elem = document.querySelector('.sidenav');
    this.sidebar = new M.Sidenav(elem, {
      edge: 'left',
      draggable: true,
    });

    // Check if dark theme is enabled
    setTimeout(async () => {
      let theme = await window.page.getLocalStorage('theme');

      // Change to theme if it's set already
      if (theme) {
        self.siteTheme = theme;
        self.setTheme();
      } else {
        // Try to query ZeroNet theme setting
        let server_info = await window.page.cmdp("serverInfo", {});
        console.log("Queried:", server_info)
        if (server_info && server_info.user_settings && server_info.user_settings.theme) {
          self.siteTheme = theme;
          self.setTheme();
        }
      }
    }, 50); // Have to delay due to page not being available immediately
  },
  computed: {
    isLoggedIn() {
      if (this.userInfo == null) return false;
      return this.userInfo.cert_user_id != null;
    },
  },
  methods: {
    goto(to) {
      // Hide sidebar by "clicking" the overlay
      const sidenavOverlay = document.querySelector('.sidenav-overlay');
      sidenavOverlay.click();

      // Go to specified page
      Router.navigate(to);
    },
    login() {
      window.page.selectUser();
      return false;
    },
    toggleDarkTheme() {
      if (this.siteTheme == 'light') { this.siteTheme = 'dark'; } else { this.siteTheme = 'light'; }

      this.setTheme();
      this.setThemeSetting();
    },
    setThemeSetting() {
      switch (this.siteTheme) {
        case 'dark':
          window.page.setLocalStorage('theme', 'dark');
          break;
        default: // light theme
          window.page.setLocalStorage('theme', 'light');
          break;
      }
    },
    setTheme() {
      console.log("Setting theme:", this.siteTheme)
      switch (this.siteTheme) {
        case 'dark':
          document.getElementById('mainstylesheet').setAttribute('href', 'css/dark.css');
          break;
        default: // light theme
          document.getElementById('mainstylesheet').setAttribute('href', 'css/main.css');
          break;
      }
    },
  },
};
</script>
