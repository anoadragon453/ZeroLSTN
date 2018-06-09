version = "2.0.1";
var playlistAddress = "1ListsNz9zbKVm163PToico2dqEqU98eAp";

// Hashing
var sha512 = require("js-sha512").sha512;

// Material CSS
var Materialize = require("materialize-css/dist/js/materialize.min.js");

var ZeroFrame = require("./libs/ZeroFrame.js");
var Router = require("./libs/router.js");
var Vue = require("vue/dist/vue.js");
var Vuex = require("vuex");
var VueZeroFrameRouter = require("./libs/vue-zeroframe-router.js");
var AsyncComputed = require('vue-async-computed');

var { sanitizeStringForUrl, sanitizeStringForUrl_SQL, html_substr, sanitizeHtmlForDb, replaceDiacritics } = require("./util.js");

// Initial Vue plugins
Vue.use(VueZeroFrameRouter.VueZeroFrameRouter);
Vue.use(AsyncComputed);
Vue.use(Vuex);

// Vue components
var NavBar = require("./vue_components/navbar.vue");
var FooterBar = require("./vue_components/footer_bar.vue");

var app = new Vue({
  components: {
    navbar: NavBar,                 // Navbar - Vue component
    footerBar: FooterBar            // Footer - Vue component
  },
  el: "#app",
  template: `
    <div>
    <navbar ref="navbar" :zite-version="ziteVersion" :user-info="userInfo"></navbar>
    <component ref="view" :is="currentView" :play-queue-obj="playQueue" :queue-index="queueIndex" :audio-playing="audioPlaying" :current-song="currentSong"></component>
    <footerBar ref="footerBar" :current-song="currentSong" :audio-playing="audioPlaying"></footerBar>
    </div>`,
  data: {
    ziteVersion: version,           // ZeroLSTN version number
    currentView: null,              // Current View - Vue component (dynamic)
    currentSong: null,              // The currently playing song
    userInfo: null,                 // ZeroFrame userInfo object
    siteInfo: null,                 // ZeroFrame siteInfo object
    localStorage: null,             // Localstorage data
    decadeAddresses: [],            // List of all merger Zites (decades) we know of
    playQueue: [],                  // Play Queue itself
    queueIndex: 0,                  // Current index in the play queue of song we're playing
    audioVolume: 100,               // Current audio volume
    audioObject: null,              // Object housing JS audio object (play, pause, etc)
    audioPlaying: false,            // Track whether audio is currently playing
    queueJustCleared: false,        // Skip to first song in queue if it was just cleared
    goingToNextSong: false,         // Prevent race condition between on song end
    playlists: []                   // User's playlists, pulled from data.json on reload
    // TODO: Sharing playlists
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

    // Check if user is logged in on pageload
    this.cmdp("siteInfo", {})
      .then(siteInfo => {
        self.siteInfo = siteInfo;
        app.siteInfo = siteInfo;
        app.getUserInfo();

        // Get localstorage for site
        page.cmd("wrapperGetLocalStorage", {}, (localStorage) => {
          app.localStorage = localStorage ? localStorage[0] || {} : {};

          // Set volume to desired value if exists

          // Import all decade merger sites
          page.cmd("fileGet", { "inner_path": "decades.json", "required": false }, (decades) => {
            app.decadeAddresses = JSON.parse(decades);

            // Request permission to the ZeroLSTN2 Merger
            page.requestPermission("Merger:ZeroLSTN2", siteInfo, function() {
              page.cmdp("mergerSiteList", [true])
                .then((mergerZites) => {
                  console.log("Merger sites:", mergerZites)
                  // Check through each known decade address
                  // If we aren't already connected to a decade merger zite, add it
                  var addressList = app.decadeAddresses.map(a => a.address);
                  addressList.push(playlistAddress);
                  console.log("addressList", addressList)
                  var needToGet = [];
                  app.decadeAddresses.forEach(function(decade) {
                    if (!mergerZites[decade.address]){
                      needToGet.push(decade.address);
                    }
                  });

                  // Add the playlist merger if we haven't already
                  if (!mergerZites[playlistAddress]) {
                    needToGet.push(playlistAddress);
                  }

                  // Request ZeroFrame to add any mergers we need
                  if (needToGet.length > 0) {
                    console.log("We need to get:", needToGet);
                    page.addMerger(needToGet);
                  }
                });
            });
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
  addMerger(ziteAddresses) {
    return this.cmd("mergerSiteAdd", [ziteAddresses], function(res) {
        console.log("Added merger sites");
      });
  }

  // Removes a merger site
  removeMerger(ziteAddress) {
    console.log("Removing", ziteAddress)
    return this.cmdp("mergerSiteDelete", [ziteAddress])
      .then((res) => {
        return self.cmdp("mergerSiteList", [true])
          .then((mergerZites) => {
            console.log(mergerZites)
            app.mergerZites = mergerZites;
            self.cmd("wrapperNotification", ["info", "Merger removed. Refresh to see changes.", 3000]);
            return mergerZites;
          });
      });
  }

  // Gets all known decades and their addresses
  getDecades() {
    // If we haven't gotten the addresses yet, get them
    if (!app.decadeAddresses || app.decadeAddresses.length == 0) {
      console.log("Wasn't available, returning json file contents")
      return page.cmdp("fileGet", { "inner_path": "decades.json", "required": false }).then((decades) => {
        console.log("Returning:", JSON.parse(decades))
        return page.newPromise(JSON.parse(decades));
      });
    }

    // Otherwise if they're cached, return cached version
    return page.newPromise(app.decadeAddresses);
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
    if (!app.siteInfo) { return false; }
    return app.siteInfo.cert_user_id != null;
  }

  getLocalStorage(key) {
    var self = this;

    console.log("Retrieving from local storage:", key)

    // Attempt to return cached value
    if (app.localStorage) {
      return self.newPromise(app.localStorage[key]);
    }

    // If cached value isn't available yet, get manually
    return page.cmdp("siteInfo", {}).then(() => {
      return page.cmdp("wrapperGetLocalStorage", {}).then((storage) => {
        app.localStorage = storage ? storage[0] || {} : {};
        return self.newPromise(app.localStorage[key]);
      });
    });
  }

  setLocalStorage(key, value) {
    // Set a value for a key in site's localstorage

    // Check for cached value first
    if (app.localStorage) {
      app.localStorage[key] = value;

      console.log("Writing to local storage:", key, ":", value)
      return page.cmdp("wrapperSetLocalStorage", [app.localStorage], null);
    } else {
      return page.cmdp("wrapperGetLocalStorage", {}).then((storage) => {
        app.localStorage = storage ? storage[0] || {} : {};
        app.localStorage[key] = value;

        return page.cmdp("wrapperSetLocalStorage", [app.localStorage], null);
      });
  }}

  selectUser() {
    return this.cmdp("certSelect", { accepted_domains: ["zeroid.bit"] });
  }

  signout() {
    return this.cmdp("certSelect", { accepted_domains: [""] });
  }

  unimplemented() {
    return page.cmdp("wrapperNotification", ["info", "Unimplemented!"]);
  }

  // -------------------------------------------------- //
  // ------ Uploading, Editing and Deleting Songs ----- //

  // Check user has correct "optional" and "ignore" values set in their own content.json
  checkOptional(yearAddress, doSignPublish, f=null) {
    // Make sure user is logged in first
    if (!app.userInfo || !app.userInfo.cert_user_id) {
      this.cmd("wrapperNotification", ["info", "Please login first."]);
      return;
    }

    // Get the user's data.json filepath
    var content_inner_path = "merged-ZeroLSTN2/" + yearAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

    // Verify that user has correct "optional" and "ignore" values
    page.cmd("fileGet", { "inner_path": content_inner_path, "required": false }, (data) => {
      if (!data) {
        console.log("Creating default content.json...");
        data = {};
      } else {
        data = JSON.parse(data);
      }

      // Allowed filetypes
      var curoptional = ".+\\.(png|jpg|jpeg|gif|mp3|flac|ogg|opus|m4a|mpeg|mp4|webm)";
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
  uploadSongBigFile(year, file, index, f = null) {
    var yearAddress = page.getAddressFromYear(year);
    var filename = this.makeUniqueFilename(file.name);
    filename = this.cleanFilename(filename);

    var filepath = "merged-ZeroLSTN2/" + yearAddress + "/data/users/" + app.siteInfo.auth_address + "/" + filename;
    console.log("Uploading:", filepath)

    // Make sure big file is set as optional
    var self = this;
    page.checkOptional(yearAddress, false, function() {
      self.cmd("bigfileUploadInit", [filepath, file.size], (init_res) => {
        var formdata = new FormData();
        formdata.append(file.name, file);

        var req = new XMLHttpRequest();

        // Listen for request finish
        req.onreadystatechange = () => {
          // Listen for server closing connection: http://stackoverflow.com/questions/15418608/#15491086
          if ( req.readyState == 4 ) {
            if (f !== null && typeof f === "function") f(index);
          }
        };

        // Listen for request error in order to restart
        req.onerror = () => {
          // Oh no, an error! Restart!
          self.uploadSongBigFile(year, file, index, f);
        };
        req.withCredentials = true;
        req.open("POST", init_res.url);
        req.send(formdata);
      });
    });

    return filename;
  }

  // Store uploaded album art on a genre
  uploadImage(file, file_data, mergerAddress, existingImageToDelete=null, doSignAndPublish=false) {
    var data_inner_path = "merged-ZeroLSTN2/" + mergerAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";

    // Calculate hash of image file. Save only first 64 chars
    var hash = sha512(file_data).substring(0,64);

    // Check if image already exists on this merger
    // If so return filepath to it
    var query = `
        SELECT image_path FROM artwork as art
        LEFT JOIN json as js
        USING (json_id)
        WHERE art.hash="${hash}" AND js.site="${mergerAddress}"
        `;

    // Execute query
    return page.cmdp("dbQuery", [query])
      .then((art) => {
        if (art.length > 0) {
          // Return existing image on this merger
          console.log("Returning existing artwork path");
          return self.newPromise(art[0].image_path)
        }

        // Open data file and write details about album art
        return page.cmdp("fileGet", { "inner_path": data_inner_path, "required": false })
          .then((data) => {
            if (!data) {
              page.cmdp("wrapperNotification", ["error", "Unable to write artwork metadata. Try logging in again. " + JSON.stringify(res)]);
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
            filename = page.cleanFilename(filename);

            // Get inner path of image file
            var filepath = "merged-ZeroLSTN2/" + mergerAddress + "/data/users/" + app.siteInfo.auth_address + "/artwork/" + filename;

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
                        page.cmdp("wrapperNotification", ["error", "Unable to write artwork metadata. Try logging in again. " + JSON.stringify(res)]);
                      }
                    });
                } else {
                  page.cmdp("wrapperNotification", ["error", "Unable to save artwork: " + JSON.stringify(res)]);
                }
              });
          });
      });
  };

  // Remove an image
  deleteImage(genreAddress, filepath) {
    var data_inner_path = "merged-ZeroLSTN2/" + genreAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
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

  // Create new songs or edit existing ones stored in user's data.json.
  // If edit, we creating a new song with same ID, but with updated values
  createSongObjects(songs, isEdit, f = null) {
    var self = this;

    console.log("Got songs:", songs)
    // Keep track of song's decade addresses
    // We'll use them later for sign/publishing
    var songsByDecade = {};

    var totalSongs = songs.length;
    var songCount = 0;

    songs.forEach(function(song) {
      var decadeAddress = page.getAddressFromYear(song.year);

      // Create address with this address if null
      if (!songsByDecade[decadeAddress]) {
        songsByDecade[decadeAddress] = [];
      }

      // Add song to this decade
      songsByDecade[decadeAddress].push(song);
    });

    console.log('songsByDecade:', songsByDecade)

    // Iterate through decade addresses and publish the songs in each
    let upload = Object.keys(songsByDecade).reduce((promiseChain, decadeAddress) => {
      // All this reduce nonsense is so that we actually iterate through each decade address
      // Beforehand it would just iterate through all of them before the promises actually got
      // started, so it would just read and write to the last address over and over, which was
      // obviously not very helpful.
      return promiseChain.then(() => new Promise((resolve) => {
        console.log("Working on decade:", decadeAddress)

        // Get the user's data file on this merger site
        var user_path = decadeAddress + "/data/users/" + app.siteInfo.auth_address;
        var data_inner_path = "merged-ZeroLSTN2/" + user_path + "/data.json";
        var content_inner_path = "merged-ZeroLSTN2/" + user_path + "/content.json";
        return self.cmdp("fileGet", { "inner_path": data_inner_path, "required": false }).then(data => {
          // Parse user's data into JS object if exists
          data = (data ? JSON.parse(data) : {});
          console.log("Data before:", data)

          // If no songs or genres uploaded yet, create empty array
          if (!data["songs"]) data["songs"] = [];
          if (!data["genres"]) data["genres"] = [];

          // Push new song values
          var songsInDecade = songsByDecade[decadeAddress];
          console.log(decadeAddress)
          console.log('songsInDecade:', songsInDecade)
          for (var i in songsInDecade) {
            var song = songsInDecade[i];

            console.log("Inserting song:", song)
            // Create a new songID if it doesn't exist
            if(song.id == null) { song.id = Date.now().toString(); }

            // Store album art on disk if necessary
            if (song.art) {
              song.art = self.saveAlbumArt(song, decadeAddress);
            }

            // Append new song information
            data["songs"].push({
              id: song.id.toString(),
              track_number: song.track_number,
              filename: song.filename,
              filesize: song.filesize,
              path: isEdit ? song.path : user_path,
              title: song.title.trim(),
              album: song.album.trim(),
              artist: song.artist.trim(),
              year: song.year.trim(),
              art: song.art,
              compilation: song.compilation,
              date_added: Date.now(),
              is_edit: isEdit
            });

            // Push specified genres for this song
            var genreDate = Date.now() // same date ID for all genre entries
            if (song.genres) {
              for (var i in song.genres) {
                data["genres"].push({
                  song_id: song.id.toString(),
                  genre: song.genres[i].tag,
                  date_added: genreDate
                });
              }
            } else if (song.genre){
              // Push single genre if present
              data["genres"].push({
                song_id: song.id.toString(),
                genre: song.genre,
                date_added: genreDate
              });
            }
          }

          // Write values back to JSON string and the data.json
          return unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));
        }).then(json_raw => {
          return self.cmdp("fileWrite", [data_inner_path, btoa(json_raw)]);
        }).then(res => {
          if (res != 'ok') {
            self.cmd("wrapperNotification", ["error writing to file:", res]);
            return;
          }

          // Sign and publish this decade
          console.log("Wrote to data.json. Now signing", content_inner_path);

          return self.cmdp("siteSign", { "inner_path": content_inner_path });
        }).catch(err => {
          self.cmd("wrapperNotification", ["error signing:", err]);
        }).then(() => {
          // TODO: Needed?
          resolve();
        });
      }));

    }, Promise.resolve());

    upload.then(() => {
      console.log("done signing... Now publishing...")

      let publishes = Object.keys(songsByDecade).map((decadeAddress) => {
        return new Promise((resolve) => {
          var content_inner_path = "merged-ZeroLSTN2/" + decadeAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";
          return self.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": false });
        });
      });

      Promise.all(publishes).then(() => console.log("Done with publishing."));
    });

    // Call callback function
    if (f !== null && typeof f === "function") { f(); }
  }

  // Saves base64 album art to a file and sets the "art" attribute of the
  // song object to the saved filename
  // TODO: Add to artwork array. Deduplication of image with hash
  saveAlbumArt(song, address) {
    // Check if album art is currently base64
    if (!song.art.startsWith("data:")) {
      // If not, then no changes necessary
      return song.art;
    }

    // Extract base64 string
    var b64 = song.art.split(',')[1];

    // Convert b64 to image data
    var imageData = atob(b64)

    // Write to file
    var imageFiletype = song.art.substring(11).split(';')[0] || "jpeg";
    var imageFilename = song.artist + "_" + song.album + "." + imageFiletype;
    console.log("imageFilename before:", imageFilename)
    imageFilename = this.cleanFilename(imageFilename)
    console.log("imageFilename after:", imageFilename)
    imageFilename = imageFilename.replace(/ /g, "_");
    var filepath = "merged-ZeroLSTN2/" + address + "/data/users/" + app.siteInfo.auth_address + "/artwork/" + imageFilename;

    // Write the image file
    this.cmd("fileWrite", [filepath, b64]);

    // Return the filepath to the new image
    return filepath;
  }

  removeDownload(song) {
    // Delete a downloaded song
    console.log(song)
    let songFilepath = "merged-ZeroLSTN2/" + song.path + "/" + song.filename;
    return this.cmdp("fileDelete", { "inner_path": songFilepath });
  }

  async mergeSongs(song, otherSongID) {
    // Merge one song into another by marking the initial song as merged with the ID of the other
    // TODO: Display files from the merged song on the new song, one we have file display working

    // Check that the other songID exists
    let query = `
      SELECT COUNT (songs.id) FROM
      (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
      INNER JOIN songs ON songs.date_added = aux.maxDate
      AND songs.id = aux.id
      AND songs.id = "${otherSongID}"
      LIMIT 1
    `;
    let count = await this.cmdp("dbQuery", [query]);
    if (count[0]["COUNT (songs.id)"] == 0) {
      return "Invalid song ID";
    }

    // If so, merge the song
    let decadeAddress = page.getAddressFromYear(song.year);
    let user_path = "merged-ZeroLSTN2/" + decadeAddress + "/data/users/" + app.siteInfo.auth_address;
    let data_inner_path = user_path + "/data.json";
    let content_inner_path = user_path + "/content.json";

    console.log(data_inner_path)
    let data = await this.cmdp("fileGet", {"inner_path": data_inner_path, "required": false});
    if (!data) {
      // User hasn't uploaded any songs yet. Create data for them.
      data = {};
    } else {
      data = JSON.parse(data);
    }

    // If data.songs doesn't exist yet, create that too
    if (!data.songs) {
      data.songs = [];
    }

    // Mark the song as merged
    data["songs"].push({
      id: song.id.toString(),
      track_number: song.track_number,
      filename: song.filename,
      filesize: song.filesize,
      path: song.path,
      title: song.title,
      album: song.album,
      artist: song.artist,
      year: song.year,
      art: song.art,
      compilation: song.compilation,
      date_added: Date.now(),
      has_merged: otherSongID,
      is_edit: song.is_edit
    });

    // Write the new data
    var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, '\t')));
    let ok = await this.cmdp("fileWrite", [data_inner_path, btoa(json_raw)]);
    if (ok != "ok") {
      return ok;
    }

    // Sign and publish content
    this.cmdp("sitePublish", { "inner_path": content_inner_path, "sign": true });

    return "ok";
  }

  deleteSong(song) {
    // Remove from user's data.json then delete song file and its piecemap
    var data_inner_path = "merged-ZeroLSTN2/" + song.path + "/data.json";
    var content_inner_path = "merged-ZeroLSTN2/" + song.path + "/content.json";
    var songFilepath = "merged-ZeroLSTN2/" + song.path + "/" + song.filename;
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
        console.log("Proxy issue. See HelloZeroNet/ZeroNet#1140");
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
          return this.cmdp("wrapperNotification", ["error", "Failed to sign user data.", 3000]);
        }
      })
  }

  // -------------------------------------------------- //
  // ----- Retrieving Song/Album/Artist/Genre info ---- //

  search(searchTerm, type) {
    // Check for any special keywords in the search string
    // TODO: Have a randomize search button
    let extraParams = "";
    let yearKeywordValueIndex = searchTerm.indexOf("year:");
    if (yearKeywordValueIndex != -1) {
      // Only search for songs in given year name/address

      // Find the end of the keyword value
      var end = searchTerm.indexOf(" ", yearKeywordValueIndex) == -1 ? searchTerm.length - 1 : searchTerm.indexOf(" ", yearKeywordValueIndex);

      // Deduce the year keyword value: '80s' or an exact address
      var yearKeywordValue = searchTerm.substring(yearKeywordValueIndex + 5, end);

      // Check to see if keyword value is in decade address/name
      for (var i in app.decadeAddresses) {
        var decade = app.decadeAddresses[i];
        if (decade.name.indexOf(yearKeywordValue) != -1 || decade.address == yearKeywordValue) {
          // If so, only search for songs within this decade
          extraParams += 'AND site = "' + decade.address + '" ';
          break;
        }
      }

      // Remove the keyword value from the actual search
      searchTerm = searchTerm.substring(0, yearKeywordValueIndex - 1) + searchTerm.substring(end + 1);
    }

    let genreKeywordValueIndex = searchTerm.indexOf("genre:");
    // TODO: Put in for loop for multiple genres
    if (genreKeywordValueIndex != -1) {
      // Only search for songs in given genre

      // Find the end of the keyword value
      var end = searchTerm.indexOf(" ", genreKeywordValueIndex) == -1 ? searchTerm.length - 1 : searchTerm.indexOf(" ", genreKeywordValueIndex);

      // Deduce the genre keyword value: 'Rock'
      var genreKeywordValue = searchTerm.substring(genreKeywordValueIndex + 6, end);

      // Add genre restriction to search
      //extraParams += 'AND genre = "' + decade.address + '" ';

      // Remove the keyword value from the actual search
      searchTerm = searchTerm.substring(0, genreKeywordValueIndex - 1) + searchTerm.substring(end + 1);
    }

    var query = "";
    switch (type) {
      case 'song':
        query = `
        SELECT DISTINCT songs.* FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        LEFT JOIN json USING (json_id)
        WHERE title LIKE "%${searchTerm}%"
        AND has_merged is null
        ${extraParams}
        ORDER BY title COLLATE NOCASE
        `;
        break;
      case 'album':
        query = `
        SELECT DISTINCT songs.album, songs.artist FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        LEFT JOIN json USING (json_id)
        WHERE album LIKE "%${searchTerm}%"
        AND has_merged is null
        ${extraParams}
        ORDER BY title COLLATE NOCASE
        `;
        break;
      case 'artist':
        query = `
        SELECT DISTINCT songs.artist FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        LEFT JOIN json USING (json_id)
        WHERE artist LIKE "%${searchTerm}%"
        AND has_merged is null
        ${extraParams}
        ORDER BY title COLLATE NOCASE
        `;
        break;
    }

    // Execute search query and return results
    return this.cmdp("dbQuery", [query]);
  }

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
      `;

    return this.cmdp("dbQuery", [query]);
  }

  // Get all genres from a given song
  getGenresFromSong(songID) {
    var query = `
      SELECT DISTINCT genres.* FROM
      (SELECT MAX(date_added) AS maxDate, song_id FROM genres GROUP BY song_id) AS aux
      INNER JOIN genres ON genres.date_added = aux.maxDate
      AND genres.song_id = '${songID}'
    `;

    return this.cmdp("dbQuery", [query]);
  }

  // Returns all currently known genres
  getAllGenres() {
    var query = `
      SELECT DISTINCT genre FROM genres
    `

    return this.cmdp("dbQuery", [query]);
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
  retrieveSongInfo(songID) {
    // Retrieve song by ID. Get latest update to this ID.
    var query = `
    SELECT * FROM songs
    LEFT JOIN json USING (json_id)
    WHERE id = ${songID}
    AND date_added < time('now')
    ORDER BY date_added DESC
    LIMIT 1
    `;

    // Grab first value from returned array
    var self = this;
    return this.cmdp("dbQuery", [query])
      .then((results) => {
        return self.newPromise(results[0]);
      });
  }

  // Get all songs a user has uploaded as an array
  getSongsByUser(userAuthAddress) {
    var query = `
    SELECT DISTINCT songs.* FROM
    (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
    INNER JOIN songs ON songs.date_added = aux.maxDate
    LEFT JOIN json USING (json_id)
    WHERE directory="data/users/${userAuthAddress}"
    AND songs.has_merged is null
    AND (songs.is_edit is null OR songs.is_edit = false)
    ORDER BY album COLLATE NOCASE, track_number
    `;

    return this.cmdp("dbQuery", [query]);
  }

  // Checks if a song already exists in the database by tags
  async isDuplicateSongByTags(tags) {
    var title = this.preprocessQuotes(tags.title);
    var album = this.preprocessQuotes(tags.album);
    var artist = this.preprocessQuotes(tags.artist);

    // LIKE for case-insensitive searching
    var query = `
    SELECT COUNT (*) FROM songs
    WHERE title LIKE "${title}"
    AND album LIKE "${album}"
    AND artist LIKE "${artist}"
    AND has_merged is null
    LIMIT 1
    `;

    // Return true if there is at least one hash already in the DB
    let result = await this.cmdp("dbQuery", [query]);
    return result[0]["COUNT (*)"] != 0;
  }

  // Returns a list of all song IDs that have the same filename and filesize as
  // the given song
  async isDuplicateSongByNameSize(fileObj) {
    let filename = fileObj.name;
    let filesize = fileObj.size;

    // Grab the filename extension
    let extensionRegex = /(?:\.([^.]+))?$/;
    let extension = extensionRegex.exec(filename)[1] || "";

    // Cut off the extension of the filename
    filename = filename.replace(/\.[^/.]+$/, "")
    filename = filename.replace(/\s/g, "_").replace(/[^\x00-\x7F]/g, "").replace(/\'/g, "").replace(/\"/g, "");
    filename = this.cleanFilename(filename);

    // Search for the filename + timestamp + extension, and filesize
    var query = `
    SELECT id FROM songs
    WHERE filename LIKE "${filename}-_____________.${extension}"
    AND filesize="${filesize}"
    AND has_merged is null
    LIMIT 1
    `;

    return await this.cmdp("dbQuery", [query]);
  }

  // Returns a list of all albums, with an optional max song amount and offset
  getAllAlbums(limit = 0, offset = 0) {
    var query = `
        SELECT album, compilation, artist FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        AND songs.id = aux.id
        AND songs.album != ""
        AND songs.has_merged is null
        LEFT JOIN json USING (json_id)
        GROUP BY album, compilation
        ORDER BY album COLLATE NOCASE
        `;
    // TODO: WIP Need to not group together non-compilation albums

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
        SELECT DISTINCT artist FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        AND songs.id = aux.id
        AND songs.has_merged is null
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
        SELECT DISTINCT songs.album FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        AND songs.id = aux.id
        AND songs.has_merged is null
        AND artist="${artistName}"
        LEFT JOIN json USING (json_id)
        ORDER BY songs.album COLLATE NOCASE
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
      songs.forEach(async function(song) {
        // Get the info for each song
        song.info = await page.cmdp("optionalFileInfo", ["merged-ZeroLSTN2/" + song.path + "/" + song.filename]);
      });

      // Return the list of songs
      resolve(songs);
    });
  }

  // Returns all songs in a given compilation album
  getSongsInCompilationAlbum(albumName) {
    var query = `
        SELECT songs.* FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        AND songs.id = aux.id
        AND songs.album = "${albumName}"
        AND songs.compilation = 1
        AND songs.has_merged is null
        LEFT JOIN json USING (json_id)
        ORDER BY track_number
        `;

    return this.cmdp("dbQuery", [query])
      .then((songs) => {
        console.log("Compilation got songs:", songs)
        return self.getInfoForSongs(songs);
      });
  }

  // Returns all songs in a given artist's album
  getSongsInAlbumByArtist(albumName, artistName) {
    var query = `
        SELECT songs.* FROM
        (SELECT MAX(date_added) AS maxDate, id FROM songs GROUP BY id) AS aux
        INNER JOIN songs ON songs.date_added = aux.maxDate
        AND songs.id = aux.id
        AND songs.album = "${albumName}"
        AND songs.artist = "${artistName}"
        AND songs.has_merged is null
        LEFT JOIN json USING (json_id)
        ORDER BY track_number
        `;

    return this.cmdp("dbQuery", [query])
      .then((songs) => {
        console.log("Normal get songs:", songs)
        return self.getInfoForSongs(songs);
      });
  }

  // -------------------------------------------------- //
  // ------------------- Playlists -------------------- //

  // Creates a new, empty playlist with the given name
  createPlaylist(name, f=null) {
    var data_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
    var content_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

    page.cmd("fileGet", { "inner_path": data_inner_path, "required": false }, (data) => {
      if (!data) {
        data = {};
      } else {
        data = JSON.parse(data);
      }

      // Create playlists array if it doesn't exist yet
      if (!data["playlists"]) { data["playlists"] = []; }

      // Add a new playlist to the end
      data["playlists"].push({id: Date.now(), name: name, date_added: Date.now()});

      // Write playlist data (and Sign and Publish)
      var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
      page.cmd("fileWrite", [data_inner_path, btoa(json_raw)], (res) => {
        if (res === "ok") {
          // Call callback
          if (f != null && typeof f === "function") f();

          page.cmd("siteSign", { "inner_path": content_inner_path }, () => {
            page.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false });
          });
        } else {
          page.cmd("wrapperNotification", ["error", "Playlist creation error: " + JSON.stringify(res)]);
        }
      });
    });
  }

  // Return the playlists created by specified user auth address
  // If an auth address isn't specified, get playlists by current user
  getPlaylistsByUser(user=null) {
    var query = `
      SELECT * FROM playlists
      LEFT JOIN json USING (json_id)
      WHERE directory="data/users/` + (user ? user : app.siteInfo.auth_address) + `"
      ORDER BY date_added
      `;

    return this.cmdp("dbQuery", [query]);
  }

  // Returns a playlist's information given a playlistID
  getPlaylistByID(id) {
    var query = `
      SELECT * FROM playlists
      WHERE id=${id}
      `;

    return this.cmdp("dbQuery", [query]).then((res) => {
      return page.newPromise(res[0]);
    });
  }

  // Returns a playlist's songs given a playlistID
  async getPlaylistSongsByID(id) {
    // TODO: Prevent users from being able to add to other's playlists
    // Need to know auth address of user who created playlist at querytime
    // TODO: Convert back to one query
    var query = `
      SELECT song_id FROM playlist_songs
      WHERE playlist_songs.playlist_id="${id}"
      ORDER BY playlist_songs.playlist_index;
      `;

    let songIDs = await this.cmdp("dbQuery", [query]);
    songIDs = songIDs.map(a => a.song_id);
    console.log("songIDs:", songIDs)

    query = `
      SELECT songs.* FROM
      (SELECT MAX(date_added) AS maxDate, * FROM songs GROUP BY id) AS songs
      WHERE songs.id IN :songIDs
      `;
    return await this.cmdp("dbQuery", [query, {songIDs: songIDs}]);
  }

  // Adds the specified songs to the specified playlist
  addSongsToPlaylist(songs, id, f=null) {
    // Get current length of playlist
    var query = `
      SELECT COUNT (*) FROM songs, playlist_songs
      WHERE playlist_songs.playlist_id="${id}"
      `;

    return this.cmd("dbQuery", [query], (res) => {
      var count = res[0]["COUNT (*)"];

      var data_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
      var content_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

      page.cmd("fileGet", { "inner_path": data_inner_path, "required": false }, (data) => {
        if (!data) {
          data = {};
        } else {
          data = JSON.parse(data);
        }

        // Create playlists array if it doesn't exist yet
        if (!data["playlist_songs"]) { data["playlist_songs"] = []; }

        // Add a new playlist to the end
        songs.forEach(function(song) {
          data["playlist_songs"].push({playlist_id: id, song_id: song.id, playlist_index: count++});
        });

        // Write playlist data (and Sign and Publish)
        var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
        page.cmd("fileWrite", [data_inner_path, btoa(json_raw)], (res) => {
          if (res === "ok") {
            // Call callback
            if (f != null && typeof f === "function") f();

            page.cmd("siteSign", { "inner_path": content_inner_path }, () => {
              page.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false });
            });
          } else {
            page.cmd("wrapperNotification", ["error", "Playlist creation error: " + JSON.stringify(res)]);
          }
        });
      });
    });
  }

  // Removes a single song from a playlist
  removeSongFromPlaylist(song, id, f=null) {
    // Get current length of playlist
    var query = `
      SELECT COUNT(*) FROM songs, playlist_songs
      WHERE playlist_songs.playlist_id="${id}"
      `;

    return this.cmd("dbQuery", [query], (res) => {
      var count = res[0]["COUNT (*)"];

      var data_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
      var content_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

      page.cmd("fileGet", { "inner_path": data_inner_path, "required": false }, (data) => {
        if (!data) {
          data = {};
        } else {
          data = JSON.parse(data);
        }

        // Return if we don't have any songs in a playlist
        if (!data["playlist_songs"]) { return; }

        // Remove song from playlist
        for (var i = 0; i < data["playlist_songs"].length; i++) {
          var listing = data["playlist_songs"][i];
          if(listing.song_id == song.id && listing.playlist_id == id) {
            data["playlist_songs"].splice(i, 1);
            break;
          }
        }

        // Write playlist data (and Sign and Publish)
        var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
        page.cmd("fileWrite", [data_inner_path, btoa(json_raw)], (res) => {
          if (res === "ok") {
            // Call callback
            if (f != null && typeof f === "function") f();

            page.cmd("siteSign", { "inner_path": content_inner_path }, () => {
              page.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false });
            });
          } else {
            page.cmd("wrapperNotification", ["error", "Playlist song deletion error: " + JSON.stringify(res)]);
          }
        });
      });
    });
  }

  // Deletes a playlist
  deletePlaylistByID(id, f=null) {
    var data_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/data.json";
    var content_inner_path = "merged-ZeroLSTN2/" + playlistAddress + "/data/users/" + app.siteInfo.auth_address + "/content.json";

    page.cmd("fileGet", { "inner_path": data_inner_path, "required": false }, (data) => {
      if (!data) {
        data = {};
      } else {
        data = JSON.parse(data);
      }

      // No playlists or songs to delete, just return
      if (!data["playlists"] && !data["playlist_songs"]) { return; }

      // Remove playlist from user's playlists
      if (data["playlists"]) {
        for (let i = 0; i < data["playlists"].length; i++) {
          let list = data["playlists"][i];
          if(list.id == id) {
            data["playlists"].splice(i, 1);
            break;
          }
        }
      }
      if (data["playlist_songs"]) {
        for (let i = 0; i < data["playlist_songs"].length; i++) {
          let song = data["playlist_songs"][i];
          if(song.playlist_id == id) {
            data["playlist_songs"].splice(i, 1);
            i--;
          }
        }
      }

      // Write playlist data (and Sign and Publish)
      var json_raw = unescape(encodeURIComponent(JSON.stringify(data, undefined, "\t")));
      page.cmd("fileWrite", [data_inner_path, btoa(json_raw)], (res) => {
        if (res === "ok") {
          // Call callback
          if (f != null && typeof f === "function") f();

          page.cmd("siteSign", { "inner_path": content_inner_path }, () => {
            page.cmd("sitePublish", { "inner_path": content_inner_path, "sign": false });
          });
        } else {
          page.cmd("wrapperNotification", ["error", "Playlist deletion error: " + JSON.stringify(res)]);
        }
      });
    });
  }

  // -------------------------------------------------- //
  // ------------- Play Queue Operations -------------- //

  // Play a music file
  playSongFile(filepath, song) {
    // Tell all we're loading the current song
    page.bus.$emit("songLoading");
    console.log("Song loading...")
    
    // Show song information in the title
    page.cmd("wrapperSetTitle", song.title + (song.artist != "" ? " by " + song.artist : ""), null)

    // Invalidate existing song timers if any
    if (page.store.state.shortTimeout) {
      clearTimeout(page.store.state.shortTimeout);
    }
    if (page.store.state.longTimeout) {
      clearTimeout(page.store.state.longTimeout);
    }

    // Timeout for 5s. Check if any seeds. If not, skip.
    page.store.state.shortTimeout = setTimeout(async function() {
      let songsWithInfo = await page.getInfoForSongs([song]);
      console.log("Info is:", songsWithInfo[0].info)
      if (songsWithInfo[0].info &&
          (!songsWithInfo[0].info.peer_seed || songsWithInfo[0].info.peer_seed == 0)) {
        M.Toast({html: "Skipped song with 0 peers."})
        page.nextSong();
      }
    }, 5000)

    // Timeout for 15s. Skip song.
    page.store.state.longTimeout = setTimeout(function() {
      M.Toast({html: "Skipped slow-loading song."})
      page.nextSong();
    }, 15000)

    // If audioObject already exists, change its source
    if(app.audioObject) {
      app.audioObject.src = filepath;
      app.audioObject.load();
    } else { // Otherwise make a new audio object
      app.audioObject = new Audio(filepath);

      // Update footer with new song duration once metadata has been loaded
      app.audioObject.addEventListener('loadedmetadata', function() {
        console.log("Updating with duration: " + app.audioObject.duration);
        app.$emit("updateSongDuration", app.audioObject.duration);
      });

      // Event listener for when the song has started playing
      app.audioObject.addEventListener('canplay', function() {
        // Disable the auto-skip feature if the song loaded
        clearTimeout(page.store.state.shortTimeout);
        clearTimeout(page.store.state.longTimeout);
      });

      // Add event listener for when song finishes, so we can either move to the next song,
      // or stop the playback if it's the last song in the queue
      app.audioObject.addEventListener('ended', function() {
        // Don't fire this event if we're currently going to the next song
        // due to a previous song ending.
        if (app.goingToNextSong) {
          return;
        } else {
          app.goingToNextSong = true;
          setTimeout(() => {
            app.goingToNextSong = false;
          }, 1000);
        }
        self.songEnded();
      });

      app.audioObject.addEventListener('canplay', function() {
        // Tell app we've finishing loading the song
        page.bus.$emit('songLoaded');
      });
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
    console.log("Song Info:")
    var filepath = "merged-ZeroLSTN2/" + song.path + "/" + song.filename;

    // Play the song
    this.playSongFile(filepath, song);

    // Allow Vue components to access the current playing song
    app.currentSong = song;
  }

  // Called when the current song ends
  songEnded() {
    console.log("Song ended. Current index: " + app.queueIndex);
    // Check if this is the last song in the queue. Stop if not looping
    if (app.queueIndex == app.playQueue.length - 1 && page.store.state.loop == 0){
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
    app.playQueue.push(song);
  }

  // Removes a single song from the play queue
  removeSongFromQueue(index) {
    if (index != -1) {
      app.playQueue.splice(index, 1);
      if (index < app.queueIndex) {
        app.queueIndex--;
        if (app.queueIndex < 0) { app.queueIndex = 0; }
      } else if (index == app.queueIndex && app.playQueue.length != 0) {
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

    // Reset the site title
    page.cmd("wrapperSetTitle", "ZeroLSTN", null)
  }

  // Skip to the next song
  nextSong() {
    console.log("Going to next song. Index: " + app.queueIndex);

    // TODO: Prevent repeating songs when shuffling
    // Create array of random numbers on shuffle click
    // from 1 - queue length and run through them

    // If looping on one song, repeat song
    if (page.store.state.loop == 2) {
      // Don't change current queue index
    } else if (page.store.state.shuffle) {
      // Randomize queue index
      app.queueIndex = page.randomIntFromInterval(0, app.playQueue.length);
    } else {
      // Move the index forward
      app.queueIndex++;
      if(app.queueIndex >= app.playQueue.length) {
        // If looping in general, repeat from beginning of playqueue
        if (page.store.state.loop == 1) {
          app.queueIndex = 0;
        } else {
          // We've reached the end of the queue, stop playing
          this.stopPlaying();
          return;
        }
      }
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

  // Switched between looping a list or song
  loop() {
    page.store.commit("toggleLoop");
  }

  // Toggle shuffling song queue
  shuffle() {
    page.store.commit("toggleShuffle");
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
    // It's alright if we don't have an audio object yet, just disregard
    // request
    if(app.audioObject){
      app.audioObject.currentTime = time;
    }
  }

  // -------------------------------------------------- //
  // ---------------- Helper Methods ------------------ //

  // Creates a new promise with given data to be returned elsewhere
  newPromise(data) {
    return new Promise((resolve, reject) => {
      resolve(data);
    });
  }

  // Return an address from a supplied year in yyyy format
  getAddressFromYear(year) {
    for (var i = 1; i < app.decadeAddresses.length; i++) {
      // Check if year is within the last and current decade
      if (app.decadeAddresses[i-1].year < year && app.decadeAddresses[i].year > year) {
        return app.decadeAddresses[i-1].address;
      }
    }

    // Song's year is greater than latest decade, return latest
    return app.decadeAddresses[app.decadeAddresses.length - 1].address;
  }

  randomIntFromInterval(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  }

  // Escape any quotes in a song title, album name, or artist name
  preprocessQuotes(str) {
    if (!str) {
      return "";
    }
    str = this.replaceAll(str, '"', '""');
    str = this.replaceAll(str, "'", "''");
    str = this.replaceAll(str, "`", "``");
    return str;
  }

  // Replaces all occurrances of a substring in a string
  replaceAll(str, find, replace) {
    return str.replace(new RegExp(this.escapeRegExp(find), 'g'), replace);
  }

  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  }

  // Cleans and attaches a timestamp to a filename
  makeUniqueFilename(filename) {
    var date_added = Date.now();
    let originalFilenameList = filename.split(".");
    return originalFilenameList[0].replace(/\s/g, "_").replace(/[^\x00-\x7F]/g, "").replace(/\'/g, "").replace(/\"/g, "") + "-" + date_added + "." + originalFilenameList[originalFilenameList.length - 1];
  }

  // Remove any non-allowed characters in a filename
  cleanFilename(str) {
    str = this.replaceAll(str, '|', '_');
    str = this.replaceAll(str, ':', '_');
    str = this.replaceAll(str, '&', '_');
    str = this.replaceAll(str, '!', '_');

    // Replace all accented characters with their ascii equivalent
    str = replaceDiacritics(str);
    return str;
  }
}

