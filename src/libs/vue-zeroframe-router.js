// Router should be a global variable

const VueRouteLink = {
  props: ['to'],
  template: '<a v-bind:href="getHref" v-on:click.prevent="goto" v-bind:class="{ \'is-active\': active }"><slot></slot></a>',
  methods: {
    goto() {
      Router.navigate(this.to);
    },
  },
  computed: {
    active() {
      if (Router.currentRoute === this.to) {
        return true;
      }
      return false;
    },
    getHref() { // Middle Click - open in new tab
      return `./?/${this.to}`;
    },
  },
};

const VueZeroFrameRouter = {
  routes: null,
  install(Vue) {
    /* Vue.mixin({ // Inject stuff into all components
      mounted() {
        console.log('Mounted');
      }
    }); */
    Vue.component('route-link', VueRouteLink);
    /* Vue.mixin({
      beforeCreate() {
        if (options.zeroframe_router) {
          this.$zeroframe_router = options.zeroframe_router;
        } else if (options.parent && options.parent.$zeroframe_router) {
          this.$zeroframe_router = options.parent.$zeroframe_router;
        }
        registerInstance();
      }
    }); */
    // Vue.currentView = options.routes[0];
    /* Router.hooks({
      after: function(currentRoute, params) {
        vueInstance.currentView = 'route-' + currentRoute.replace(/:/g, '').replace(/\//g, '-');
        if (currentRoute === '') {
          vueInstance.currentView = 'route-home';
        }
      }
    }); */

    // Router.init();
  },
};

const VueZeroFrameRouterInit = (Router, vueInstance, routes) => {
  VueZeroFrameRouter.routes = routes;
  for (let i = 0; i < routes.length; i++) {
    Router.add(routes[i].route, !routes[i].component.init ? () => {} : routes[i].component.init, {
      before: !routes[i].component.before ? () => true : routes[i].component.before,
      after: !routes[i].component.after ? () => {} : routes[i].component.after,
      leave: !routes[i].component.leave ? () => {} : routes[i].component.leave,
    }, routes[i].component);
  }
  Router.vueInstance = vueInstance;
  Router.setView = (i, object) => {
    Router.vueInstance.currentView = object;
    console.log("Set view to:", Router.vueInstance)
  };
  Router.init();
};

export {
  VueZeroFrameRouter,
  VueZeroFrameRouterInit,
};
