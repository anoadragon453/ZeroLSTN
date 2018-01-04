<template>
	<nav id="navbar" class="blue lighten-2">
		<div class="nav-wrapper">
			<div class="container">
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
					<li v-if="!userInfo"><a @click.prevent="login()">Login</a></li>
					<li v-else><a @click.prevent="">{{ userInfo ? userInfo.cert_user_id : "" }}</a></li>
				</ul>
			</div>
		</div>
	</nav>
</template>

<script>
    var Router = require("../libs/router.js");
    var M = require("materialize-css");

	module.exports = {
		props: ["userInfo"],
		name: "navbar",
		data: () => {
			return {
				ZiteName: "ZeroLSTN",
                downloadedOnly: false
			}
		},
		mounted: function() {
			var elem = document.querySelector('.sidenav');
  			var instance = new M.Sidenav(elem, {
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
                // Go to upload page
                Router.navigate(to);

                // Show  page where you pick name, genre (for merger site), album art (unless
                // it's embedded?), artist etc.
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