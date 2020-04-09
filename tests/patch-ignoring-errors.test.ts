/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  dontIgnoreExceptions,
  ignoreExceptions,
  InvalidAttributeValue,
  InvalidCharacterSet, InvalidNodeTypes,
  Patch,
  setExceptionHandler,
} from '../src';

/**
 * All tests here must check the target document is not changed
 * unintentionally or unexpectedly.
 */
describe('Patch ignoring errors', () => {
  afterAll(() => dontIgnoreExceptions());

  test('it does not throw ignored error', () => {
    expect.assertions(3);
    ignoreExceptions([InvalidAttributeValue, InvalidCharacterSet]);
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidAttributeValue);
    });
    expect(() => {
      expect(new Patch()
        .load('<diff><replace><c>y</c></replace></diff>')
        .patch('<a>x<b>y</b>z</a>')
        .toString({minify: true}))
        .toBe('<a>x<b>y</b>z</a>');
    }).not.toThrow();
  });

  test('it replaces target element with multiple elements', () => {
    expect.assertions(2);
    ignoreExceptions(InvalidNodeTypes);
    setExceptionHandler(ex => {
      expect(ex).toBeInstanceOf(InvalidNodeTypes);
    });
    expect(new Patch()
      .load('<diff><replace sel="/a/b"><c/><d/><e/></replace></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<c/><d/><e/>z</a>');
  });
});
