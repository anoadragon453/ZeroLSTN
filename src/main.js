version = "1.0.6";
var indexAddress = "1iNdEXm7ZNDpwyHHTtsh7QMiMDyx2wUZB";
var defaultGenreAddress = "1GEnReVHyvRwC4BR32UnVwHX7npUmxVpiY";

// JS Animations
var anime = require("animejs");
window.anime = anime;

// Hashing
var sha512 = require("js-sha512").sha512;

// Material CSS
var Materialize = require("materialize-css/dist/js/materialize.min.js");

var ZeroFrame = require("./libs/ZeroFrame.js");
var Router = require("./libs/router.js");
var Vue = require("vue/dist/vue.js");
var VueZeroFrameRouter = require("./libs/vue-zeroframe-router.js");
var AsyncComputed = require('vue-async-computed');

var { sanitizeStringForUrl, sanitizeStringForUrl_SQL, html_substr, sanitizeHtmlForDb } = require("./util.js");

// Initial Vue plugins
Vue.use(VueZeroFrameRouter.VueZeroFrameRouter);
Vue.use(AsyncComputed);

// Vue components
var NavBar = require("./vue_components/navbar.vue");
var FooterBar = require("./vue_components/footer_bar.vue");

var app = new Vue({
	components: {
		navbar: NavBar,					// Navbar - Vue component
		footerBar: FooterBar			// Footer - Vue component
	},
	el: "#app",
	template: `
		<div>
			<navbar ref="navbar" :zite-version="ziteVersion" :user-info="userInfo"></navbar>
			<component ref="view" :is="currentView" :play-queue-obj="playQueue" :queue-index="queueIndex" :audio-playing="audioPlaying" :current-song="currentSong" :merger-zites="mergerZites"></component>
			<footerBar ref="footerBar" :current-song="currentSong" :audio-playing="audioPlaying"></footerBar>
		</div>`,
	data: {
		ziteVersion: version,			// ZeroLSTN version number
		currentView: null,				// Current View - Vue component (dynamic)
		currentSong: null,				// The currently playing song
		userInfo: null,					// ZeroFrame userInfo object
		siteInfo: null,					// ZeroFrame siteInfo object
		mergerZites: null,				// List of all merger Zites (genres) we know of
		playQueue: [],					// Play Queue itself
		queueIndex: 0,					// Current index in the play queue of song we're playing
		audioVolume: 80,				// Current audio volume
		audioObject: null, 				// Object housing JS audio object (play, pause, etc)
		audioPlaying: false,				// Track whether audio is currently playing
		queueJustCleared: false,		// Skip to first song in queue if it was just cleared
		playlists: []					// User's playlists, pulled from data.json on reload
		// TODO: Sharing playlists?
	},
	methods: {
		getUserInfo: function(f = null) {
            if (this.siteInfo == null || this.siteInfo.cert_user_id == null) {
                this.userInfo = null;
                return;
            }

			// Keep a reference to our own state
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
		// Make the webpage mobile-compatible
		this.cmdp("wrapperSetViewport", ["width=device-width", "initial=scale=1.0"]);
		var self = this;

		// Check if user is logged in on pageload
		this.cmdp("siteInfo", {})
			.then(siteInfo => {
				self.siteInfo = siteInfo;
				app.siteInfo = siteInfo;
				app.getUserInfo();

			// Ensure genre index and default genre sites are loaded
			page.requestPermission("Merger:ZeroLSTN", siteInfo, function() {
				page.cmdp("mergerSiteList", [true])
					.then((mergerZites) => {
						console.log("Got Merger Zites");
						// If we aren't already connected to the index or genre, add them
						if (!mergerZites[indexAddress]){
							page.addMerger(indexAddress);
						} 
						if (!mergerZites[defaultGenreAddress]) {
							page.addMerger(defaultGenreAddress);
						}
						app.mergerZites = mergerZites;
						app.$emit('setMergerZites', mergerZites);
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
						app.$emit('genreIndexUpdate');
						self.cmd("wrapperNotification", ["info", "You may need to refresh to see new music."]);
						return mergerZites;
					});
			});
	}

	// Removes a merger site
	removeMerger(ziteAddress) {
		console.log("Removing", ziteAddress)
		console.log(app.mergerZites)
		var self = this;

		return this.cmdp("mergerSiteDelete", [ziteAddress])
			.then((res) => {
				return self.cmdp("mergerSiteList", [true])
					.then((mergerZites) => {
						console.log(mergerZites)
						app.mergerZites = mergerZites;
						app.$emit('setMergerZites', mergerZites);
						app.$emit('genreIndexUpdate');
						self.cmd("wrapperNotification", ["info", "Genre removed. Refresh to see changes."]);
						return mergerZites;
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

		if (message.params.event && message.params.event[0] === "file_done") {
			app.$emit("update");
		}
	}

	isUserSignedIn() {
		return app.siteInfo.cert_user_id != null;
	}

	selectUser() {
		return this.cmdp("certSelect", { accepted_domains: ["zeroid.bit", "kaffie.bit", "cryptoid.bit"] });
    }

    signout() {
    	return this.cmdp("certSelect", { accepted_domains: [""] });
	}

    unimplemented() {
        return page.cmdp("wrapperNotification", ["info", "Unimplemented!"]);
	}

	// Triggered when logo is clicked
	// TODO: Shouldn't be necessary after moving index_genre to its own page1
	goHome() {
		app.$emit("goHome");
	}

	// -------------------------------------------------- //
	// ------ Uploading, Editing and Deleting Songs ----- //

	// Check user has correct "optional" and "ignore" values set in their own content.json
	checkOptional(genreAddress, doSignPublish, f) {
		// Make sure user is logged in first
        if (!app.userInfo || !app.userInfo.cert_user_id) {
            this.cmd("wrapperNotification", ["info", "Please login first."]);
            return;
        }

		// Get the user's data.json filepath
        var content_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

        // Verify that user has correct "optional" and "ignore" values
        page.cmd("fileGet", { "inner_path": content_inner_path, "required": false }, (data) => {
            if (!data) {
				console.log("Creating default content.json...");
				data = {};
			} else {
				data = JSON.parse(data);
			}

			// Allowed filetypes
            var curoptional = ".+\\.(mp3|flac|ogg|m4a|mp4|webm)";
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
                    page.cmd("wrapperNotification", ["info", "File saved. Click Save to publish!"]);
                    if (f !== null && typeof f === "function") f(filename);
                });
                req.withCredentials = true;
                req.open("POST", init_res.url);
                req.send(formdata);
            });
        });
	}

	// Store uploaded album art on a genre
	uploadImage(file, file_data, genreAddress, existingImageToDelete=null, doSignAndPublish=false) {
        var data_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
		
		// Calculate hash of image file. Save only first 64 chars
		var hash = sha512(file_data).substring(0,64);

		// Check if image already exists in this genre
		// If so return filepath to it
		var query = `
			SELECT image_path FROM artwork as art
			LEFT JOIN json as js
				USING (json_id)
			WHERE art.hash="${hash}" AND js.site="${genreAddress}"
		`;
	
		// Execute query
		var self = this;
		return page.cmdp("dbQuery", [query])
			.then((art) => {
				console.log(art);
				if (art.length > 0) {
					// Return existing image in this genre
					console.log("Returning existing artwork path");
					return self.newPromise(art[0].image_path)
				}
				
				// Open data file and write details about album art
				return page.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
					.then((data) => {
					if (!data) {
						console.log("Unable to read", data_inner_path)
						return;
					}

					// Parse the existing information
					data = JSON.parse(data);

					// Create artwork object if it doesn't exist already
					if (!data["artwork"]) {
						data["artwork"] = {};
					}

					// TODO: Delete existing artwork if there is any

					// Get current time, accounts for artwork with same file name
					var date_added = Date.now();

					// .replace(/[^\x00-\x7F]/g, "") removes non-ascii characters
					// Ascii is defined as being between 0 and 127 (x7F is 127 in hex)
					// [^] matches anything that is NOT within the brackets, therefore
					// [^\x00-\x7F] will match anything that is NOT ascii
					var orig_filename_list = file.name.split(".");
					var filename = orig_filename_list[0].replace(/\s/g, "_").replace(/[^\x00-\x7F]/g, "").replace(/\'/g, "").replace(/\"/g, "") + "-" + date_added + "." + orig_filename_list[orig_filename_list.length - 1];

					// Get inner path of image file
					var filepath = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/artwork/" + filename;

					data["artwork"][hash] = {
						"image_path": filepath,
						"date_added": date_added
					};

					// Write image to inner data path
					return page.cmdp("fileWrite", [filepath, file_data])
						.then((res) => {
						if (res === "ok") {
							// Pin file so it is excluded from the automated optional file cleanup
							page.cmdp("optionalFilePin", { "inner_path": filepath });

							// Add file to data.json
							var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
							return page.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
								.then((res) => {
								if (res === "ok") {
									// Return the resulting image URL as a promise
									return self.newPromise(filepath);
								} else {
									page.cmdp("wrapperNotification", ["error", "Unable to write artwork metadata: " + JSON.stringify(res)]);
								}
							});
						} else {
							page.cmdp("wrapperNotification", ["error", "Unable to save artwork: " + JSON.stringify(res)]);
						}
					});
				});
			});
	}

	// Remove an image
	deleteImage(genreAddress, filepath) {
		var data_inner_path = "merged-ZeroLSTN/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
		console.log("Deleting", filepath)

		// Only delete image if no other song is using it
		// Check if any other songs are using this artwork. If count is greater than one, don't delete
		var query = `
			SELECT COUNT(art) FROM songs as song
			LEFT JOIN json as js
				USING (json_id)
			WHERE song.art="${filepath}" AND js.site="${genreAddress}"
		`;
	
		// Execute query
		var self = this;
		return page.cmdp("dbQuery", [query])
			.then((songCount) => {
			// Return if other songs are using this artwork
			if (songCount > 1) {
				return self.newPromise(null);
			}

			// Get the image hash from the database
			var query = `
				SELECT hash FROM artwork
				WHERE image_path="${filepath}"
			`;

			return page.cmdp("dbQuery", [query])
				.then((hashes) => {
				if (hashes.length == 0) {
					// Couldn't find the file hash
					console.log("Unable to find file hash for", filepath);
					return self.newPromise(null);
				}
				var hash = hashes[0].hash;

				// Remove existing has metadata from user's data.json
				return page.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
					.then((data) => {
					if (!data) {
						console.log("No data available", data_inner_path)
						return;
					}

					// Parse the existing information
					data = JSON.parse(data);

					// Return if artwork doesn't exist already
					if (!data["artwork"]) {
						return;
					}

					// Delete the artwork information
					delete data["artwork"][hash];

					// Convert object to JSON
					var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));

					// Write image to inner data path
					return page.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
						.then((res) => {
							if (res === "ok") {
								// Delete the image file itself
								return page.cmdp("fileDelete", [filepath])
								.then((res) => {
									if (res !== "ok") {
										// Show an error if deletion was unsuccessful
										return page.cmdp("wrapperNotification", ["error", "Unable to delete artwork: " + JSON.stringify(res)]);
									}

									// Just return an empty promise (heh)
									return self.newPromise(null);
								});
							}

							return page.cmdp("wrapperNotification", ["error", "Unable to write data.json: " + JSON.stringify(res)]);
					});
				});
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
				if (!data["songs"]) data["songs"] = {};

				// Add new song with default data
    			data["songs"]['' + date] = { // Convert date to string
					"filename": filename,
					"title": title,
					"album": album,
					"artist": artist,
    				"date_added": date
    			};

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
	editSong(genreAddress, songID, title, album, artist, art, f = null) {
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

				// Update with new values
				data["songs"][songID].title = title;
				data["songs"][songID].album = album;
				data["songs"][songID].artist = artist;
				data["songs"][songID].art = art;

				// Write values back to JSON string and the data.json
    			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

				return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)]);
				
				// Sign and publish site
    		}).then((res) => {
				// Return to uploads page while it publishes
				if (f !== null && typeof f === "function") f(songID);
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
			});
	}

	deleteSong(song) {
		// Remove from user's data.json then delete song file and its piecemap
		var data_inner_path = "merged-ZeroLSTN/" + song.site + "/data/users/" + app.siteInfo.auth_address + "/data.json";
		var content_inner_path = "merged-ZeroLSTN/" + song.site + "/data/users/" + app.siteInfo.auth_address + "/content.json";
		var songFilepath = "merged-ZeroLSTN/" + song.site + "/data/users/" + app.siteInfo.auth_address + "/" + song.filename;
		var pieceMapFilepath = songFilepath + ".piecemap.msgpack";

		console.log("Deleting song:", song.title)

		return this.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
			.then((data) => {
				// Get user's existing data
				if (!data) {
					// Can't remove a song if there aren't any yet
					console.log("ERROR");
					return;
				} else {
					// Parse user's data into JS object
					data = JSON.parse(data);
				}
	
				// Return if no songs available
				if (!data["songs"]) {
					console.log("ERROR");
					return;
				}

				// Remove the song
				delete data["songs"][song.id];

				// Write values back to JSON string and the data.json
				var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));

				return this.cmdp("fileWrite", [data_inner_path, btoa(json_raw)]);
			}).then((res) => {
				// Delete file and piecemap
				console.log("Deleting MP3", songFilepath)
				return this.cmdp("fileDelete", { "inner_path": songFilepath})
			}).catch((e) => {
				console.log("Proxy issue. See HelloZeroNet/ZeroNet#1140")
				return "ok";
			}).then((res) => {
				// If delete was not successful, show the error in a notification
				if (res != "ok") {
					return this.cmdp("wrapperNotification", ["error", res]);	
				}

				console.log("Deleting pieceMap", pieceMapFilepath)
				return this.cmdp("fileDelete", { "inner_path": pieceMapFilepath})
			}).catch((e) => {
				console.log("Proxy issue. See HelloZeroNet/ZeroNet#1140")
				return "ok";
			}).then((res) => {
				// If delete was not successful, show the error in a notification
				if (res != "ok") {
					return this.cmdp("wrapperNotification", ["error", res]);	
				}

				console.log("Delete successful");
				// Sign and publish site
			}).then(() => {
				// Tell Vue objects that the song has been deleted (refreshes uploads page)
				app.$emit("songDeleted");

				return this.cmdp("siteSign", { "inner_path": content_inner_path });
			}).then((res) => {
				if (res === "ok") {
					return this.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false });
				} else {
					return this.cmdp("wrapperNotification", ["error", "Failed to sign user data."]);
				}
			})
		
	}

	// -------------------------------------------------- //
	// ------------ Installing/Editing Genres ----------- //

	// Adds a new genre to the index
	installGenre(genreName, genreAddress) {
		console.log("Creating: " + genreAddress);
		var data_inner_path = "merged-ZeroLSTN/" + indexAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
		var content_inner_path = "merged-ZeroLSTN/" + indexAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";
		this.cmd("fileGet", { "inner_path": data_inner_path, "required": false }, (data) => {
			if (!data) {
				console.log("Creating default data.json...");
				data = {};
			} else {
				data = JSON.parse(data);
			}

			// Create "genres" object if it doesn't exist
			if (!data.genres) {
				data.genres = {};
			}

			// Add genre name and address to the index
			data.genres[genreAddress] = {
				name: genreName,
				date_added: Date.now()
			}			

			// Write (and Sign and Publish)
			var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
			this.cmd("fileWrite", [data_inner_path, btoa(json_raw)], (res) => {
				if (res === "ok") {
					this.cmd("siteSign", { "inner_path": content_inner_path }, () => {
						this.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false }, (res) => {
							// Tell genre index to update
							app.$emit("genreIndexUpdate");
						});
					});
				} else {
					this.cmd("wrapperNotification", ["error", "File write error: " + JSON.stringify(res)]);
				}
			});
		});
	}

	// Edits a genre in the index and changes content in the mergerZite
	editGenre(genreName, genreAddress) {
		console.log("editing: " + genreName + "/" + genreAddress)
		var index_data_inner_path = "merged-ZeroLSTN/" + indexAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
		var index_content_inner_path = "merged-ZeroLSTN/" + indexAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";
		var genre_content_path = "merged-ZeroLSTN/" + genreAddress + "/content.json";
		console.log("[genre_path]", genre_content_path)
		 
		// Keep a reference to ourselves
		var self = this;
		return self.cmdp("fileGet", { "inner_path": genre_content_path, "required": false })
			.then((content) => {
				// Return if there's no content
				console.log("[content]", content)
				if (!content) {
					return { then: function() {} };  // Break the promise chain
				} else {
					content = JSON.parse(content);
				}

				// Set the new name of the genre
				content.title = genreName;

				// Write the new genre's content.json
				var json_raw = unescape(encodeURIComponent(JSON.stringify(content, undefined, "\t")));
				return self.cmdp("fileWrite", [genre_content_path, btoa(json_raw)])
			.then((res) => {
				if (res !== "ok") {
					this.cmd("wrapperNotification", ["error", "File write error: " + JSON.stringify(res)]);
					return { then: function() {} };
				}

				// Write to the index
				return self.cmdp("fileGet", { "inner_path": index_data_inner_path, "required": false })
			.then((data) => {
				// Return if there's no data file
				if (!data) {
					return { then: function() {} };
				} else {
					data = JSON.parse(data);
				}

				// Change the genre's attributes in the index
				data.genres[genreAddress].name = genreName;

				// Write back to the index
				var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
				return self.cmdp("fileWrite", [index_data_inner_path, btoa(json_raw)]);
			}).then((res) => {
				if (res !== "ok") {
					return { then: function() {} };
				}

				// Sign/Publish genre's content.json
				return self.cmdp("siteSign", { privatekey: "stored", "inner_path": genre_content_path })
					.then((res) => {
						if (res !== "ok") {
							return { then: function() {} };
						}

						return self.cmd("sitePublish", { "inner_path": genre_content_path, "sign": false })
					}).then((res) => {
						// Sign/Publish the index entry
						return self.cmdp("siteSign", { "inner_path": index_content_inner_path })
							.then((res) => {
								if (res !== "ok") {
									return { then: function() {} };
								}
								
								return self.cmd("sitePublish", { "inner_path": index_content_inner_path, "sign": false });
							})
					});
			});
			});
		});
	}

	// Removes an existing genre from the index
	removeGenre(genreAddress) {
		console.log("Removing: " + genreAddress);
		var data_inner_path = "merged-ZeroLSTN/" + indexAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
		var content_inner_path = "merged-ZeroLSTN/" + indexAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";
		console.log(data_inner_path)

		// Keep a reference to ourselves
		var self = this;
		return self.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
			.then((data) => {
				// Return if there's no data file
				if (!data) {
					return { then: function() {} };  // Break the promise chain
				} else {
					data = JSON.parse(data);
				}

				console.log(data)

				// If there are no genres here, just return
				if (!data.genres) {
					return { then: function() {} };
				}

				// Remove genre from the index
				delete data.genres[genreAddress];
				
				console.log(data)

				// Write (and Sign and Publish)
				var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
				return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)])
			}).then((res) => {
				return self.cmdp("siteSign", { "inner_path": content_inner_path })
			}).then((res) => {
				return self.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false })
			});
	}

	// -------------------------------------------------- //
	// ----- Retrieving Song/Album/Artist/Genre info ---- //

	// Convert genre array into genre[address] = {name}
	convertArrayOfGenresToMap(genres) {
		var genreMap = {};
		genres.forEach(function(genre) {
			genreMap[genre.address] = { name: genre.name };
		});
		return genreMap;
	}

	// Return list of genres from the Genre Index
	getGenresFromIndex() {
		var query = `
		SELECT * FROM genres
			LEFT JOIN json USING (json_id)
			ORDER BY date_added ASC
		`;
	
		// Convert genre array to map
		var self = this;
		return this.cmdp("dbQuery", [query])
			.then((genres) => {
				return new Promise((resolve, reject) => {
					resolve(self.convertArrayOfGenresToMap(genres));
				});
			});
	}

	// Get name of a genre from its address
	getGenreNameFromAddress(address) {
		var query = `
		SELECT name FROM genres
			WHERE address='${address}'
			LIMIT 1
		`

		return this.cmdp("dbQuery", [query])
	}

	// Return list of a specific user's genres from the Genre Index
	getUserGenresFromIndex(authAddress) {
		var query = `
		SELECT * FROM genres
			LEFT JOIN json USING (json_id)
			WHERE directory='data/users/${authAddress}'
			ORDER BY name COLLATE NOCASE
		`;
	
		// Convert genre array to map
		var self = this;
		return this.cmdp("dbQuery", [query])
			.then((genres) => {
				return new Promise((resolve, reject) => {
					resolve(self.convertArrayOfGenresToMap(genres));
				});
			});
	}

	// Returns an array of our connected genres
	getConnectedGenres() {
		// Get list of merger zites
		return page.cmdp("mergerSiteList", [true])
        	.then((mergerZites) => {
				return new Promise((resolve, reject) => {
					// Compute genres and store as a map
					var genreMap = {};
					console.log("MergerZites:")
					console.log(mergerZites)
					for (var ziteAddress in mergerZites) {
						genreMap[ziteAddress] = { name: mergerZites[ziteAddress].content.title };
					}
					resolve(genreMap);
				});
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

				// Check for the song by ID
				if (data["songs"][songID]) {
					// Add ID to song
					data["songs"][songID].id = songID;

					// Run callback function
					if (f !== null && typeof f === "function") f(data["songs"][songID]);
				} else {
					// Return null if we didn't find it
					if (f !== null && typeof f === "function") f(null);
				}
		});
	}

	// Get all songs a user has uploaded as an array
	getSongsByUser(userAuthAddress) {
		var query = `
		SELECT * FROM songs
			LEFT JOIN json USING (json_id)
			WHERE directory="data/users/${userAuthAddress}"
			ORDER BY title COLLATE NOCASE
		`;
	
		return this.cmdp("dbQuery", [query]);
	}

	// Returns number of songs in a given genre
	countSongsInGenre(genreAddress) {
		var query = `
		SELECT COUNT (*) FROM songs
		`;

		var self = this;
		return this.cmdp("dbQuery", [query])
			.then((res) => {
				// Unpack count into just a single integer
				return self.newPromise(res[0]["COUNT (*)"]);
			});
	}

	// Returns a list of all songs, with an optional max song amount and offset
	getAllSongs(limit = 0, offset = 0) {
		var query = `
		SELECT * FROM songs
			LEFT JOIN json USING (json_id)
			ORDER BY title COLLATE NOCASE
		`;

		// Execute query
		return this.cmdp("dbQuery", [query]);
	}

	// Returns a list of all albums, with an optional max song amount and offset
	// TODO: Deal with two artists having the same name for an album
	// Somehow send information back with both artist and album...
	getAllAlbums(limit = 0, offset = 0) {
		var query = `
		SELECT DISTINCT album, artist FROM songs
			LEFT JOIN json USING (json_id)
			ORDER BY album COLLATE NOCASE
		`;
	
		// Execute query
		return this.cmdp("dbQuery", [query])
			.then((albumObjs) => {
				// Return array of { "album": "abc", "artist": "xyz"} objects
				return albumObjs;
			});
	}

	// Returns an array of all known artist names, with an optional max song amount and offset
	getAllArtists(limit = 0, offset = 0) {
		var query = `
		SELECT DISTINCT artist FROM songs
			LEFT JOIN json USING (json_id)
			ORDER BY artist COLLATE NOCASE
		`;
	
		return this.cmdp("dbQuery", [query])
			.then((artistObjs) => {
				// Unpack "artist" string attribute into its own array of strings
				return new Promise((resolve, reject) => {
					resolve(artistObjs.map(function(a) {return a.artist;}));
				});
			});
	}

	// Returns an array of album titles, made by the given artist
	getAlbumsByArtist(artistName) {
		var query = `
		SELECT DISTINCT album FROM songs
			LEFT JOIN json USING (json_id)
			WHERE artist="${artistName}"
			ORDER BY album COLLATE NOCASE
		`;
	
		return this.cmdp("dbQuery", [query])
			.then((albumObjs) => {
				// Unpack "albums" string attribute into its own array of strings
				return new Promise((resolve, reject) => {
					resolve(albumObjs.map(function(a) {return a.album;}));
				});
			});
	}

	// Get and attach file info to song object
	getInfoForSongs(songs) {
		return new Promise((resolve, reject) => {
			songs.forEach(function(song) {
				// Get the info for each song
				song.info = page.cmdp("optionalFileInfo", ["merged-ZeroLSTN/" + song.site + "/" + song.directory + "/" + song.filename]);
			});
			
			// Return the list of songs
			resolve(songs);
		});
	}

	// Returns all songs in a given artist's album
	getSongsInAlbum(albumName, artistName) {
		var query = `
		SELECT * FROM songs
			LEFT JOIN json USING (json_id)
			WHERE album="${albumName}"
			AND artist="${artistName}"
			ORDER BY date_added ASC
		`;
	
		var self = this;
		return this.cmdp("dbQuery", [query])
			.then((songs) => {
				return self.getInfoForSongs(songs);
			})
	}

	// TODO: Sort by song number

	// -------------------------------------------------- //
	// ------------- Play Queue Operations -------------- //

	// Play a music file
	playSongFile(filepath) {
		// If audioObject already exists, change its source
		if(app.audioObject) {
			app.audioObject.src = filepath;
			app.audioObject.load();
		} else { // Otherwise make a new audio object
			app.audioObject = new Audio(filepath);
		}

		// Set the audio source's volume
		app.audioObject.volume = app.audioVolume / 100;
		this.playCurrentSong();
	}

	// Play the current running audio
	playCurrentSong() {
		// If there isn't any audio available yet, play first song in queue
		console.log("Playing current song")
		if (!app.audioObject) {
			if(app.playQueue.length > 0) {
				this.playSongAtQueueIndex(0);
			} else {
				// If we've got no queue, don't play anything
				return;
			}
		} else {
			app.audioObject.play();

			// Note down when audio is playing
			app.audioPlaying = true;
		}
	}

	// Pause the current running audio
	pauseCurrentSong() {
		app.audioObject.pause();

		// Note down when audio is playing
		app.audioPlaying = false;
	}

	// Play a given song object
	playSong(song) {
		var filepath = "merged-ZeroLSTN/" + song.site + "/" + song.directory + "/" + song.filename;

		// Play the song
		this.playSongFile(filepath);

		// Allow Vue components to access the current playing song
		app.currentSong = song;

		// Update footer with new song duration once metadata has been loaded
		app.audioObject.addEventListener('loadedmetadata', function() {
			console.log("Updating with duration: " + app.audioObject.duration);
			app.$emit("updateSongDuration", app.audioObject.duration);
		});

		// Add event listener for when song finishes, so we can either move to the next song,
		// or stop the playback if it's the last song in the queue
		var self = this;
		app.audioObject.addEventListener('ended', function() {
			self.songEnded();
		});
	}

	// Called when the current song ends
	songEnded() {
		console.log("Song ended. Current index: " + app.queueIndex);
		// Check if this is the same song in the queue
		if (app.queueIndex == app.playQueue.length - 1){
			return;
		}

		// Otherwise move on to the next song in the queue
		this.nextSong();
	}

	// Place a song at end of play queue and skip to it.
	playSongImmediately(song) {
		// If this song is currently playing, just unpause
		if (app.currentSong && song.filename == app.currentSong.filename) {
			this.playCurrentSong();
			return;
		}

		// Add song to the queue
		app.playQueue.push(song);

		// Set index to end of queue
		app.queueIndex = app.playQueue.length - 1;

		this.playSongAtQueueIndex(app.queueIndex);
	}

	// Queue an array of songs
	queueSongs(songs) {
		app.playQueue.push(...songs);
	}

	// Add a song to the end of the play queue
	queueSong(song) {
		console.log("Queueing " + song.title + " by " + song.artist);
		app.playQueue.push(song);

		// Make sure our queueIndex exists
		// Update Vue components that play queue changed
		console.log("Emitting update!")
		console.log("Mainapp's queue:")
		console.log(app.playQueue);
		console.log("Current queue index: " + app.queueIndex);
	}

	// Removes a single song from the play queue
	removeSongFromQueue(song) {
		var index = app.playQueue.indexOf(song);
		if (index != -1) {
			app.playQueue.splice(index, 1);
			if (index < app.queueIndex) {
				app.queueIndex--;
				if (app.queueIndex < 0) { app.queueIndex = 0; }
			} else if (index == app.queueIndex) {
				// If the current song was removed, try to play the next song
				this.playSongAtQueueIndex(app.queueIndex)
			}
		}

		// Stop playing if there's no queue left
		if (app.playQueue.length == 0) {
			this.stopPlaying();
		}
	}

	// Return the queue contents as an array of songs
	getPlayQueue() {
		return app.playQueue;
	}

	// Return the current queue index
	getQueueIndex() {
		return app.queueIndex;
	}

	// Return the current queue length
	getQueueLength() {
		return app.playQueue.length;
	}

	// Remove all the songs in the play queue and set index to 0
	clearPlayQueue() {
		app.playQueue = [];
		app.queueIndex = 0;

		this.stopPlaying();
	}

	// Return the current audio object
	getAudioObject() {
		return app.audioObject;
	}

	// Play a song at an index in the current queue
	playSongAtQueueIndex(index) {
		// Update the queue index
		app.queueIndex = index;

		this.playSong(app.playQueue[index]);
	}

	// Toggle playback
	togglePlayback() {
		if (app.audioObject.paused) {
			this.playCurrentSong();
		} else {
			this.pauseCurrentSong();
		}
	}

	stopPlaying() {
		console.log("Stopping playback.");
		// Stop playing all songs
		app.audioObject.currentTime = 0;
		this.pauseCurrentSong();

		// Set the queueIndex to the beginning
		app.queueIndex = 0;

		// Update footer with no song duration
		app.$emit("updateSongDuration", 0);
	}

	// Skip to the next song
	nextSong() {
		console.log("Going to next song. Index: " + app.queueIndex);

		// TODO: Check if song isn't downloaded and has no seeders,
		// if so, just skip over it. Prefetch next song to actually
		// check seeder number and to speed up playback.

		// Move the index forward
		app.queueIndex++;
		if(app.queueIndex >= app.playQueue.length) {
			// We've reached the end of the queue, stop playing
			this.stopPlaying();
			return;
		}

		// Play whatever song is at that index
		this.playSongAtQueueIndex(app.queueIndex);
	}

	// Go back to the previous song
	prevSong() {
		// Move the index back
		app.queueIndex--;
		if(app.queueIndex < 0) {
			app.queueIndex = 0;
		}

		// Play whatever song is at that index
		this.playSongAtQueueIndex(app.queueIndex);
	}

	// Set the current audio volume
	setVolume(volume) {
		app.audioVolume = volume;

		// It's alright if we don't have an audio object yet, it'll
		// get the new volume when it's initialized
		if(app.audioObject){
			// If we do have one already, set its volume
			app.audioObject.volume = volume / 100;
		}
	}

	// Sets the current track time
	setTime(time) {
		app.audioObject.currentTime = time;
	}

	// -------------------------------------------------- //
	// ---------------- Helper Methods ------------------ //

	// Creates a new promise with given data to be returned elsewhere
	newPromise(data) {
		return new Promise((resolve, reject) => {
			resolve(data);
		});
	}
}

page = new ZeroApp();

var Uploads = require("./router_pages/uploads.vue");
var Edit = require("./router_pages/edit.vue");
var PlayQueue = require("./router_pages/playqueue.vue");
var Home = require("./router_pages/home.vue");
var Artist = require("./router_pages/artist.vue");
var Album = require("./router_pages/album.vue");
var NowPlaying = require("./router_pages/now_playing.vue");

VueZeroFrameRouter.VueZeroFrameRouter_Init(Router, app, [
	{ route: "uploads", component: Uploads },
	{ route: "playqueue", component: PlayQueue },
	{ route: "edit/:genre/:songID", component: Edit },
	{ route: "addGenre/:genreName/:genreAddress", component: Home },
	{ route: "artist/:artist", component: Artist },
	{ route: "album/:artist/:album", component: Album },
	{ route: "nowplaying", component: NowPlaying },
	{ route: "", component: Home }
]);