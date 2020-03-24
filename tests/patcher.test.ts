import {readFileSync} from 'fs';
import {Patcher} from '../src';

test('it', () => {
  const xml = readFileSync('tests/data/1A.xml', {encoding: 'utf-8'});
  const diff = readFileSync('tests/data/1A.diff.xml', {encoding: 'utf-8'});
  const patcher = new Patcher();
  patcher.load(diff);
  patcher.patch(xml);
});
