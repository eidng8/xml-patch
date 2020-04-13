/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  dontIgnoreExceptions,
  Exception,
  ignoreExceptions,
  InvalidAttributeValue,
  InvalidDiffFormat,
  InvalidNamespaceURI,
  InvalidPrologOperation,
  throwException,
  UnsupportedIdFunction,
  UnsupportedXmlId,
} from '../src';

describe('Exception', () => {
  it('generates empty error tag', () => {
    expect.assertions(2);
    const ex = new InvalidAttributeValue().toString();
    expect(ex).not.toContain('phrase="');
    expect(ex).toContain('<err:invalid-attribute-value/>');
  });

  it('does nothing if no error handler', () => {
    expect.assertions(1);
    ignoreExceptions(InvalidAttributeValue);
    expect(() => throwException(new InvalidAttributeValue()))
      .not.toThrow();
    dontIgnoreExceptions();
  });

  it('has default message', () => {
    expect.assertions(5);
    let ex: Exception = new InvalidDiffFormat();
    expect(ex.message).toEqual(Exception.ErrXML);
    ex = new InvalidNamespaceURI();
    expect(ex.message).toEqual(Exception.ErrNamespaceURI);
    ex = new InvalidPrologOperation();
    expect(ex.message).toEqual(Exception.ErrProlog);
    ex = new UnsupportedIdFunction();
    expect(ex.message).toEqual(Exception.ErrFunction);
    ex = new UnsupportedXmlId();
    expect(ex.message).toEqual(Exception.ErrID);
  });
});
