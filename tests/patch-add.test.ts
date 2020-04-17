/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { InvalidAttributeValue, InvalidNodeTypes, Patch } from '../src';
import InvalidRootElementOperation from '../src/errors/InvalidRootElementOperation';
import './helpers';

describe('Patch <add>', () => {
  // region Elements
  it('appends new element', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/*[local-name()=\'a\']"><c>w</c></add></diff>',
      ).apply('<a/>'),
    ).toEqualXml('<a><c>w</c></a>');
  });

  it('prepends new element', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="prepend"><c>w</c></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b><c>w</c>y</b>z</a>');
  });

  it('inserts before target', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="before"><c>w</c></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<c>w</c><b>y</b>z</a>');
  });

  it('inserts after target', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="after"><c>w</c></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b>y</b><c>w</c>z</a>');
  });

  it('appends multiple elements', () => {
    expect.assertions(1);
    expect(
      new Patch('<diff><add sel="/a/b"><c>w</c><d/></add></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toEqualXml('<a>x<b>y<c>w</c><d/></b>z</a>');
  });

  it('prepends multiple elements', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="prepend"><c>w</c><d/></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b><c>w</c><d/>y</b>z</a>');
  });

  it('inserts multiple elements before target', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="before"><c>w</c><d/></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<c>w</c><d/><b>y</b>z</a>');
  });

  it('inserts multiple elements after target', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="after"><c>w</c><d/></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b>y</b><c>w</c><d/>z</a>');
  });

  it('adds new element with prefix', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c>w</n:c></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b>y<n:c xmlns:n="urn:xxx">w</n:c></b>z</a>');
  });

  it('adds new element with namespace', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c/></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b>y<n:c xmlns:n="urn:xxx"/></b>z</a>');
  });

  it('adds new element with attribute', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns:n="urn:xxx"><add sel="a/b" type="@n:c">w</add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b xmlns:n="urn:xxx" n:c="w">y</b>z</a>');
  });

  it('adds element with default namespace', () => {
    expect.assertions(1);
    expect(
      new Patch('<diff xmlns="urn:xxx"><add sel="a/b"><c/></add></diff>').apply(
        '<n:a xmlns:n="urn:xxx">x<n:b>y</n:b>z</n:a>',
      ),
    ).toEqualXml('<n:a xmlns:n="urn:xxx">x<n:b>y<n:c/></n:b>z</n:a>');
  });

  it('adds new element with mapped prefix', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns:n="urn:xxx"><add sel="a/b"><n:c>w</n:c></add></diff>',
      ).apply('<a xmlns:m="urn:xxx">x<b>y</b>z</a>'),
    ).toEqualXml('<a xmlns:m="urn:xxx">x<b>y<m:c>w</m:c></b>z</a>');
  });

  it('adds new element with attribute with mapped prefix', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns:n="urn:xxx"><add sel="a/b"><c n:v="w"/></add></diff>',
      ).apply('<a xmlns:m="urn:xxx">x<b>y</b>z</a>'),
    ).toEqualXml('<a xmlns:m="urn:xxx">x<b>y<c m:v="w"/></b>z</a>');
  });
  // endregion

  // region Attributes
  it('adds new attribute', () => {
    expect.assertions(2);
    expect(
      new Patch('<diff><add sel="/a/b" type="@c">w</add></diff>')
        .apply('<a>x<b>y</b>z</a>')
        .toLocaleString({ minify: true, preserveComments: true }),
    ).toEqual('<a>x<b c="w">y</b>z</a>');
    expect(
      new Patch(
        '<diff><add sel="/a/b" type="attribute::c">w</add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b c="w">y</b>z</a>');
  });

  it('adds new attribute with mapped prefix', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns:n="urn:xxx"><add sel="a/b" type="@n:c">w</add></diff>',
      ).apply('<a xmlns:m="urn:xxx">x<b>y</b>z</a>'),
    ).toEqualXml('<a xmlns:m="urn:xxx">x<b m:c="w">y</b>z</a>');
  });

  it('adds attribute without mapping default namespace', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns="urn:xxx"><add sel="a/b" type="@c">w</add></diff>',
      ).apply('<n:a xmlns:n="urn:xxx">x<n:b>y</n:b>z</n:a>'),
    ).toEqualXml('<n:a xmlns:n="urn:xxx">x<n:b c="w">y</n:b>z</n:a>');
  });

  it('allows adding empty attribute value', () => {
    expect.assertions(2);
    expect(
      new Patch('<diff><add sel="a/b" type="@c"/></diff>')
        .apply('<a>x<b>y</b>z</a>')
        .toString({ minify: true, preserveComments: true }),
    ).toBe('<a>x<b c="">y</b>z</a>');
    expect(
      new Patch('<diff><add sel="a/b" type="attribute::c"/></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toEqualXml('<a>x<b c="">y</b>z</a>');
  });
  // endregion

  // region Others
  it('adds namespace prefix declaration', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a" type="namespace::pref">urn:new</add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a xmlns:pref="urn:new">x<b>y</b>z</a>');
  });

  it('appends new processing instruction', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b"><?xml-stylesheet href="a"?></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b>y<?xml-stylesheet href="a"?></b>z</a>');
  });

  it('appends new comment', () => {
    expect.assertions(1);
    expect(
      new Patch('<diff><add sel="/a/b"><!-- a comment --></add></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toEqualXml('<a>x<b>y<!-- a comment --></b>z</a>');
  });

  it('prepends new comment', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="prepend"><!-- a comment --></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b><!-- a comment -->y</b>z</a>');
  });

  it('inserts before target comment', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="/a/b" pos="before"><!-- a comment --></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<!-- a comment --><b>y</b>z</a>');
  });

  it('inserts after target comment', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><add sel="a" pos="after"><!-- a comment --></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>x<b>y</b>z</a><!-- a comment -->');
  });
  // endregion

  // region Exceptions
  it('throws if add attribute with non-text node', () => {
    expect.assertions(2);
    expect(() =>
      new Patch('<diff><add sel="a/b" type="@c"><a/></add></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toThrow(InvalidNodeTypes);
    expect(() =>
      new Patch(
        '<diff><add sel="a/b" type="attribute::c"><a/></add></diff>',
      ).apply('<a>x<b>y</b>z</a>'),
    ).toThrow(InvalidNodeTypes);
  });

  it('throws if adding empty namespace', () => {
    expect.assertions(1);
    expect(() =>
      new Patch('<diff><add sel="a/b" type="namespace::c"/></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toThrow(InvalidNodeTypes);
  });

  it('throws if types is invalid', () => {
    expect.assertions(1);
    expect(() =>
      new Patch('<diff><add sel="a/b" type="wrong"/></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toThrow(InvalidAttributeValue);
  });

  it('throws if add element to root', () => {
    expect.assertions(2);
    expect(() =>
      new Patch('<diff><add sel="a" pos="after"><c/></add></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toThrow(InvalidRootElementOperation);
    expect(() =>
      new Patch('<diff><add sel="a" pos="before"><c/></add></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toThrow(InvalidRootElementOperation);
  });
  // endregion
});
