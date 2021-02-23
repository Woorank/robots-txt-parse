/* global describe, it */

'use strict';

const parse = require('../lib/parse');
const fs = require('fs');
const path = require('path');
const assert = require('chai').assert;

function getFixture (name) {
  const fixturePath = path.resolve(__dirname, 'fixtures', name + '.txt');
  const stream = fs.createReadStream(fixturePath);
  return stream;
}

describe('parser', function () {
  it('should parse a simple group', async function () {
    const parsed = await parse(getFixture('single-group'));
    assert.isObject(parsed);
    assert.property(parsed, 'groups');
    assert.isArray(parsed.groups);
    assert.lengthOf(parsed.groups, 1);
    const group = parsed.groups[0];
    assert.isObject(group);

    assert.property(group, 'agents');
    assert.isArray(group.agents);
    assert.lengthOf(group.agents, 1);
    assert.strictEqual(group.agents[0], '*');

    assert.property(group, 'rules');
    assert.isArray(group.rules);
    assert.lengthOf(group.rules, 1);
    const rule = group.rules[0];

    assert.isObject(rule);
    assert.propertyVal(rule, 'rule', 'disallow');
    assert.propertyVal(rule, 'path', '/');
  });

  it('should parse multiple agents', async function () {
    const parsed = await parse(getFixture('multiple-agents'));
    assert.nestedPropertyVal(parsed, 'groups[0].agents[0]', '*');
    assert.nestedPropertyVal(parsed, 'groups[0].agents[1]', 'agent1');
    assert.nestedPropertyVal(parsed, 'groups[0].agents[2]', 'agent2');
  });

  it('should ignore group members outside of a group', async function () {
    const parsed = await parse(getFixture('member-outside'));
    assert.nestedPropertyVal(parsed, 'groups[0].agents[0]', '*');
    assert.lengthOf(parsed.groups[0].agents, 1);
  });

  it('should parse extensions', async function () {
    const parsed = await parse(getFixture('with-sitemap'));
    assert.nestedPropertyVal(parsed, 'extensions[0].extension', 'sitemap');
    assert.nestedPropertyVal(parsed, 'extensions[0].value', '/sitemap.xml');
    assert.nestedPropertyVal(parsed, 'extensions[1].extension', 'sitemap');
    assert.nestedPropertyVal(parsed, 'extensions[1].value', 'http://example.com/alt_sitemap.xml');
  });

  it('should parse multiple groups', async function () {
    const parsed = await parse(getFixture('multiple-groups'));
    assert.nestedPropertyVal(parsed, 'groups[0].agents[0]', '*');
    assert.nestedPropertyVal(parsed, 'groups[0].agents[1]', 'agent1');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[0].rule', 'disallow');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[0].path', '/path1');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[1].rule', 'allow');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[1].path', '/path2');

    assert.nestedPropertyVal(parsed, 'groups[1].agents[0]', 'agent2');
    assert.nestedPropertyVal(parsed, 'groups[1].rules[0].rule', 'allow');
    assert.nestedPropertyVal(parsed, 'groups[1].rules[0].path', '/');

    assert.nestedPropertyVal(parsed, 'groups[2].agents[0]', 'agent3');
    assert.nestedPropertyVal(parsed, 'groups[2].rules[0].rule', 'disallow');
    assert.nestedPropertyVal(parsed, 'groups[2].rules[0].path', '/path3');
  });

  it('should parse noindex', async function () {
    const parsed = await parse(getFixture('noindex'));
    assert.nestedPropertyVal(parsed, 'groups[0].agents[0]', '*');

    assert.nestedPropertyVal(parsed, 'groups[0].rules[0].rule', 'allow');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[0].path', '/path1');

    assert.nestedPropertyVal(parsed, 'groups[0].rules[1].rule', 'disallow');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[1].path', '/*/path2/');

    assert.nestedPropertyVal(parsed, 'groups[0].rules[2].rule', 'noindex');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[2].path', '/*/path2/');

    assert.nestedPropertyVal(parsed, 'groups[0].rules[3].rule', 'noindex');
    assert.nestedPropertyVal(parsed, 'groups[0].rules[3].path', '/*/path3/');
  });
});
