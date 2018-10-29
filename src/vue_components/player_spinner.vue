<template>
  <a class="btn-floating waves-effect waves-light btn-large indigo">
    <div id="playerspinner" class="preloader-wrapper small active" style="top: 10px">
      <div class="spinner-layer" style="border-color: white">
        <div class="circle-clipper left">
          <div class="circle"></div>
        </div><div class="gap-patch">
          <div class="circle"></div>
        </div><div class="circle-clipper right">
          <div class="circle"></div>
        </div>
      </div>
    </div>
  </a>
</template>

<script>
import Router from '../libs/router.js';

export default {
  name: 'playerspinner',
};
</script>
