window.$app.defineComponent("design","vue-design-index",{data:function(){return{isUpdating:!1,isSetting:!1,isFetching:!1,isDeleting:!1,isAllowPro:!1,groups:{1:this.$gettext("Стандартные")},designs:[],designsTitles:[],themes:{},design_id:null,theme_id:null,current_theme_id:null,current_design_id:null,fetchingGroups:[],isFetchingThemes:!1,deltaMouseWheel:0,timerMouseWheel:0,isEditMode:!1,themeIndex:0,select_theme:null}},props:["group_id","page_id"],created:function(){this.isAllowPro=this.$auth.isAllowTariff("pro"),this.select_theme=this.$account.theme,this.current_theme_id=this.$account.theme_id,this.fetchData(!0)},computed:{menu:function(){return _.map(this.groups,function(e,t){return{name:"design",meta:{title:e},params:{group_id:t}}})},designTitle:function(){return 0==this.design_id?this.$gettext("Мои дизайны"):null!=this.designsTitles[this.design_id]?this.$gettext(this.designsTitles[this.design_id]):this.$gettext("Выберите цветовую схему")}},mixins:[FormModel],watch:{group_id:function(){this.fetchData()},theme_id:function(e){for(var t=0,i=0;i<this.themes[this.design_id].length;i++){var s=this.themes[this.design_id][i];if(s.theme_id==e){t=i,this.select_theme=s;break}}this.themeIndex=t}},methods:{themesMouseWheel:function(e){var t=this;Math.abs(e.deltaX)>Math.abs(e.deltaY)&&(e.preventDefault(),this.deltaMouseWheel+=e.deltaX,this.deltaMouseWheel<0&&0==this.themeIndex&&(this.deltaMouseWheel=0),0<this.deltaMouseWheel&&this.themeIndex==this.themes[this.design_id].length-1&&(this.deltaMouseWheel=0),395<this.deltaMouseWheel?(this.themeIndex++,this.deltaMouseWheel-=395):this.deltaMouseWheel<-395&&(this.themeIndex--,this.deltaMouseWheel+=395),this.theme_id=this.themes[this.design_id][this.themeIndex].theme_id,this.timerMouseWheel&&clearTimeout(this.timerMouseWheel),this.timerMouseWheel=setTimeout(function(){200<t.deltaMouseWheel?t.themeIndex++:t.deltaMouseWheel<-200&&t.themeIndex--,t.theme_id=t.themes[t.design_id][t.themeIndex].theme_id,t.deltaMouseWheel=0},250))},fetchData:function(){var i=this;if(null==this.designs[this.group_id]){var s=this.group_id;this.designs.length?(this.fetchingGroups[s]=[1,2,3],this.$api.get("design/designs",{group_id:s}).then(function(e){i.isFetching=!1;var t=e.response;i.fetchingGroups[s]=[],i.$set(i.designs,s,i.prepareDesigns(t.designs))})):this.$api.get("design/current",{group_id:s}).then(function(e){i.isFetching=!1;var t=e.response;i.groups=t.groups,i.designs[t.group_id]=i.prepareDesigns(t.designs),i.group_id=t.group_id,i.themes[t.design_id]=t.themes,i.current_design_id=i.design_id=t.design_id,i.theme_id=t.theme_id,i.prepareThemes(t.themes)})}},prepareDesigns:function(e){var t=this;return _.each(e,function(e){null==e.options.bg.opacity?e.options.bg.opacity="0.95":e.options.bg.opacity=e.options.bg.opacity.toString(),e.styles=t.buildStyles(e),t.designsTitles[e.design_id]=e.title}),e},prepareThemes:function(e){var t="";_.each(e,function(e){t+=buildStyles(e.options,"design",".theme"+e.theme_id)}),StylesFactory.updateCSSBlock(t,this.$refs.styles)},fetchThemes:function(s){var n=this;return new Promise(function(i,e){null==n.themes[s]?(n.isFetchingThemes=!0,n.themeIndex=0,n.$api.get("design/themes",{design_id:s}).then(function(e){var t=e.response;n.themes[s]=t.themes,n.isFetchingThemes=!1,i(t.themes)})):i(n.themes[s])})},buildStyles:function(e){var t=this.$clone(e.options);t.link.transparent&&(t.link.border=t.link.bg,t.link.bg=null);switch(t.bg.size){case"width":"background-size: 100% auto";break;case"cover":"background-size: cover"}return{html_thumb:buildStylesBackground(t,"html","thumb"),body_thumb:buildStylesBackground(t,"body","thumb")+";color: "+t.screen.color+(e.thumb?";background:url("+e.thumb+")":""),link:"background: "+(t.link.bg?t.link.bg:"transparent")+";border-color:"+(t.link.border?t.link.border:t.link.bg)+";color: "+t.link.color+(t.link.radius?";border-radius:"+t.link.radius:""),link_class:"left"==t.link.align?"btn-link-align-left":""}},setGroup:function(e){var t=this;this.group_id=e,this.$nextTick(function(){t.$refs.scroll.scrollTo(0,0),0==e&&t.$refs.tabs.scrollTo(0,0)})},selectDesign:function(t){var i=this;this.design_id=t,this.fetchThemes(t).then(function(e){i.prepareThemes(e),i.theme_id=e.length?i.current_design_id==t?i.current_theme_id:e[0].theme_id:null})},setTheme:function(e){var t=this;if(!e.is_pro||this.isAllowPro){this.isSetting=!0;var i=this.theme_id,s=this.design_id;this.$api.post("settings/design/set",{theme_id:i},this).then(function(e){"success"==e.result&&(t.$account.theme_id=t.current_theme_id=i,t.$account.theme=e.response.theme,t.current_design_id=s,t.current_theme=t.$account.theme,t.current_style=t.$account.styles),t.isSetting=!1}).catch(function(e){t.isSetting=!1})}},newTheme:function(){var e=this;this.isAllowPro?this.$confirm(this.$gettext("Вы хотите создать новую тему?"),"is-warning",{yes:"Да",no:"Нет"}).then(function(){e.editThemeInternal()}):this.$alert(this.$gettext("Своя тема доступна в pro-тарифе").replace("<br>"," "),"is-danger")},editTheme:function(){this.isAllowPro&&this.$confirm(this.$gettext("Вы хотите создать новую тему на основе этой?"),"is-warning",{yes:"Да",no:"Нет"}).then(this.editThemeInternal)},editThemeInternal:function(){var i=this;this.isUpdating=!0,0!=this.select_theme.group_id&&this.$api.post("settings/design/create",{options:this.select_theme.options,extended_id:this.select_theme.extended_id},this).then(function(e){if("success"==e.result){var t=e.response.theme_id;null==i.themes[0]&&i.$set(i.themes,0,[]),i.select_theme.group_id=0,i.select_theme.theme_id=i.theme_id=t,i.setGroup(0),i.themes[0].unshift(i.select_theme),i.setTheme(i.select_theme)}i.isUpdating=!1}).catch(function(e){i.isUpdating=!1})},deleteTheme:function(e,i){var s=this;this.$confirm(this.$gettext("Вы уверены что хотите удалить эту тему?"),"is-danger").then(function(){s.isDeleting=!0,s.$api.post("settings/design/delete",{theme_id:e},s).then(function(e){if("success"==e.result){var t=s.themes[s.group_id];t.splice(i,1),s.select_theme.group_id==s.group_id&&(i=Math.min(i,t.length-1))}s.isDeleting=!1})})},updateTheme:function(){var t=this;this.isUpdating=!0,this.$api.post("settings/design/update",{theme_id:this.theme_id,options:this.select_theme.options},this).then(function(e){"success"==e.result&&(t.select_theme.styles=t.buildStyles(t.select_theme),t.theme_id==t.current_theme_id&&(t.$auth.refreshStyles(),t.current_theme=t.$account.theme,t.current_style=t.$account.styles)),t.isUpdating=!1}).catch(function(e){t.isUpdating=!1})}},template:'<div style="background: #fff"> <vue-component-submenu :menu="menu" :page_id="page_id"></vue-component-submenu> <div ref=\'styles\'></div> <div class="design-list"> <div class="design-item" v-if="group_id == 1 && (fetchingGroups[group_id] == undefined || !fetchingGroups[group_id].length)"> <div class="design-block" :class="{in: !design_id, current: !current_design_id}" @click="selectDesign(0)"> <span class="tag is-pro" v-tippy :content="\'Своя тема доступна в pro-тарифе\'|gettext" v-if="!isAllowPro">pro</span> <div style="border: 1px dashed #aaa;box-shadow: none;"><div> <div class="design-block-btn" style="border:1px dashed #aaa;border-radius: 40px">{{\'Мои дизайны\'|gettext}}</div> </div> </div> </div> </div> <div class="design-item" v-for="i in fetchingGroups[group_id]"> <div class="design-block"> <div style="border: 1px solid #d9d9d9;box-shadow: none;"><div> <div><div> <span class="skeleton" style="margin:0 auto;width: 60%">Text</span> <div class="design-block-btn skeleton">Link</div> </div> </div> </div></div> </div> </div> <div class="design-item" v-for="(t, index) in designs[group_id]"> <div class="design-block" :class="{in: t.design_id == design_id, current: t.design_id == current_design_id}" @click="selectDesign(t.design_id)"> <span class="tag is-pro" v-tippy :content="\'Эта тема доступна в pro-тарифе\'|gettext" v-if="t.is_pro && !isAllowPro">pro</span> <div :style="t.styles.html_thumb"><div :style="t.styles.body_thumb"> {{\'Текст\'|gettext}} <div class="design-block-btn" :class="t.styles.link_class" :style="t.styles.link">{{\'Ссылка\'|gettext}}</div> </div> </div> <svg width="16" height="6" xmlns="http://www.w3.org/2000/svg"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg> </div> <button type="button" class="button is-danger is-small" v-if="group_id == 0" :disabled="(current_theme_id == t.theme_id) || isDeleting" @click="deleteTheme(t.theme_id, index)"><i class="fa fa-trash-alt"></i></button> </div> </div> <h4 class="has-mt-5 has-text-centered" style="text-transform: uppercase">{{designTitle}}</h4> <div class="has-mt-5 has-mb-4" :class="{container: isEditMode, \'is-flex\': isEditMode}" style="position: relative" @mousewheel="themesMouseWheel"> <div style="top:0;width: 100%" :class="{\'has-text-centered\': !isEditMode}" :style="isFetchingThemes?\'\':\'position:absolute\'"> <div class="device is-large has-shadow"> <div class="screen page" style="background: transparent !important"></div> <b-loading :is-full-page="false" :active.sync="isFetchingThemes"></b-loading> </div> </div> <div class="themes-list" :class="{editmode: isEditMode}"> <div :style="{transform: \'translate(-\'+((themeIndex*395)+deltaMouseWheel)+\'px, 0)\'}"> <div class="device is-large has-transparent" :class="[{in: themeIndex== i, current: current_theme_id== t.theme_id}, \'theme\'+t.theme_id, \'is-\'+t.options.bg.brightness]" v-for="(t, i) in themes[design_id]"> <div class="screen page" @click="theme_id = t.theme_id"> <div class="theme-main"> <div v-html="t.options.html"></div> <div class="blocks-list has-pt-2 has-pb-2"> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-avatar container"> <div class="has-text-centered"><img :src="$account.avatar.url" class="profile-avatar profile-avatar-65"></div> <div class="has-text-centered text-avatar" v-if="$account.nickname">@{{$account.nickname}}</div> <div class="has-text-centered text-avatar" v-else>@nickname</div> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-text container"> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 1</a> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 2</a> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 3</a> </div> </div> </div> </div> </div> </div> </div> </div> <div v-if="isEditMode"> <button class="button" @click="isEditMode = false">Отмена</button> </div> <div class="theme-buttons-panel" v-if="!isFetchingThemes && !isEditMode"> <div> <button class="button is-white is-large" :disabled="(theme_id == current_theme_id) || !select_theme || (select_theme.is_pro == 1 && !isAllowPro)" @click="setTheme(select_theme)" :class="{\'is-loading\': isSetting}">{{\'Выбрать эту тему\'|gettext}}</button> <button class="button is-white is-large is-outlined" @click="isEditMode = !isEditMode">{{\'Редактировать\'|gettext}}</button> </div> </div> </div> </div>'}),window.$app.defineModule("design",[]);
