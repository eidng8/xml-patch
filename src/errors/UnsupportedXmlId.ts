import Exception from './Exception';

/**
 * The attribute xml:id as an ID attribute in XML documents is not supported.
 */
export default class UnsupportedXmlId extends Exception {
  protected tag: string = 'unsupported-xml-id';
}
