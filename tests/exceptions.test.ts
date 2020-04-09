import {Patch} from '../src';
import {
  dontIgnoreExceptions,
  ignoreExceptions,
  InvalidAttributeValue,
  InvalidCharacterSet,
  setExceptionHandler,
} from '../src/errors';

// these tests must assert that original content isn't changed when
// an error is ignored.
describe('Exceptions', () => {
  afterAll(() => dontIgnoreExceptions());

  test('it does not throws ignored error', () => {
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
});
