<template>
  <footer class="page-footer sitebar" id="Bottombar">
    <div id="song-progress" class="hide-on-med-and-down range-field center">
      <input type="range" @input="visualChangeSongProgress()" @change="changeSongProgress()" v-model="songProgress" id="track-progress" min="0" max="100" />
    </div>
    <div id="song-progress-slightly-higher" class="show-on-medium-and-down hide-on-large-only range-field center">
      <input type="range" @input="visualChangeSongProgress()" @change="changeSongProgress()" v-model="songProgress" id="track-progress" min="0" max="100" />
    </div>
    <div class="row">
      <div class="col s1 m3 l3">
        <b>{{ songProgressLeft }}</b>
      </div>
      <div class="col s10 m6 l6 center">
        <a @click.prevent="loop()" class="btn-floating waves-effect waves-light" :class="isLooping ? 'purple darken-2' : 'indigo'"><i class="material-icons">{{ isLooping == 2 ? 'looks_one' : 'loop' }}</i></a>
        <a @click.prevent="prev()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_rewind</i></a>
        <playerSpinner v-if="songLoading"></playerSpinner>
        <a v-else @click.prevent="playPause()" class="btn-floating waves-effect waves-light btn-large indigo"><i class="material-icons">{{ audioPlaying ? "pause" : "play_arrow" }}</i></a>
        <a @click.prevent="next()" class="btn-floating waves-effect waves-light indigo"><i class="material-icons">fast_forward</i></a>
        <a @click.prevent="shuffle()" class="btn-floating waves-effect waves-light" :class="isShuffling ? 'purple darken-2' : 'indigo'"><i class="material-icons">shuffle</i></a>
      </div>
      <div class="col hide-on-small-only m2 l2">
        <div class="range-field center">
          <input type="range" v-model="volume" id="volume-slider" @input="volumeChanged" @mouseup="volumeFinishedChanging" min="0" max="100" />
        </div>
      </div>
      <div class="col s1 m1 l1">
        <b class="right">{{ songProgressRight }}</b>
      </div>
    </div>
  </footer>
</template>

<script>
  var Router = require("../libs/router.js");
  var PlayerSpinner = require("../vue_components/player_spinner.vue");

  module.exports = {
    components: {
      playerSpinner: PlayerSpinner
    },
    props: ["currentSong", "audioPlaying"],
    name: "FooterBar",
    data: () => {
      return {
        playing: false,
        isShuffling: false,
        isLooping: 0,
        volume: 100,
        songProgress: 0,
        songProgressLeft: "00:00",
        songProgressRight: "00:00",
        songTotalDuration: 0,
        progressCurrentlyChanging: false,
        songLoading: false
      }
    },
    mounted: function() {
      var self = this;

      // Catch and act on events from the site
      this.$parent.$on("updateSongDuration", this.updateSongDuration);

      // Check if volume preferences are saved
      setTimeout(function() {
        page.getLocalStorage("volume").then((volume) => {
          // Update music volume if stored
          if (volume) {
            self.volume = volume;
            page.setVolume(volume);
          }
        });
      }, 50); // Have to delay due to page not being available immediately

      // Listen for keyboard presses
      document.addEventListener("keydown", function(ev) {
        // Prevent blocking of input fields
        if (ev.target != document.body) {
          return true;
        }

        if (ev.key == " ") {
          page.togglePlayback();
          ev.preventDefault(); // Prevent space-to-scroll
        } else if (ev.key == "n") {
          page.nextSong();
        } else if (ev.key == "b") {
          page.prevSong();
        } else if (ev.key == "s") {
          self.shuffle();
        } else if (ev.key == "l") {
          self.loop();
        }
      });

      // Update current song progress every second
      setInterval(this.updateSongProgress, 1000);

      // TODO: Make this work for loading song on siteload
      // They currently don't work as page hasn't been created yet
      // Callback events for song loaded state
      setTimeout(function() {
        page.bus.$on("songLoading", function() {
          self.songLoading = true;
        });

        page.bus.$on("songLoaded", function() {
          self.songLoading = false;
        });
      }, 400);
    },
    methods: {
      playPause: function() {
        console.log("[footer]", this.currentSong);
        // Toggle playing music
        if(this.audioPlaying) {
          this.pauseSong();
        } else {
          this.playSong();
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
      shuffle: function() {
        page.shuffle();
        this.isShuffling = page.store.state.shuffle;
      },
      loop: function() {
        page.loop();
        this.isLooping = page.store.state.loop;
      },
      volumeChanged: function() {
        page.setVolume(this.volume);
      },
      volumeFinishedChanging: function() {
        // Save volume preferences to localstorage
        page.setLocalStorage("volume", this.volume);
      },
      // Runs every second, updating song progress
      updateSongProgress: function() {
        // Don't update progress if music is paused. It's weird.
        if (!this.audioPlaying) {
          return;
        }

        // Get current progress from page
        var audioObject = page.getAudioObject();

        // If audio doesn't exist yet, just show "00:00"
        if (!audioObject){
          this.songProgressLeft = "00:00";
          return;
        }

        // Update slider bar with song % complete
        // Prevent slider from slipping away from user while they're moving it
        if (!this.progressCurrentlyChanging) {
          this.songProgress = audioObject.currentTime / audioObject.duration * 100;
          // Update progress values on page
          this.alterShownProgress(audioObject.currentTime);
        }
      },
      alterShownProgress: function(currentTime) {
        // Get current song progress in mm:ss and update view
        this.songProgressLeft = this.secondsToMinutesSeconds(currentTime);

        // Get remaining song progress in -mm:ss and update view
        this.songProgressRight = "-" + this.secondsToMinutesSeconds(this.songTotalDuration - currentTime);
      },
      // Change the current track time of the playing song
      changeSongProgress: function() {
        // Get desired track progress
        var desiredProgress = document.getElementById("track-progress").value / 100;

        // Convert to second using track duration
        page.setTime(desiredProgress * this.songTotalDuration);

        this.progressCurrentlyChanging = false;
      },
      // Show time progress changing even though the song is still playing
      // Allows user to navigate to exact time in song while still listening while doing so
      visualChangeSongProgress: function() {
        this.progressCurrentlyChanging = true;

        var movingProgress = document.getElementById("track-progress").value / 100;
        this.alterShownProgress(movingProgress * this.songTotalDuration);
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
