/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { ElementImpl } from 'xmldom-ts';
import {
  XmlWrapper,
  InvalidNodeTypes,
  assertElement,
  ignoreExceptions,
  InvalidPatchDirective,
  assertKnownAction,
  assertEmptyText,
  setExceptionHandler,
  InvalidWhitespaceDirective,
} from '../../src';

describe('Assertions', () => {
  describe('assertElement', () => {
    it('throws if not element', () => {
      expect.assertions(1);
      const xml = new XmlWrapper().fromString('<!-- c -->');
      expect(() => assertElement(xml.doc.firstChild)).toThrow(InvalidNodeTypes);
    });

    it('returns false if InvalidNodeTypes is ignored', () => {
      expect.assertions(2);
      const xml = new XmlWrapper().fromString('<!-- c -->');
      ignoreExceptions(InvalidNodeTypes);
      expect(() =>
        expect(assertElement(xml.doc.firstChild)).toBe(false),
      ).not.toThrow();
    });
  });

  describe('assertKnownAction', () => {
    it('throws on unsupported directive', () => {
      expect.assertions(1);
      const elem = new ElementImpl();
      elem.localName = 'a';
      expect(() => assertKnownAction(elem)).toThrow(InvalidPatchDirective);
    });

    it('returns false if InvalidPatchDirective is ignored', () => {
      expect.assertions(2);
      ignoreExceptions(InvalidPatchDirective);
      const elem = new ElementImpl();
      elem.localName = 'a';
      expect(() => expect(assertKnownAction(elem)).toBe(false)).not.toThrow();
    });
  });

  describe('assertEmptyText', () => {
    it('has default values', () => {
      expect.assertions(3);
      ignoreExceptions(InvalidWhitespaceDirective);
      const node = new ElementImpl();
      setExceptionHandler(ex => {
        expect(ex.message).toBe('Invalid type.');
        expect(ex.action).toBe(node);
      });
      expect(() => assertEmptyText(node)).not.toThrow();
    });
  });
});
