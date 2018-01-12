<template>
	<nav id="navbar" class="blue lighten-2">
		<div class="nav-wrapper">
			<div class="nav-container">
				<a href="./?/" class="brand-logo" v-on:click.prevent="goto('')">{{ ZiteName }}</a>
				<a href="#" data-target="mobile-nav" class="sidenav-trigger"><i class="material-icons">menu</i></a>
				<ul class="right hide-on-med-and-down">
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
					<li>
						<a @click.prevent="goto('uploads')"><i class="material-icons left">cloud_upload</i>Uploads</a>
					</li>
					<li v-if="!isLoggedIn"><a @click.prevent="login()"><i class="material-icons left">person</i>Login</a></li>
					<li v-else><a @click.prevent="login()"><i class="material-icons left">person</i>{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
				</ul>
				<ul id="mobile-nav" class="sidenav">
					<li><h2 class="black-text center-align">{{ ZiteName }}</h2></li>
					<li><h6 class="black-text center-align">{{ ziteVersion }}</h6></li>
					<li><a @click.prevent="goto('')"><i class="material-icons left">home</i>Home</a></li>
					<li><a @click.prevent="goto('uploads')"><i class="material-icons left">cloud_upload</i>Uploads</a></li>
					<li><a @click.prevent="goto('playqueue')"><i class="material-icons left">playlist_play</i>Play Queue</a></li>
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
		props: ["userInfo"],
		name: "navbar",
		data: () => {
			return {
				ZiteName: "ZeroLSTN",
				downloadedOnly: false,
				sidebar: null,
				ziteVersion: "1.0.2"
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

				// If logo was clicked, tell home to go back to music page
				if (to === '') {
					page.goHome();
				}

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