/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

/**
 * Options to format the XML document to string
 */
export default interface FormatOptions {
  /**
   * Pretty print the XML
   */
  pretty?: boolean;

  /**
   * Minify the XML
   */
  minify?: boolean;

  /**
   * Preserve comments in XML
   */
  preserveComments?: boolean;
}
