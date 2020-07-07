var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};window.$app.defineComponent("index","vue-index-affiliate-form",{data:function(){return{values:{name:"",email:"",message:""},isUpdating:!1,isSent:!1}},mixins:[FormModel],methods:{submit:function(){var t=this;this.isUpdating=!0,this.$api.post("system/affiliate/push",this.values,this).then(function(e){t.isUpdating=!1,"success"==e.result&&(t.isSent=!0)})}},template:'<div v-if="isSent"> <div class="sa-icon sa-success animate" style="display: block;"><span class="sa-line sa-tip animateSuccessTip"></span> <span class="sa-line sa-long animateSuccessLong"></span> <div class="sa-placeholder"></div> <div class="sa-fix"></div></div> <h3 class="has-text-centered">{{\'Спасибо\'|gettext}}</h3> </div> <div v-else> <form @submit.prevent="submit"> <b-field :label="\'Ваше имя\'|gettext" :class="{\'has-error\': errors.name}" :message="errors.name"> <input type="text" class="input is-large" v-model.trim="values.name" :disabled="isUpdating" maxlength="128"> </b-field> <b-field :label="\'Ваш email\'|gettext" :class="{\'has-error\': errors.email}" :message="errors.email"> <input type="email" class="input is-large" v-model.trim="values.email" :disabled="isUpdating" maxlength="128"> </b-field> <b-field :label="\'Сообщение\'|gettext"> <textarea type="text" class="input is-large" v-model.trim="values.message" :disabled="isUpdating" rows="6" maxlength="64000"></textarea> </b-field> <button type="submit" class="button is-primary is-medium" :class="{\'is-loading\': isUpdating}">{{\'Отправить\'|gettext}}</button> </form> </div>'}),window.$app.defineComponent("index","vue-index-footer",{methods:{checkUrlPrefix:function(e){return window.base_path_prefix+e}},template:"<footer class=\"is-hidden-mobile\"> <div class=\"container\"> <div class=\"level\"> <div class=\"level-left\"> <a :href=\"checkUrlPrefix('/guide/')\">{{'Подробные инструкции'|gettext}}</a> <a :href=\"checkUrlPrefix('/faq/')\">{{'Вопросы и ответы'|gettext}}</a> <a @click=\"Intercom('show')\">{{'Задать вопрос'|gettext}}</a> <a :href=\"checkUrlPrefix('/about/affiliate.html')\" v-if=\"i18n.locale != 'ru'\">{{'Партнерская программа'|gettext}}</a> <a :href=\"checkUrlPrefix('/tariffs/')\">{{'Цены и тарифы'|gettext}}</a> </div> <div class=\"level-right\"> <vue-component-locale-change></vue-component-locale-change> </div> </div> </div> </footer>"}),window.$app.defineComponent("index","vue-index-index",{data:function(){return{isAuth:!1,current:null}},computed:{isShow:function(){return this.current&&("main"==this.current.name&&this.isAuth||"main"!=this.current.name)}},created:function(){var e=this;$mx("html").addClass("is-app"),window.$events.on("navigate",this.navigate),this.navigate(null,this.$router.currentRoute),null==this.$account.profile_id?("index"==this.$router.currentRoute.name&&window.$events.one("account:refresh",function(){e.$router.replace({name:"pages",params:{page_id:e.$account.page_id}})}),this.$auth.refresh(null,null,function(){var e=document.location.href;-1==e.indexOf("/auth/")?Cookies.set("auth-redirect",e):Cookies.remove("auth-redirect")})):this.isAuth=!0,window.$events.on("account:refresh",function(){if(!e.$account.user.email)return e.$router.replace({name:"email"});e.isAuth=!0}),this.$io.on("events:account:logout",this.logout),window.$events.on("account:logout",this.logout),this.$io.on("events:avatar:updated",this.avatarUpdated);var t=$mx(".main-block");t.on("scroll",function(e){$mx(document.body).toggleClass("is-scrolled",20<t[0].scrollTop)})},mounted:function(){window.scrollTo(0,1)},destroyed:function(){window.$events.off("navigate",this.navigate),this.$io.off("events:account:logout",this.logout),this.$io.off("events:avatar:updated",this.avatarUpdated)},methods:{avatarUpdated:function(e){this.$account.avatar.url="//"+this.$account.storage_domain+e.pathname},navigate:function(e,t){this.current=t?1<t.matched.length?t.matched[1]:t:null},logout:function(){this.isAuth=!1,this.$account.profile_id=null,-1!=["main","index"].indexOf(this.current.name)&&this.$router.replace({name:"signin"})}},template:'<router-view v-if="isShow" :class="{\'has-auth\':isAuth}"></router-view>'}),window.$app.defineComponent("index","vue-index-main",{data:function(){return{connection:1,connectionTimer:null,online:!0,isMounted:!1}},props:["page_id"],created:function(){$mx(window).on("online offline",this.updateIndicator),this.$events.on("theme:refresh",this.themeRefresh)},mounted:function(){this.isMounted=!0,this.themeRefresh()},destroyed:function(){$mx(window).off("online offline",this.updateIndicator),this.$events.off("theme:refresh",this.themeRefresh),this.isMounted=!1},methods:{themeRefresh:function(){this.isMounted&&StylesFactory.updateCSSBlock(this.$account.styles,this.$refs.styles)},updateIndicator:function(){var e=this;this.online=navigator.onLine,this.online?(this.connectionTimer&&(clearInterval(this.connectionTimer),this.connectionTimer=null),$mx("html").removeClass("is-clipped")):(this.connectionTimer=setInterval(function(){e.connection++,5==e.connection&&(e.connection=1)},1e3),$mx("html").addClass("is-clipped"))},navigate:function(e,t){this.current=t?1<t.matched.length?t.matched[1]:t:null}},template:'<div style="display: flex;flex-direction: column;flex-shrink:0;flex-grow: 1"> <div ref=\'styles\'></div> <vue-index-menu :page_id="page_id"></vue-index-menu> <router-view style="flex-grow: 1"></router-view> <vue-index-footer></vue-index-footer> <div class="network-status" v-if="!online"> <div class="network-status-icon"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"> <g class="fa-group" v-if="connection == 1"><path class="fa-secondary" fill="currentColor" d="M634.9 154.9C457.7-9 182.2-8.9 5.1 154.9c-6.4 6-6.8 16-.9 22.5.2.2.3.4.5.5l34.2 34c6.2 6.1 16 6.2 22.4.4 145.9-133.7 371.3-133.7 517.2 0 6.4 5.9 16.2 5.7 22.4-.4l34.2-34c6.3-6.2 6.3-16.2.2-22.5 0-.2-.2-.4-.4-.5zM522.7 268.4c-115.3-101.9-290.2-101.8-405.3 0-6.5 5.8-7.1 15.8-1.4 22.3.3.3.5.6.8.8l34.4 34c6 5.9 15.6 6.3 22.1.8 83.9-72.6 209.7-72.4 293.5 0 6.4 5.5 16 5.2 22-.8l34.4-34c6.2-6.1 6.4-16.1.3-22.4-.3-.2-.5-.4-.8-.7z"></path><path class="fa-primary" fill="currentColor" d="M320 352c35.3 0 64 28.7 64 64s-28.7 64-64 64-64-28.7-64-64 28.7-64 64-64z"></path></g> <g class="fa-group" v-if="connection != 1"><path :class="{\'fa-secondary\': connection== 2 || connection== 4, \'fa-primary\': connection== 3}" fill="currentColor" d="M635.3 177.9l-34.2 34c-6.2 6.1-16 6.2-22.4.4-146-133.7-371.3-133.7-517.2 0-6.4 5.9-16.2 5.7-22.4-.4l-34.2-34-.5-.5c-6-6.4-5.6-16.5.9-22.5C182.2-8.9 457.7-9 634.9 154.9c.2.2.4.3.5.5 6.2 6.3 6.1 16.3-.1 22.5z"></path><path class="fa-primary" fill="currentColor" d="M320 352c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zm203.5-82.8l-.8-.8c-115.3-101.9-290.2-101.8-405.3 0-6.5 5.8-7.1 15.8-1.4 22.3.3.3.5.6.8.8l34.4 34c6 5.9 15.6 6.3 22 .8 84-72.6 209.7-72.4 293.5 0 6.4 5.5 16 5.2 22-.8l34.4-34c6.4-6 6.5-16 .4-22.3z"></path></g> </svg> </div> <h2 class="has-mb-2 has-text-centered">{{\'Отсутствует соединение\'|gettext}}</h2> <h3 class="has-text-centered">{{\'Убедитесь, что ваше устройство подключено к интернету\'|gettext}}</h3> </div> </div>'}),window.$app.defineComponent("index","vue-index-menu",{data:function(){return{favourites:[],standalone:window.standalone,title:"",currentRoute:null,menuOpened:!1,isShowBanner:!0,helpShown:!1}},props:{page_id:Number},created:function(){var i=this;this.fillTitle(this.currentRoute=this.$router.currentRoute),window.$events.on("navigate",function(e,t){i.fillTitle(i.currentRoute=t)}),$mx(document.body).on("touchstart",this.onTouchStart)},computed:{ratePlanLink:function(){return window.base_path_prefix+"/tariffs/"},tariffEndsMessage:function(){return this.$format(this.$gettext('Через {1} истекает срок действия вашего тарифа, вам необходимо <a href="{2}">продлить ваш тариф</a>'),this.$plural("день",this.$account.tariff_ends_days),this.ratePlanLink)},menu:function(){return _.filter(this.$auth.prepareMenu(this.$router.getRoute({name:"main"}).children),function(e){return e.meta&&(e.meta.icon||e.meta.icon_svg)})}},mounted:function(){var e=this;this.$io.on("events:menu.hits:changed",this.changedHits),this.$io.on("events:menu.hits:increment",this.incrementHits),this.$io.on("events:system:updated",this.updatedSystem),this.$io.on("events:profiles.favourites:refresh",this.refreshFavourites),NativeApplication.setBadge(this.calcHits()),window.$events.on("account:refresh",this.accountRefresh),window.$events.on("account:logout",this.accountLogout),window.$events.on("menu:close",function(){$mx(".projects-menu").css("pointer-events","none"),e.menuOpened=!1,setTimeout(function(){$mx(".projects-menu").css("pointer-events","all")},50)})},destroyed:function(){this.$io.off("events:menu.hits:changed",this.changedHits),this.$io.off("events:menu.hits:increment",this.incrementHits),this.$io.off("events:system:updated",this.updatedSystem),this.$io.off("events:profiles.favourites:refresh",this.refreshFavourites),window.$events.off("account:refresh",this.accountRefresh),window.$events.off("account:logout",this.accountLogout),$mx(document.body).off("touchstart",this.onTouchStart)},methods:{isActiveMenu:function(e){for(i=this.currentRoute.matched.length-1;0<=i;i--)if(this.currentRoute.matched[i].name==e.name)return!0;return!1},accountRefresh:function(){NativeApplication.setBadge(this.calcHits())},accountLogout:function(){NativeApplication.setBadge(null)},isXs:function(){return!!window.matchMedia("(max-width: 767px)").matches},onTouchStart:function(e){var s=this,n=$mx(e.target);if(!($mx("html").is(".is-dragging")||$mx("html").is(".is-clipped")||n.closest(".b-slider").length)&&this.isXs()){var t=n.closest(".main"),i=t.length,a=screen.width/100*85,o=e.touches[0].pageX,c=e.touches[0].pageY,r=$mx("html").is(".open-menu")?a:0,l=0,d=0;if(i){var u=t.data("scroll-x");i=u<-50}var p=$mx(".main"),h=!1,m=!1,f=0;if(!i){function v(e){$mx("html").is(".is-dragging")||(f=e.touches[0].pageX,y=e.touches[0].pageY,!m&&(h||45<Math.abs(f-o))&&(l=f-o+r,i&&0<l&&(i=!1),l<0&&t.length&&(i=!0),i||(h||(p.addClass("stop-transition"),h=!0,d=e.timeStamp),p.css("transform","translate3d("+Math.min(Math.max(0,l),a)+"px,0,0)"))),!h&&45<Math.abs(y-c)&&(m=!0))}n.on("touchmove",v).one("touchend",function(e){if(n.off("touchmove",v),h){p.removeClass("stop-transition"),$mx(".main-block").removeClass("disable-pointer-events");var t=e.timeStamp-d,i=Math.abs(f-o)/t,a=0;a=.4<i?0<f-o:l>screen.width/2,setTimeout(function(){p.css("transform",""),s.menuOpen(null,a)},0),h=!1}m=!1})}}},fillTitle:function(e){for(var t=null,i=e.matched.length-1;0<i;i--)null!=e.matched[i].meta&&null!=e.matched[i].meta.title&&(t=e.matched[i].meta.title);this.title=t},changedHits:function(e){this.$account.hits=_.merge(this.$account.hits,e),NativeApplication.setBadge(this.calcHits())},incrementHits:function(e){!function i(a,e){_.each(e,function(e,t){_.isObject(e)?(null==a[t]&&(a[t]=[]),i(a[t],e)):null==a[t]?a[t]=e:a[t]+=e})}(this.$account.hits,e),NativeApplication.setBadge(this.calcHits())},updatedSystem:function(){this.$confirm(this.$gettext("Произошло обновление системы, необходимо перезагрузить страницу"),"is-danger").then(function(){document.location.reload()})},menuOpen:function(e,t){null==t&&(t=!$mx("html").is(".open-menu")),$mx("html").toggleClass("open-menu",t),t&&$mx(".main").one("click",function(){$mx("html").removeClass("open-menu")})},refreshFavourites:function(){var t=this;this.$api.get("account/favourites").then(function(e){t.$account.favourites=e.response.favourites})},checkViewBox:function(e){return null==e.icon_viewbox?"0 0 512 512":e.icon_viewbox},prepareHits:function(e){return this.calcHits(e)?" menu-hits":""},calcHits:function(e){function a(e){var t=0;for(var i in e)"object"==_typeof(e[i])?t+=a(e[i]):t+=e[i];return t}var t=0;return null!=e?this.$account.hits[e.name]&&(t=a(this.$account.hits[e.name])):_.each(this.$account.hits,function(e){t+=a(e)}),t},prepareIcon:function(e){return e.meta.icon+this.prepareHits(e)},click:function(e){window.standalone&&go($mx(e.target).closest("a").attr("href")),this.$auth.closeMenu()},logout:function(){var t=this;this.$api.get("auth/logout").then(function(e){"success"==e.result&&(t.$auth.closeMenu(),null!=e.response?t.$auth.refresh(e.response,function(){t.$router.replace({name:"pages",params:{page_id:t.$account.page_id}})}):(t.$account.profile_id=null,window.$events.fire("account:logout")))})}},template:'<div> <transition name="fade"> <article class="message is-top-banner" v-if="$account.banner && isShowBanner" :class="$account.banner.classname"> <header class="message-header" :style="{background: $account.banner.bg}"> <div class="container"> <a target="_blank" :href="$account.banner.link" @click="if ($account.banner.close == \'link\') isShowBanner=false" v-html="$account.banner.title"></a> <button type="button" class="delete" @click="isShowBanner = false" v-if="$account.banner.close == \'button\'"></button> <a :href="$account.banner.link" class="button" target="_blank" @click="isShowBanner = false" v-if="$account.banner.button" :class="$account.banner.button.classname">{{$account.banner.button.text}}</a> </div> </header> </article> </transition> <header class="is-top is-auth"> <div class="container"> <div> <a @click.stop="menuOpen" class="menu-btn"><i class="fal fa-bars"></i><i :class="prepareHits()"></i></a> <span @click.stop="menuOpen" class="menu-title">{{title|gettext}}</span> <div class="scrolling-container"> <div> <div class="menu"> <router-link v-for="(m, index) in menu" :key="index" :to="{name: m.name, params: { page_id: page_id }}" :class="{active: isActiveMenu(m)}" v-if="m.meta && (m.meta.icon || m.meta.icon_svg)" @click.native="click"><svg :viewBox="checkViewBox(m.meta)" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" v-if="m.meta.icon_svg != undefined" v-html="m.meta.icon_svg"></svg><i :class="prepareHits(m)"></i><em :class="prepareIcon(m)" v-else></em><span>{{m.meta.title|gettext}}</span><dd :data-value="calcHits(m)" v-if="calcHits(m)"></dd></router-link> </div> </div> </div> <div class="menu-right"> <svg @click="helpShown = !helpShown" v-if="$auth.hasFeature(\'help\') && (i18n.locale == \'ru\')" class="help-icon" :class="{in: helpShown}" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="m256 0c-141.87 0-256 114.13-256 256s114.13 256 256 256 256-114.13 256-256-114.13-256-256-256zm0 388.27c-72.533 0-132.27-58.667-132.27-132.27 0-72.533 58.667-132.27 132.27-132.27s132.27 59.734 132.27 132.27-59.734 132.27-132.27 132.27z" fill="#F3705A"/><g fill="#E8EAE9"><path d="M256,123.733c18.133,0,35.2,3.2,50.133,9.6l35.2-118.4C314.667,5.333,285.867,0,256,0 s-58.667,5.333-85.333,14.933l35.2,119.467C220.8,128,237.867,123.733,256,123.733z"/><path d="m256 388.27c-18.133 0-35.2-3.2-50.133-9.6l-35.2 118.4c26.666 9.6 55.466 14.933 85.333 14.933s58.667-5.333 85.333-14.933l-35.2-119.47c-14.933 6.4-32 10.667-50.133 10.667z"/><path d="m497.07 170.67-119.47 35.2c6.4 16 9.6 33.067 9.6 50.133 0 18.133-3.2 35.2-9.6 50.133l119.47 35.2c9.6-26.666 14.933-55.466 14.933-85.333s-5.333-58.667-14.933-85.333z"/><path d="M123.733,256c0-18.133,3.2-35.2,9.6-50.133l-118.4-35.2C5.333,197.333,0,226.133,0,256 s5.333,58.667,14.933,85.333l119.467-35.2C128,291.2,123.733,274.133,123.733,256z"/></g></svg> <div class="header-choose-profile"> <div class="a projects-menu" :class="{in: menuOpened}"> <div @click.prevent.stop="menuOpened = false" class="background"></div> <div class="d" @click="if (isXs()) menuOpened=true"><img :src=\'$account.avatar.url\' class="avatar"><i class="fa fa-angle-down is-hidden-mobile has-ml-1"></i></div> <div class="ul"> <div class="li is-first"><router-link :to="{name: \'profiles\', params: {page_id: page_id}}" @click.native="click">{{\'Мои профили\'|gettext}}</router-link></div> <div class="li divider" v-if="$account.favourites.length"></div> <div class="menu-favourites"> <div v-for="f in $account.favourites" class="li"><a class=\'profile\' @click="$auth.changeProfile(f.profile_id)"><i class="fa fa-share-alt" v-if="f.is_share"></i><dd>{{f.nickname}}</dd></a></div> </div> <div class="li divider"></div> <div class="li"><router-link :to="{name: \'access\', params: {page_id: page_id}}" @click.native="click">{{\'Совместный доступ\'|gettext}}</router-link></div> <div class="li divider"></div> <div class="li"><router-link :to="{name: \'account-settings\', params: {page_id: page_id}}" @click.native="click">{{\'Настройки аккаунта\'|gettext}}</router-link></div> <div v-if="$account.manager_id"> <div class="li divider"></div> <div class="li"><router-link :to="{name: \'manager\', params: {page_id: page_id}}" @click.native="click">{{\'Администрирование\'|gettext}}</router-link></div> </div> <div v-if="$account.partner_id && $account.partner_id"> <div class="li divider"></div> <div class="li"><router-link :to="{name: \'partner\', params: {page_id: page_id}}" @click.native="click">{{\'Партнерская программа\'|gettext}}</router-link></div> </div> <div class="li divider"></div> <div><a :href="ratePlanLink">{{\'Цены и тарифы\'|gettext}}</a></div> <div class="li divider"></div> <div class="li is-last"><a @click="logout">{{\'Выход\'|gettext}}</a></div> </div> </div> </div> </div> </div> </div> </header> <em></em> <div class="message is-warning alert-header" v-if="!($account.banner && isShowBanner) && !$auth.isAllowTariff(\'pro\')"><i class=\'fa fa-star-o\'></i> {{\'У вас базовый тариф\'|gettext}}, <a :href=\'ratePlanLink\' class="text-black">{{\'обновить тариф\'|gettext}}</a></div> <div v-else> <div class="message is-warning alert-header" v-if="$account.tariff_ends && $account.tariff_ends_days> 0 && $account.tariff_ends_days < 14"><i class=\'fa fa-exclamation-triangle\'></i> <span v-html="tariffEndsMessage"></span></div> </div> <vue-component-submenu :page_id="page_id"></vue-component-submenu> <vue-component-help-sidebar :active.sync="helpShown"></vue-component-help-sidebar> </div>'}),window.$app.defineComponent("index","vue-index-pricing",{data:function(){return{currency:{title:"$",format:"%c%p",precision:1,decimal:".",thousands:",",round:1},prepaid:null,features:[],details:{basic:Array.from("aaaaa"),pro:Array.from("aaaaaaaaa"),business:Array.from("aaaaaaaaaaaa")},plans:{basic:{price:0},pro:{price:0},business:{price:0}},currentPeriod:12,currentPlan:"pro",isFetching:!0,isFinished:!1,isTrialActivating:!1,isChoosing:null,isWaitingPayment:!1,counter:{from:{},to:{}}}},created:function(){var i=this;this.$api.get("system/prices/get").then(function(e){if("success"==e.result){var t=e.response;i.features=t.features,i.currency=t.currency,i.plans=t.plans,i.prepaid=t.prepaid,i.details=t.details,i.isFetching=!1,i.storeCounter(),i.counter.current=i.counter.to,i.$nextTick(function(){i.isFinished=!0})}}),this.$io.on("events:account:refresh",this.planUpdated)},destroyed:function(){this.$io.off("events:account:refresh",this.planUpdated)},computed:{periods:function(){return{3:{discount:0,months:3,text:"квартал",title:"3 месяца",period:3},6:{discount:30,months:3,text:"полгода",title:"6 месяцев",period:6},12:{discount:50,months:3,text:"год",title:"12 месяцев",period:12}}},current:function(){return this.periods[this.currentPeriod]}},watch:{currentPeriod:function(){var o=this;this.storeCounter(),_.each(this.plans,function(e,t){var i=o.counter.from[t],a=(o.counter.to[t]-i)/20,s=0,n=setInterval(function(){o.counter.current[t]=i+a*s,o.$forceUpdate(),10==++s&&(o.counter.current[t]=o.counter.to[t],o.$forceUpdate(),clearInterval(n))},10)})}},methods:{planUpdated:function(){this.isWaitingPayment=!1},storeCounter:function(){var i=this;this.counter.from=this.counter.to,this.counter.to={},_.each(this.plans,function(e,t){i.counter.to[t]=i.newPricePerMonth(e)*i.currentPeriod})},trialActivate:function(){var t=this;this.isTrialActivating=!0,this.$api.get("system/prices/trial").then(function(e){"success"==e.result&&t.$auth.refresh(e.response),t.isTrialActivating=!1}).catch(function(){t.isTrialActivating=!1})},choose:function(e){var a=this,t=_.isObject(e)?e:{period:this.currentPeriod,tariff:e};this.isChoosing=t.tariff,this.$api.get("system/prices/order",t).then(function(e){if("success"==e.result){var i=e.response;switch(i.payment_method){case"paddle":i.info.error?alert(i.info.error):$mx.lazy("//cdn.paddle.com/paddle/paddle.js",function(){Paddle.Setup({vendor:parseInt(i.info.vendor_id)}),Paddle.Checkout.open({override:i.info.url,closeCallback:function(){a.isChoosing=null}})});break;case"cloudpayments":$mx.lazy("//widget.cloudpayments.ru/bundles/cloudpayments",function(){var e={en_US:"en-US",pt_BR:"pt",es_ES:"es"},t=null==e[i.info.language]?"en-US":e[i.info.language];new cp.CloudPayments({language:t,googlePaySupport:!0,applePaySupport:!0}).charge({skin:"modern",publicId:i.info.public_id,amount:parseFloat(i.price),currency:i.currency_code,email:i.info.email,onSuccess:i.info.success,onFail:i.info.fail,invoiceId:i.order_id,domain:"taplink.at",description:i.title},function(e){a.isChoosing=null},function(e,t){a.isChoosing=null})});break;case"fastspring":window.fastspringWidgetClose=function(){a.isChoosing=null},window.fastspringWidgetWebhook=function(){a.isWaitingPayment=!0},$mx.lazy("https://d1f8f9xcsvx3ha.cloudfront.net/sbl/0.8.3/fastspring-builder.min.js",null,function(){fastspring.builder.secure(i.info.payload.payload,i.info.payload.securekey),fastspring.builder.checkout()},{id:"fsc-api","data-storefront":i.info.storefront,"data-access-key":i.info.access_key,"data-popup-closed":"fastspringWidgetClose","data-popup-webhook-received":"fastspringWidgetWebhook"});break;default:document.location=i.redirect}}else a.isChoosing=null})},openPromoForm:function(e){this.$form("vue-index-promocode-form",{period:this.currentPeriod,tariff:e},this)},currencyFormat:function(e,t){if(this.isFetching)return 999;var i=this.counter.current[e];return this.$currency(i-("business"==e?this.prepaid:0),t.price?this.currency:Object.assign({},this.currency,{precision:0}),this.currency.format.replace("%p","<span>%p</span>"))},prepaidTitle:function(e){return"business"==e&&this.prepaid?"-"+this.$currency(this.prepaid,this.currency):""},tippy:function(e,t,i){return!!_.isArray(e)&&{placement:"top-start",content:e[1],triggerTarget:this.$refs["id"+t+i][0]}},payButtonTitle:function(e){switch(e){case"pro":return"pro"==this.$account.tariff?this.$gettext("Продлить PRO"):this.$gettext("Оплатить PRO");case"business":return"business"==this.$account.tariff?this.$gettext("Продлить BUSINESS"):this.$gettext("Оплатить BUSINESS")}},priceRound:function(e){var t=this.currency.round;if("floor"==t&&(e=Math.floor(e)),"ceil"==t&&(e=Math.ceil(e)),!isNaN(this.currency.round)){var i=Math.pow(10,this.currency.round);e=Math.round(e*i)/i}return e},newPricePerMonth:function(e){var t=e.price-e.price/100*this.current.discount;return t=this.priceRound(t)}},template:'<div> <div class="row"> <div class="col-lg-8 col-md-8 col-sm-7 col-xs-12 has-mb-4" style="align-items:center;display:flex"> <h4 class="has-text-centered-mobile has-text-success" style="flex: 1" v-if="$account.profile_id && $auth.isAllowTariff(\'pro\') && !isWaitingPayment"><i class="fas fa-star has-text-yellow has-mr-1"></i>{{\'Ваш {1} тариф активен до {2}\'|gettext|format($account.tariff.toUpperCase(), $date($account.tariff_until))}}</h4> <div v-else> <h4 v-if="isWaitingPayment" class="has-text-centered-mobile has-text-warning"><i class="fas fa-spinner fa-pulse has-text-yellow has-mr-1"></i>{{\'Ожидание оплаты\'|gettext}}</h4> <span v-if="$auth.hasFeature(\'trial\') && !isWaitingPayment" style="align-items:center;display:flex"><button @click="trialActivate" class="button is-success index-shadow is-fullwidth-mobile" :class="{\'is-loading\': isTrialActivating}" :disabled="$account.trial_activated">Start a 7-Day Free Trial</button> <span class="has-ml-1 has-text-grey is-hidden-mobile">No credit card required</span></span> </div> </div> <div class="col-lg-4 col-md-4 col-sm-5 col-xs-12 has-mb-4"> <b-field class="has-tabs-style is-marginless"> <b-radio-button v-for="(p, i) in periods" v-model="currentPeriod" type="active" class="is-expanded" :native-value="p.period" :disabled="isFetching"><span>{{p.title|gettext}}</span><div class="hint" v-if="p.discount">-{{p.discount}}%</div></b-radio-button> </b-field> <b-field class="has-tabs-style is-tabs-plans is-hidden-tablet has-mt-2"> <b-radio-button v-for="(p, n) in plans" v-model="currentPlan" type="active" class="is-expanded" :class="\'is-\'+n" :native-value="n" :disabled="isFetching"><span>{{n.toUpperCase()}}</span></b-radio-button> </b-field> </div> </div> <div class="row row-small price-list"> <div class="col-md-4 col-xs-12 col-sm-12 has-mb-2" :class="{\'is-hidden-mobile\': currentPlan != name}" v-for="(p, name) in plans"> <div class="price-column" :data-plan="name"> <div> <div> <div class="price-block has-pt-4 price-level" style="margin: 0;padding-bottom: 0 !important;border:0;line-height: 1"> <h1>{{name.toUpperCase()}}</h1> <span class="priceTotal"><span class="new-price" :class="{skeleton: isFetching}" v-html="currencyFormat(name, p)" :data-prepaid-title="prepaidTitle(name)"></span></span> </div> <div class="price-block has-pb-2 price-level" style="padding-top: 0 !important"> <p></p> <span class="has-text-grey price-total-period" :class="{skeleton: isFetching}">{{p.price?$gettext(current.text):\'∞\'}}</span> </div> <p class="price-block has-text-centered" v-if="p.price"> <span class=\'has-text-centered priceMonthly\'> <span class="old-price" v-if="p.price != newPricePerMonth(p)">{{p.price|currency(currency)}}/{{\'мес\'|gettext}}</span> <span class="new-price">{{newPricePerMonth(p)|currency(currency)}}/{{\'мес\'|gettext}}</span> </span> </p> <p class="price-block has-text-centered" v-else> <span> <div class="skeleton is-centered is-40" v-if="isFetching"></div> <span v-else>{{\'Бесплатно навсегда\'|gettext}}</span> </span> </p> <div v-if="!isFetching" style="padding-top: 1rem"> <div class="price-item" v-for="(s, i) in details[name]" :ref="\'id\'+name+i"> <em v-tippy="tippy(s, name, i)" v-if="isFinished && _.isArray(s)"></em><em v-else></em> <span v-if="_.isArray(s)">{{s[0]}}</span><span v-else>{{s}}</span> </div> </div> <div style="padding-top: 1rem" v-else> <div v-for="(s, i) in details[name]"><span class="skeleton" style="margin: 1rem" :style="{width: (30 + (Math.random() * 50))+\'%\'}"></span></div> </div> </div> <div class="price-block" style="border:0" v-if="$account.profile_id"> <button class="button is-medium is-dark is-fullwidth index-shadow" style="padding-top: .75rem;padding-bottom:.75rem;height:auto" v-if="name == \'basic\'" disabled="on"><span v-if="$account.tariff == name">{{\'Ваш текущий тариф\'|gettext}}</span><span v-else>{{\'Бесплатно\'|gettext}}</span></button> <button class="button is-medium is-fullwidth index-shadow" :class="{\'is-black\': p.is_allow, \'is-dark\': !p.is_allow, \'is-loading\': isChoosing== name}" style="padding-top: .75rem;padding-bottom:.75rem;height:auto" data-track-event=\'payment\' :disabled="!p.is_allow" @click="choose(name)" v-else>{{payButtonTitle(name)}}<i class="fal fa-long-arrow-right index-button-arrow"></i></button> </div> </div> <div v-if="$account.profile_id" class="promocode-footer" :data-plan="name"> <a @click="openPromoForm(name)" class="linkPromo has-text-grey" :class="{\'is-invisible\': name== \'basic\'}">{{\'Активировать промокод\'|gettext}}</a> </div> </div> </div> </div> <b-loading :active.sync="isWaitingPayment"></b-loading> </div>'}),window.$app.defineComponent("index","vue-index-promocode-form",{data:function(){return{isUpdating:!1,response:{},values:{code:""}}},mixins:[FormModel],props:["period","tariff"],methods:{check:function(){var t=this;this.isUpdating=!0,this.$api.get("system/prices/promo",Object.assign({},this.values,{period:this.period,tariff:this.tariff,action:this.response.promo_id?"submit":"check"}),this).then(function(e){switch(e.result){case"success":t.response=e.response;break;case"redirect":document.location=e.response.redirect,t.$parent.close();break;case"choose":t.$parent.$parent.choose(e.response),t.$parent.close();break;case"refresh":t.$auth.refresh(),t.$parent.close()}t.isUpdating=!1})},close:function(){this.response.promo_id?this.response={}:this.$parent.close()}},template:'<form class="modal-card modal-card-little" @submit.prevent="check"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Промокод\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()" type="button"></button> </header> <section class="modal-card-body"> <b-field :label="\'Укажите промокод\'|gettext" :class="{\'has-error\': errors.code}" :message="errors.code"> <input type="text" class="input" v-model.trim="values.code" :disabled="isUpdating" maxlength="16" :disabled="response.promo_id" v-focus> </b-field> <div v-if="response.promo_title" class="message" :class="{\'is-success\': response.is_allow, \'is-danger\': !response.is_allow}" style="margin: 0"><div class="message-body" v-html="response.promo_title"></div></div> </section> <footer class="modal-card-foot"> <button class="button is-dark" type="button" @click="close"><span v-if="response.promo_id">{{\'Отмена\'|gettext}}</span><span v-else>{{\'Закрыть\'|gettext}}</span></button> <button class="button is-primary" type="submit" :class="{\'is-loading\': isUpdating}"><span v-if="response.promo_id">{{\'Активировать\'|gettext}}</span><span v-else>{{\'Проверить\'|gettext}}</span></button> </footer> </div>'}),window.$app.defineModule("index",[{path:"/",component:"vue-index-index",name:"index",children:[{path:"/auth/",redirect:"auth/signin/",name:"auth",children:[{path:"signin/",component:"vue-auth-signin",name:"signin",props:{tab:"signin"}},{path:"signup/",component:"vue-auth-signin",name:"signup",props:{tab:"signup"}},{path:"email/",component:"vue-auth-email",name:"email"},{path:"restore/",component:"vue-auth-restore",name:"restore"},{path:"attach/",component:"vue-auth-attach",name:"attach"},{path:"change/:username/",component:"vue-auth-change",name:"change",props:!0}]},{path:"/:page_id/",props:!0,component:"vue-index-main",name:"main",feature:"taplink",children:[{path:"account/",redirect:"account/settings/",name:"account",meta:{title:"Аккаунт"},children:[{path:"profiles/",component:"vue-account-profiles-list",props:!0,name:"profiles",meta:{title:"Мои профили"}},{path:"access/",props:!0,redirect:"access/main/",name:"access",meta:{title:"Совместный доступ"},children:[{path:"main/",component:"vue-account-access-list",props:{part:"main"},name:"access-main"},{path:"shared/",component:"vue-account-access-list",props:{part:"shared"},name:"access-shared"}]},{path:"settings/",component:"vue-account-settings-form",props:!0,name:"account-settings",meta:{title:"Настройки аккаунта"}}]},{path:"pages/",component:"vue-pages-page",props:!0,name:"pages",meta:{title:"Страница",icon_svg:'<path d="M76 160h40a12 12 0 0 0 12-12v-40a12 12 0 0 0-12-12H76a12 12 0 0 0-12 12v40a12 12 0 0 0 12 12zM0 224v208a48 48 0 0 0 48 48h416a48 48 0 0 0 48-48V224z" class="fa-secondary"/><path d="M464 32H48A48 48 0 0 0 0 80v144h512V80a48 48 0 0 0-48-48zM128 148a12 12 0 0 1-12 12H76a12 12 0 0 1-12-12v-40a12 12 0 0 1 12-12h40a12 12 0 0 1 12 12zm320 0a12 12 0 0 1-12 12H188a12 12 0 0 1-12-12v-40a12 12 0 0 1 12-12h248a12 12 0 0 1 12 12z"/>',tariff:"basic",feature:"taplink"}},{path:"statistics/",component:"vue-statistics-list",props:!0,name:"statistics",meta:{title:"Статистика",icon_svg:'<path d="M512 400v32a16 16 0 0 1-16 16H32a32 32 0 0 1-32-32V80a16 16 0 0 1 16-16h32a16 16 0 0 1 16 16v304h432a16 16 0 0 1 16 16z" class="fa-secondary"/><path d="M275.2 96h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8zm-96 128h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8zm288-160h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8zm-96 96h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8z"/>',icon_viewbox:"0 0 562 512",tariff:"basic",access:64,feature:"taplink"}},{path:"billing/",component:"vue-billing-index",props:!0,name:"billing"},{path:"inbox/",component:"vue-inbox-index",props:!0,name:"typebot-inbox",meta:{title:"Диалоги",icon_svg:'<g class="fa-group"><path class="fa-secondary" d="M448 0H64A64.06 64.06 0 0 0 0 64v288a64.06 64.06 0 0 0 64 64h96v84a12 12 0 0 0 19.1 9.7L304 416h144a64.06 64.06 0 0 0 64-64V64a64.06 64.06 0 0 0-64-64zM128 240a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128 0a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128 0a32 32 0 1 1 32-32 32 32 0 0 1-32 32z"></path><path class="fa-primary"  d="M384 176a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm-128 0a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm-128 0a32 32 0 1 0 32 32 32 32 0 0 0-32-32z"></path></g>',icon_viewbox:"0 0 512 512",feature:"typebot",submenu:!1}},{path:"chatbots/",component:"vue-chatbots-index",props:!0,name:"chatbots",meta:{title:"Автоматизация",icon_svg:'<path class="fa-secondary" d="M149.333 56v80c0 13.255-10.745 24-24 24H24c-13.255 0-24-10.745-24-24V56c0-13.255 10.745-24 24-24h101.333c13.255 0 24 10.745 24 24zm181.334 240v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.256 0 24.001-10.745 24.001-24zm32-240v80c0 13.255 10.745 24 24 24H488c13.255 0 24-10.745 24-24V56c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24zm-32 80V56c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.256 0 24.001-10.745 24.001-24zm-205.334 56H24c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24zM0 376v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H24c-13.255 0-24 10.745-24 24zm386.667-56H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24zm0 160H488c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H386.667c-13.255 0-24 10.745-24 24v80c0 13.255 10.745 24 24 24zM181.333 376v80c0 13.255 10.745 24 24 24h101.333c13.255 0 24-10.745 24-24v-80c0-13.255-10.745-24-24-24H205.333c-13.255 0-24 10.745-24 24z"></path>',icon_viewbox:"0 0 512 512",feature:"typebot",submenu:!1}},{path:"subscribers/",component:"vue-subscribers-index",props:!0,name:"typebot-subscribers",meta:{title:"Аудитория",icon_svg:'<path d="M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z"></path>',icon_viewbox:"0 0 640 512",feature:"typebot1",submenu:!1}},{path:"sales/",redirect:"sales/leads/",props:!0,name:"sales",meta:{title:"Заявки",icon_svg:'<path d="M0 432a48 48 0 0 0 48 48h480a48 48 0 0 0 48-48V256H0zm192-68a12 12 0 0 1 12-12h136a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H204a12 12 0 0 1-12-12zm-128 0a12 12 0 0 1 12-12h72a12 12 0 0 1 12 12v40a12 12 0 0 1-12 12H76a12 12 0 0 1-12-12zM528 32H48A48 48 0 0 0 0 80v48h576V80a48 48 0 0 0-48-48z" class="fa-secondary"/><path d="M576 256H0V128h576z"/>',icon_viewbox:"0 0 576 512",tariff:"business",feature:"crm",access:4}},{path:"products/",redirect:"products/active/",props:!0,name:"products",meta:{title:"Товары",icon_svg:'<path d="M551.64 286.8a102.1 102.1 0 0 0 16.4-3.6V480a32 32 0 0 1-32 32H88a32 32 0 0 1-32-32V283.2a125.76 125.76 0 0 0 16.4 3.6 134.93 134.93 0 0 0 18 1.2 132.48 132.48 0 0 0 29.5-3.8V384h384v-99.8a126.88 126.88 0 0 0 29.5 3.8 139.07 139.07 0 0 0 18.24-1.2z" class="fa-secondary"/><path d="M605.94 118.6c33.6 53.6 3.8 128-59 136.4a102.81 102.81 0 0 1-13.7.9 99.07 99.07 0 0 1-73.8-33.1 98.82 98.82 0 0 1-147.6 0 98.82 98.82 0 0 1-147.6 0 98.74 98.74 0 0 1-73.8 33.1 103.92 103.92 0 0 1-13.7-.9c-62.6-8.5-92.3-82.9-58.8-136.4L82.84 15a32 32 0 0 1 27.1-15h404A32 32 0 0 1 541 15z"/>',icon_viewbox:"0 0 618 512",tariff:"business",feature:"taplink,products",access:16}},{path:"design/",redirect:"design/1/",props:!0,name:"design1",meta:{title:"Дизайн",icon_svg:'<path class="fa-secondary" d="M204.29 5c-99.4 19.4-179.5 99.29-199.1 198.4-37 187 131.7 326.39 258.8 306.69 41.2-6.4 61.4-54.59 42.5-91.69-23.1-45.4 9.9-98.4 60.9-98.4h79.7c35.8 0 64.8-29.6 64.9-65.31C511.49 97.13 368.09-26.87 204.29 5zM96 320a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm32-128a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128-64a32 32 0 1 1 32-32 32 32 0 0 1-32 32zm128 64a32 32 0 1 1 32-32 32 32 0 0 1-32 32z" opacity="0.4"></path><path class="fa-primary" d="M96 256a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm32-128a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm128-64a32 32 0 1 0 32 32 32 32 0 0 0-32-32zm128 64a32 32 0 1 0 32 32 32 32 0 0 0-32-32z"></path>',icon_viewbox:"0 0 512 512",feature:"design",submenu:!1},children:[{path:":group_id/",component:"vue-design-index",props:!0,name:"design",meta:{title:"Дизайн",icon_viewbox:"0 0 512 512",feature:"design",submenu:!1}}]},{path:"addons/",redirect:"addons/all/",props:!0,name:"addons",meta:{title:"Модули",icon_svg:'<path d="M12.41 236.31L70.51 210l161.63 73.27a57.64 57.64 0 0 0 47.72 0L441.5 210l58.09 26.33c16.55 7.5 16.55 32.5 0 40L266.64 381.9a25.68 25.68 0 0 1-21.29 0L12.41 276.31c-16.55-7.5-16.55-32.5 0-40z" class="fa-secondary"/><path d="M12.41 148l232.94 105.7a25.61 25.61 0 0 0 21.29 0L499.58 148c16.55-7.51 16.55-32.52 0-40L266.65 2.32a25.61 25.61 0 0 0-21.29 0L12.41 108c-16.55 7.5-16.55 32.52 0 40zm487.18 216.11l-57.87-26.23-161.86 73.37a57.64 57.64 0 0 1-47.72 0L70.29 337.88l-57.88 26.23c-16.55 7.5-16.55 32.5 0 40L245.35 509.7a25.68 25.68 0 0 0 21.29 0l233-105.59c16.5-7.5 16.5-32.5-.05-40z"/>',icon_viewbox:"0 0 582 512",feature:"addons",submenu:!1,access:128}},{path:"settings/",redirect:"settings/design/",props:!0,name:"settings",meta:{title:"Настройки",icon_svg:'<path d="M487.75 315.6l-42.6-24.6a192.62 192.62 0 0 0 0-70.2l42.6-24.6a12.11 12.11 0 0 0 5.5-14 249.2 249.2 0 0 0-54.7-94.6 12 12 0 0 0-14.8-2.3l-42.6 24.6a188.83 188.83 0 0 0-60.8-35.1V25.7A12 12 0 0 0 311 14a251.43 251.43 0 0 0-109.2 0 12 12 0 0 0-9.4 11.7v49.2a194.59 194.59 0 0 0-60.8 35.1L89.05 85.4a11.88 11.88 0 0 0-14.8 2.3 247.66 247.66 0 0 0-54.7 94.6 12 12 0 0 0 5.5 14l42.6 24.6a192.62 192.62 0 0 0 0 70.2l-42.6 24.6a12.08 12.08 0 0 0-5.5 14 249 249 0 0 0 54.7 94.6 12 12 0 0 0 14.8 2.3l42.6-24.6a188.54 188.54 0 0 0 60.8 35.1v49.2a12 12 0 0 0 9.4 11.7 251.43 251.43 0 0 0 109.2 0 12 12 0 0 0 9.4-11.7v-49.2a194.7 194.7 0 0 0 60.8-35.1l42.6 24.6a11.89 11.89 0 0 0 14.8-2.3 247.52 247.52 0 0 0 54.7-94.6 12.36 12.36 0 0 0-5.6-14.1zm-231.4 36.2a95.9 95.9 0 1 1 95.9-95.9 95.89 95.89 0 0 1-95.9 95.9z" class="fa-secondary"/><path d="M256.35 319.8a63.9 63.9 0 1 1 63.9-63.9 63.9 63.9 0 0 1-63.9 63.9z"/>',tariff:"basic",access:128}},{path:"partner/",redirect:"partner/statistics/",component:"vue-partner-index",props:!0,name:"partner",meta:{title:"Партнерская программа",submenu:!1}},{path:"manager/",redirect:"manager/profiles/",props:!0,name:"manager"}]}]}]);
