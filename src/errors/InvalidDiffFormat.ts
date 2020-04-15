/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';
import { NodeImpl } from 'xmldom-ts';

/**
 * This indicates that the diff body of the request was not a well-formed XML
 * document or a valid XML document according to its schema.
 */
export default class InvalidDiffFormat extends Exception {
  protected tag: string = 'invalid-diff-format';

  constructor(message?: string, action?: NodeImpl) {
    super(message || Exception.ErrXML, action);
  }
}
