import Exception from './Exception';

/**
 * The nodeset function id() is not supported, and thus attributes with the ID
 * type are not known.
 */
export default class UnsupportedIdFunction extends Exception {
  protected tag: string = 'unsupported-id-function';
}
