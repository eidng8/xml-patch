import {Patch} from '../src';

describe('Patcher <add>', () => {
  test('it appends new element', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y<c>w</c></b>z</a>');
  });

  test('it prepends new element', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b" pos="prepend"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b><c>w</c>y</b>z</a>');
  });

  test('it inserts before target element', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b" pos="before"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<c>w</c><b>y</b>z</a>');
  });

  test('it inserts after target element', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b" pos="after"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y</b><c>w</c>z</a>');
  });

  test('it appends multiple elements', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y<c>w</c><d/></b>z</a>');
  });

  test('it prepends multiple elements', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b" pos="prepend"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b><c>w</c><d/>y</b>z</a>');
  });

  test('it appends new processing instruction', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b"><?xml-stylesheet href="a"?></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y<?xml-stylesheet href="a"?></b>z</a>');
  });

  test('it inserts multiple elements before target element', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b" pos="before"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<c>w</c><d/><b>y</b>z</a>');
  });

  test('it inserts multiple elements after target element', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b" pos="after"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y</b><c>w</c><d/>z</a>');
  });

  test('it adds new attribute', () => {
    expect.assertions(2);
    expect(new Patch()
      .load('<diff><add sel="/a/b" type="@c">w</add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b c="w">y</b>z</a>');
    expect(new Patch()
      .load('<diff><add sel="/a/b" type="attribute::c">w</add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b c="w">y</b>z</a>');
  });

  test('it appends new comment', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a/b"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y<!-- a comment --></b>z</a>');
  });

  test('it prepends new comment', () => {
    expect.assertions(1);
    expect(new Patch()
      .load(
        '<diff><add sel="/a/b" pos="prepend"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b><!-- a comment -->y</b>z</a>');
  });

  test('it inserts before target comment', () => {
    expect.assertions(1);
    expect(new Patch()
      .load(
        '<diff><add sel="/a/b" pos="before"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<!-- a comment --><b>y</b>z</a>');
  });

  test('it inserts after target comment', () => {
    expect.assertions(1);
    expect(new Patch()
      .load(
        '<diff><add sel="/a/b" pos="after"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y</b><!-- a comment -->z</a>');
  });

  test('it adds namespace prefix declaration', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff><add sel="/a" type="namespace::pref">urn:new</add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a xmlns:pref="urn:new">x<b>y</b>z</a>');
  });

  test('it adds new element with prefix', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c>w</n:c></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y<n:c xmlns:n="urn:xxx">w</n:c></b>z</a>');
  });

  test('it adds new element with mapped prefix', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c>w</n:c></add></diff>')
      .patch('<a xmlns:m="urn:xxx">x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a xmlns:m="urn:xxx">x<b>y<m:c>w</m:c></b>z</a>');
  });

  test('it adds new element\'s attribute with mapped prefix', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b"><c n:v="w"/></add></diff>')
      .patch('<a xmlns:m="urn:xxx">x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a xmlns:m="urn:xxx">x<b>y<c m:v="w"/></b>z</a>');
  });

  test('it adds new attribute with mapped prefix', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b" type="@n:c">w</add></diff>')
      .patch('<a xmlns:m="urn:xxx">x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a xmlns:m="urn:xxx">x<b m:c="w">y</b>z</a>');
  });

  test('it adds new element with namespace', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c/></add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b>y<n:c xmlns:n="urn:xxx"/></b>z</a>');
  });

  test('it adds new element with attribute', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b" type="@n:c">w</add></diff>')
      .patch('<a>x<b>y</b>z</a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<a>x<b xmlns:n="urn:xxx" n:c="w">y</b>z</a>');
  });

  test('it adds element with default namespace', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns="urn:xxx"><add sel="a/b"><c/></add></diff>')
      .patch('<n:a xmlns:n="urn:xxx">x<n:b>y</n:b>z</n:a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<n:a xmlns:n="urn:xxx">x<n:b>y<n:c/></n:b>z</n:a>');
  });

  test('it adds attribute without mapping default namespace', () => {
    expect.assertions(1);
    expect(new Patch()
      .load('<diff xmlns="urn:xxx"><add sel="a/b" type="@c">w</add></diff>')
      .patch('<n:a xmlns:n="urn:xxx">x<n:b>y</n:b>z</n:a>')
      .toString({minify: true, preserveComments: true}),
    ).toEqual('<n:a xmlns:n="urn:xxx">x<n:b c="w">y</n:b>z</n:a>');
  });
});