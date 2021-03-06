/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';
import { NodeImpl } from 'xmldom-ts';

/**
 * The nodeset function id() is not supported, and thus attributes with the ID
 * type are not known.
 */
export default class UnsupportedIdFunction extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'unsupported-id-function';

  /**
   * @inheritDoc
   */
  constructor(action?: NodeImpl) {
    super(Exception.ErrFunction, action);
  }
}