page = new ZeroApp();
page.bus = new Vue({});
self = page;

// Vuex Store

const store = new Vuex.Store({
  state: {
    newSongs: [], // Used to temporarily store songs that haven't been published yet
    downloadState: {notdownloaded: 0, downloaded: 1, unknown: -1}, // enum for download icons
    loop: 0, // 0: not looping, 1: looping playqueue, 2: looping song
    shuffle: false,
    shortTimeout: null,
    longTimeout: null,
    duplicateSongsTags: [], // Used to temporarily store songs that the user tried to upload, but whose metadata is already in the database
    duplicateSongsFile: []  // Used to temporarily store songs that the user tried to upload, but the file was already in the database
  },
  mutations: {
    addDuplicateSongsTags (state, duplicateSongsTags) {
      // Add list of duplicate songs to state.duplicateSongsTags
      state.duplicateSongsTags.push.apply(state.duplicateSongsTags, duplicateSongsTags);
    },
    addDuplicateSongsFile (state, duplicateSongsFile) {
      // Add list of duplicate songs to state.duplicateSongsFile
      state.duplicateSongsFile.push.apply(state.duplicateSongsFile, duplicateSongsFile);
    },
    addNewSongs (state, newSongs) {
      // Add list of songs to state.newSongs
      state.newSongs.push.apply(state.newSongs, newSongs);
    },
    setDuplicateSongsTags (state, duplicateSongsTags) {
      // Add list of duplicate songs to state.duplicateSongsTags
      state.duplicateSongsTags = duplicateSongsTags;
    },
    setDuplicateSongsFile (state, duplicateSongsFile) {
      // Add list of duplicate songs to state.duplicateSongsFile
      state.duplicateSongsFile = duplicateSongsFile;
    },
    setNewSongs (state, newSongs) {
      // Add list of songs to state.newSongs
      state.newSongs = newSongs;
    },
    saveDuplicateSongTags (state, payload) {
      // Overwrite a song at a certain index in the duplicate songs array
      state.duplicateSongsTags[payload.index].song = payload.song;
    },
    saveDuplicateSongFile (state, payload) {
      // Overwrite a song at a certain index in the duplicate songs array
      state.duplicateSongsFile[payload.index] = payload.song;
    },
    saveSong (state, payload) {
      // Overwrite a song at a certain index
      state.newSongs[payload.index].song = payload.song;
    },
    removeNewSong (state, songToRemove) {
      // Remove a song from newSongs
      state.newSongs.remove(songToRemove);
    },
    clearDuplicateSongsTags (state) {
      // Clear tags-based duplicate songs
      // Done after uploading complete
      state.duplicateSongsTags = [];
    },
    clearDuplicateSongsFile (state) {
      // Clear file-based duplicate songs
      // Done after uploading complete
      state.duplicateSongsFile = [];
    },
    clearNewSongs (state) {
      // Clear all new songs
      // Done after uploading complete
      state.newSongs = [];
    },
    toggleShuffle (state) {
      // Toggle shuffle state
      state.shuffle = !state.shuffle;
    },
    toggleLoop (state) {
      // Increment loop state
      state.loop = (state.loop + 1) % 3;
    }
  }
});

page.store = store;

var Uploads = require("./router_pages/uploads.vue");
var Edit = require("./router_pages/edit.vue");
var Home = require("./router_pages/home.vue");
var Artist = require("./router_pages/artist.vue");
var Album = require("./router_pages/album.vue");
var NowPlaying = require("./router_pages/now_playing.vue");
var Search = require("./router_pages/search.vue");
var Playlists = require("./router_pages/playlists.vue");
var Playlist = require("./router_pages/playlist.vue");

VueZeroFrameRouter.VueZeroFrameRouter_Init(Router, app, [
  { route: "uploads", component: Uploads },
  { route: "edit/existingStore/:dupindex", component: Edit },
  { route: "edit/store/:index", component: Edit },
  { route: "edit/:songID", component: Edit },
  { route: "artist/:artist", component: Artist },
  { route: "compilation/:album", component: Album },
  { route: "album/:artist/:album", component: Album },
  { route: "nowplaying", component: NowPlaying },
  { route: "search/:searchText", component: Search },
  { route: "search", component: Search },
  { route: "playlist/:playlistID", component: Playlist },
  { route: "playlists", component: Playlists },
  { route: "tab/:currentTab", component: Home},
  { route: "", component: Home }
]);
