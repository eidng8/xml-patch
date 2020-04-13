/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';
import {NodeImpl} from 'xmldom-ts';

/**
 * The namespace URI for the given prefix could not be located or resolved,
 * e.g., within the 'sel' attribute a prefix was used but its declaration is
 * missing from the target document.
 */
export default class InvalidNamespacePrefix extends Exception {
  protected tag: string = 'invalid-namespace-prefix';

  constructor(action?: NodeImpl) {
    super(Exception.ErrPrefix, action);
  }
}
