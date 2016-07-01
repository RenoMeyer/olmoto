import {Files} from '/lib/collections';

export default {
  upload({Meteor, LocalState}, file) {

    var uploadInstance = Files.insert({
        file: file,
        streams: 'dynamic',
        chunkSize: 'dynamic'
      }, false);

      uploadInstance.on('start', function() {
        // return LocalState.set('message', 'Start uploading ...')
      });

      uploadInstance.on('error', function(error) {
        // return LocalState.set('error', error)
      });

      uploadInstance.on('end', function(error, fileObj) {
        if (error) {
          return LocalState.set('message', {type: 'error', content: error.message})
        } else {
          return LocalState.set('message', {type: 'success', content: 'Upload ' +
           fileObj.name + ' finished.'})
        }
      });

      uploadInstance.start();
  },

  clearMessage({LocalState}) {
    return LocalState.set('message', null);
  }
}
