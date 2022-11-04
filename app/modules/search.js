var search = function(query, next) {
  const async = require('async');
  const request = require('request');
  const url = 'https://ludwig.guru/s/';
  const agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:51.0) Gecko/20100101 Firefox/51.0';

  async.waterfall([
    (callback) => {
      request({
        url: url,
        headers: {
          'user-agent': agent,
        },
      }, (err, rres, body) => {
        if (err || !body) {
          return callback(err || 'Request error');
        }

        callback(null, body);
      });
    },

    (body, callback) => {
      const anchor = '<script>window.REDUX_STATE';
      const i = body.indexOf(anchor);
      const j = body.indexOf('</script>', i);
      let js = body.substring(i, j);

      try {
        const json = js.replace(anchor + ' = ', '');
        callback(null, JSON.parse(json));
      } catch (e) {
        callback(e.message);
      }
    },

    (data, callback) => {
      request({
        url: 'https://api.ludwig.guru/ludwig-authentication-manager/rest/v1.0/search',
        method: 'get',
        headers: {
          'user-agent': agent,
          authorization: data.jwToken,
          version: data.version,
        },
        qs: {
          o: 'i',
          q: query,
        },
        json: true,
      }, (err, rres, body) => {
        if (err || !body) {
          return callback(err || 'Request error');
        }

        callback(null, body);
      });
    },

  ], (err, result) => {
    if (err) {
      return next({
        success: false,
        error: err,
      });
    }

    next(null, result);
  });
};

module.exports = search;
