<template>
	<footer class="page-footer blue lighten-2" id="Bottombar">
		<div class="row">
			<div class="col s0 m5 l5">
				<div class="col s2">
				<b>{{ songProgressLeft }}</b>
				</div>
				<div class="col s8">
					<div class="range-field center">
						<input type="range" @input="visualChangeSongProgress()" @change="changeSongProgress()" v-model="songProgress" id="track-progress" min="0" max="100" />
					</div>
				</div>
				<div class="col s2"><b>{{ songProgressRight }}</b></div>
			</div>
			<div class="col s12 m2 l2 center">
				<a @click="prev()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_rewind</i></a>
				<a @click="playPause()" class="btn-floating waves-effect waves-light btn-large indigo"><i class="material-icons">{{ playing ? "pause" : "play_arrow" }}</i></a>
				<a @click="next()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_forward</i></a>
			</div>
			<div class="col s0 m5 l5">
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
				songProgress: 0,
				songProgressLeft: "00:00",
				songProgressRight: "00:00",
				songTotalDuration: 0
			}
		},
		mounted: function() {
			// Initialize slider
            var volumeSlider = document.getElementById("volume-slider");
			//var instance = new M.Slider(slider, {});

			volumeSlider.addEventListener("input", this.volumeChanged);

			// Catch song duration updates
			this.$parent.$on("updateSongDuration", this.updateSongDuration);

			// Catch song play/pause updates
			this.$parent.$on("songPlaying", this.updatePlayPauseButton);

			// Update current song progress every second
			setInterval(this.updateSongProgress, 1000);
		},
		methods: {
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
				page.playCurrentSong();
			},
			pauseSong: function() {
				page.pauseCurrentSong();
			},
			prev: function() {
				page.prevSong();
			},
			next: function() {
				page.nextSong();
			},
			volumeChanged: function() {
				var volume = document.getElementById("volume-slider").value;
				page.setVolume(volume);
			},
			updatePlayPauseButton: function(playing) {
				this.playing = playing;
			},
			// Runs every second, updating song progress
			updateSongProgress: function() {
				// Don't update progress if music is paused. It's weird.
				if (!this.playing) {
					return;
				}

				// Get current progress from page
				var audioObject = page.getAudioObject();
				
				// If nothing's playing, just show "00:00"
				if (!audioObject){
					this.songProgressLeft = "00:00";
					return;
				}

				// Update slider bar with song % complete
				this.songProgress = audioObject.currentTime / audioObject.duration * 100;

				// Get current song progress in mm:ss and update view
				this.songProgressLeft = this.secondsToMinutesSeconds(audioObject.currentTime);

				// Get remaining song progress in -mm:ss and update view
				this.songProgressRight = "-" + this.secondsToMinutesSeconds(this.songTotalDuration - audioObject.currentTime);
			},
			// Change the current track time of the playing song
			changeSongProgress: function() {
				// Get desired track progress
				var desiredProgress = document.getElementById("track-progress").value / 100;

				// Convert to second using track duration
				page.setTime(desiredProgress * this.songTotalDuration);

				// Play song if it was paused
				page.playCurrentSong();
			},
			// Show time progress changing even though the song is still playing
			// Allows user to navigate to exact time in song while still listening while doing so
			visualChangeSongProgress: function() {

			},
			// Runs on new songs, shows full duration
			updateSongDuration: function(duration) {
				// Keep track of current song's total duration
				this.songTotalDuration = duration;
				// Get total song duration in mm:ss and update view
				this.songProgressRight = "-" + this.secondsToMinutesSeconds(duration);
			},
			secondsToMinutesSeconds: function(seconds) {
				// Convert duration in seconds to mm:ss
				var minutes = Math.floor(seconds / 60);
				var seconds = Math.floor(seconds % 60);

				// Convert to string and put a "0" in front if it's < 10
				minutes = (minutes < 10) ? '0' + minutes : '' + minutes;
				seconds = (seconds < 10) ? '0' + seconds : '' + seconds;

				// Format as "mm:ss"
				return minutes + ":" + seconds;
			}
		}
	}
</script>