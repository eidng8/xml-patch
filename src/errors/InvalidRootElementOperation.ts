/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * The root element of the document cannot be removed or another sibling element
 * for the document root element cannot be added.
 */
export default class InvalidRootElementOperation extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'invalid-root-element-operation';
}
