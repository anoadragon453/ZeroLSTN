version = "0.1"

// JS Animations
var anime = require("animejs");
window.anime = anime;

// Material CSS
var Materialize = require("materialize-css/dist/js/materialize.min.js");

var ZeroFrame = require("./libs/ZeroFrame.js");
var Router = require("./libs/router.js");
var Vue = require("vue/dist/vue.min.js");
var VueZeroFrameRouter = require("./libs/vue-zeroframe-router.js");

var { sanitizeStringForUrl, sanitizeStringForUrl_SQL, html_substr, sanitizeHtmlForDb } = require("./util.js");

// Initial Vue plugins
Vue.use(VueZeroFrameRouter.VueZeroFrameRouter);

// Vue components
var NavBar = require("./vue_components/navbar.vue");
var FooterBar = require("./vue_components/footer_bar.vue");

var app = new Vue({
	el: "#app",
	template: `<div>
			<component ref="navbar" :is="navbar" :user-info="userInfo"></component>
			<component ref="view" :is="currentView" :merger-zites="mergerZites"></component>
			<component ref="footerBar" :is="footerBar"></component>
		</div>`,
	data: {
		currentView: null,
		navbar: NavBar,
		footerBar: FooterBar,
		userInfo: null,
		siteInfo: null,
		mergerZites: null
	},
	methods: {
		getUserInfo: function(f = null) { // TODO: This can be passed in a function as a callback
            if (this.siteInfo == null || this.siteInfo.cert_user_id == null) {
                this.userInfo = null;
                return;
            }

            console.log("Getting User Info");

            var that = this;

            that.userInfo = {
                cert_user_id: that.siteInfo.cert_user_id,
                auth_address: that.siteInfo.auth_address
            };
            that.$emit("setUserInfo", that.userInfo);
            if (f !== null && typeof f === "function") f();
		}
	}
});

class ZeroApp extends ZeroFrame {
	onOpenWebsocket() {
		// Check if user is logged in on pageload
		this.cmdp("siteInfo", {})
			.then(siteInfo => {
				self.siteInfo = siteInfo;
				app.siteInfo = siteInfo;
				app.getUserInfo();

			// Add initial merger sites/genres
			page.requestPermission("Merger:ZeroLSTN", siteInfo, function() {
				page.cmdp("mergerSiteList", [true])
					.then((mergerZites) => {
						console.log("Got Merger Zites");
						if (!mergerZites["1JErkEXytYwAb8xvwKVKfbNmP2EZxPewbE"]) {
							page.addMerger("1JErkEXytYwAb8xvwKVKfbNmP2EZxPewbE")
								.then(() => {
									return self.cmdp("wrapperNotification", ["info", "You may need to refresh to see new music."]);
								});
						} else {
							app.mergerZites = mergerZites;
							app.$emit('setMergerZites', mergerZites);
						}
					});
			});
		});
	}

	// Request permission to the ZeroLSTN merger/access ZeroLSTN site data
	requestPermission(permission, siteInfo, callback) {
		// Already have permission
		if (siteInfo.settings.permissions.indexOf(permission) > -1) {
			callback();
			return;
		}

		this.cmdp("wrapperPermissionAdd", [permission])
			.then(callback);
	}

	// Adds a new merger site
	addMerger(ziteAddress) {
		var self = this;

		return this.cmdp("mergerSiteAdd", [ziteAddress])
			.then(() => {
				return self.cmdp("mergerSiteList", [true])
					.then((mergerZites) => {
						app.mergerZites = mergerZites;
						app.$emit('setMergerZites', mergerZites);
						return mergerZites;
						//self.cmdp("wrapperOpenWindow", [self.siteInfo.address]);
					});
			});
	}

	// Needed for ZeroRouter to work properly
	onRequest(cmd, message) {
		Router.listenForBack(cmd, message);
		if (cmd === "setSiteInfo") {
			this.siteInfo = message.params;
			app.siteInfo = message.params;
			app.getUserInfo();
		}

		if (message.params.event[0] === "file_done") {
			app.$emit("update");
		}
	}

	selectUser() {
		return this.cmdp("certSelect", { accepted_domains: ["zeroid.bit", "kaffie.bit", "cryptoid.bit", "peak.id"] });
    }

    signout() {
    	return this.cmdp("certSelect", { accepted_domains: [""] });
    }

    unimplemented() {
        return page.cmdp("wrapperNotification", ["info", "Unimplemented!"]);
	}

