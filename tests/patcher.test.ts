import {existsSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {XMLSerializerImpl} from 'xmldom-ts';
import {Patcher} from '../src';
import './helpers';

describe('Sample XML', () => {
  const [sources, fixtures, patches, patchedFiles] = findSamples();
  for (let idx = 0; idx < sources.length; idx++) {
    const source = sources[idx];
    const fixture = fixtures[idx];
    const patch = patches[idx];

    test(`it patches ${source}`, () => {
      const xml = readFileSync(source, {encoding: 'utf-8'});
      const diff = readFileSync(patch, {encoding: 'utf-8'});
      const patched = new Patcher().load(diff).patch(xml);
      expect(patched).toEqualXml(readFileSync(fixture, {encoding: 'utf-8'}));
      writeFileSync(
        patchedFiles[idx],
        new XMLSerializerImpl().serializeToString(patched as Node),
      );
    });
  }
});

function findSamples() {
  const dir = 'tests/data';
  const sources = [];
  const fixtures = [];
  const patches = [];
  const patched = [];
  const regex = /^.+A.xml$/;
  const files = readdirSync(dir, {withFileTypes: true});
  for (const file of files) {
    if (!file.isFile() || !regex.test(file.name)) {
      continue;
    }
    const prefix = file.name.substr(0, file.name.length - 5);
    const patch = join(dir, `${prefix}A.diff.xml`);
    if (!existsSync(patch)) {
      continue;
    }
    sources.push(join(dir, file.name));
    fixtures.push(join(dir, `${prefix}B.xml`));
    patches.push(patch);
    patched.push(join(dir, `${prefix}A.js-patched.xml`));
  }
  return [sources, fixtures, patches, patched];
}
