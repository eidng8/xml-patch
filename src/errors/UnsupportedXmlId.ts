import Exception from './Exception';

export default class UnsupportedXmlId extends Exception {
  protected tag: string = 'unsupported-xml-id';
}
