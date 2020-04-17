/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  InvalidAttributeValue,
  InvalidCharacterSet,
  Patch,
  UnlocatedNode,
} from '../src';
import XmlWrapper from '../src/xml/xml-wrapper';
import XmlFile from '../src/xml/xml-file';
import './helpers';

describe('Patch', () => {
  it('throws if `sel` attribute is missing', () => {
    expect.assertions(2);
    try {
      // eslint-disable-next-line
      new Patch('<diff><add/><remove sel="v"/></diff>');
    } catch (ex) {
      expect(ex).toBeInstanceOf(InvalidAttributeValue);
      expect(ex.toLocaleString()).toEqualXml(
        '<?xml version="1.0" encoding="utf-8"?>\n' +
          '<err:patch-ops-error \n' +
          '  xmlns:err="urn:ietf:params:xml:ns:patch-ops-error" \n' +
          '  xmlns="urn:ietf:params:xml:ns:pidf-diff">\n' +
          '  <err:invalid-attribute-value phrase="`sel` must be provided and not empty.">\n' +
          '    <add/>\n' +
          '  </err:invalid-attribute-value>\n' +
          '</err:patch-ops-error>',
      );
    }
  });

  it('throws if `sel` attribute is empty', () => {
    expect.assertions(1);
    expect(() => new Patch('<diff><add sel=" "/></diff>')).toThrow(
      InvalidAttributeValue,
    );
  });

  it('will not change expression without namespace', async () => {
    expect.assertions(2);
    const xml = new XmlFile();
    await xml.fromFile('tests/data/1A.diff.xml');
    const patch = new Patch(xml);
    expect(patch.actions[0]!.sel).toBe('/a/b');
    expect(patch.actions[0]!.predicate).toBe(
      "/*[local-name()='a']/*[local-name()='b']",
    );
  });

  it('mangles diff namespace', async () => {
    expect.assertions(8);
    const xml = new XmlFile();
    await xml.fromFile('tests/data/rfc-a18-A.diff.xml');
    const patch = new Patch(xml);
    let action = patch.actions[0]!;
    // * XPath query should be expanded using default namespace
    // * attribute should be left untouched
    expect(action.directive).toBe('add');
    expect(action.predicate).toBe(
      // @formatter:off
      "/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='doc']/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='elem'][@*[local-name()='a']='foo']",
      // @formatter:on
    );
    action = patch.actions[1]!;
    // * XPath query should be expanded using default namespace
    // * function should be left untouched
    expect(action.directive).toBe('replace');
    expect(action.predicate).toBe(
      // @formatter:off
      "/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='doc']/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='note']/text()",
      // @formatter:on
    );
    action = patch.actions[2]!;
    // * XPath query should be expanded using default namespace
    // * XPath query should be expanded using namespace specified by prefix
    // * asterisks should be left untouched
    // * attribute should be left untouched
    // * function should be left untouched
    expect(action.directive).toBe('remove');
    expect(action.predicate).toBe(
      // @formatter:off
      "/*/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='elem'][@*[local-name()='a']='bar']/*[namespace-uri()='urn:ietf:params:xml:ns:yyy'][local-name()='child']",
      // @formatter:on
    );
    action = patch.actions[3]!;
    // * XPath query should be expanded using default namespace
    // * asterisks should be left untouched
    // * attribute should be left untouched
    expect(action.directive).toBe('add');
    expect(action.predicate).toBe(
      // @formatter:off
      "/*/*[namespace-uri()='urn:ietf:params:xml:ns:xxx'][local-name()='elem'][@*[local-name()='a']='bar']",
      // @formatter:on
    );
  });

  it('will not touch predicates', () => {
    expect.assertions(2);
    const action = new Patch('<diff><add sel="//[id()=\'abc\']"/></diff>')
      .actions[0]!;
    expect(action.sel).toEqual("//[id()='abc']");
    expect(action.predicate).toBeNull();
  });

  it('will not touch wildcard', () => {
    expect.assertions(2);
    const action = new Patch('<diff><add sel="*/*"/></diff>').actions[0]!;
    expect(action.sel).toEqual('*/*');
    expect(action.predicate).toBe('/*/*');
  });

  it('looks up prefix', () => {
    expect.assertions(1);
    const patch = new Patch('<diff xmlns:p="urn:xxx"><p:add sel="a"/></diff>');
    expect(patch.lookupPrefix('urn:xxx', patch.actions[0]!.element)).toEqual(
      'p',
    );
  });

  it('throws error if `sel` were missing', () => {
    expect.assertions(1);
    expect(() =>
      new Patch()
        .load('<diff><replace><c>y</c></replace></diff>')
        .apply('<a>x<b>y</b>z</a>'),
    ).toThrow(InvalidAttributeValue);
  });

  it('throws if `sel` matches no target', () => {
    require('../src/translations/zh_chs');
    expect.assertions(2);
    try {
      new Patch('<diff><replace sel="b/c"><c>y</c></replace></diff>').apply(
        '<a>x<b>y<c/></b>z</a>',
      );
    } catch (e) {
      expect(e).toBeInstanceOf(UnlocatedNode);
      expect(e.message).toBe('无法找到匹配节点。');
    }
  });

  it('throws if matched multiple target', () => {
    require('../src/translations/zh_cht');
    expect.assertions(2);
    try {
      new Patch('<diff><add sel="a/b"><c>y</c></add></diff>').apply(
        '<a>x<b>y</b><b>y</b>z</a>',
      );
    } catch (e) {
      expect(e).toBeInstanceOf(UnlocatedNode);
      expect(e.message).toBe('匹配到了多個節點。');
    }
  });

  it('throws if encoding is not same', () => {
    expect.assertions(1);
    const d = new XmlWrapper({ defaultEncoding: 'ascii' }).fromString('<a/>');
    const x = new XmlWrapper({ defaultEncoding: 'utf-8' }).fromString('<a/>');
    expect(() => new Patch().load(d).apply(x)).toThrow(InvalidCharacterSet);
  });
});
