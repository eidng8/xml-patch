/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {DocumentImpl} from 'xmldom-ts';
import {ExceptionBag, XmlWrapper} from '../src';
import './helpers';

describe('XML Wrapper', () => {
  it('reads XML file', async () => {
    expect.assertions(2);
    return new XmlWrapper().fromFile('tests/data/docA.xml').then(xml => {
      expect(xml.encoding).toBe('iso-8859-1');
      expect(xml.doc).toBeInstanceOf(DocumentImpl);
    });
  });

  it('handles XML string', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString('<a>a</a>');
    expect(xml.encoding).toBe('utf-8');
    expect(xml.doc).toBeInstanceOf(DocumentImpl);
  });

  it('falls back to default encoding', async () => {
    expect.assertions(2);
    return new XmlWrapper({defaultEncoding: 'latin1'})
      .fromFile('tests/data/eA.diff.xml')
      .then(xml => {
        expect(xml.encoding).toBe('latin1');
        expect(xml.doc).toBeInstanceOf(DocumentImpl);
      });
  });

  it('pretty prints XML', () => {
    expect.assertions(1);
    expect(new XmlWrapper().fromString('<p><b>xxx</b>yyy<br/></p>\n')
      .toString())
      .toBe('<p>\n'
            + '  <b>xxx</b>yyy\n'
            + '  <br/>\n'
            + '</p>');
  });

  it('minifies XML', async () => {
    expect.assertions(1);
    const txt = `<?xml version="1.0"?>
      <!-- test -->
      <a>x<b>y</b>z</a>`;
    const xml = new XmlWrapper().fromString(txt);
    const expected = '<?xml version="1.0"?><!-- test --><a>x<b>y</b>z</a>';
    expect(xml.toString({minify: true, preserveComments: true}))
      .toBe(expected);
  });

  it('minifies XML and removes comments', async () => {
    expect.assertions(1);
    const txt = `<?xml version="1.0"?>
      <!-- just a test -->
      <a>x<b>y</b>z</a>`;
    const xml = new XmlWrapper().fromString(txt);
    const expected = '<?xml version="1.0"?><a>x<b>y</b>z</a>';
    expect(xml.toString({minify: true, preserveComments: false}))
      .toBe(expected);
  });

  it('rejects if file not found', async () => {
    expect.assertions(1);
    return new XmlWrapper().fromFile('not exist').catch(e => {
      expect(e).toEqual(new Error('File doesn\'t exist: not exist'));
    });
  });

  it('ignores XML warning if requested', async () => {
    expect.assertions(1);
    expect(() => new XmlWrapper({warnError: false}).fromString('<a>'))
      .not.toThrow();
  });

  it('throws XML warning in string', () => {
    expect.assertions(1);
    const xml = new XmlWrapper({warnError: true});
    expect(() => xml.fromString('<a>')).toThrow(ExceptionBag);
  });

  it('rejects XML warning in file', async () => {
    expect.assertions(1);
    const xml = new XmlWrapper({
      fsMock: {readFile: (_: any, cb: any) => cb(null, Buffer.from('<a>'))},
    });
    return xml.fromFile('tests/data/1A.xml')
      .then(() => {
        throw new Error('exception was not thrown');
      })
      .catch(e => expect(e).toBeInstanceOf(Error));
  });

  it('rejects if failed to read file', async () => {
    expect.assertions(1);
    const xml = new XmlWrapper({
      fsMock: {readFile: (_: any, cb: any) => cb(new Error('just a test'), '')},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('just a test'));
    });
  });

  it('rejects if failed to get file buffer', async () => {
    expect.assertions(1);
    const xml = new XmlWrapper({
      fsMock: {readFile: (_: any, cb: any) => cb(null, null)},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('Failed to read file: tests/data/1A.xml'));
    });
  });

  it('rejects if file is empty', async () => {
    expect.assertions(1);
    const xml = new XmlWrapper({
      fsMock: {readFile: (_: any, cb: any) => cb(null, Buffer.from(''))},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('File is empty: tests/data/1A.xml'));
    });
  });

  it('removes empty text nodes', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString(
      '<a>\n\n<b>\n</b> \n<c>a\n<d/></c> <!--f--></a>\n');
    xml.removeEmptyTextNodes(xml.doc.firstChild);
    expect(xml.doc).toEqualXml('<a><b/><c>a\n<d/></c><!--f--></a>');
  });

  it('trims text nodes', () => {
    expect.assertions(1);
    const xml = new XmlWrapper().fromString(
      '<a>\na a\n<b>\n b \n<c/></b> c\n<?pi ?></a>\n');
    xml.trimTextContents(xml.doc.firstChild);
    expect(xml.doc).toEqualXml('<a>a a<b>b<c/></b>c<?pi ?></a>');
  });

  it('returns first CData child', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString(
      '<a><![CDATA[abc]]><![CDATA[def]]></a>');
    expect(XmlWrapper.firstCDataChild(xml.root!)!)
      .toEqualXml('<![CDATA[abc]]>');
    expect(XmlWrapper.firstCDataChild(xml.root!.firstChild))
      .toBeNull();
  });

  it('returns first comment child', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString('<a><!--abc--><!--def--></a>');
    expect(XmlWrapper.firstCommentChild(xml.root!)!)
      .toEqualXml('<!--abc-->');
    expect(XmlWrapper.firstCommentChild(xml.root!.firstChild))
      .toBeNull();
  });

  it('returns first processing instruction child', () => {
    expect.assertions(2);
    const xml = new XmlWrapper().fromString('<a><?pi ?><b/></a>');
    expect(XmlWrapper.firstProcessingInstructionChild(xml.root!))
      .toEqualXml('<?pi ?>');
    expect(XmlWrapper.firstProcessingInstructionChild(xml.root!.firstChild))
      .toBeNull();
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
    expect(xml.addNamespace('p', 'urn:xxx'))
      .toEqualXml('<a xmlns:p="urn:xxx"/>');
  });

  it('throws multiple exception in one go', () => {
    expect.assertions(2);
    try {
      // noinspection CheckDtdRefs
      new XmlWrapper().fromString('<a>&noteneity;</b></a>');
    } catch (e) {
      expect(e).toBeInstanceOf(ExceptionBag);
      expect(new XmlWrapper().fromString(e.toString()))
        .toEqualXml(
          '<?xml version="1.0" encoding="utf-8"?>'
          + '<err:patch-ops-error'
          + ' xmlns:err="urn:ietf:params:xml:ns:patch-ops-error"'
          + ' xmlns="urn:ietf:params:xml:ns:pidf-diff">'
          + '<err:invalid-entity-declaration'
          + ' phrase="[xmldom error]\t'
          + 'entity not found:&amp;noteneity;\n'
          + '@#[line:1,col:1]"/>'
          + '<err:invalid-diff-format'
          + ' phrase="[xmldom error]\t'
          + 'closing tag \'b\' does not have a starting tag.\n'
          + '@#[line:1,col:4]"/>'
          + '</err:patch-ops-error>');
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
      expect(new XmlWrapper().fromString(xml.exception.toString()))
        .toEqualXml(
          '<?xml version="1.0" encoding="utf-8"?>'
          + '<err:patch-ops-error'
          + ' xmlns:err="urn:ietf:params:xml:ns:patch-ops-error"'
          + ' xmlns="urn:ietf:params:xml:ns:pidf-diff">'
          + '<err:invalid-diff-format'
          + ' phrase="[xmldom fatalError]\telement parse error:'
          + ' Error: just a test\n'
          + '@#[line:1,col:1]"/>'
          + '</err:patch-ops-error>');
    }
  });
});
