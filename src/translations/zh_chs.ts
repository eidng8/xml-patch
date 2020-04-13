/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */
import {Exception} from '../errors';

Exception.ErrDirective = '无法完成指定的修改操作。';

Exception.ErrEncoding = '两份文档使用了不同的字符编码。';

Exception.ErrFunction = '不支持节点集 id() 函数。';

Exception.ErrID = '不支持文档级 xml:id 属性。';

Exception.ErrMultipleMatches = '匹配到了多个节点。';

Exception.ErrNamespaceURI = '非法的命名空间URI，或文档没有定义该命名空间。';

Exception.ErrNodeTypeText = '这里应该使用文本节点。';

Exception.ErrNodeTypeMismatch = '目标节点的类型必须与替换节点相同。';

Exception.ErrNoMatch = '无法找到匹配节点。';

Exception.ErrPrefix = '无法解释指定的命名空间前缀。';

Exception.ErrPrefixUsed = '尚有子节点使用指定的命名空间前缀。';

Exception.ErrProlog = '无效的XML prolog。';

Exception.ErrRoot = '不得增删根节点。';

Exception.ErrSelEmpty = '`sel`不可为空。';

Exception.ErrSelMissing = '必须定义 `sel` 属性。';

Exception.ErrType = '非法类型。';

Exception.ErrWsAttribute = '属性操作不得含有 `ws` 属性。';

Exception.ErrWsTextNode = '文本节点操作不得含有 `ws` 属性。';

Exception.ErrWsAfter = '目标节点后没有空白文本节点。';

Exception.ErrWsBefore = '目标节点前没有空白文本节点。';

Exception.ErrXML = '非法XML';
