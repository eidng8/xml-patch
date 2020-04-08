import {existsSync, readdirSync, readFileSync, writeFileSync} from 'fs';
import {join} from 'path';
import {Patcher} from '../src';
import {format} from './helpers';

describe('Sample XML', () => {
  const [sources, fixtures, patches, patchedFiles] = findSamples();
  for (let idx = 0; idx < sources.length; idx++) {
    const source = sources[idx];
    const fixture = fixtures[idx];
    const patch = patches[idx];

    test(`it patches ${source}`, () => {
      expect.assertions(1);
      const xml = readFileSync(source, {encoding: 'utf-8'});
      const diff = readFileSync(patch, {encoding: 'utf-8'});
      try {
        const patched = new Patcher().load(diff).patch(xml);
        writeFileSync(patchedFiles[idx], format(patched.toString()));
        expect(patched).toEqualXml(readFileSync(fixture, {encoding: 'utf-8'}));
      } catch (ex) {
        throw new Error(ex.toString());
      }
    });
  }
});

function findSamples() {
  const dir = 'tests/data';
  const sources = [] as string[];
  const fixtures = [] as string[];
  const patches = [] as string[];
  const patched = [] as string[];
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
