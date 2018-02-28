# robots-txt-parse [![Build Status](https://travis-ci.org/Woorank/robots-txt-parse.svg)](https://travis-ci.org/Woorank/robots-txt-parse)

Streaming robots.txt parser

## usage

```js
var parse = require('robots-txt-parse'),
    fs    = require('fs');

parse(fs.createReadStream(__dirname + '/robots.txt'))
  .then(function (robots) {
    console.log(robots)
  });

```
assuming this file
```
user-agent: *
user-agent: googlebot
disallow: /

user-agent: twitterbot
disallow: /
allow: /twitter

user-agent: mozilla
disallow: /path
noindex: /path

Sitemap: http://www.example.com/sitemap.xml
Sitemap: /wrong_sitemap.xml
```
produces following output
```json
{
  "groups": [{
    "agents": [ "*", "googlebot" ],
    "rules": [
      { "rule": "disallow", "path": "/" }
    ]
  }, {
    "agents": [ "twitterbot" ],
    "rules": [
      { "rule": "disallow", "path": "/" },
      { "rule": "allow", "path": "/twitter" }
    ]
  }, {
    "agents": [ "mozilla" ],
    "rules": [
      { "rule": "disallow", "path": "/path" },
      { "rule": "noindex", "path": "/path" }
    ]
  }],
  "extensions": [
    { "extension": "sitemap", "value": "http://www.example.com/sitemap.xml" },
    { "extension": "sitemap", "error": "Invalid URL: /wrong_sitemap.xml" }
  ]
}
```
