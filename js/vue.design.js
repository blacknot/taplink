window.$app.defineComponent("design","vue-design-editor-modal",{props:["theme","group_id","design_id"],methods:{themeChanged:function(e){this.$parent.$parent.themeChanged(e)},cancel:function(){this.$parent.$parent.editThemeCancel(),this.$parent.close()},save:function(){this.$parent.$parent.editThemeSave(),this.$parent.close()}},template:'<div class="modal-card design-modal-form"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Редактирование темы\'|gettext}}</p> <button class="modal-close is-large" @click="cancel"></button> </header> <section class="modal-card-body is-paddingless"> <vue-design-editor :theme="theme" :group_id="group_id" :design_id="design_id" @update:theme="themeChanged"></vue-design-editor> </section> <footer class="modal-card-foot"> <button class="button is-dark" type="button" @click="cancel">{{\'Отмена\'|gettext}}</button> <button class="button is-primary" @click="save">{{\'Сохранить\'|gettext}}</button> </footer> </div>'}),window.$app.defineComponent("design","vue-design-editor",{data:function(){return{part:1}},props:["theme","group_id","design_id"],watch:{theme:{handler:function(){this.$emit("update:theme",this.theme)},deep:!0}},methods:{sectionAdd:function(){null==this.theme.options.sections&&this.$set(this.theme.options,"sections",{_:0}),this.theme.options.sections._++,this.theme.options.sections[this.theme.options.sections._]={text:{font:this.theme.options.screen.font,color:this.theme.options.screen.color},bg:{position:"0% 0%",repeat:"repeat",opacity:0,size:"tile",cover:!1,fixed:0,type:"solid",color1:this.theme.options.bg.color1,color2:this.theme.options.bg.color2,picture:null,brightness:this.theme.options.bg.brightness}},this.part="s"+this.theme.options.sections._}},template:'<div :class="{disabled: design_id != 0 || !$auth.isAllowTariff(\'pro\')}"> <div class="design-panel" :class="{in: part== 1}"> <p @click="part = 1">{{\'Общие\'|gettext}}</p> <div> <div class="has-mb-2"> <vue-component-colorpicker v-model="theme.options.screen.color" :label="\'Цвет текста\'|gettext" :disabled="design_id != 0"></vue-component-colorpicker> </div> <div class="has-mb-2"> <vue-component-colorpicker v-model="theme.options.avatar.color" :label="\'Цвет названия профиля\'|gettext" :disabled="design_id != 0"></vue-component-colorpicker> </div> <div class="link-styles-container"> <label class="form-control-static">{{\'Шрифт\'|gettext}}</label> <vue-component-font-chooser v-model="theme.options.screen.font" view="name"></vue-component-font-chooser> </div> </div> </div> <div class="design-panel" :class="{in: part== 2}"> <p @click="part = 2">{{\'Ссылки\'|gettext}}</p> <div> <div class="has-mb-2"> <vue-component-colorpicker v-model="theme.options.link.color" :label="\'Цвет текста ссылки\'|gettext" v-on:input="theme.options.link.color = $event" :disabled="design_id != 0"></vue-component-colorpicker> </div> <div class="has-mb-2"> <vue-component-colorpicker v-model="theme.options.link.bg" :label="\'Цвет фона ссылки\'|gettext" :disabled="design_id != 0"></vue-component-colorpicker> </div> <div class="has-mb-2 link-styles-container"> <label class="form-control-static">{{\'Прозрачность ссылки\'|gettext}}</label> <div class="select"> <select v-model="theme.options.link.transparent" :disabled="design_id != 0"> <option :value="v" v-for="v in [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]">{{v}}%</option> </select> </div> </div> <transition name="fade"> <div class="has-mb-2 link-styles-container" v-if="theme.options.link.transparent"> <label class="form-control-static">{{\'Толщина границы\'|gettext}}</label> <input type="number" v-model="theme.options.link.border.width" max="10" min="0" class="input" style="width: 100px"> </div> </transition> <div class="has-mb-2 link-styles-container"> <label class="form-control-static">{{\'Эффект при наведении\'|gettext}}</label> <div class="select"> <select v-model="theme.options.link.hover" :disabled="design_id != 0"> <option value="0">{{\'Нет\'|gettext}}</option> <option value="1">{{\'Прозрачность\'|gettext}}</option> <option value="2">{{\'Увеличение\'|gettext}}</option> </select> </div> </div> <div class="has-mb-2 link-styles-container"> <label class="form-control-static">{{\'Закругленная ссылка\'|gettext}}</label> <ul class="link-styles is-radius-style"> <li class="link-styles-center" :class="{in: theme.options.link.radius == \'40px\'}" @click="theme.options.link.radius = \'40px\'" style="border-radius:40px"><dd></dd></li> <li class="link-styles-center" :class="{in: theme.options.link.radius == \'12px\'}" @click="theme.options.link.radius = \'12px\'" style="border-radius:8px"><dd></dd></li> <li class="link-styles-center" :class="{in: theme.options.link.radius == \'\'}" @click="theme.options.link.radius = \'\'"><dd></dd></li> </ul> </div> <div class="link-styles-container"> <label class="form-control-static">{{\'Стиль ссылки\'|gettext}}</label> <ul class="link-styles"> <li class="link-styles-center" :class="{in: theme.options.link.align == \'center\'}" @click="theme.options.link.align = \'center\'"><dd></dd></li> <li class="link-styles-left fa" :class="{in: theme.options.link.align == \'left\'}" @click="theme.options.link.align = \'left\'"><dd></dd></li> </ul> </div> </div> </div> <div class="design-panel" :class="{in: part== 3}"> <p @click="part = 3">{{\'Фон\'|gettext}}</p> <div> <div v-if="!theme.extended_id"> <vue-component-background-editor v-model="theme.options.bg"></vue-component-background-editor> <mx-toggle v-model="theme.options.bg.fixed" :space-between="true" :title="\'Фиксировать при прокрутке\'|gettext"></mx-toggle> </div> </div> </div> <div class="design-panel" :class="{in: part== \'s\' + i}" v-for="(s, i) in theme.options.sections" v-if="i != \'_\'"> <p @click="part = \'s\' + i">{{\'Секция\'|gettext}}</p> <div> <div class="has-mb-2"> <vue-component-colorpicker v-model="s.text.color" :label="\'Цвет текста\'|gettext" :disabled="design_id != 0"></vue-component-colorpicker> </div> <div class="link-styles-container has-mb-2"> <label class="form-control-static">{{\'Шрифт\'|gettext}}</label> <vue-component-font-chooser v-model="s.text.font" view="name"></vue-component-font-chooser> </div> <vue-component-background-editor v-model="s.bg"></vue-component-background-editor> </div> </div> <div style="position: relative" class="has-mt-2"> <a @click="sectionAdd">Добавить секцию</a> </div> </div>'}),window.$app.defineComponent("design","vue-design-index",{data:function(){return{isUpdating:!1,isSetting:!1,isFetching:!1,isDeleting:!1,isAllowPro:!1,groups:{1:this.$gettext("Стандартные")},designs:[],designsTitles:[],themes:{},design_id:null,theme_id:null,current_theme_id:null,current_design_id:null,current_group_id:null,fetchingGroups:[],isFetchingThemes:!1,deltaMouseWheel:0,timerMouseWheel:0,isEditMode:!1,tmpTheme:null,stopTransition:!1,deviceFix:"",devicePageFix:"",buttonsPanelFix:"",deviceParentFix:"",themeIndex:0,stage:0,stageEnded:!1,select_theme:null,widthDevice:395,touchClientX:0,touchClientY:0}},props:["group_id","page_id"],created:function(){this.isAllowPro=this.$auth.isAllowTariff("pro"),this.select_theme=this.$account.theme,this.current_theme_id=this.$account.theme_id,this.fetchData(!0),$mx(window).on("resize orientationchange scroll",this.scrollCheck)},destroyed:function(){$mx(window).off("resize orientationchange scroll",this.scrollCheck)},computed:{menu:function(){return _.map(this.groups,function(e,t){return{name:"design",meta:{title:e},params:{group_id:t}}})},designTitle:function(){return this.isEditMode?"":0==this.design_id?this.$gettext("Мои дизайны"):null!=this.designsTitles[this.design_id]?this.$gettext(this.designsTitles[this.design_id]):this.$gettext("Выберите цветовую схему")}},mixins:[FormModel],watch:{group_id:function(){this.fetchData(),this.isEditMode&&this.editThemeCancel()},theme_id:function(e){this.setThemeId(e)}},methods:{isMobile:function(){return!!window.matchMedia("(max-width: 767px)").matches},keyboardMove:function(e){var t;this.isEditMode||(t=this.themes[this.design_id],37==e.keyCode&&0<this.themeIndex&&(this.theme_id=t[this.themeIndex-1].theme_id),39==e.keyCode&&this.themeIndex<t.length-1&&(this.theme_id=t[this.themeIndex+1].theme_id))},scrollCheckForce:function(){this.$nextTick(this.scrollCheck)},scrollCheck:function(){var e=window.scrollY,t=window.innerHeight||document.documentElement.clientHeight,i=this.$refs.buttonsPanel.clientHeight,s=e>this.$refs.device.offsetTop-30,n=30<document.documentElement.scrollHeight-840-e-60;this.deviceFix=s&&this.stageEnded?n?"position:fixed;top:60px;left:auto;":"margin-bottom: 2rem;":"",this.devicePageFix=s&&this.stageEnded?n?"position:fixed;top:60px;left:auto":"left:auto;bottom: 2.5rem;":"",this.deviceParentFix=!s||!this.stageEnded||n?"":"bottom: 0",this.buttonsPanelFix=null!=this.$refs.buttonsPanel&&e+t<this.$refs.device.offsetTop+780+this.$refs.buttonsPanel.clientHeight+30?"position:fixed;bottom:60px;top:auto;left:0":"";var o=$mx(this.$refs.device).offset().top;this.buttonsPanelFix=t+e-i+60<o+780?"position:fixed;bottom:60px;top:auto;left:0":"position:absolute;bottom:auto;top:"+(720-i)+"px;left:0",this.widthDevice=this.isMobile()?220:395},setThemeId:function(e){for(var t=0,i=0;i<this.themes[this.design_id].length;i++){var s=this.themes[this.design_id][i];if(s.theme_id==e){t=i,this.select_theme=s;break}}this.themeIndex=t},themeChanged:function(e){this.prepareThemes([e])},editTheme:function(){var e=this;this.isAllowPro?this.design_id?this.$confirm(this.$gettext("Вы хотите создать новую тему на основе этой?"),"is-warning",{yes:"Да",no:"Нет"}).then(this.editThemeInternal):(this.tmpTheme=this.$clone(this.themes[this.design_id][this.themeIndex]),this.isMobile()?this.$form("vue-design-editor-modal",{theme:this.tmpTheme,group_id:this.group_id,design_id:this.design_id},this):(this.stageEnded=!1,this.isEditMode=!0,this.stage=1,setTimeout(function(){e.stage=2,setTimeout(function(){e.stageEnded=!0,e.scrollCheckForce()},400)},200))):this.$alert(this.$gettext("Своя тема доступна в pro-тарифе"))},editThemeInternal:function(){var i=this;this.isUpdating=!0,this.$api.post("design/create",{theme_id:this.theme_id},this).then(function(e){var t;"success"==e.result&&(t=e.response,i.group_id=1,i.design_id=0,i.prepareThemes(t.themes),i.themes[0]=t.themes,i.setThemeId(i.theme_id=t.theme_id),i.$nextTick(function(){i.editTheme()})),i.isUpdating=!1}).catch(function(e){i.isUpdating=!1})},editThemeCancel:function(){var e=this;this.stopTransition=!0,this.prepareThemes(this.themes[this.design_id]),this.tmpTheme=null,this.stage=0,this.isEditMode=!1,setTimeout(function(){e.stopTransition=!1},200)},editThemeSave:function(){var t=this,i=this.themes[this.design_id][this.themeIndex]=this.select_theme=this.tmpTheme;this.isUpdating=!0,this.$api.post("settings/design/update",{theme_id:this.theme_id,options:this.select_theme.options},this).then(function(e){"success"==e.result&&t.theme_id==t.current_theme_id&&(t.$account.theme=i.options,t.$auth.refreshStyles()),t.isUpdating=!1,t.editThemeCancel()}).catch(function(e){t.isUpdating=!1})},newTheme:function(){var e=this;this.isAllowPro?this.$confirm(this.$gettext("Вы хотите создать новую тему?"),"is-warning",{yes:"Да",no:"Нет"}).then(function(){e.editThemeInternal()}):this.$alert(this.$gettext("Своя тема доступна в pro-тарифе").replace("<br>"," "),"is-danger")},themesTouchstart:function(e){this.touchClientX=e.changedTouches[0].clientX,this.touchClientY=e.changedTouches[0].clientY,$mx("html").addClass("is-dragging"),this.stopTransition=!0},themesTouchstop:function(){$mx("html").removeClass("is-dragging"),this.stopTransition=!1,this.deltaMouseWheel<-20&&0<this.themeIndex?this.themeIndex--:20<this.deltaMouseWheel&&this.themeIndex<this.themes[this.design_id].length-1&&this.themeIndex++,this.deltaMouseWheel=0},themesMouseWheel:function(e){var t=this,i=void 0,s=void 0;null!=e.changedTouches?(i=this.touchClientX-e.changedTouches[0].clientX,s=this.touchClientY-e.changedTouches[0].clientY,this.themesTouchstart(e)):(i=e.deltaX,s=e.deltaY);var n,o=this.isMobile()?2:1;!this.isEditMode&&Math.abs(i)>Math.abs(s)&&(e.preventDefault(),this.deltaMouseWheel+=i,this.deltaMouseWheel<0&&0==this.themeIndex&&(this.deltaMouseWheel=0),0<this.deltaMouseWheel&&null!=this.themes[this.design_id]&&this.themeIndex==this.themes[this.design_id].length-1&&(this.deltaMouseWheel=0),n=395/o,this.deltaMouseWheel>n?(this.themeIndex++,this.deltaMouseWheel-=n):this.deltaMouseWheel<-n&&(this.themeIndex--,this.deltaMouseWheel+=n),this.theme_id=this.themes[this.design_id][this.themeIndex].theme_id,this.timerMouseWheel&&clearTimeout(this.timerMouseWheel),this.timerMouseWheel=setTimeout(function(){var e=200/o;t.deltaMouseWheel>e?t.themeIndex++:t.deltaMouseWheel<-e&&t.themeIndex--,t.theme_id=t.themes[t.design_id][t.themeIndex].theme_id,t.deltaMouseWheel=0},250))},fetchData:function(){var i,s=this;null==this.designs[this.group_id]?(i=this.group_id,this.designs.length?(this.fetchingGroups[i]=[1,2,3],this.$api.get("design/designs",{group_id:i}).then(function(e){s.isFetching=!1;var t=e.response;s.fetchingGroups[i]=[],s.$set(s.designs,i,s.prepareDesigns(t.designs)),s.selectDesign(s.designs[i][0].design_id),s.scrollCheckForce()})):this.$api.get("design/current",{group_id:i}).then(function(e){s.isFetching=!1;var t=e.response;t.group_id!=s.group_id&&s.$router.replace({name:"design",params:{group_id:t.group_id}}),s.groups=t.groups,s.designs[t.group_id]=s.prepareDesigns(t.designs),s.group_id=t.group_id,s.themes[t.design_id]=t.themes,s.current_design_id=s.design_id=t.design_id,s.current_group_id=t.group_id,s.theme_id=t.theme_id,s.prepareThemes(t.themes),s.scrollCheckForce(),s.$nextTick(function(){s.moveDesignMenu(0)})})):this.current_group_id==this.group_id?this.selectDesign(this.current_design_id):this.selectDesign(this.designs[this.group_id][0].design_id)},prepareDesigns:function(e){var t=this;return _.each(e,function(e){null==e.options.bg.opacity?e.options.bg.opacity="0.95":e.options.bg.opacity=e.options.bg.opacity.toString(),e.styles=t.buildStyles(e),t.designsTitles[e.design_id]=e.title}),e},prepareThemes:function(e){var t="";_.each(e,function(e){e.theme_id&&(t+=buildStyles(e.options,"design",".theme"+e.theme_id))}),StylesFactory.updateCSSBlock(t,this.$refs.styles)},fetchThemes:function(s){var n=this;return new Promise(function(i,e){null==n.themes[s]?(n.isFetchingThemes=!0,n.themeIndex=0,n.$api.get("design/themes",{design_id:s}).then(function(e){var t=e.response;n.themes[s]=t.themes,n.isFetchingThemes=!1,i(t.themes)})):i(n.themes[s])})},buildStyles:function(e){var t=this.$clone(e.options);t.link.transparent&&(t.link.border=t.link.bg,t.link.bg=null);switch(t.bg.size){case"width":0;break;case"cover":0}return{html_thumb:buildStylesBackground(t,"html","thumb"),body_thumb:buildStylesBackground(t,"body","thumb")+";color: "+t.screen.color+(e.thumb?";background:url("+e.thumb+")":""),link:"background: "+(t.link.bg?t.link.bg:"transparent")+";border-color:"+(t.link.border?t.link.border:t.link.bg)+";color: "+t.link.color+(t.link.radius?";border-radius:"+t.link.radius:""),link_class:"left"==t.link.align?"btn-link-align-left":""}},setGroup:function(e){var t=this;this.group_id=e,this.$nextTick(function(){t.$refs.scroll.scrollTo(0,0),0==e&&t.$refs.tabs.scrollTo(0,0)})},selectDesign:function(t){var i=this;this.stopTransition=!0,this.$nextTick(function(){i.isEditMode&&i.editThemeCancel(),i.design_id=t,i.moveDesignMenu(),i.fetchThemes(t).then(function(e){i.prepareThemes(e),i.theme_id=e.length?i.current_design_id==t?i.current_theme_id:e[0].theme_id:null,setTimeout(function(){i.stopTransition=!1},200)})})},moveDesignMenu:function(e){var t=0<arguments.length&&void 0!==e?e:300;if(null!=this.$refs.designList){var s=0,n=this.designs[this.group_id];if(n.length){for(i=0;i<n.length;i++)if(n[i].design_id==this.design_id){s=i+(1==this.group_id?1:0);break}var o=this.$refs.designList.children[s];$mx.scrollIt(o.offsetLeft-(this.$refs.designList.parentNode.offsetWidth-o.offsetWidth)/2,"x",this.$refs.designList.parentNode,t)}}},setTheme:function(e){var t,i,s,n=this;e.is_pro&&!this.isAllowPro||(this.isSetting=!0,t=this.theme_id,i=this.design_id,s=this.group_id,this.$api.post("settings/design/set",{theme_id:t},this).then(function(e){"success"==e.result&&(n.$account.theme_id=n.current_theme_id=t,n.$account.theme=e.response.theme,n.current_design_id=i,n.current_group_id=s,n.$auth.refreshStyles(),n.current_theme=n.$account.theme,n.current_style=n.$account.styles),n.isSetting=!1}).catch(function(e){n.isSetting=!1}))},deleteTheme:function(){var i=this;this.$confirm(this.$gettext("Вы уверены что хотите удалить эту тему?"),"is-danger").then(function(){i.isDeleting=!0,i.$api.post("design/delete",{theme_id:i.theme_id},i).then(function(e){var t;"success"==e.result&&(i.stopTransition=!0,(t=i.themes[i.design_id]).splice(i.themeIndex,1),i.themeIndex=Math.min(i.themeIndex,t.length-1),i.theme_id=t[i.themeIndex].theme_id,setTimeout(function(){i.stopTransition=!1},200)),i.isDeleting=!1})})}},template:'<div tabindex="0" @keydown="keyboardMove" :style="{background: isEditMode?\'#F2F4F6\':\'#fff\'}"> <vue-component-submenu :menu="menu" :page_id="page_id"></vue-component-submenu> <div ref=\'styles\'></div> <div class="design-list-panel" :class="{editmode: isEditMode}"> <vue-component-vbar v-model="designs[group_id]" class="design-panel-scroller" ref=\'scroll\' shadow="horizontal" :vBarShow="false" :hBarShow="false" :vBarEnabled="false" :hBarEnabled="true" shadow-color="var(--design-shadow-color)" shadow-color-transparent="var(--design-shadow-color-transparent)"> <div class="design-list" ref="designList"> <div class="design-item" v-if="group_id == 1 && (fetchingGroups[group_id] == undefined || !fetchingGroups[group_id].length)"> <div class="design-block" :class="{in: !design_id, current: !current_design_id}" @click="selectDesign(0)"> <span class="tag is-pro" v-tippy :content="\'Своя тема доступна в pro-тарифе\'|gettext" v-if="!isAllowPro">pro</span> <div style="border: 1px dashed #aaa;box-shadow: none;"><div> <div class="design-block-btn" style="border:1px dashed #aaa;border-radius: 40px">{{\'Мои дизайны\'|gettext}}</div> </div> </div> <svg width="16" height="6" xmlns="http://www.w3.org/2000/svg" v-if="0 == design_id"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg> </div> </div> <div class="design-item" v-for="i in fetchingGroups[group_id]"> <div class="design-block"> <div style="border: 1px solid #d9d9d9;box-shadow: none;"><div> <div><div> <span class="skeleton" style="margin:0 auto;width: 60%">Text</span> <div class="design-block-btn skeleton">Link</div> </div> </div> </div></div> </div> </div> <div class="design-item" v-for="(t, index) in designs[group_id]"> <div class="design-block" :class="{in: t.design_id == design_id, current: t.design_id == current_design_id}" @click="selectDesign(t.design_id)"> <span class="tag is-pro" v-tippy :content="\'Эта тема доступна в pro-тарифе\'|gettext" v-if="t.is_pro && !isAllowPro">pro</span> <div :style="t.styles.html_thumb"><div :style="t.styles.body_thumb"> {{\'Текст\'|gettext}} <div class="design-block-btn" :class="t.styles.link_class" :style="t.styles.link">{{\'Ссылка\'|gettext}}</div> </div> </div> <svg width="16" height="6" xmlns="http://www.w3.org/2000/svg" v-if="t.design_id == design_id"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg> </div> </div> <div class="design-item" style="pointer-events: none; visibility: hidden"></div> </div> </vue-component-vbar> </div> <h4 class="has-mt-5 has-xs-mt-3 has-text-centered" style="text-transform: uppercase">{{designTitle}}</h4> <div class="has-pt-5 has-xs-pt-3 has-pb-5 themes-container" :class="{container: isEditMode}" :style="\'position:relative;\'+(isEditMode?\'\':\'overflow:hidden\')" @mousewheel="themesMouseWheel" @touchstart="themesTouchstart" @touchend="themesTouchstop" @touchmove="themesMouseWheel" ref="device"> <div style="left:0;right: 0;margin: 0 1rem" :class="{\'has-text-centered\': !isEditMode}" :style="(isFetchingThemes?\'\':\'position:absolute;\')+(isEditMode?deviceParentFix:\'\')"> <div class="device device-theme-back is-large has-shadow" :class="[{editmode: isEditMode, ended: stageEnded}, \'stage\'+stage]" :style="(isEditMode?deviceFix:\'\')"> <div class="screen page" style="background: transparent !important"></div> <b-loading :is-full-page="false" :active.sync="isFetchingThemes"></b-loading> </div> </div> <div class="themes-list" :class="[{editmode: isEditMode, stoptransition: stopTransition}, \'stage\'+stage]" :style="isEditMode?devicePageFix:\'\'" ref="themesList"> <div :style="{display: \'flex\', transform: \'translate(-\'+((themeIndex*widthDevice)+deltaMouseWheel)+\'px, 0)\'}"> <div class="device is-large has-transparent" :class="[{in: themeIndex== i, current: current_theme_id== t.theme_id, editmode: isEditMode}, \'theme\'+t.theme_id, \'is-\'+t.options.bg.brightness]" v-for="(t, i) in themes[design_id]"> <div class="screen page" @click="theme_id = t.theme_id"> <div class="theme-main" v-if="t.theme_id"> <div v-html="t.options.html"></div> <div class="blocks-list has-pt-2 has-pb-2" v-if="t.theme_id"> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-avatar container"> <div class="has-text-centered"><img :src="$account.avatar.url" class="profile-avatar profile-avatar-65"></div> <div class="has-text-centered text-avatar" v-if="$account.nickname">@{{$account.nickname}}</div> <div class="has-text-centered text-avatar" v-else>@nickname</div> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-text container"> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 1</a> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 2</a> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 3</a> </div> </div> </div> </div> <div class="theme-main" v-else> <a @click="newTheme" class="plus" :class="{\'is-loading\': isSetting}" v-if="theme_id == t.theme_id"></a> <h3 class="has-mt-3" :class="{\'has-text-grey\': theme_id != t.theme_id}">{{\'Новый дизайн\'|gettext}}</h3> </div> </div> </div> </div> </div> <div class="theme-buttons-panel" :class="{editmode: isEditMode, hide: theme_id== 0 || (isEditMode && stage != 2)}" v-if="!isFetchingThemes" :style="buttonsPanelFix" ref="buttonsPanel"> <div :class="{container: isEditMode && stage== 2}"> <div v-if="isEditMode"> <button class="button is-black" @click="editThemeCancel">{{\'Отменить\'|gettext}}</button> <button class="button is-primary" :class="{\'is-loading\': isUpdating}" @click="editThemeSave">{{\'Сохранить\'|gettext}}</button> </div> <div v-else> <button class="button is-danger" style="flex:0" v-if="design_id == 0" :disabled="(current_theme_id == theme_id) || (theme_id == 0) || isDeleting" @click="deleteTheme"><i class="fa fa-trash-alt"></i></button> <button class="button is-black" @click="editTheme" :disabled="theme_id == 0">{{\'Редактировать\'|gettext}}</button> <button class="button is-primary" :disabled="(theme_id == current_theme_id) || (theme_id == 0) || !select_theme || (select_theme.is_pro == 1 && !isAllowPro)" @click="setTheme(select_theme)" :class="{\'is-loading\': isSetting}">{{\'Выбрать\'|gettext}}</button> </div> </div> </div> <div v-if="stage == 2" style="flex:1;padding-left:460px"> <h2 class="has-mb-5 has-pt-2">{{\'Редактирование темы\'|gettext}}</h2> <vue-design-editor :theme="tmpTheme" :group_id="group_id" :design_id="design_id" @update:theme="themeChanged"></vue-design-editor> </div> </div> </div>'}),window.$app.defineModule("design",[]);
