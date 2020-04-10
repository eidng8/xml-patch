/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  dontIgnoreExceptions, Exception,
  ignoreExceptions,
  InvalidAttributeValue, InvalidDiffFormat,
  throwException,
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
    expect.assertions(1);
    const ex = new InvalidDiffFormat();
    expect(ex.message).toEqual(Exception.ErrXML);
  });
});
