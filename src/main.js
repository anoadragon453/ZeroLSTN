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
		var self = this;

		// Check if user is logged in on pageload
		this.cmdp("siteInfo", {})
			.then(siteInfo => {
				console.log("Gettin it!");
				self.siteInfo = siteInfo;
				app.siteInfo = siteInfo;
				app.getUserInfo();

				console.log("this.siteInfo:");
				console.log(self.siteInfo);

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
        var data_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + this.siteInfo.auth_address + "/data.json";
        var content_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + this.siteInfo.auth_address + "/content.json";

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
	
	// Uploads a file using the BigFile API. Returns new filename.
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

	// Add new song info to user's data.json. Returns new song ID.
	uploadSong(genreAddress, filename, title, album, artist, f = null) {
		// Check user is logged in (assume they are, but just in case...)
		if (!app.siteInfo.cert_user_id) {
    		return this.cmdp("wrapperNotification", ["error", "You must be logged in to post a song."]);
		}
		
		// Get the user's data.json filepath
        var data_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
        var content_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

		var self = this;
		var date = Date.now();
    	return this.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
    		.then((data) => {
				// Get user's existing data
    			data = JSON.parse(data);
    			if (!data) { // If no existing data, make some
    				data = {};
    			}

				// If no songs uploaded yet, create empty array
    			if (!data["songs"]) data["songs"] = [];

				// Add new song with default data
    			data["songs"].push({
					"id": '' + date, // Convert ID to string
					"filename": filename,
					"title": title,
					"album": album,
					"artist": artist,
					"uploader": app.siteInfo.auth_address,
    				"date_added": date
    			});

				// Write values back to JSON string and the data.json
    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

				return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)]);
				
				// Sign and publish site
    		}).then((res) => {
    			if (res === "ok") {
    				return self.cmdp("siteSign", { "inner_path": content_inner_path });
    			} else {
    				return self.cmdp("wrapperNotification", ["error", "Failed to write to data file."]);
    			}
    		}).then((res) => {
				// Run callback function
				if (f !== null && typeof f === "function") f(date);
		});
	}

	// Edit existing song stored in user's data.json. Returns songID.
	editSong(genreAddress, songID, title, album, artist, f = null) {
		// Check user is logged in (assume they are, but just in case...)
		if (!app.siteInfo.cert_user_id) {
    		return this.cmdp("wrapperNotification", ["error", "You must be logged in to post a song."]);
		}
		
		// Get the user's data.json filepath
        var data_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
        var content_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

		var self = this;
    	return this.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
    		.then((data) => {
				// Get user's existing data
    			if (!data) {
					// Can't edit a song if there aren't any yet
					console.log("ERROR");
					return;
				} else {
					// Parse user's data into JS object
					data = JSON.parse(data);
				}
	
				// Can't edit a song if there aren't any yet
				if (!data["songs"]) {
					console.log("ERROR");
					return;
				}

				// Find and edit song with given ID
				var songToEdit = null;
				for (var song of data["songs"]) {
					if (song.id === songID) {
						songToEdit = song
						break;
					}
				}

				if(!songToEdit) {
					console.log("Unable to find song. Given ID: " + songID + ", list:");
					console.log(data["songs"]);
					return;
				}

				// Update with new values
				songToEdit.title = title;
				songToEdit.album = album;
				songToEdit.artist = artist;

				// Write values back to JSON string and the data.json
    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

				return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)]);
				
				// Sign and publish site
    		}).then((res) => {
    			if (res === "ok") {
    				return self.cmdp("siteSign", { "inner_path": content_inner_path });
    			} else {
    				return self.cmdp("wrapperNotification", ["error", "Failed to write to data file."]);
    			}
    		}).then((res) => {
    			if (res === "ok") {
    				return self.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false });
    			} else {
    				return self.cmdp("wrapperNotification", ["error", "Failed to sign user data."]);
				}
			}).then((res) => {
				// Run callback function
				if (f !== null && typeof f === "function") f(songID);
			});
	}

	// Get song info from ID. Returns song object.
	retrieveSongInfo(genreAddress, songID, authAddress, f = null) {	
		// Get the user's data.json filepath
        var data_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + authAddress + "/data.json";
		var content_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + authAddress + "/content.json";
		
    	return this.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
    		.then((data) => {
				// Get user's existing data
    			if (!data) {
					// Can't edit a song if there aren't any yet
					console.log("ERROR");
					return;
				} else {
					// Parse user's data into JS object
					data = JSON.parse(data);
				}
	
				// Can't edit a song if there aren't any yet
				if (!data["songs"]) {
					console.log("ERROR");
					return;
				}

				// Find and edit song with given ID
				var songToRetrieve = null;
				for (var song of data["songs"]) {
					if (song.id === songID) {
						songToRetrieve = song
						break;
					}
				}

				console.log("Got song:");
				console.log(songToRetrieve);

				// Run callback function
				if (f !== null && typeof f === "function") f(songToRetrieve);
		});
	}

	getSongsByUser(userAuthAddress) {
		var query = `
		SELECT * FROM songs
			LEFT JOIN json USING (json_id)
			WHERE uploader='${userAuthAddress}'
			ORDER BY date_added ASC
		`;
	
		return this.cmdp("dbQuery", [query]);
	}
}

page = new ZeroApp();

var Uploads = require("./router_pages/uploads.vue");
var Edit = require("./router_pages/edit.vue");
var Home = require("./router_pages/home.vue");

VueZeroFrameRouter.VueZeroFrameRouter_Init(Router, app, [
	{ route: "uploads", component: Uploads },
	{ route: "edit/:genre/:songID", component: Edit },
	{ route: "", component: Home }
]);
