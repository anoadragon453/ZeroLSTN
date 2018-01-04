<template>
	<footer class="page-footer blue lighten-2" id="Bottombar">
		<div class="row">
			<div class="col s5">
				<div class="col s2">
				<b>0:00</b>
				</div>
				<div class="col s8">
					<div class="range-field center">
						<input type="range" v-model="trackProgress" id="track-progress" min="0" max="100" />
					</div>
				</div>
				<div class="col s2"><b>-0:00</b></div>
			</div>
			<div class="col s2 center">
				<a @click="previous()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_rewind</i></a>
				<a @click="playPause()" class="btn-floating waves-effect waves-light btn-large indigo"><i class="material-icons">{{ playing ? "pause" : "play_arrow" }}</i></a>
				<a @click="next()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_forward</i></a>
			</div>
			<div class="col s5">
				<div class="col s1">
				<i class="material-icons">volume_up</i>
				</div>
				<div class="col s9">
					<div class="range-field center">
						<input type="range" v-model="volume" id="volume-slider" min="0" max="100" />
					</div>
				</div>
				<div class="col s2"><b>{{ volume }}%</b></div>
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
				playing: false,
				volume: 80,
				trackProgress: 0
			}
		},
		mounted: function() {
			// Initialize slider
            //var slider = document.querySelector("#volume-slider");
            //var instance = new M.Slider(slider, {});
		},
		methods: {
			previous: function() {
				console.log(this.volume);
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