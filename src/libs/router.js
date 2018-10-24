const Router = {
  routes: [],
  currentRoute: '',
  currentParams: {},
  root: '/',
  notFoundFunction: null,
  hookFunctions: {}, // hooks that are called for each route, functions for 'before' and 'after'.
  config(options) {
    this.root = options && options.root ? `/${this.clearSlashes(options.root)}/` : '/';
    return this;
  },
  // Note: Call right after creating all of your routes.
  init() {
    // if '?/' isn't on address - add it
    const address = window.location.search.replace(/&wrapper_nonce=([A-Za-z0-9]+)/, '').replace(/\?wrapper_nonce=([A-Za-z0-9]+)/, ''); // TODO: Fix this to replace the root instead of just a slash
    if (address === '') {
      window.page.cmd('wrapperPushState', [{ route: '' }, null, this.root]);
    }
    // Resolve the initial route
    this.check(this.getURL());
  },
  getURL() { // gets current query string/hash & trims slashes, only for initial load
    let url = '';
    url = window.location.search.replace(/&wrapper_nonce=([A-Za-z0-9]+)/, '').replace(/\?wrapper_nonce=([A-Za-z0-9]+)/, '').replace(/\?\//, ''); // TODO: Fix this to replace the root instead of just a slash
    return this.clearSlashes(url);
  },
  clearSlashes(path) {
    return path.toString().replace(/\/$/, '').replace(/^\//, '');
  },
  add(path, controller, hooks, object = null) {
    if (typeof path === 'function') {
      object = hooks;
      hooks = controller;
      controller = path;
      path = '';
    }
    this.routes.push({
      path, controller, hooks, object,
    });
    return this;
  },
  remove(param) {
    for (let i = 0, r; i < this.routes.length; i++) {
      r = this.routes[i];
      if (r.controller === param || r.path.toString() === param.toString()) {
        this.routes.splice(i, 1);
        return this;
      }
    }
    return this;
  },
  flush() {
    this.routes = [];
    this.root = '/';
    return this;
  },
  check(hash) {
    let keys,
      match,
      routeParams;

    const matchHandler = (value, i) => {
      routeParams[keys[i].replace(':', '')] = value;
    };
    for (let i = 0, max = this.routes.length; i < max; i++) {
      routeParams = {};
      keys = this.routes[i].path.match(/:([^/]+)/g);
      match = hash.replace(/^\//, '').match(new RegExp(`^${this.routes[i].path.replace(/:([^/]+)/g, '([^/]*)').replace(/\*/g, '(?:.*)')}(?:/|$)`));
      if (match) {
        match.shift();
        match.forEach(matchHandler);
        let object = {};
        if (this.routes[i].object) {
          object = this.routes[i].object;
          object.params = routeParams;
        }
        this.currentParams = routeParams;
        // Call 'before' hook
        // TODO: Move this into navigate function?
        if (this.hookFunctions && this.hookFunctions.before) {
          if (!this.hookFunctions.before.call(object, this.routes[i].path, routeParams)) {
            window.page.cmd('wrapperPushState', [{ route: this.currentRoute }, null, this.root + this.clearSlashes(this.currentRoute)]);
            return this;
          }
        }
        // Call route-specific 'before' hook
        if (this.routes[i].hooks && this.routes[i].hooks.before) {
          if (!this.routes[i].hooks.before.call(object, routeParams)) {
            window.page.cmd('wrapperPushState', [{ route: this.currentRoute }, null, this.root + this.clearSlashes(this.currentRoute)]);
            return this;
          }
        }
        this.currentRoute = this.routes[i].path;
        window.scroll(window.pageXOffset, 0);
        if (this.setView) { // Used for Vue-ZeroFrame-Router-Plugin NOTE: May Change
          this.setView(i, this.routes[i].object);
        }
        this.routes[i].controller.call(object, routeParams);
        // Call route-specific 'after' hook
        if (this.routes[i].hooks) {
          this.routes[i].hooks.after.call(object, routeParams);
        }
        if (this.hookFunctions) {
          if (this.hookFunctions.after) {
            this.hookFunctions.after.call(object, this.currentRoute, routeParams);
          }
        }
        return this;
      }
    }
    return this;
  },
  refresh() { // Refreshes the current route - reruns the route's controller function
    this.check(this.currentRoute);
    return this;
  },
  listenForBack(cmd, message) { // Note: Call in the OnRequest function in ZeroFrame class.
    if (!cmd) console.log('[Router] Please pass in cmd and message into Router.listenForBack function');
    if (cmd === 'wrapperPopState') {
      if (message.params.state) {
        if (!message.params.state.url) {
          message.params.state.url = message.params.href.replace(/.*\?/, '');
        }
        this.navigate(message.params.state.url.replace(/^\//, ''), false);
      }
    }
  },
  navigate(path, doPush = true) {
    const previousRoute = this.currentRoute;
    // TODO: Call route-specific 'leave' hook
    // Call global 'leave' hook
    if (this.hookFunctions && this.hookFunctions.leave) {
      if (!this.hookFunctions.leave.call({}, previousRoute)) {
        return this;
      }
    }

    path = path || '';
    if (doPush === true) {
      window.page.cmd('wrapperPushState', [{ route: path }, path, this.root + this.clearSlashes(path)]);
    }
    this.check(path);
    return this;
  },
  hooks(hookFunctions) { // TODO: Check if using correct format?
    this.hookFunctions = hookFunctions;
    return this;
  },
  notFound(f) {
    if (f && typeof f === 'function') {
      this.notFoundFunction = f;
    }
    return this;
  },
};

// Returns a string with the html for a link that will call the Router.navigate
// function when clicked. Example:
//   content += generateRouteLinkHTML(
//     'tutorials/' + tutorial.slug, tutorial.name, 'button is-info',
//     'margin-left: 30px;') + "<br>";
Router.generateRouteLinkHTML = (to, display, tagClass = '', tagStyle = '') => {
  let link = `<a href="./?/${to}" onclick="Router.navigate('${to}'); event.preventDefault();"`;

  if (tagClass && tagClass !== '') {
    link += ` class="${tagClass}"`;
  }
  if (tagStyle && tagStyle !== '') {
    link += ` style="${tagStyle}"`;
  }
  link += `>${display}</a>`;
  return link;
};

export default Router;
