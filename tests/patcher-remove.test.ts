import {Patcher} from '../src';
import {InvalidWhitespaceDirective} from '../src/errors';

describe('Patcher <remove>', () => {
  test('it removes target element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b"/></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>xz</a>');
  });

  test('it also removes white space text node before target', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="before"/></diff>')
      .patch('<a>\n   \n<b>y</b>\nz</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>\nz</a>');
  });

  test('it also removes white space text node after target', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="after"/></diff>')
      .patch('<a>x\n<b>y</b>\n   \n</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x\n</a>');
  });

  test('it also removes white space text node around target', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="/a/b" ws="both"/></diff>')
      .patch('<a>\n   \n<b>y</b>\n   \n</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a/>');
  });

  test('it throws exception if no white space text node', () => {
    expect.assertions(3);
    expect(() => new Patcher()
      .load('<diff><remove sel="/a/b" ws="before"/></diff>')
      .patch('<a>\nx\n<b>y</b>\nz\n</a>'),
    ).toThrow(InvalidWhitespaceDirective);
    expect(() => new Patcher()
      .load('<diff><remove sel="/a/b" ws="after"/></diff>')
      .patch('<a>\nx\n<b>y</b>\nz\n</a>'),
    ).toThrow(InvalidWhitespaceDirective);
    expect(() => new Patcher()
      .load('<diff><remove sel="/a/b" ws="both"/></diff>')
      .patch('<a><d/><b>y</b><c/></a>'),
    ).toThrow(InvalidWhitespaceDirective);
  });

  test('it removes comment', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><remove sel="a/comment()[1]"/></diff>')
      .patch('<a><!--d/--><b>y</b></a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a><b>y</b></a>');
  });

  test('it removes processing instruction', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><remove sel="a/processing-instruction(\'xml-stylesheet\')"/></diff>')
      .patch('<a><?xml-stylesheet href="a"?><b>y</b></a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a><b>y</b></a>');
  });

  test('it removes namespace declaration', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><remove sel="a/namespace::ns"/></diff>')
      .patch('<a><b xml:ns="urn:xxx">y</b></a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a><b>y</b></a>');
  });
});
