import {Patcher} from '../src';

describe('Patcher <replace>', () => {
  test('it replaces target element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><replace sel="/a/b"><c/></replace></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<c/>z</a>');
  });

  test('it replaces with mangled namespace', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff xmlns="urn:xxx"><replace sel="/a/b"><c/></replace></diff>')
      .patch('<m:a xmlns:m="urn:xxx">x<m:b>y</m:b>z</m:a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<m:a xmlns:m="urn:xxx">x<m:c/>z</m:a>');
  });

  test('it replaces target element with multiple elements', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><replace sel="/a/b"><c/><d/><e/></replace></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<c/><d/><e/>z</a>');
  });

  test('it replaces target attribute', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><replace sel="/a/b/@c">v</replace></diff>')
      .patch('<a>x<b c="w">y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b c="v">y</b>z</a>');
  });

  test('it replaces processing instruction', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><replace sel="/a/processing-instruction(\'xml-stylesheet\')"><?xml-stylesheet href="xxx"?></replace></diff>')
      .patch('<a>x<?xml-stylesheet href="a"?>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<?xml-stylesheet href="xxx"?>z</a>');
  });

  test('it replaces comments', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><replace sel="/a/comment()[1]"><!--new--></replace></diff>')
      .patch('<a>x<!--old-->z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<!--new-->z</a>');
  });

  test('it replaces text node', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><replace sel="/a/text()[1]">new text</replace></diff>')
      .patch('<a>xz</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>new text</a>');
  });

  test('it replaces namespace declaration', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><replace sel="/a/namespace::ns">urn:new</replace></diff>')
      .patch('<a xml:ns="urn:old">xz</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a xml:ns="urn:new">xz</a>');
  });
});
