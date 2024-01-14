//URL Shortener Functions

module.exports = function(server, restify) {

	initialize = function() {
        
    }

    server.urlShorten = function(srcURL, category, callback) {
    	var cuttlyAPI = "https://cutt.ly/api/api.php?key=b851f5efa08c313cd6575d00f405f0a59c0d7&short="+encodeURI(srcURL);

	 	axios({
			  method: 'get',
			  url: cuttlyAPI
			}).then(function (response) {
				if(response.data.url==null || response.data.url.status!=7) {
					return callback(false, "Error generating ShortURL (1)");
				}
				callback(response.data.url.shortLink);
			  }).catch(function (error) {
			  	return callback(false, "Error generating ShortURL (2)");
			  });
    }

    return this;
}