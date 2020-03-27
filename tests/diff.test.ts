import {Diff, XMLFile} from '../src';

describe('Diff', () => {
  test('it will not change expression without namespace', () => {
    expect.assertions(1);
    return new XMLFile().fromFile('tests/data/1A.diff.xml').then(xml => {
      const diff = new Diff(xml);
      expect(diff.actions[0].getAttribute('sel')).toBe('/a/b');
    });
  });
});
