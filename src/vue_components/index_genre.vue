<template>
    <div id="indexGenre">
        <div class="row center">
            <p>Your new Genre, {{ decodedGenreName }}, is all ready to go! Click the Publish button below to list it globally!</p>
        </div>
        <div class="row center">
            <a id="uploadButton" @click.prevent="publishGenre()" class="waves-effect waves-light btn"><i class="material-icons left">cloud_upload</i>Publish!</a>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    module.exports = {
        props: ["genreName", "genreAddress"],
        name: "indexGenre",
        mounted: function() {
            // HTML decode genre name
            this.decodedGenreName = decodeURI(this.genreName);
            console.log(decodeURIComponent(this.genreName));
        },
        data: () => {
            return {
                decodedGenreName: ""
            }
        },
        methods: {
            goto: function(to) {
                // Go to specified page
                Router.navigate(to);
            },
            publishGenre: function() {
                // Make sure they're signed in first
                if(!page.isUserSignedIn()) {
                    // Show sign in prompt
                    page.selectUser();
                    return;
                }

                // Disable upload button while it publishes
                var uploadButton = document.getElementById("uploadButton");
                uploadButton.classList += ' disabled';
                uploadButton.innerHTML = '<i class="material-icons left">cloud_upload</i>Publishing...';

                // Ensure they're the owner of this address
                // Try to sign address's content.json
                content_inner_path = "merged-ZeroLSTN/" + this.genreAddress + "/content.json";
                return page.cmdp("siteSign", { "privatekey": "stored", "inner_path": content_inner_path })
                    .then((res) => {
                        if (res == "ok") {
                            // Store genre and address in index
                            page.installGenre(this.decodedGenreName, this.genreAddress);
                        } else {
                            return self.cmdp("wrapperNotification", ["error", "You are not the owner of this genre."]);
                        }
                    });
            }
        }
    }
</script>