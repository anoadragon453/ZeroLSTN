<template>
  <div id="linkmodal" class="row">
    <!-- Modal Structure -->
    <div id="urlmodal" class="modal">
      <div class="modal-content">
        <div class="row">
          <h4>Copy Link</h4>
        </div>
        <div class="row">
          <div class="input-field">
            <i class="material-icons prefix">link</i>
            <input id="copy_url" type="text" :value="url" class="validate">
          </div>
        </div>
        <div class="right">
           <a @click.prevent="closeModal()" class="waves-effect btn-flat">Cancel</a>
           <a @click.prevent="copyURL()" class="waves-effect btn-flat">Copy</a>
        </div>
        <div class="row"></div>
      </div>
    </div>
  </div>
</template>

<script>
  var Router = require("../libs/router.js");

  module.exports = {
    name: "linkmodal",
    data: () => {
      return {
        linkModal: null,
        url: ""
      }
    },
    mounted: function() {
      var self = this;

      // Initialize modal view
      var modal = document.getElementById("urlmodal");
      var instance_modal = new M.Modal(modal, {
        onCloseEnd: function() {
          // Fix scrolling after modal closes
          // https://github.com/Dogfalo/materialize/issues/4622
          document.querySelector('body').style.overflow = 'visible';
        }
      });

      this.linkModal = modal;

      // Pop up modal when someone calls copyLink
      page.bus.$on("copyLink", function(url) {
        // Show the modal
        self.url = url;
        self.linkModal.M_Modal.open()

        self.selectURL();
      });
    },
    methods: {
      copyURL: function() {
        // Copy URL to user's clipboard
        this.selectURL();

        try {
          // Copy to clipboard
          document.execCommand('copy');
          M.toast({html: "Copied!"});
        } catch (err) {
          M.toast({html: "Unable to copy. Please copy manually."});
        }
      },
      closeModal: function() {
        this.linkModal.M_Modal.close();
      },
      selectURL: function() {
        var urlField = document.getElementById('copy_url');

        // Select the text
        urlField.focus();
        urlField.select();
      }
    }
  }
</script>
