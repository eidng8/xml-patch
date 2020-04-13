/*
 * GPLv3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 * Author: eidng8
 */
const Exception = require('../lib/index').Exception;

Exception.ErrDirective = '無法完成指定的修改操作。';

Exception.ErrEncoding = '兩份文檔使用了不同的字符編碼。';

Exception.ErrFunction = '不支持節點集 id() 函數。';

Exception.ErrID = '不支持文檔級 xml:id 屬性。';

Exception.ErrMultipleMatches = '匹配到了多個節點。';

Exception.ErrNamespaceURI = '非法的命名空間URI，或文檔沒有定義該命名空間。';

Exception.ErrNodeTypeText = '這裡應該使用文本節點。';

Exception.ErrNodeTypeMismatch = '目標節點的類型必須與替換節點相同。';

Exception.ErrNoMatch = '無法找到匹配節點。';

Exception.ErrPrefix = '無法解釋指定的命名空間前綴。';

Exception.ErrPrefixUsed = '尚有子節點使用指定的命名空間前綴。';

Exception.ErrProlog = '無效的XML prolog。';

Exception.ErrRoot = '不得增刪根節點。';

Exception.ErrSelEmpty = '`sel`不可為空。';

Exception.ErrSelMissing = '必須定義 `sel` 屬性。';

Exception.ErrType = '非法類型。';

Exception.ErrWsAttribute = '屬性操作不得含有 `ws` 屬性。';

Exception.ErrWsTextNode = '文本節點操作不得含有 `ws` 屬性。';

Exception.ErrWsAfter = '目標節點後沒有空白文本節點。';

Exception.ErrWsBefore = '目標節點前沒有空白文本節點。';

Exception.ErrXML = '非法XML';
