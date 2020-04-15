/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { DocumentImpl } from 'xmldom-ts';
import { XmlFile } from '../../src';
import '../helpers';

describe('XML Wrapper', () => {
  it('reads XML file', async () => {
    expect.assertions(2);
    return new XmlFile().fromFile('tests/data/docA.xml').then(xml => {
      expect(xml.encoding).toBe('iso-8859-1');
      expect(xml.doc).toBeInstanceOf(DocumentImpl);
    });
  });

  it('falls back to default encoding', async () => {
    expect.assertions(2);
    return new XmlFile({ defaultEncoding: 'latin1' })
      .fromFile('tests/data/eA.diff.xml')
      .then(xml => {
        expect(xml.encoding).toBe('latin1');
        expect(xml.doc).toBeInstanceOf(DocumentImpl);
      });
  });

  it('rejects if file not found', async () => {
    expect.assertions(1);
    return new XmlFile().fromFile('not exist').catch(e => {
      expect(e).toEqual(new Error("File doesn't exist: not exist"));
    });
  });

  it('rejects XML warning in file', async () => {
    expect.assertions(1);
    const xml = new XmlFile({
      fsMock: { readFile: (_: any, cb: any) => cb(null, Buffer.from('<a>')) },
    });
    return xml
      .fromFile('tests/data/1A.xml')
      .then(() => {
        throw new Error('exception was not thrown');
      })
      .catch(e => expect(e).toBeInstanceOf(Error));
  });

  it('rejects if failed to read file', async () => {
    expect.assertions(1);
    const xml = new XmlFile({
      fsMock: {
        readFile: (_: any, cb: any) => cb(new Error('just a test'), ''),
      },
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('just a test'));
    });
  });

  it('rejects if failed to get file buffer', async () => {
    expect.assertions(1);
    const xml = new XmlFile({
      fsMock: { readFile: (_: any, cb: any) => cb(null, null) },
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('Failed to read file: tests/data/1A.xml'));
    });
  });

  it('rejects if file is empty', async () => {
    expect.assertions(1);
    const xml = new XmlFile({
      fsMock: { readFile: (_: any, cb: any) => cb(null, Buffer.from('')) },
    });
    return xml.fromFile('tests/data/1A.xml').catch(e => {
      expect(e).toEqual(new Error('File is empty: tests/data/1A.xml'));
    });
  });
});
