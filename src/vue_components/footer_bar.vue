<template>
	<footer class="page-footer blue lighten-2" id="Bottombar">
		<div class="container">
			<div class="row">
				<div class="col s4">
					
				</div>
				<div class="col s4 center">
					<a @click="previous()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_rewind</i></a>
					<a @click="playPause()" class="btn-floating waves-effect waves-light btn-large indigo"><i class="material-icons">{{ playing ? "pause" : "play_arrow" }}</i></a>
					<a @click="next()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_forward</i></a>
				</div>
				<div class="col s4">
					
				</div>
			</div>
		</div>
	</footer>
</template>

<script>
	var Router = require("../libs/router.js");

	module.exports = {
		props: [],
		name: "BottomBar",
		data: () => {
			return {
				playing: false
			}
		},
		mounted: function() {
		},
		methods: {
			previous: function() {

			},
			playPause: function() {
				// Toggle playing music
				this.playing = !this.playing;
				if(this.playing) {
					// Get current song?
					this.playSong();
				} else {
					this.pauseSong();
				}
			},
			playSong: function() {
				console.log("Playing");
			},
			pauseSong: function() {
				console.log("Paused");
			},
			next: function() {

			}
		}
	}
</script>