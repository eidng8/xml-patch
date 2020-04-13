/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

/**
 * Options to reading XML file
 */
export default interface XMLFileOptions {
  /**
   * Default encoding to use while reading file
   */
  defaultEncoding?: string;

  /**
   * The file system mock to be used
   */
  fsMock?: any;
}
