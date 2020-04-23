/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

/*
 * The change log must have at least two versions.
 */

const fs = require('fs');
const path = require('path');
const version = require('../package.json').version;

updateReleaseNotes(
  updateChangeLog(path.resolve(path.join(__dirname, '../CHANGELOG.md'))),
);
console.log(version);

/**
 * Updates `Unreleased` to current version
 * @param {string} file
 * @return {string}
 */
function updateChangeLog(file) {
  let log = fs.readFileSync(file).toString('utf-8');
  // find the `unreleased` & last version log header
  const regex = /## \[(.+)]\(.+\)/gm;
  const first = regex.exec(log);
  const second = regex.exec(log);
  // replace the `unreleased` header and comparison to current version
  log = log
    .replace(first[0], header(version))
    .replace(
      /^\[Full Changelog]\(.+\)$/m,
      `[Full Changelog](${linkCompare(second[1], version)})`,
    );
  // update changelog file
  fs.writeFileSync(file, log, { encoding: 'utf-8' });
  return log;
}

/**
 * Extracts current version log to release notes
 * @param {string} log
 */
function updateReleaseNotes(log) {
  // extract current version log to release notes
  const match = /## \[.+?## \[/ms.exec(log)[0];
  const note = path.resolve(path.join(__dirname, '../RELEASE.md'));
  const text = `# XML-patch v${version}

An RFC 5261 compliant XML patch library.
Released under [GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html).


${match.substr(0, match.length - 4)}`;
  fs.writeFileSync(note, text, {
    encoding: 'utf-8',
    flag: 'w+',
  });
}

/**
 * @param {string} path
 * @return {string}
 */
function linkRepo(path) {
  path = path.trim();
  while ('/' == path[0]) path = path.slice(1);
  return `https://github.com/eidng8/xml-patch/${path}`;
}

/**
 * @param {string} version
 * @return {string}
 */
function linkVersion(version) {
  return linkRepo(`tree/${version}`);
}

/**
 * @param {string} v1
 * @param {string} v2
 * @return {string}
 */
function linkCompare(v1, v2) {
  return linkRepo(`compare/${v1}...${v2}`);
}

/**
 * @param {string} version
 * @return {string}
 */
function header(version) {
  const dt = new Date().toISOString().split('T')[0];
  return `## [${version}](${linkVersion(version)}) (${dt} UTC)`;
}
