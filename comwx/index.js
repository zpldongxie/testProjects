/** 应用ID */
const suiteID = 'wwf59089fd486b7391';

const $con = document.querySelector('#con');
function appendMessage(message) {
  const $newNode = document.createElement('div');
  $newNode.innerText = message;
  $con.appendChild($newNode);
}

function clearMessage() {
  $con.innerHTML = '';
}

/**
 * 获取用户信息
 * @param {*} code
 * @param {*} state
 */
async function getUserInfo(code, state) {
  try {
    const res = await fetch(`/api/auth/loginInfo?code=${code}&state=${state}&suiteID=${suiteID}`);
    const jsonRes = await res.json();
    const { data } = jsonRes;
    const sessionData = {
      ...data,
      endTime: new Date().getTime() / 1000 + data.expires_in,
    };
    sessionStorage.setItem('user', JSON.stringify(sessionData));
    return data;
  } catch (error) {
    console.log('Request Failed', error);
    return null;
  }
}

/**
 * 获取企业的jsapi_ticket
 * @param {string} CorpId 企业ID
 */
async function getQYJsSignature(CorpId) {
  appendMessage(`计算企业签名...`);
  try {
    const url = encodeURIComponent(window.location.href.split('#')[0]);
    const res = await fetch(`/api/auth/qyJsSignature?suiteID=${suiteID}&CorpId=${CorpId}&url=${url}`);
    const jsonRes = await res.json();
    const { errCode, data } = jsonRes;
    if (errCode) {
      console.error('计算企业签名: 接口请求失败');
      appendMessage(`计算企业签名: 接口请求失败`);
      return {};
    }
    appendMessage(`计算企业签名: 成功`);
    return data;
  } catch (error) {
    console.log('Request Failed', error);
    appendMessage(`计算企业签名: 接口请求异常`);
    return {};
  }
}

/**
 * 获取应用的jsapi_ticket
 * @param {string} CorpId 企业ID
 */
async function getYYJsSignature(CorpId) {
  appendMessage(`计算应用签名...`);
  try {
    const url = encodeURIComponent(window.location.href.split('#')[0]);
    const res = await fetch(`/api/auth/yyJsSignature?suiteID=${suiteID}&CorpId=${CorpId}&url=${url}`);
    const jsonRes = await res.json();
    const { errCode, data } = jsonRes;
    if (errCode) {
      console.error('计算应用签名: 接口请求失败');
      appendMessage(`计算应用签名: 接口请求失败`);
      return {};
    }
    appendMessage(`计算应用签名: 成功`);
    return data;
  } catch (error) {
    console.log('Request Failed', error);
    appendMessage(`计算应用签名: 接口请求异常`);
    return {};
  }
}

function openMiniProgram() {
  appendMessage('开始跳转微信小程序...');
  wx.invoke(
    'launchMiniprogram',
    {
      appid: 'wx87e82ee95f21edbd', // 需跳转的小程序appid
      // path: 'pages/home/index.html', // 所需跳转的小程序内页面路径及参数。非必填
    },
    function (res) {
      if (res.err_msg == 'launchMiniprogram:ok') {
        // 正常
        appendMessage('已正常跳转');
      } else {
        // 错误处理
        appendMessage('跳转失败');
        console.error(res);
      }
    }
  );
}

/**
 * 微信控件注册
 * @param {string} CorpId 企业ID
 */
async function regWechatPlugin(CorpId) {
  const { appId, timestamp, nonceStr, signature } = await getQYJsSignature(CorpId);
  appendMessage(`开始注册企微控件...`);
  wx.config({
    beta: true, // 必须这么写，否则wx.invoke调用形式的jsapi会有问题
    debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
    appId, // 必填，企业微信的corpID
    timestamp, // 必填，生成签名的时间戳
    nonceStr, // 必填，生成签名的随机串
    signature, // 必填，签名，见 附录-JS-SDK使用权限签名算法
    jsApiList: ['launchMiniprogram'], // 必填，需要使用的JS接口列表，凡是要调用的接口都需要传进来
  });
  wx.ready(function () {
    appendMessage(`注册企微控件: 成功`);
    console.log('注册企微控件: 成功');
  });
  wx.error(function (res) {
    appendMessage(`注册企微控件: 失败`);
    console.warn('注册企微控件: 失败');
    console.log('🚀 ~ file: index.js ~ line 62 ~ res', res);
    // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
  });
}

/**
 * 企微应用控件注册
 * @param {string} CorpId 企业ID
 */
async function regYYPlugin(CorpId) {
  const { corpid, agentid, timestamp, nonceStr, signature } = await getYYJsSignature(CorpId);
  appendMessage(`开始注册企微应用控件...`);
  wx.agentConfig({
    corpid, // 必填，企业微信的corpid，必须与当前登录的企业一致
    agentid, // 必填，企业微信的应用id （e.g. 1000247）
    timestamp, // 必填，生成签名的时间戳
    nonceStr, // 必填，生成签名的随机串
    signature, // 必填，签名，见附录-JS-SDK使用权限签名算法
    jsApiList: ['launchMiniprogram'], //必填，传入需要使用的接口名称
    success: function (res) {
      // 回调
      appendMessage(`注册企微应用控件: 成功`);
      openMiniProgram();
    },
    fail: function (res) {
      appendMessage(`注册企微应用控件: 失败`);
      if (res.errMsg.indexOf('function not exist') > -1) {
        alert('版本过低请升级');
      }
    },
  });
}

/**
 * 跳转向认证页面
 */
async function gotoAuthPage() {
  console.log('开始跳转向认证页');
  try {
    const res = await fetch(`/api/auth/authorizeUrl?suiteID=${suiteID}`, {
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
    });
    const jsonRes = await res.json();
    const { data } = jsonRes;
    if (data) {
      window.location.href = data;
    }
  } catch (error) {
    console.log('Request Failed', error);
  }
}

async function toLogin() {
  const currentUrl = new URL(window.location.href);
  const code = currentUrl.searchParams.get('code');
  const state = currentUrl.searchParams.get('state');
  if (code && state) {
    const userInfo = await getUserInfo(code, state);
    if (userInfo) {
      const { CorpId, UserId, open_userid, DeviceId } = userInfo;
      appendMessage(`当前用户： ${UserId}`);
      appendMessage(`所属部门： ${DeviceId}`);
      regWechatPlugin(CorpId);
      regYYPlugin(CorpId);
    } else {
      appendMessage(`获取用户信息失败`);
    }
  } else {
    gotoAuthPage();
  }
}

async function init() {
  const currentUser = sessionStorage.getItem('user');
  if (currentUser) {
    const userInfo = JSON.parse(currentUser);
    if (userInfo.endTime * 1000 > new Date().getTime()) {
      const { CorpId } = userInfo;
      regWechatPlugin(CorpId);
      regYYPlugin(CorpId);
    } else {
      toLogin();
    }
  } else {
    toLogin();
  }
}

init();
