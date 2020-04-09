/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * Patch failure related to XML prolog nodes.
 */
export default class InvalidPrologOperation extends Exception {
  protected tag: string = 'invalid-xml-prolog-operation';
}
