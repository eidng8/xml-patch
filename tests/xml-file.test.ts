import {XML} from '../src';
import {DocumentImpl} from 'xmldom-ts';
import {InvalidDiffFormat} from '../src/errors';

describe('XMLFile', () => {
  it('reads XML file', async () => {
    expect.assertions(2);
    return new XML().fromFile('tests/data/docA.xml').then(xml => {
      expect(xml.encoding).toBe('iso-8859-1');
      expect(xml.doc).toBeInstanceOf(DocumentImpl);
    });
  });

  it('handles XML string', () => {
    expect.assertions(2);
    const xml = new XML().fromString('<a>a</a>');
    expect(xml.encoding).toBe('utf-8');
    expect(xml.doc).toBeInstanceOf(DocumentImpl);
  });

  it('falls back to default encoding', async () => {
    expect.assertions(2);
    return new XML({defaultEncoding: 'latin1'})
      .fromFile('tests/data/eA.diff.xml')
      .then(xml => {
        expect(xml.encoding).toBe('latin1');
        expect(xml.doc).toBeInstanceOf(DocumentImpl);
      });
  });

  it('pretty prints XML', () => {
    expect.assertions(1);
    expect(new XML().fromString('<p><b>xxx</b>yyy<br/></p>\n').toString())
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
    const xml = new XML().fromString(txt);
    const expected = '<?xml version="1.0"?><!-- test --><a>x<b>y</b>z</a>';
    expect(xml.toString({minify: true, preserveComments: true}))
      .toBe(expected);
  });

  it('minifies XML and removes comments', async () => {
    expect.assertions(1);
    const txt = `<?xml version="1.0"?>
      <!-- just a test -->
      <a>x<b>y</b>z</a>`;
    const xml = new XML().fromString(txt);
    const expected = '<?xml version="1.0"?><a>x<b>y</b>z</a>';
    expect(xml.toString({minify: true, preserveComments: false}))
      .toBe(expected);
  });

  it('rejects if file not found', async () => {
    expect.assertions(1);
    return new XML().fromFile('not exist').catch(e => {
      expect(e).toEqual(new Error('File doesn\'t exist: not exist'));
    });
  });

  it('reports XML warning without rejecting', async () => {
    expect.assertions(2);
    const xml = new XML().fromString('<a>');
    expect(xml.warnings.length).toBe(1);
    expect(xml.warnings[0]).toContain('unclosed xml element');
  });

  it('rejects XML warning if requested', () => {
    expect.assertions(1);
    const xml = new XML({warnError: true});
    expect(() => xml.fromString('<a>'))
      .toThrow(InvalidDiffFormat);
  });

  it('rejects XML warning in file if requested', async () => {
    expect.assertions(3);
    const xml = new XML({
      warnError: true,
      fsMock: {readFile: (_: any, cb: any) => cb(null, Buffer.from('<a>'))},
    });
    return xml.fromFile('tests/data/1A.xml')
      .then(() => {
        throw new Error('exception was not thrown');
      })
      .catch(e => {
        expect(e).toEqual(new Error('Failed to parse the given XML'));
        expect(xml.warnings.length).toBe(1);
        expect(xml.warnings[0]).toContain('unclosed xml element');
      });
  });

  it('rejects if failed to read file', async () => {
    expect.assertions(1);
    const xml = new XML({
      fsMock: {readFile: (_: any, cb: any) => cb(new Error('just a test'), '')},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('just a test'));
    });
  });

  it('rejects if failed to get file buffer', async () => {
    expect.assertions(1);
    const xml = new XML({
      fsMock: {readFile: (_: any, cb: any) => cb(null, null)},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('Failed to read file: tests/data/1A.xml'));
    });
  });

  it('rejects if file is empty', async () => {
    expect.assertions(1);
    const xml = new XML({
      fsMock: {readFile: (_: any, cb: any) => cb(null, Buffer.from(''))},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('File is empty: tests/data/1A.xml'));
    });
  });

  it('removes empty text nodes', () => {
    expect.assertions(1);
    const xml = new XML().fromString('<a>\n\n<b>\n</b> \n<c>a\n</c> </a>\n');
    xml.removeEmptyTextNodes(xml.doc.firstChild);
    // It seems the serializer automatically collapses empty tags.
    expect(xml.doc.toString())
      .toBe('<a><b/><c>a\n</c></a>');
  });

  it('trims text nodes', () => {
    expect.assertions(1);
    const xml = new XML().fromString('<a>\na a\n<b>\n b \n</b> c\n</a>\n');
    xml.trimTextContents(xml.doc.firstChild);
    // It seems the serializer automatically collapses empty tags.
    expect(xml.doc.toString()).toBe('<a>a a<b>b</b>c</a>');
  });
});
