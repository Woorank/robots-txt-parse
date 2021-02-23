'use strict';

const split = require('split');
const through = require('through');
const combine = require('stream-combiner');
const Promise = require('bluebird');

const START_GROUP = 'START_GROUP';
const GROUP_MEMBER = 'GROUP_MEMBER';
const NON_GROUP = 'NON_GROUP';

function parseLine (line) {
  const commentFree = line.replace(/#.*$/, '');
  const index = commentFree.indexOf(':');

  if (index === -1) return null;

  const field = commentFree.substr(0, index).trim().toLowerCase();
  const value = commentFree.substr(index + 1).trim();

  switch (field) {
    case 'user-agent':
      return {
        type: START_GROUP,
        agent: value
      };
    case 'allow':
    case 'disallow':
    case 'noindex':
      return {
        type: GROUP_MEMBER,
        rule: field,
        path: value
      };
    default:
      return {
        type: NON_GROUP,
        field: field,
        value: value
      };
  }
}

function tokenize () {
  return through(function (line) {
    const token = parseLine(line);
    if (token) {
      this.queue(token);
    }
  });
}

module.exports = function parse (content) {
  const result = {
    groups: [],
    extensions: []
  };

  let prevToken = null;
  let currentGroup = null;

  const build = through(function (token) {
    switch (token.type) {
      case START_GROUP:
        if (prevToken !== START_GROUP) {
          currentGroup = {
            agents: [],
            rules: []
          };
          result.groups.push(currentGroup);
        }
        currentGroup.agents.push(token.agent);
        break;
      case GROUP_MEMBER:
        if (currentGroup) {
          currentGroup.rules.push({
            rule: token.rule,
            path: token.path
          });
        }
        break;
      case NON_GROUP:
        result.extensions.push({
          extension: token.field,
          value: token.value
        });
        break;
    }

    prevToken = token.type;
  });

  return new Promise(function (resolve, reject) {
    combine(
      content,
      split(),
      tokenize(),
      build
    )
      .on('error', reject)
      .on('end', function () {
        resolve(result);
      });
  });
};
