<template>
    <div id="indexGenre">
        <div class="row center">
            <p>Your new Genre, {{ this.genreName }}, is all ready to go! Click the Publish button below to list it globally!</p>
        </div>
        <div class="row center">
            <a @click.prevent="publishGenre()" class="waves-effect waves-light btn"><i class="material-icons left">cloud_upload</i>Publish!</a>
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    module.exports = {
        props: ["genreName", "genreAddress"],
        name: "indexGenre",
        methods: {
            goto: function(to) {
                // Go to specified page
                Router.navigate(to);
            },
            publishGenre: function() {
                // Ensure they're the owner of this address
                // Try to sign address's content.json
                content_inner_path = "merged-ZeroLSTN/" + this.genreAddress + "/content.json";
                return page.cmdp("siteSign", { "privatekey": "stored", "inner_path": content_inner_path })
                    .then((res) => {
                        if (res == "ok") {
                            // Store genre and address in index
                            page.installGenre(this.genreName, this.genreAddress, function() {
                                // Redirect back to main home page once done
                                // TODO: Ability to redirect directly to genre tab
                                window.location = "/ZeroLSTN.bit";
                            });
                        } else {
                            return self.cmdp("wrapperNotification", ["error", "You are not the owner of this genre."]);
                        }
                    });
            }
        }
    }
</script>