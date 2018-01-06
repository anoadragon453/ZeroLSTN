<template>
	<nav id="navbar" class="blue lighten-2">
		<div class="nav-wrapper">
			<div class="nav-container">
				<a href="./?/" class="brand-logo" v-on:click.prevent="goto('')">{{ ZiteName }}</a>
				<a href="#" data-target="mobile-nav" class="sidenav-trigger"><i class="material-icons">menu</i></a>
				<!--<ul class="left">-->
				<!--</ul>-->
				<ul class="right hide-on-med-and-down">
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
					<li>
						<a @click.prevent="goto('uploads')">Uploads</a>
					</li>
					<li v-if="!isLoggedIn"><a @click.prevent="login()">Login</a></li>
					<li v-else><a @click.prevent="login()">{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
				</ul>
				<ul id="mobile-nav" class="sidenav">
					<li><a @click.prevent="goto('')">Home</a></li>
					<li><a @click.prevent="goto('uploads')">Uploads</a></li>
					<li><a @click.prevent="goto('playqueue')">Play Queue</a></li>
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
					<li v-if="!isLoggedIn"><a @click.prevent="login()">Login</a></li>
					<li v-else><a @click.prevent="login()">{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
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
				console.log("Login button clicked!");
				console.log(this.userInfo);
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