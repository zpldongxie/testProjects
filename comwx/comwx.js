'use strict';

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
class ComWX {
  /**
   * 企业微信操作类
   * @param {string} suiteID 企业微信应用ID
   */
  constructor(suiteID) {
    this.suiteID = suiteID;
  }

  /**
   * 获取认证跳转页
   * @returns url
   */
  async getAuthPath() {
    console.log('开始跳转向认证页');
    try {
      const res = await fetch(`/api_wechat/auth/authorizeUrl?suiteID=${this.suiteID}`, {
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
        },
      });
      const jsonRes = await res.json();
      const { data } = jsonRes;
      if (data) {
        return data;
      }
      return null;
    } catch (error) {
      console.log('Request Failed', error);
      return null;
    }
  }

  /**
   * 获取用户信息
   * @param {*} code
   * @param {*} state
   */
  async getUserInfo(code, state) {
    try {
      const res = await fetch(`/api_wechat/auth/loginInfo?code=${code}&state=${state}&suiteID=${this.suiteID}`);
      const { errCode, data } = await res.json();
      if (errCode) {
        return null;
      }
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
  async #getQYJsSignature(CorpId) {
    console.log(`计算企业签名...`);
    try {
      const url = encodeURIComponent(window.location.href.split('#')[0]);
      const res = await fetch(`/api_wechat/auth/qyJsSignature?suiteID=${this.suiteID}&CorpId=${CorpId}&url=${url}`);
      const jsonRes = await res.json();
      const { errCode, data } = jsonRes;
      if (errCode) {
        console.error('计算企业签名: 接口请求失败');
        return {};
      }
      console.log(`计算企业签名: 成功`, 'success');
      return data;
    } catch (error) {
      console.error('Request Failed', error);
      return {};
    }
  }

  /**
   * 获取应用的jsapi_ticket
   * @param {string} CorpId 企业ID
   */
  async #getYYJsSignature(CorpId) {
    console.log(`计算应用签名...`);
    try {
      const url = encodeURIComponent(window.location.href.split('#')[0]);
      const res = await fetch(`/api_wechat/auth/yyJsSignature?suiteID=${this.suiteID}&CorpId=${CorpId}&url=${url}`);
      const jsonRes = await res.json();
      const { errCode, data } = jsonRes;
      if (errCode) {
        console.error('计算应用签名: 接口请求失败');
        return {};
      }
      console.log(`计算应用签名: 成功`, 'success');
      return data;
    } catch (error) {
      console.error('Request Failed', error);
      return {};
    }
  }

  /**
   * 微信权限注册
   * @param {string} CorpId 企业ID
   * @param {string[]} jsApiList JS接口列表
   * @param {function} okCallback 成功回调
   * @param {function} errCallback 失败回调
   */
  async regWechatPlugin(CorpId, jsApiList = ['launchMiniprogram'], okCallback, errCallback) {
    const { appId, timestamp, nonceStr, signature } = await this.#getQYJsSignature(CorpId);
    console.log(`开始注册企微权限...`);
    wx.config({
      beta: true, // 必须这么写，否则wx.invoke调用形式的jsapi会有问题
      debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
      appId, // 必填，企业微信的corpID
      timestamp, // 必填，生成签名的时间戳
      nonceStr, // 必填，生成签名的随机串
      signature, // 必填，签名，见 附录-JS-SDK使用权限签名算法
      jsApiList, // 必填，需要使用的JS接口列表，凡是要调用的接口都需要传进来
    });
    wx.ready(function () {
      console.log('注册企微权限: 成功');
      okCallback?.();
    });
    wx.error(function (res) {
      console.error('注册企微权限: 失败');
      errCallback?.();
      // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
    });
  }

  /**
   * 应用权限注册
   * @param {string} CorpId 企业ID
   * @param {string[]} jsApiList JS接口列表
   * @param {function} okCallback 成功回调
   * @param {function} errCallback 失败回调
   */
  async regYYPlugin(CorpId, jsApiList = ['launchMiniprogram'], okCallback, errCallback) {
    const { corpid, agentid, timestamp, nonceStr, signature } = await this.#getYYJsSignature(CorpId);
    console.log(`开始注册应用权限...`);
    wx.agentConfig({
      corpid, // 必填，企业微信的corpid，必须与当前登录的企业一致
      agentid, // 必填，企业微信的应用id （e.g. 1000247）
      timestamp, // 必填，生成签名的时间戳
      nonceStr, // 必填，生成签名的随机串
      signature, // 必填，签名，见附录-JS-SDK使用权限签名算法
      jsApiList, //必填，传入需要使用的接口名称
      success: function (res) {
        console.log('注册应用权限: 成功');
        okCallback?.();
      },
      fail: function (res) {
        console.error(`注册应用权限: 失败`);
        errCallback?.();
        if (res.errMsg.indexOf('function not exist') > -1) {
          alert('版本过低请升级');
        }
      },
    });
  }

  /**
   * 打开企业微信小程序
   * @param {string} MiniprogramID 企业微信小程序ID
   * @param {function} okCallback 成功回调
   * @param {function} errCallback 失败回调
   */
  openMiniProgram(MiniprogramID, okCallback, errCallback) {
    console.log('开始跳转企业微信小程序...');
    wx.invoke(
      'launchMiniprogram',
      {
        appid: MiniprogramID, // 需跳转的小程序appid
        // path: 'pages/home/index.html', // 所需跳转的小程序内页面路径及参数。非必填
      },
      function (res) {
        if (res.err_msg == 'launchMiniprogram:ok') {
          // 正常
          console.log('已正常跳转');
          okCallback?.();
        } else {
          // 错误处理
          console.error('跳转失败');
          errCallback?.();
        }
      }
    );
  }

  /**
   * 获取微信小程序跳转链接-企业批改
   * @param {string} CorpId 当前登录企业微信的企业ID
   * @param {string} UserId 当前登录企业微信的用户ID
   * @param {string} DeviceId 当前登录企业微信的部门ID
   * @return {Primse<string | null>}
   */
  async getWechatAppUrl(CorpId, UserId, DeviceId) {
    appendMessage(`获取微信小程序跳转链接...`);
    const res = await fetch(`/api/linghang/ZYPGUrl?CorpId=${CorpId}&UserId=${UserId}&DeviceId=${DeviceId}`);
    const jsonRes = await res.json();
    console.log('🚀 ~ file: index.js ~ line 74 ~ getWechatAppUrl ~ jsonRes', jsonRes);
    const { errCode, data } = jsonRes;
    if (errCode) {
      appendMessage(`获取微信小程序跳转链接: 失败`, 'error');
      return null;
    }
    appendMessage(`获取微信小程序跳转链接: 成功`, 'success');
    return data;
  }
}
