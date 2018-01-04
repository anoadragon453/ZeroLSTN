<<template>
  <div id="mainapp" class="container">
    <div class="row">
      <div class="col s12 m7 l9">
        Music goes here.
      </div>
    </div>
    <component :is="test"></component>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");
  var Test = require("../vue_components/test.vue");
  var NavBar = require("../vue_components/navbar.vue");
  module.exports = {
    props: [],
    name: "mainapp",
    data: () => {
      return {
        test: Test,
        navbar: NavBar
      }
    }
  }
</script>