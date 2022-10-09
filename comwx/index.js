/** 应用ID */
const suiteID = 'wwf59089fd486b7391';
/** 小程序ID */
const MiniprogramID = 'wx9c715ba80248179e';

const $con = document.querySelector('#con');
/**
 * 页面追加一条信息
 * @param {string} message 消息内容
 * @param {'success' | 'error' | undefined} status 消息状态
 */
function appendMessage(message, status) {
  const $newNode = document.createElement('div');
  if (status === 'success') {
    $newNode.style.color = 'green';
  }
  if (status === 'error') {
    $newNode.style.color = 'red';
  }
  $newNode.innerText = message;
  $con.appendChild($newNode);
}

/**
 * 清除页面信息
 */
function clearMessage() {
  $con.innerHTML = '';
}

const comWx = new ComWX(suiteID);

/**
 * 重新获取用户信息并进行缓存
 * @return {Promise<userInfo>}
 */
async function updateCurrentUserInfo() {
  const currentUrl = new URL(window.location.href);
  const code = currentUrl.searchParams.get('code');
  const state = currentUrl.searchParams.get('state');
  if (code && state) {
    const userInfo = await comWx.getUserInfo(code, state);
    if (userInfo) {
      const sessionData = {
        ...userInfo,
        endTime: new Date().getTime() / 1000 + userInfo.expires_in,
      };
      sessionStorage.setItem('user', JSON.stringify(sessionData));
      return sessionData;
    } else {
      sessionStorage.removeItem('user');
      appendMessage(`获取用户信息: 失败`, 'error');
      return null;
    }
  } else {
    sessionStorage.removeItem('user');
    const loginUrl = await comWx.getAuthPath();
    if (loginUrl) {
      window.location.href = loginUrl;
    } else {
      appendMessage(`未成功获取到认证链接`, 'error');
      return null;
    }
  }
}

async function init() {
  clearMessage();
  const sessionUser = sessionStorage.getItem('user');
  let currentUser = sessionUser ? JSON.parse(sessionUser) : sessionUser;
  if (!currentUser || currentUser.endTime * 1000 <= new Date().getTime()) {
    currentUser = await updateCurrentUserInfo();
  }
  if (currentUser) {
    const { CorpId, UserId, open_userid, DeviceId } = currentUser;
    appendMessage(`当前用户： ${UserId}`);
    appendMessage(`所属部门： ${DeviceId}`);
    const wechatAppUrl = await comWx.getWechatAppUrl(CorpId, UserId, DeviceId);
    appendMessage(`小程序跳转链接： ${wechatAppUrl}`);
    if (wechatAppUrl) {
      // window.location.href = wechatAppUrl;
      const a = document.querySelector('#openApp');
      a.setAttribute('href', wechatAppUrl);
    }
    appendMessage(`开始注册企微权限...`);
    comWx.regWechatPlugin(
      CorpId,
      ['launchMiniprogram'],
      () => {
        appendMessage(`注册企微权限: 成功`, 'success');
      },
      () => {
        appendMessage(`注册企微权限: 失败`, 'error');
      }
    );
    appendMessage(`开始注册应用权限...`);
    comWx.regYYPlugin(
      CorpId,
      ['launchMiniprogram'],
      () => {
        appendMessage(`注册应用权限: 成功`, 'success');
        // appendMessage('开始跳转企业微信小程序...');
        // comWx.openMiniProgram(
        //   MiniprogramID,
        //   () => {
        //     appendMessage('已正常跳转', 'success');
        //     window.close();
        //   },
        //   () => {
        //     appendMessage('跳转失败', 'error');
        //   }
        // );
      },
      () => {
        appendMessage(`注册应用权限: 失败`, 'error');
      }
    );
  }
}

init();
