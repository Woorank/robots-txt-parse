'use strict';

const split2 = require('split2');
const { pipeline, Transform } = require('stream');

const START_GROUP = 'START_GROUP';
const GROUP_MEMBER = 'GROUP_MEMBER';
const NON_GROUP = 'NON_GROUP';

/**
 * @typedef {{
 *   type: START_GROUP
 *   agent: string
 * } | {
 *   type: GROUP_MEMBER
 *   rule: string
 *   path: string
 * } | {
 *   type: NON_GROUP
 *   field: string
 *   value: string
 * }} Token
 */

/**
 * @typedef {{
 *    rule: string
 *    path: string
 * }} GroupRule
 * @typedef {{
 *    agents: string[]
 *    rules: GroupRule[]
 * }} Group
 * @typedef {{
 *   extension: string
 *   value: string
 *}} Extension
 * @typedef {{
 *   groups: Group[]
 *   extensions: Extension[]
 * }} ParseResult
 */

/**
 * @param {string} line
 * @returns {Token | null}
 */
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
  return new Transform({
    readableObjectMode: true,
    transform (line, encoding, callback) {
      const token = parseLine(String(line));
      if (token) {
        this.push(token);
      }
      callback();
    }
  });
}

/**
 * @param {import('stream').Readable} content
 * @returns {Promise<ParseResult>}
 */
module.exports = function parse (content) {
  /** @type {ParseResult} */
  const result = {
    groups: [],
    extensions: []
  };

  /** @type {string | null} */
  let prevToken = null;
  /** @type {Group | null} */
  let currentGroup = null;

  const build = new Transform({
    objectMode: true,
    transform (token, encoding, callback) {
      switch (token.type) {
        case START_GROUP:
          if (prevToken !== START_GROUP) {
            currentGroup = {
              agents: [],
              rules: []
            };
            result.groups.push(currentGroup);
          }
          if (currentGroup) {
            currentGroup.agents.push(token.agent);
          }
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
      callback();
    }
  });

  return new Promise(function (resolve, reject) {
    pipeline(
      content,
      split2(),
      tokenize(),
      build,
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      }
    );
  });
};