	checkOptional(genreAddress, doSignPublish, f) {
		// Make sure user is logged in first
        if (!app.userInfo || !app.userInfo.cert_user_id) {
            this.cmd("wrapperNotification", ["info", "Please login first."]);
            return;
        }

		// Get the user's data.json filepath
        var data_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
        var content_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

        // Verify that user has correct "optional" and "ignore" values
        page.cmd("fileGet", { "inner_path": content_inner_path, "required": false }, (data) => {
            if (!data) {
				console.log("Creating default data.json...");
				data = {};
			} else {
				data = JSON.parse(data);
			}

			// Allowed filetypes
            var curoptional = ".+\\.(mp3|flac|ogg|mp4|webm)";
            var changed = false;
            if (!data.hasOwnProperty("optional") || data.optional !== curoptional){
                data.optional = curoptional
                changed = true;
            }

            var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));

            if (changed) {
                // Write (and Sign and Publish is doSignPublish)
                page.cmd("fileWrite", [content_inner_path, btoa(json_raw)], (res) => {
                    if (res === "ok") {
                        if (f != null && typeof f === "function") f();
                        if (doSignPublish) {
                            page.cmd("siteSign", { "inner_path": content_inner_path }, () => {
                                page.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false });
                            });
                        }
                    } else {
                        page.cmd("wrapperNotification", ["error", "File write error: " + JSON.stringify(res)]);
                    }
                });
            } else {
                if (f != null && typeof f === "function") f();
            }
        });
	}
	
	// Uploads a file using the BigFile API
	uploadBigFile(genreAddress, file, f = null) {
		console.log("Got it!");
        var date_added = Date.now();
        var orig_filename_list = file.name.split(".");
        var filename = orig_filename_list[0].replace(/\s/g, "_").replace(/[^\x00-\x7F]/g, "").replace(/\'/g, "").replace(/\"/g, "") + "-" + date_added + "." + orig_filename_list[orig_filename_list.length - 1];

		var f_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/" + filename;
		console.log(f_path);

        page.checkOptional(genreAddress, false, () => {
            page.cmd("bigfileUploadInit", [f_path, file.size], (init_res) => {
                var formdata = new FormData();
                formdata.append(file.name, file);

                var req = new XMLHttpRequest();

                req.upload.addEventListener("progress", console.log);
                req.upload.addEventListener("loadend", () => {
                    page.cmd("wrapperNotification", ["info", "Upload finished!"]);
                    if (f !== null && typeof f === "function") f(filename);
                });
                req.withCredentials = true;
                req.open("POST", init_res.url);
                req.send(formdata);
            });
        });
	}

	// TODO: Adapt for editing song information
	editStory(story_id, title, description, body, tags, language, f = null) {
        if (!app.userInfo || !app.userInfo.cert_user_id) {
            this.cmd("wrapperNotification", ["info", "Please login first."]);
            //page.selectUser(); // TODO: Check if user has data, if not, show the registration modal.
            return;
        }

        var data_inner_path = "merged-ZeroLSTN/data/users/" + app.userInfo.auth_address + "/data.json";
        var content_inner_path = "merged-ZeroLSTN/data/users/" + app.userInfo.auth_address + "/content.json";

        page.cmd("fileGet", { "inner_path": data_inner_path, "required": false }, (data) => {
            if (!data) {
                console.log("ERROR");
                return;
            } else {
                data = JSON.parse(data);
            }

            if (!data["stories"]) {
                console.log("ERROR");
                return;
            }

            // Is slug already exists, append (updated) date to it
            var storyDate = Date.now();
            var storySlug = sanitizeStringForUrl(title);

            for (var story of data["stories"]) {
                if (story.slug == storySlug && story.story_id != story_id) {
                    storySlug += "-" + storyDate;
                    break;
                }
            }

            for (var i = 0; i < data["stories"].length; i++) {
                var story = data["stories"][i];
                if (story.story_id == story_id) {
                    story.title = title;
                    story.slug = storySlug;
                    story.body = page.sanitizeHtml(body);
                    story.tags = tags;
                    if (language && language !== "") {
                        story.language = language;
                    }
                    story.description = description;
                    story.date_updated = storyDate;
                    break;
                }
            }

            var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));

            page.cmd("fileWrite", [data_inner_path, btoa(json_raw)], (res) => {
                if (res === "ok") {
                    page.cmd("siteSign", { "inner_path": content_inner_path }, (res) => {
                        if (f != null && typeof f === "function") {
                            f(storySlug);
                        }
						page.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false });
                    });
                }
            });
        });
	}
}

page = new ZeroApp();

var Uploads = require("./router_pages/uploads.vue");
var Edit = require("./router_pages/edit.vue");
var Home = require("./router_pages/home.vue");

VueZeroFrameRouter.VueZeroFrameRouter_Init(Router, app, [
	{ route: "uploads", component: Uploads },
	{ route: "edit/:filename", component: Edit },
	{ route: "", component: Home }
]);
