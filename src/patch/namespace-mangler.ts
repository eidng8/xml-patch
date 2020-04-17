/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */

import { AttrImpl, ElementImpl, NodeImpl } from 'xmldom-ts';
import XmlWrapper from '../xml/xml-wrapper';
import { isAttribute, isElement } from '../utils/type-guards';
import Patch from './patch';
import { descend } from '..';

export default class NamespaceMangler {
  protected xml?: XmlWrapper;

  protected patch: Patch;

  constructor(patch: Patch, xml?: XmlWrapper) {
    this.patch = patch;
    this.xml = xml;
  }

  setTarget(xml: XmlWrapper) {
    this.xml = xml;
  }

  /**
   * Default namespace has been translated into the XPath expressions, we just
   * need to handle prefixes here.
   *
   * @param node a imported node that will be put to target, please note that
   * this node *may* not be in the diff document.
   * @param target a node in the target document.
   * @param anchor a node in the diff document, mostly likely the node being
   * processed currently.
   */
  mangle(node: NodeImpl, target: NodeImpl, anchor: NodeImpl): NodeImpl {
    this.mangleNode(node, target, anchor);
    descend(node, n => this.mangleNode(n, target, anchor));
    return node;
  }

  mangleNode(node: NodeImpl | AttrImpl, target: NodeImpl, anchor: NodeImpl) {
    if (!isElement(node) && !isAttribute(node)) {
      // we are in the middle of importing nodes that can be all kinds of nodes,
      // don't throw exception here.
      return;
    }
    const [prefix, , targetPrefix, targetNS] = this.mapNamespace(
      (<ElementImpl>node).tagName || (<AttrImpl>node).name,
      target,
      anchor,
    );
    if (targetPrefix) {
      this.setPrefix(node, targetPrefix);
    } else if (targetNS) {
      this.setPrefix(node, prefix, targetNS);
    }
    this.mangleAttributes(node, target, anchor);
  }

  mangleAttributes(
    node: NodeImpl | AttrImpl,
    target: NodeImpl,
    anchor: NodeImpl,
  ) {
    if (isElement(node) && node.hasAttributes()) {
      node.attributes.forEach(a => this.mangleNode(a, target, anchor));
    }
  }

  /**
   * Map the given namespace to target document's namespaces.
   * @param name
   * @param target
   * @param node
   * @param isAttr
   */
  mapNamespace(
    name: string,
    target: NodeImpl,
    node: NodeImpl,
    isAttr?: boolean,
  ): string[] {
    // we may in the middle of add or replacing nodes, which may involve adding
    // new namespaces to target.
    // dont throw any exception here.
    const parts = name.split(':');
    if (parts.length < 2) {
      // RFC 4.2.3, last "For example" paragraph, last sentence:
      // unprefixed attributes don't inherit the default namespace declaration
      if (isElement(node) && node.namespaceURI && !isAttr) {
        const prefix = this.xml!.lookupPrefix(node.namespaceURI, target);
        return ['', name, prefix || '', node.namespaceURI];
      }
      return ['', name, '', ''];
    }
    const [prefix, local] = parts;
    const uri = this.patch.lookupNamespaceURI(prefix, node)!;
    const targetPrefix = this.xml!.lookupPrefix(uri);
    return [prefix, local, targetPrefix || '', uri];
  }

  /**
   * Sets the node prefix, and namespace URI if provided. Please note that the
   * namespace lookup list (`_nsMap`) is not changed.
   * @param node
   * @param prefix
   * @param ns
   */
  protected setPrefix(
    node: ElementImpl | AttrImpl,
    prefix: string,
    ns?: string,
  ): void {
    node.prefix = prefix;
    if (ns) {
      node.namespaceURI = ns;
    }
    const prop = isElement(node) ? 'tagName' : 'name';
    if (prefix) {
      node.nodeName = `${prefix}:${node.localName}`;
      node[prop] = `${prefix}:${node.localName}`;
    } else {
      node.nodeName = node.localName;
      node[prop] = node.localName;
    }
  }
}
