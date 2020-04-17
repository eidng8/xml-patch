/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { DocumentImpl } from 'xmldom-ts';
import {
  ExceptionBag,
  firstCDataChild,
  firstCommentChild,
  firstProcessingInstructionChild,
  XmlWrapper,
} from '../../src';
import '../helpers';

describe('XML Wrapper', () => {
  it('handles XML string', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString('<a>a</a>');
    expect(xml.encoding).toBe('utf-8');
    expect(xml.doc).toBeInstanceOf(DocumentImpl);
  });

  it('pretty prints XML', () => {
    expect.assertions(1);
    expect(
      new XmlWrapper().fromString('<p><b>xxx</b>yyy<br/></p>\n').toString(),
    ).toBe('<p>\n' + '  <b>xxx</b>yyy\n' + '  <br/>\n' + '</p>');
  });

  it('minifies XML', async () => {
    expect.assertions(1);
    const txt = `<?xml version="1.0"?>
      <!-- test -->
      <a>x<b>y</b>z</a>`;
    const xml = new XmlWrapper().fromString(txt);
    const expected = '<?xml version="1.0"?><!-- test --><a>x<b>y</b>z</a>';
    expect(xml.toString({ minify: true, preserveComments: true })).toBe(
      expected,
    );
  });

  it('minifies XML and removes comments', async () => {
    expect.assertions(1);
    const txt = `<?xml version="1.0"?>
      <!-- just a test -->
      <a>x<b>y</b>z</a>`;
    const xml = new XmlWrapper().fromString(txt);
    const expected = '<?xml version="1.0"?><a>x<b>y</b>z</a>';
    expect(xml.toString({ minify: true, preserveComments: false })).toBe(
      expected,
    );
  });

  it('throws XML warning in string', () => {
    expect.assertions(1);
    const xml = new XmlWrapper();
    expect(() => xml.fromString('<a>')).toThrow(ExceptionBag);
  });

  it('returns first CData child', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString(
      '<a><![CDATA[abc]]><![CDATA[def]]></a>',
    );
    expect(firstCDataChild(xml.root!)!).toEqualXml('<![CDATA[abc]]>');
    expect(firstCDataChild(xml.root!.firstChild)).toBeNull();
  });

  it('returns first comment child', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString('<a><!--abc--><!--def--></a>');
    expect(firstCommentChild(xml.root!)!).toEqualXml('<!--abc-->');
    expect(firstCommentChild(xml.root!.firstChild)).toBeNull();
  });

  it('returns first processing instruction child', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString('<a><?pi ?><b/></a>');
    expect(firstProcessingInstructionChild(xml.root!)).toEqualXml('<?pi ?>');
    expect(firstProcessingInstructionChild(xml.root!.firstChild)).toBeNull();
  });

  it('looks up default namespace URI on root', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString('<a xmlns="urn:xxx"></a>\n');
    expect(xml.lookupNamespaceURI('')).toBe('urn:xxx');
  });

  it('looks up prefix namespace URI on root', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString('<a xmlns:p="urn:xxx"></a>\n');
    expect(xml.lookupNamespaceURI('p')).toBe('urn:xxx');
  });

  it('looks up null prefix', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString('<a xmlns:p="urn:xxx"></a>\n');
    expect(xml.lookupPrefix('')).toBeNull();
  });

  it('looks will not add empty prefix', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString('<a/>\n');
    expect(xml.addNamespace('', '')).toEqualXml('<a/>');
  });

  it('adds prefix to root', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString('<a/>\n');
    expect(xml.addNamespace('p', 'urn:xxx')).toEqualXml(
      '<a xmlns:p="urn:xxx"/>',
    );
  });

  it('throws multiple exception in one go', () => {
    expect.assertions(2);
    try {
      // noinspection CheckDtdRefs
      new XmlWrapper().fromString('<a>&noteneity;</b></a>');
    } catch (e) {
      expect(e).toBeInstanceOf(ExceptionBag);
      expect(new XmlWrapper().fromString(e.toString())).toEqualXml(
        '<?xml version="1.0" encoding="utf-8"?>' +
          '<err:patch-ops-error' +
          ' xmlns:err="urn:ietf:params:xml:ns:patch-ops-error"' +
          ' xmlns="urn:ietf:params:xml:ns:pidf-diff">' +
          '<err:invalid-entity-declaration' +
          ' phrase="[xmldom error]\t' +
          'entity not found:&amp;noteneity;\n' +
          '@#[line:1,col:1]"/>' +
          '<err:invalid-diff-format' +
          ' phrase="[xmldom error]\t' +
          "closing tag 'b' does not have a starting tag.\n" +
          '@#[line:1,col:4]"/>' +
          '</err:patch-ops-error>',
      );
    }
  });

  it('throws fatal error', () => {
    expect.assertions(2);
    const xml = new XmlWrapper();
    // eslint-disable-next-line
    xml['error'] = () => {
      throw new Error('just a test');
    };
    try {
      xml.fromString('<a>&noteneity;</b></a>');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect(new XmlWrapper().fromString(xml.exception.toString())).toEqualXml(
        '<?xml version="1.0" encoding="utf-8"?>' +
          '<err:patch-ops-error' +
          ' xmlns:err="urn:ietf:params:xml:ns:patch-ops-error"' +
          ' xmlns="urn:ietf:params:xml:ns:pidf-diff">' +
          '<err:invalid-diff-format' +
          ' phrase="[xmldom fatalError]\telement parse error:' +
          ' Error: just a test\n' +
          '@#[line:1,col:1]"/>' +
          '</err:patch-ops-error>',
      );
    }
  });
});
