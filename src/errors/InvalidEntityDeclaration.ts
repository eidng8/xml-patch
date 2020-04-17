/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * An entity reference was found but corresponding declaration could not be
 * located or resolved.
 */
export default class InvalidEntityDeclaration extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'invalid-entity-declaration';
}
