import {Patch} from '../src';
import {
  InvalidNamespacePrefix,
  InvalidWhitespaceDirective,
} from '../src/errors';

describe('Patcher <remove>', () => {
  test('it removes target element', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><remove sel="/a/b"/></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>xz</a>');
  });

  test('it removes white space text node before target', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><remove sel="/a/b" ws="before"/></diff>')
      .patch('<a>\n   \n<b>y</b>\nz</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>\nz</a>');
  });

  test('it removes white space text node after target', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><remove sel="/a/b" ws="after"/></diff>')
      .patch('<a>x\n<b>y</b>\n   \n</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x\n</a>');
  });

  test('it removes white space text node around target', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><remove sel="/a/b" ws="both"/></diff>')
      .patch('<a>\n   \n<b>y</b>\n   \n</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a/>');
  });

  test('it removes root level non-element node', () => {
    expect.assertions(2);
    expect(new Patch()
      .load('<diff><remove sel="comment()[1]"/></diff>')
      .patch('<!--ccc--><a/>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a/>');
    expect(new Patch()
      .load('<diff><remove sel="processing-instruction(\'xml\')"/></diff>')
      .patch('<?xml version="1.0"?><a/>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a/>');
    // There can be no text node at root level
    // expect(new Patcher()
    //   .load('<diff><remove sel="text()[1]"/></diff>')
    //   .patch('abc<a/>')
    //   .toString({minify: true, preserveComments: true}),
    // ).toEqual('<a/>');
  });

  test('it throws exception if no white space text node', () => {
    expect.assertions(3);
    expect(() => new Patch()
      .load('<diff><remove sel="/a/b" ws="before"/></diff>')
      .patch('<a>\nx\n<b>y</b>\nz\n</a>'),
    ).toThrow(InvalidWhitespaceDirective);
    expect(() => new Patch()
      .load('<diff><remove sel="/a/b" ws="after"/></diff>')
      .patch('<a>\nx\n<b>y</b>\nz\n</a>'),
    ).toThrow(InvalidWhitespaceDirective);
    expect(() => new Patch()
      .load('<diff><remove sel="/a/b" ws="both"/></diff>')
      .patch('<a><d/><b>y</b><c/></a>'),
    ).toThrow(InvalidWhitespaceDirective);
  });

  test('it removes comment', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><remove sel="a/comment()[1]"/></diff>')
      .patch('<a><!--d/--><b>y</b></a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a><b>y</b></a>');
  });

  test('it removes processing instruction', () => {
    expect.assertions(1);
    expect(new Patch()
      .load(
        '<diff><remove sel="a/processing-instruction(\'xml-stylesheet\')"/></diff>')
      .patch('<a><?xml-stylesheet href="a"?><b>y</b></a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a><b>y</b></a>');
  });

  test('it removes prefix declaration', () => {
    expect.assertions(2);
    expect(new Patch()
      .load(
        '<diff><remove sel="a/b/namespace::pf"/></diff>')
      .patch('<a><b xmlns:pf="urn:xxx">y</b></a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a><b>y</b></a>');
    expect(new Patch()
      .load(
        '<diff><remove sel="a/pf:b/namespace::pf"/></diff>')
      .patch('<a><pf:b xmlns:pf="urn:xxx">y</pf:b></a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a><b>y</b></a>');
  });

  test('it throws if prefix is not defined', () => {
    expect.assertions(2);
    expect(() => new Patch()
      .load(
        '<diff><remove sel="a/b/namespace::pr"/></diff>')
      .patch('<a><b xmlns:pf="urn:xxx">y</b></a>'),
    ).toThrow(InvalidNamespacePrefix);
    expect(() => new Patch()
      .load(
        '<diff><remove sel="a/namespace::pf"/></diff>')
      .patch('<a><b xmlns:pf="urn:xxx">y</b></a>'),
    ).toThrow(InvalidNamespacePrefix);
  });

  test('it throws if prefix is in use', () => {
    expect.assertions(1);
    expect(() => new Patch()
      .load(
        '<diff><remove sel="a/b/namespace::pf"/></diff>')
      .patch('<a><b xmlns:pf="urn:xxx"><pf:c/>y</b></a>'),
    ).toThrow(InvalidNamespacePrefix);
  });
});
