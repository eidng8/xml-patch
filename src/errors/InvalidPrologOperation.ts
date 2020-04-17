/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';
import { NodeImpl } from 'xmldom-ts';

/**
 * Patch failure related to XML prolog nodes.
 */
export default class InvalidPrologOperation extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'invalid-xml-prolog-operation';

  /**
   * @inheritDoc
   */
  constructor(action?: NodeImpl) {
    super(Exception.ErrProlog, action);
  }
}
