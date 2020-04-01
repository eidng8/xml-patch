import {Patcher} from '../src';
import {NotImplementedException} from '../src/errors';

describe('Patcher <add>', () => {
  test('it appends new element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b>y<c>w</c></b>z</a>');
  });

  test('it prepends new element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b" pos="prepend"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b><c>w</c>y</b>z</a>');
  });

  test('it inserts before target element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b" pos="before"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<c>w</c><b>y</b>z</a>');
  });

  test('it inserts after target element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b" pos="after"><c>w</c></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b>y</b><c>w</c>z</a>');
  });

  test('it appends multiple elements', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b>y<c>w</c><d/></b>z</a>');
  });

  test('it prepends multiple elements', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b" pos="prepend"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b><c>w</c><d/>y</b>z</a>');
  });

  test('it inserts multiple elements before target element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b" pos="before"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<c>w</c><d/><b>y</b>z</a>');
  });

  test('it inserts multiple elements after target element', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b" pos="after"><c>w</c><d/></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b>y</b><c>w</c><d/>z</a>');
  });

  test('it adds new attribute', () => {
    expect.assertions(2);
    expect(new Patcher()
      .load('<diff><add sel="/a/b" type="@c">w</add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b c="w">y</b>z</a>');
    expect(new Patcher()
      .load('<diff><add sel="/a/b" type="attribute::c">w</add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b c="w">y</b>z</a>');
  });

  test('it appends new comment', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff><add sel="/a/b"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b>y<!-- a comment --></b>z</a>');
  });

  test('it prepends new comment', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><add sel="/a/b" pos="prepend"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b><!-- a comment -->y</b>z</a>');
  });

  test('it inserts before target comment', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><add sel="/a/b" pos="before"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<!-- a comment --><b>y</b>z</a>');
  });

  test('it inserts after target comment', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load(
        '<diff><add sel="/a/b" pos="after"><!-- a comment --></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b>y</b><!-- a comment -->z</a>');
  });

  test('does not implement add namespace', () => {
    expect.assertions(1);
    expect(() => new Patcher()
      .load('<diff><add sel="/a" type="namespace::pref">w</add></diff>')
      .patch('<a>x<b>y</b>z</a>'),
    ).toThrow(NotImplementedException);
  });

  test('it ignores actions without `sel` attribute', () => {
    expect.assertions(1);
    const diff = '<?xml version="1.0" encoding="utf-8"?>\n'
                 + '<diff>\n'
                 + '  <replace sel="/a/b"><c>y</c></replace>\n'
                 + '</diff>';
    const xml = '<?xml version="1.0"?><a>x<b>y</b>z</a>';
    const expected = '<?xml version="1.0"?><a>x<c>y</c>z</a>';
    expect(new Patcher().load(diff).patch(xml).toString()).toEqual(expected);
  });

  test('it adds new element with prefix', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c>w</n:c></add></diff>')
      .patch('<a>x<b>y</b>z</a>').toString(),
    ).toEqual('<a>x<b>y<n:c xmlns:n="urn:xxx">w</n:c></b>z</a>');
  });

  test('it adds new element with mapped prefix', () => {
    expect.assertions(1);
    expect(new Patcher()
      .load('<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c>w</n:c></add></diff>')
      .patch('<a xmlns:m="urn:xxx">x<b>y</b>z</a>').toString(),
    ).toEqual(
      '<a xmlns:m="urn:xxx">x<b>y<m:c>w</m:c></b>z</a>');
  });
});
