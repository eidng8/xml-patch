import {Diff, XML} from '../src';
import {InvalidAttributeValue} from '../src/errors';

describe('Diff', () => {
  test('it throws if `sel` attribute is missing', () => {
    expect.assertions(2);
    try {
      // eslint-disable-next-line
      new Diff('<diff><add/><remove sel="v"/></diff>');
    } catch (ex) {
      expect(ex).toBeInstanceOf(InvalidAttributeValue);
      expect(ex.toString()).toBe(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        + '<err:patch-ops-error \n'
        + '  xmlns:err="urn:ietf:params:xml:ns:patch-ops-error" \n'
        + '  xmlns="urn:ietf:params:xml:ns:pidf-diff">\n'
        + '  <err:invalid-attribute-value phrase="Missing `sel` attribute.">\n'
        + '    <add/>\n'
        + '  </err:invalid-attribute-value>\n'
        + '</err:patch-ops-error>',
      );
    }
  });

  test('it will not change expression without namespace', async () => {
    expect.assertions(1);
    const xml = new XML();
    await xml.fromFile('tests/data/1A.diff.xml');
    const diff = new Diff(xml);
    expect(diff.actions[0].getAttribute('sel')).toBe('/a/b');
  });

  test('it mangles diff namespace', async () => {
    expect.assertions(8);
    const xml = new XML();
    await xml.fromFile('tests/data/rfc-a18.diff.xml');
    const diff = new Diff(xml);
    let action = diff.actions[0];
    // * XPath query should be expanded using default namespace
    // * attribute should be left untouched
    expect(action.localName).toBe('add');
    expect(action.getAttribute('sel')).toBe(
      // @formatter:off
      "/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='doc']/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='elem'][@*[local-name()='a']='foo']",
      // @formatter:on
    );
    action = diff.actions[1];
    // * XPath query should be expanded using default namespace
    // * function should be left untouched
    expect(action.localName).toBe('replace');
    expect(action.getAttribute('sel')).toBe(
      // @formatter:off
      "/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='doc']/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='note']/text()",
      // @formatter:on
    );
    action = diff.actions[2];
    // * XPath query should be expanded using default namespace
    // * XPath query should be expanded using namespace specified by prefix
    // * asterisks should be left untouched
    // * attribute should be left untouched
    // * function should be left untouched
    expect(action.localName).toBe('remove');
    expect(action.getAttribute('sel')).toBe(
      // @formatter:off
      "/*/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='elem'][@*[local-name()='a']='bar']/*[namespace-uri()='urn:ietf:params:xml:ns:yyy'][local-name()='child']",
      // @formatter:on
    );
    action = diff.actions[3];
    // * XPath query should be expanded using default namespace
    // * asterisks should be left untouched
    // * attribute should be left untouched
    expect(action.localName).toBe('add');
    expect(action.getAttribute('sel')).toBe(
      // @formatter:off
      "/*/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='elem'][@*[local-name()='a']='bar']",
      // @formatter:on
    );
  });
});
