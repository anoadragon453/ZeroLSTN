<template>
    <div id="songdetails">
        <div class="row center card">
            <div class="card-title">
                <b>Chasing Pavements</b>
            </div>
            19 <br>
            Adele
        </div>
    </div>
</template>

<script>
    var Router = require("../libs/router.js");
    
    module.exports = {
        props: ["song"],
        name: "songdetails",
        mounted: function() {
            
        }
    }
</script>