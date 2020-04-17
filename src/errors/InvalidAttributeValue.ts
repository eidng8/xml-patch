/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';

/**
 * The validity constraints of 'sel', 'type', 'ws', or 'pos' attribute values
 * MAY be indicated with this error, i.e., non-allowable content has been used.
 * Also, this error can be used to indicate if an added or a modified attribute
 * content is not valid, for example, CDATA sections were used when anew
 * attribute was intended to be added.
 */
export default class InvalidAttributeValue extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'invalid-attribute-value';
}
