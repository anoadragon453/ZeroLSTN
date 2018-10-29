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
import Router from '../libs/router.js';

export default {
  name: 'linkmodal',
  data: () => ({
    linkModal: null,
    url: '',
  }),
  mounted() {
    const self = this;

    // Initialize modal view
    const modal = document.getElementById('urlmodal');
    const instance_modal = new M.Modal(modal, {
      onCloseEnd() {
        // Fix scrolling after modal closes
        // https://github.com/Dogfalo/materialize/issues/4622
        document.querySelector('body').style.overflow = 'visible';
      },
    });

    this.linkModal = modal;

    // Pop up modal when someone calls copyLink
    window.page.bus.$on('copyLink', (url) => {
      // Show the modal
      self.url = url;
      self.linkModal.M_Modal.open();

      self.selectURL();
    });
  },
  methods: {
    copyURL() {
      // Copy URL to user's clipboard
      this.selectURL();

      try {
        // Copy to clipboard
        document.execCommand('copy');
        M.toast({ html: 'Copied!' });
      } catch (err) {
        M.toast({ html: 'Unable to copy. Please copy manually.' });
      }
    },
    closeModal() {
      this.linkModal.M_Modal.close();
    },
    selectURL() {
      const urlField = document.getElementById('copy_url');

      // Select the text
      urlField.focus();
      urlField.select();
    },
  },
};
</script>
