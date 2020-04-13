/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';
import {NodeImpl} from 'xmldom-ts';

/**
 * The namespace URI value is not valid or the target document did not have this
 * declaration.
 */
export default class InvalidNamespaceURI extends Exception {
  protected tag: string = 'invalid-namespace-uri';

  constructor(action?: NodeImpl) {
    super(Exception.ErrNamespaceURI, action);
  }
}
