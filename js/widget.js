w.taplink={modal:null,shadow:null,opened:!1,btn:null,iframe:null,part:"",backdrop:null,style:null,inited:!1,msgs:[],createElement:function(e,t,i){var a=document.createElement(e);for(var n in t)a.setAttribute(n,t[n]);return i&&(a.innerHTML=i),a},postMessage:function(e){this.iframe?this.iframe.postMessage(e):this.msgs.push(e)},getCookie:function(e){var t=("; "+document.cookie).split("; "+e+"=");if(2==t.length)return t.pop().split(";").shift()},toggleClass:function(e,t,i){null==i?-1!=e.className.indexOf(t)?this.removeClass(e,t):this.addClass(e,t):i?this.addClass(e,t):this.removeClass(e,t)},addClass:function(e,t){-1==e.className.indexOf(t)&&(e.className+=" "+t)},removeClass:function(e,t){e&&(e.className=e.className.replace(" "+t,""))},open:function(e){if(null==e&&(e="/"),"string"==typeof e)this.part=e;else switch(e.part){case"market":this.part="/m/";break;case"product":this.part="/o/"+e.id+"/";break;case"page":this.part="/p/"+e.id+"/";break;default:this.part="/"}this.iframe&&e&&this.reload(),this.opened||this.toggle()},close:function(){this.opened&&this.toggle()},reload:function(e){null==e&&(e=function(){});var t=(p.domain?p.domain:"//taplink.cc/"+p.username)+("/"!=this.part?this.part:"");token&&(t+="?token="+token);var i=this.iframe.getAttribute("src");"about:blank"!=i?e():setTimeout(function(){e()},750),i!=t&&this.iframe.setAttribute("src",t)},toggle:function(){var e,i=this;w.taplink.inited||w.taplink.completed(),w.taplink.modal?(e=this.modal,this.opened||this.reload(),w.taplink.toggleClass(d.body,"is-taplink-opened")):(e=this.modal=this.createElement("div",{class:"taplink-widget-modal",style:p.style+";-webkit-overflow-scrolling: touch;-webkit-backface-visibility: hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);overflow: hidden;height:100%;text-align:left"}),this.iframe=this.createElement("iframe",{src:"about:blank",allowtransparency:!0,frameborder:0,border:0,style:"-webkit-overflow-scrolling:touch;-webkit-backface-visibility: hidden;-webkit-tap-highlight-color:rgba(0,0,0,0);"}),e.appendChild(this.iframe),d.body.appendChild(e),this.reload(function(){w.taplink.toggleClass(d.body,"is-taplink-opened");var e=i.createElement("a",{class:"taplink-widget-close"});switch(d.body.appendChild(e),e.onclick=function(e){w.taplink.toggle()},p.view){case"popup":i.shadow=i.createElement("div",{class:"taplink-widget-shadow is-"+p.placement});break;case"slideout":i.shadow=i.createElement("div",{class:"taplink-widget-backdrop"}),i.shadow.onclick=function(){w.taplink.close()}}d.body.appendChild(i.shadow)}),this.iframe.onload=function(e){for(var t=0;t<i.msgs.length;t++)i.iframe.contentWindow.postMessage(i.msgs[t],"*")}),this.opened=!this.opened},setColor:function(e){e=e.replace("#","");var t,i,a,n=(t=/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e))?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null;n&&(i=".taplink-widget-btn { background-color: #"+e+"} .taplink-widget-btn:before, .taplink-widget-btn:after { border-color: #"+e+"}",this.style||(this.style=w.taplink.createElement("link",{type:"text/css",rel:"stylesheet"})),w.taplink.toggleClass(w.taplink.btn,"is-taplink-light",160<.299*(a=n).r+.587*a.g+.114*a.b),this.style.setAttribute("href","data:text/css;charset=UTF-8,"+encodeURIComponent(i)),d.body.appendChild(this.style))},completed:function(){var e,t;w.taplink.inited||(d.removeEventListener("DOMContentLoaded",w.taplink.completed,!1),w.removeEventListener("load",w.taplink.completed,!1),e=w.taplink.createElement("link",{rel:"stylesheet",href:"//taplink.cc/s/css/widget.css?4"}),d.body.appendChild(e),1==p.button&&(w.taplink.btn=w.taplink.createElement("label",{class:"taplink-widget-btn"},'<div class="taplink-widget-btn-inner"></div>'),d.body.appendChild(w.taplink.btn),w.taplink.btn.onclick=function(e){w.taplink.toggle()}),null!=p.color&&w.taplink.setColor(p.color),null!=p.part&&(w.taplink.part=p.part),d.body.className+=" taplink-widget-view-"+p.view+" taplink-widget-placement-"+p.placement,t=w.taplink.createElement("div",{class:"taplink-widget-footer"}),d.body.appendChild(t),w.taplink.inited=!0)}},w.addEventListener("message",taplink.receiveMessage,!1),d.addEventListener("DOMContentLoaded",w.taplink.completed,!1),w.addEventListener("load",w.taplink.completed,!1);
