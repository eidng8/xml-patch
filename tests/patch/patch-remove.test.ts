/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import {
  InvalidNamespacePrefix,
  InvalidWhitespaceDirective,
  Patch,
} from '../../src';
import '../helpers';

describe('Patch <remove>', () => {
  it('removes target element', () => {
    expect.assertions(1);
    expect(
      new Patch('<diff><remove sel="/a/b"/></diff>').apply('<a>x<b>y</b>z</a>'),
    ).toEqualXml('<a>xz</a>');
  });

  it('removes comment', () => {
    expect.assertions(1);
    expect(
      new Patch()
        .load('<diff><remove sel="a/comment()[1]"/></diff>')
        .apply('<a><!--d/--><b>y</b></a>'),
    ).toEqualXml('<a><b>y</b></a>');
  });

  it('removes processing instruction', () => {
    expect.assertions(1);
    expect(
      new Patch()
        .load(
          '<diff><remove sel="a/processing-instruction(\'xml-stylesheet\')"/></diff>',
        )
        .apply('<a><?xml-stylesheet href="a"?><b>y</b></a>'),
    ).toEqualXml('<a><b>y</b></a>');
  });

  it('removes prefix declaration', () => {
    expect.assertions(2);
    expect(
      new Patch()
        .load('<diff><remove sel="a/b/namespace::pf"/></diff>')
        .apply('<a><b xmlns:pf="urn:xxx">y</b></a>'),
    ).toEqualXml('<a><b>y</b></a>');
    expect(
      new Patch()
        .load('<diff><remove sel="a/pf:b/namespace::pf"/></diff>')
        .apply('<a><pf:b xmlns:pf="urn:xxx">y</pf:b></a>'),
    ).toEqualXml('<a><b>y</b></a>');
  });

  it('removes root level non-element node', () => {
    expect.assertions(2);
    expect(
      new Patch()
        .load('<diff><remove sel="comment()[1]"/></diff>')
        .apply('<!--ccc--><a/>')
        .toString({ minify: true, preserveComments: true }),
    ).toEqual('<a/>');
    expect(
      new Patch()
        .load('<diff><remove sel="processing-instruction(\'xml\')"/></diff>')
        .apply('<?xml version="1.0"?><a/>'),
    ).toEqualXml('<a/>');
  });

  it('removes white space text node before target', () => {
    expect.assertions(1);
    expect(
      new Patch()
        .load('<diff><remove sel="/a/b" ws="before"/></diff>')
        .apply('<a>\n   \n<b>y</b>\nz</a>'),
    ).toEqualXml('<a>\nz</a>');
  });

  it('removes white space text node after target', () => {
    expect.assertions(1);
    expect(
      new Patch()
        .load('<diff><remove sel="/a/b" ws="after"/></diff>')
        .apply('<a>x\n<b>y</b>\n   \n</a>'),
    ).toEqualXml('<a>x\n</a>');
  });

  it('removes white space text node around target', () => {
    expect.assertions(1);
    expect(
      new Patch()
        .load('<diff><remove sel="/a/b" ws="both"/></diff>')
        .apply('<a>\n   \n<b>y</b>\n   \n</a>'),
    ).toEqualXml('<a/>');
  });

  it('throws exception if no white space text node', () => {
    expect.assertions(3);
    expect(() =>
      new Patch()
        .load('<diff><remove sel="/a/b" ws="before"/></diff>')
        .apply('<a>\nx\n<b>y</b>\nz\n</a>'),
    ).toThrow(InvalidWhitespaceDirective);
    expect(() =>
      new Patch()
        .load('<diff><remove sel="/a/b" ws="after"/></diff>')
        .apply('<a>\nx\n<b>y</b>\nz\n</a>'),
    ).toThrow(InvalidWhitespaceDirective);
    expect(() =>
      new Patch()
        .load('<diff><remove sel="/a/b" ws="both"/></diff>')
        .apply('<a><d/><b>y</b><c/></a>'),
    ).toThrow(InvalidWhitespaceDirective);
  });

  it('throws exception on `ws` in invalid node type', () => {
    expect.assertions(1);
    expect(() =>
      new Patch()
        .load('<diff><remove sel="/a/@b" ws="before"/></diff>')
        .apply('<a b=""/>'),
    ).toThrow(InvalidWhitespaceDirective);
  });

  it('throws if prefix is not defined', () => {
    expect.assertions(2);
    expect(() =>
      new Patch()
        .load('<diff><remove sel="a/b/namespace::pr"/></diff>')
        .apply('<a><b xmlns:pf="urn:xxx">y</b></a>'),
    ).toThrow(InvalidNamespacePrefix);
    expect(() =>
      new Patch()
        .load('<diff><remove sel="a/namespace::pf"/></diff>')
        .apply('<a><b xmlns:pf="urn:xxx">y</b></a>'),
    ).toThrow(InvalidNamespacePrefix);
  });

  it('throws if prefix is in use', () => {
    expect.assertions(1);
    expect(() =>
      new Patch()
        .load('<diff><remove sel="a/namespace::pf"/></diff>')
        .apply('<a xmlns:pf="urn:xxx"><b><d/><e>e</e><pf:c/>y</b></a>'),
    ).toThrow(InvalidNamespacePrefix);
  });
});
