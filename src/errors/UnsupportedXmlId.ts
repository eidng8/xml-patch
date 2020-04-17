/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import Exception from './Exception';
import { NodeImpl } from 'xmldom-ts';

/**
 * The attribute xml:id as an ID attribute in XML documents is not supported.
 */
export default class UnsupportedXmlId extends Exception {
  /**
   * @inheritDoc
   */
  protected tag: string = 'unsupported-xml-id';

  /**
   * @inheritDoc
   */
  constructor(action?: NodeImpl) {
    super(Exception.ErrID, action);
  }
}
