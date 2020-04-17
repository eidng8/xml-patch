/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { InvalidNamespacePrefix, InvalidNodeTypes, Patch } from '../../src';
import '../helpers';

describe('Patch <replace>', () => {
  it('replaces target element', () => {
    expect.assertions(1);
    expect(
      new Patch('<diff><replace sel="/a/b"><c/></replace></diff>').apply(
        '<a>x<b>y</b>z</a>',
      ),
    ).toEqualXml('<a>x<c/>z</a>');
  });

  it('replaces with mangled namespace', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff xmlns="urn:xxx"><replace sel="/a/b"><c/></replace></diff>',
      ).apply('<m:a xmlns:m="urn:xxx">x<m:b>y</m:b>z</m:a>'),
    ).toEqualXml('<m:a xmlns:m="urn:xxx">x<m:c/>z</m:a>');
  });

  it('replaces target attribute', () => {
    expect.assertions(1);
    expect(
      new Patch('<diff><replace sel="/a/b/@c">v</replace></diff>').apply(
        '<a>x<b c="w">y</b>z</a>',
      ),
    ).toEqualXml('<a>x<b c="v">y</b>z</a>');
  });

  it('replaces processing instruction', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><replace sel="/a/processing-instruction(\'xml-stylesheet\')"><?xml-stylesheet href="xxx"?></replace></diff>',
      ).apply('<a>x<?xml-stylesheet href="a"?>z</a>'),
    ).toEqualXml('<a>x<?xml-stylesheet href="xxx"?>z</a>');
  });

  it('replaces comments', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><replace sel="/a/comment()[1]"><!--new--></replace></diff>',
      ).apply('<a>x<!--old-->z</a>'),
    ).toEqualXml('<a>x<!--new-->z</a>');
  });

  it('replaces text node', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><replace sel="/a/text()[1]">new text</replace></diff>',
      ).apply('<a>xz</a>'),
    ).toEqualXml('<a>new text</a>');
  });

  it('replaces namespace declaration', () => {
    expect.assertions(1);
    expect(
      new Patch(
        '<diff><replace sel="/a/namespace::pref">urn:new</replace></diff>',
      ).apply('<a xmlns:pref="urn:old">xz</a>'),
    ).toEqualXml('<a xmlns:pref="urn:new">xz</a>');
  });

  it('throws if prefix is not defined', () => {
    expect.assertions(1);
    expect(() =>
      new Patch(
        '<diff><replace sel="/a/namespace::pref">urn:new</replace></diff>',
      ).apply('<a><b xmlns:pref="urn:old"/>xz</a>'),
    ).toThrow(InvalidNamespacePrefix);
  });

  it('throws if action has no text child', () => {
    expect.assertions(1);
    expect(() =>
      new Patch(
        '<diff><replace sel="/a/namespace::pref"><a/></replace></diff>',
      ).apply('<a><b xmlns:pref="urn:old"/>xz</a>'),
    ).toThrow(InvalidNodeTypes);
  });
});
