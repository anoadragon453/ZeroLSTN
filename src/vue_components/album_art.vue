<template>
  <div id="albumart">
    <img v-if="currentSong && currentSong.art && currentSong.art !== ''" width="100%" :src="currentSong.art">
    <img v-else src="./logo.png" width="100%">
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  
  module.exports = {
    props: ["currentSong"],
    name: "albumart",
  }
</script>