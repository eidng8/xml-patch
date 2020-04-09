/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * A <remove> operation requires a removal of a white space node that doesn't
 * exist in the target document.
 */
export default class InvalidWhitespaceDirective extends Exception {
  protected tag: string = 'invalid-whitespace-directive';
}
