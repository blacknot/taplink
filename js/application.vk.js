window.isMobileVk=-1!==document.referrer.indexOf("m.vk.com"),-1==document.referrer.indexOf("vk.com")&&-1==document.location.href.indexOf("dev.")&&(document.location="https://taplink.cc"),$mx.lazy(["https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js"],function(){vkBridge.send("VKWebAppInit");var e,i=0;!window.isMobileVk&&vkBridge.supports("VKWebAppResizeWindow")&&((e=function(){_.each([150,500,700],function(e){return setTimeout(function(){var e,n=$mx(".page.vue");n.length||(n=$mx(document.body)),null!=i&&(e=Math.max(n.outerHeight(),500),window.vkBridge.send("VKWebAppResizeWindow",{width:1e3,height:i=e}))},e)})})(),$events.on("contentupdated",e),$mx(window).on("resize",e))});
