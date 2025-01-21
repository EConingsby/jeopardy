var httpProxy = require('http-proxy');
var url = require('url');

module.exports = function (req, res) {
  // Parse the original j-archive URL from the request
  const originalUrl = url.parse(req.url.replace('/media/', ''));
  
  var proxy = httpProxy.createProxyServer({
    target: 'http://www.j-archive.com',
    changeOrigin: true
  });

  delete req.headers.referer;
  
  // Set appropriate headers for audio files
  if (req.url.match(/\.(mp3|wav|ogg)$/i)) {
    res.setHeader('Content-Type', 'audio/' + req.url.split('.').pop().toLowerCase());
  }
  
  proxy.web(req, res);
}
