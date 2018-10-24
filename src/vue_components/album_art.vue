<template>
  <div id="albumart">
    <img v-if="currentSong && currentSong.art && currentSong.art !== ''" width="100%" :src="currentSong.art">
    <img v-else src="img/logo.png" width="100%">
  </div>
</template>

<script>
import Router from '../libs/router.js';

export default {
  props: ['currentSong'],
  name: 'albumart',
};
</script>
