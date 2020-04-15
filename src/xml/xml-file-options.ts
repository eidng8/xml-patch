/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import XmlOptions from './xml-options';

/**
 * Options to reading XML file
 */
export default interface XmlFileOptions extends XmlOptions {
  /**
   * The file system mock to be used
   */
  fsMock?: any;
}
