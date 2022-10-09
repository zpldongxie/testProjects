/**
 * 解析url的query信息
 * @param {string} url url
 * @return {object} json
 */
function parse(url) {
  return [...new URL(url).searchParams].reduce((cur, [key, value]) => ((cur[key] = value), cur), {});
}

async function init() {
  clearMessage();
  const query = parse(location.href);
  const { CorpId, UserId, DeviceId } = query;
  if (!CorpId) {
    appendMessage('未收到企业ID', 'error');
    return;
  }
  if (!UserId) {
    appendMessage('未收到用户ID', 'error');
    return;
  }
  if (!DeviceId) {
    appendMessage('未收到部门ID', 'error');
    return;
  }
  const comwx = new ComWX('');
  const wechatAppUrl = await comwx.getWechatAppUrl(CorpId, UserId, DeviceId);
  // appendMessage(`小程序跳转链接： ${wechatAppUrl}`);
  if (wechatAppUrl) {
    // window.location.href = wechatAppUrl;
    const a = document.querySelector('#openApp');
    a.setAttribute('href', wechatAppUrl);
    appendMessage('请点击上面的链接测试跳转');
  }
}

init();
