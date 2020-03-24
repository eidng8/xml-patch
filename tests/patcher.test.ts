import {readFileSync} from 'fs';
import format from 'xml-formatter';
import {Patcher} from '../src';
import {XMLSerializerImpl} from 'xmldom-ts';

test('it', () => {
  const xml = readFileSync('tests/data/1A.xml', {encoding: 'utf-8'});
  const diff = readFileSync('tests/data/1A.diff.xml', {encoding: 'utf-8'});
  const patcher = new Patcher();
  patcher.load(diff);
  const patched = patcher.patch(xml);
  expect(format(new XMLSerializerImpl().serializeToString(patched!)))
    .toEqual(format(readFileSync('tests/data/1B.xml', {encoding: 'utf-8'})));
});
