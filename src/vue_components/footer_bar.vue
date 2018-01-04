<template>
	<footer class="page-footer blue lighten-2" id="Bottombar">
		<div class="container">
			<div class="row">
				<div class="col s4">
					Left
				</div>
				<div class="col s4">
					Middle
				</div>
				<div class="col s4">
					Right
				</div>
			</div>
		</div>
	</footer>
</template>

<script>
	var Router = require("../libs/router.js");
	var M = require("materialize-css");
	module.exports = {
		props: [],
		name: "BottomBar",
		data: () => {
			return {
				
			}
		},
		mounted: function() {
		},
		methods: {
			navbarLinkClick: function(link) {
				if (link.route !== null || link.route === "#") {
					Router.navigate(link.route);
				} else {
					link.onclick(this);
				}
			}
		}
	}
</script>