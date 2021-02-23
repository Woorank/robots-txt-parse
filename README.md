# robots-txt-parse [![Build Status](https://travis-ci.org/Woorank/robots-txt-parse.svg)](https://travis-ci.org/Woorank/robots-txt-parse)

Streaming robots.txt parser

## usage

```js
const parse = require('robots-txt-parse');
const fs = require('fs');

const input = fs.createReadStream(__dirname + '/robots.txt');
const result = await parse(input);
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
    { "extension": "sitemap", "value": "http://www.example.com/sitemap.xml" }
  ]
}
```
