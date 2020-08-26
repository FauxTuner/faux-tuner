const path = require('path');

function relativeToUri(inputUri, baseUrl) {

  inputUri = decodeURIComponent(inputUri);

  try {
    return new URL(inputUri);
    // return playlistUrl.toString();
  } catch(error) {
    if (error.code === 'ERR_INVALID_URL') {
      // likely a relative path?
      const newPlaylistUrl = new URL(baseUrl);
      const prefix = path.dirname(newPlaylistUrl.pathname);
      const pathParts = inputUri.indexOf('?') > -1 ? inputUri.split('?') : [inputUri];
      newPlaylistUrl.pathname = inputUri.startsWith('/') ? inputUri : path.join(prefix, pathParts[0]);
      if (pathParts.length > 0) {
        newPlaylistUrl.search = new URLSearchParams(pathParts[1]);
      }
      return newPlaylistUrl.toString();
    }
  }
}

module.exports = relativeToUri;
