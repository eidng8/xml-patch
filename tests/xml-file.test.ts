import {XMLFile} from '../src';
import {DocumentImpl, XMLSerializerImpl} from 'xmldom-ts';

describe('XMLFile', () => {
  it('reads XML file', async () => {
    expect.assertions(2);
    return new XMLFile().fromFile('tests/data/docA.xml').then(xml => {
      expect(xml.encoding).toBe('iso-8859-1');
      expect(xml.doc).toBeInstanceOf(DocumentImpl);
    });
  });

  it('handles XML string', () => {
    expect.assertions(2);
    const xml = new XMLFile().fromString('<a>a</a>');
    expect(xml.encoding).toBe('utf-8');
    expect(xml.doc).toBeInstanceOf(DocumentImpl);
  });

  it('falls back to default encoding', async () => {
    expect.assertions(2);
    return new XMLFile({defaultEncoding: 'latin1'})
      .fromFile('tests/data/eA.diff.xml')
      .then(xml => {
        expect(xml.encoding).toBe('latin1');
        expect(xml.doc).toBeInstanceOf(DocumentImpl);
      });
  });

  it('pretty prints XML', async () => {
    expect.assertions(1);
    return new XMLFile().fromFile('tests/data/cA.xml').then(xml => {
      const expected = '<p>\n'
                       + '  <b>xxx</b>yyy\n'
                       + '  <br/>\n'
                       + '</p>';
      expect(xml.toString()).toBe(expected);
    });
  });

  it('minifies XML', async () => {
    expect.assertions(1);
    const txt = `<?xml version="1.0"?>
      <!-- test -->
      <a>x<b>y</b>z</a>`;
    const xml = new XMLFile().fromString(txt);
    const expected = '<?xml version="1.0"?><!-- test --><a>x<b>y</b>z</a>';
    expect(xml.toString(true, true)).toBe(expected);
  });

  it('minifies XML and removes comments', async () => {
    expect.assertions(1);
    const txt = `<?xml version="1.0"?>
      <!-- just a test -->
      <a>x<b>y</b>z</a>`;
    const xml = new XMLFile().fromString(txt);
    const expected = '<?xml version="1.0"?><a>x<b>y</b>z</a>';
    expect(xml.toString(true)).toBe(expected);
  });

  it('rejects if file not found', async () => {
    expect.assertions(1);
    return new XMLFile().fromFile('not exist').catch(e => {
      expect(e).toEqual(new Error('File doesn\'t exist: not exist'));
    });
  });

  it('reports XML warning without rejecting', async () => {
    expect.assertions(2);
    const xml = new XMLFile().fromString('<a>');
    expect(xml.warnings.length).toBe(1);
    expect(xml.warnings[0]).toContain('unclosed xml element');
  });

  it('rejects XML warning if requested', () => {
    expect.assertions(1);
    const xml = new XMLFile({warnError: true});
    expect(() => xml.fromString('<a>'))
      .toThrowError('Failed to parse the given XML');
  });

  it('rejects XML warning in file if requested', async () => {
    expect.assertions(3);
    const xml = new XMLFile({
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
    const xml = new XMLFile({
      fsMock: {readFile: (_: any, cb: any) => cb(new Error('just a test'), '')},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('just a test'));
    });
  });

  it('rejects if failed to get file buffer', async () => {
    expect.assertions(1);
    const xml = new XMLFile({
      fsMock: {readFile: (_: any, cb: any) => cb(null, null)},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('Failed to read file: tests/data/1A.xml'));
    });
  });

  it('rejects if file is empty', async () => {
    expect.assertions(1);
    const xml = new XMLFile({
      fsMock: {readFile: (_: any, cb: any) => cb(null, Buffer.from(''))},
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('File is empty: tests/data/1A.xml'));
    });
  });

  it('removes empty text nodes', () => {
    expect.assertions(1);
    const xml = new XMLFile().fromString('<a>\n\n<b>\n</b> \n<c>a\n</c> </a>\n');
    xml.removeEmptyTextNodes(xml.doc.firstChild);
    // It seems the serializer automatically collapses empty tags.
    expect(new XMLSerializerImpl().serializeToString(xml.doc))
      .toBe('<a><b/><c>a\n</c></a>');
  });

  it('trims text nodes', () => {
    expect.assertions(1);
    const xml = new XMLFile().fromString('<a>\na a\n<b>\n b \n</b> c\n</a>\n');
    xml.trimTextContents(xml.doc.firstChild);
    // It seems the serializer automatically collapses empty tags.
    expect(new XMLSerializerImpl().serializeToString(xml.doc))
      .toBe('<a>a a<b>b</b>c</a>');
  });
});
