import {existsSync, readdirSync, readFileSync} from 'fs';
import {join} from 'path';
import {Patcher} from '../src';
import './helpers';

describe('Sample XML', () => {
  const [sources, fixtures, patches] = findSamples();
  for (let idx = 0; idx < sources.length; idx++) {
    const source = sources[idx];
    const fixture = fixtures[idx];
    const patch = patches[idx];

    test(`it patches ${source}`, () => {
      const xml = readFileSync(source, {encoding: 'utf-8'});
      const diff = readFileSync(patch, {encoding: 'utf-8'});
      expect(new Patcher().load(diff).patch(xml))
        .toEqualXml(readFileSync(fixture, {encoding: 'utf-8'}));
    });
  }
});

function findSamples() {
  const dir = 'tests/data';
  const sources = [];
  const fixtures = [];
  const patches = [];
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
  }
  return [sources, fixtures, patches];
}
