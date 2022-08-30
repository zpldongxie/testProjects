// 获取客户端信息
var u = navigator.userAgent,
  app = navigator.appVersion;
var isAndroid = u.indexOf("Android") > -1 || u.indexOf("Linux") > -1; //android终端或者uc浏览器
var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
// 获取用户信息
// ios
function setupWebViewJavascriptBridge(callback) {
  if (window.WebViewJavascriptBridge) {
    return callback(WebViewJavascriptBridge);
  }
  if (window.WVJBCallbacks) {
    return window.WVJBCallbacks.push(callback);
  }
  window.WVJBCallbacks = [callback];
  var WVJBIframe = document.createElement("iframe");
  WVJBIframe.style.display = "none";
  WVJBIframe.src = "wvjbscheme://__BRIDGE_LOADED__";
  document.documentElement.appendChild(WVJBIframe);
  setTimeout(function () {
    document.documentElement.removeChild(WVJBIframe);
  }, 0);
}
// android
function getUserInfoForAndroid() {
  return JSON.parse(yspCheckIn.getUserInfo());
}

// 入口
if (isAndroid && yspCheckIn) {
  var userInfo = getUserInfoForAndroid();
  autoLogin(userInfo.loginName, userInfo.password);
} else if (isiOS) {
  setupWebViewJavascriptBridge(function (bridge) {
    //客户端已经注册好一个名为“getUserInfo”的方法，H5直接进行调用（方法名也为“getUserInfo”）就行，调用的时候可以传客户端需要的参数
    bridge && bridge.callHandler("getUserInfo", function responseCallback(responseData) {
      autoLogin(responseData.account, responseData.password);
    });
  });
}

// 密码代填
function autoLogin(account, password) {
  var usernameDom = document.querySelector('#username');
  var pwdDom = document.querySelector('#password1');
  var submitDom = document.querySelector('#submitForm');
  if (usernameDom && pwdDom && submitDom && account && password) {
    usernameDom.value = account;
    pwdDom.value = password;
    var e = new Event('click');
    submitDom.dispatchEvent(e);
  }
}