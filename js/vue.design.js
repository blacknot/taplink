window.$app.defineComponent("design","vue-design-index",{data:function(){return{isUpdating:!1,isSetting:!1,isFetching:!1,isDeleting:!1,isAllowPro:!1,groups:{0:this.$gettext("Мои темы"),1:this.$gettext("Стандартные темы")},designs:[],themes:{},select_theme_id:null,current_theme_id:null,current_theme:null,current_design_id:null,select_design_id:null,current_style:null,select_theme:null}},props:["group_id","page_id"],created:function(){this.isAllowPro=this.$auth.isAllowTariff("pro"),this.fetchData(!0)},computed:{menu:function(){return _.map(this.groups,function(e,t){return{name:"design",meta:{title:e},params:{group_id:t}}})}},mixins:[FormModel],beforeRouteLeave:function(e,t,s){this.current_theme_id==this.$account.theme_id&&(this.$account.theme=this.current_theme,this.$account.styles=this.current_style,this.$events.fire("theme:refresh")),s()},watch:{select_theme:{handler:function(){this.$account.theme=this.select_theme.options,this.$auth.refreshStyles()},deep:!0},group_id:function(){this.fetchData()}},methods:{fetchData:function(e){var s=this;null==this.designs[this.group_id]&&(this.isFetching=e,this.$api.get(this.designs.length?["design/designs"]:["design/groups","design/designs"],{group_id:this.group_id}).then(function(e){s.isFetching=!1;var t=e.response;null!=t.groups&&(s.groups=t.groups),s.select_theme=null,s.select_theme_id=s.$account.theme_id,s.current_theme_id=s.$account.theme_id,s.current_theme=s.$account.theme,s.current_style=s.$account.styles,_.each(t.designs,function(e){null==e.options.bg.opacity?e.options.bg.opacity="0.95":e.options.bg.opacity=e.options.bg.opacity.toString(),e.styles=s.buildStyles(e),e.theme_id==s.current_theme_id&&(s.selectTheme(e),s.group_id=i)}),s.designs[t.group_id]=t.designs,s.$nextTick(function(){null!=s.$refs.tabs&&s.$refs.tabs.resize()})}))},buildStyles:function(e){var t=this.$clone(e.options);t.link.transparent&&(t.link.border=t.link.bg,t.link.bg=null);switch(t.bg.size){case"width":"background-size: 100% auto";break;case"cover":"background-size: cover"}return{html_thumb:buildStylesBackground(t,"html","thumb"),body_thumb:buildStylesBackground(t,"body","thumb")+";color: "+t.screen.color+(e.thumb?";background:url("+e.thumb+")":""),link:"background: "+(t.link.bg?t.link.bg:"transparent")+";border-color:"+(t.link.border?t.link.border:t.link.bg)+";color: "+t.link.color+(t.link.radius?";border-radius:"+t.link.radius:""),link_class:"left"==t.link.align?"btn-link-align-left":""}},setGroup:function(e){var t=this;this.group_id=e,this.$nextTick(function(){t.$refs.scroll.scrollTo(0,0),0==e&&t.$refs.tabs.scrollTo(0,0)})},selectDesign:function(s){var i=this;this.fetchThemes(s.design_id).then(function(e){var t="";_.each(e,function(e){t+=buildStyles(e.options,"design",".theme"+e.theme_id)}),StylesFactory.updateCSSBlock(t,i.$refs.styles),i.select_design_id=s.design_id})},fetchThemes:function(i){var n=this;return new Promise(function(s,e){null==n.themes[i]?n.$api.get("design/themes",{design_id:i}).then(function(e){var t=e.response;n.themes[i]=t.themes,s(t.themes)}):s(n.themes[i])})},selectTheme:function(t){var s=this;this.select_theme=0==t.group_id?t:this.$clone(t),this.select_theme_id=t.theme_id;var i=this.select_theme;i.extended_id&&null==i.options.css?this.$api.post("settings/design/get",{theme_id:t.theme_id},this).then(function(e){i.options=t.options=e.response.theme,s.$account.theme=i.options,s.$auth.refreshStyles()}):(this.$account.theme=i.options,this.$auth.refreshStyles())},setTheme:function(e){var t=this;e&&this.selectTheme(e),e.is_pro&&!this.isAllowPro||(this.isSetting=!0,this.$api.post("settings/design/set",{theme_id:this.select_theme_id},this).then(function(e){"success"==e.result&&(t.$account.theme_id=t.current_theme_id=t.select_theme_id,t.$account.theme=e.response.theme,t.$auth.refreshStyles(),t.current_theme=t.$account.theme,t.current_style=t.$account.styles),t.isSetting=!1}).catch(function(e){t.isSetting=!1}))},newTheme:function(){var e=this;this.isAllowPro?this.$confirm(this.$gettext("Вы хотите создать новую тему?"),"is-warning",{yes:"Да",no:"Нет"}).then(function(){e.select_theme=e.themes[1][0],e.editThemeInternal()}):this.$alert(this.$gettext("Своя тема доступна в pro-тарифе").replace("<br>"," "),"is-danger")},editTheme:function(){this.isAllowPro&&this.$confirm(this.$gettext("Вы хотите создать новую тему на основе этой?"),"is-warning",{yes:"Да",no:"Нет"}).then(this.editThemeInternal)},editThemeInternal:function(){var s=this;this.isUpdating=!0,0!=this.select_theme.group_id&&this.$api.post("settings/design/create",{options:this.select_theme.options,extended_id:this.select_theme.extended_id},this).then(function(e){if("success"==e.result){var t=e.response.theme_id;null==s.themes[0]&&s.$set(s.themes,0,[]),s.select_theme.group_id=0,s.select_theme.theme_id=s.select_theme_id=t,s.setGroup(0),s.themes[0].unshift(s.select_theme),s.setTheme(s.select_theme)}s.isUpdating=!1}).catch(function(e){s.isUpdating=!1})},deleteTheme:function(e,s){var i=this;this.$confirm(this.$gettext("Вы уверены что хотите удалить эту тему?"),"is-danger").then(function(){i.isDeleting=!0,i.$api.post("settings/design/delete",{theme_id:e},i).then(function(e){if("success"==e.result){var t=i.themes[i.group_id];t.splice(s,1),i.select_theme.group_id==i.group_id&&(s=Math.min(s,t.length-1),i.selectTheme(-1==s?i.themes[1][0]:t[s]))}i.isDeleting=!1})})},updateTheme:function(){var t=this;this.isUpdating=!0,this.$api.post("settings/design/update",{theme_id:this.select_theme_id,options:this.select_theme.options},this).then(function(e){"success"==e.result&&(t.select_theme.styles=t.buildStyles(t.select_theme),t.select_theme_id==t.current_theme_id&&(t.$auth.refreshStyles(),t.current_theme=t.$account.theme,t.current_style=t.$account.styles)),t.isUpdating=!1}).catch(function(e){t.isUpdating=!1})},selectMove:function(e){var t=this,s=this.themes[this.group_id];if(s&&s.length){var i=_.findIndex(s,function(e){return t.select_theme.theme_id==e.theme_id});i=Math.max(Math.min(i+e,s.length-1),0),this.select_theme=s[i],this.select_theme_id=this.select_theme.theme_id}},selectNext:function(){this.selectMove(1)},selectPrev:function(){this.selectMove(-1)}},template:'<div> <vue-component-submenu :menu="menu" :page_id="page_id"></vue-component-submenu> <div ref=\'styles\'></div> <div class="theme-panel"> <div style="padding:0 1rem"> <vue-component-vbar class="theme-panel-scroller" ref=\'scroll\' shadow="horizontal" shadow-color="var(--design-shadow-color)" shadow-color-transparent="var(--design-shadow-color-transparent)"> <div class="theme-list" tabindex="0" @keydown.left.prevent.stop="selectPrev" @keydown.right.prevent.stop="selectNext"> <div class="theme-item" v-if="group_id == 0"> <div class="theme-block" @click="newTheme"> <span class="tag is-pro" v-tippy :content="\'Своя тема доступна в pro-тарифе\'|gettext" v-if="!isAllowPro">pro</span> <div style="border: 1px dashed #aaa;box-shadow: none;"><div> <div class="theme-block-btn" style="border:1px dashed #aaa;border-radius: 40px">{{\'Новая тема\'|gettext}}</div> </div> </div> </div> </div> <div class="theme-item" v-for="(t, index) in designs[group_id]"> <div class="theme-block" :class="{in: t.design_id == select_design_id, current: t.design_id == current_design_id}" @click="selectDesign(t)"> <span class="tag is-pro" v-tippy :content="\'Эта тема доступна в pro-тарифе\'|gettext" v-if="t.is_pro && !isAllowPro">pro</span> <div :style="t.styles.html_thumb"><div :style="t.styles.body_thumb"> {{\'Текст\'|gettext}} <div class="theme-block-btn" :class="t.styles.link_class" :style="t.styles.link">{{\'Ссылка\'|gettext}}</div> </div> </div> </div> <button type="button" class="button is-danger is-small" v-if="group_id == 0" :disabled="(current_theme_id == t.theme_id) || isDeleting" @click="deleteTheme(t.theme_id, index)"><i class="fa fa-trash-alt"></i></button> </div> </div> </vue-component-vbar> </div> </div> <div class="container" style="white-space: nowrap;overflow-x: scroll"> <div class="device is-large is-hide-mobile is-preview-mobile has-mb-4 has-mt-4 has-mr-4" :class="[{\'has-shadow\': i== 0, \'has-transparent\': i != 0}, \'theme\'+t.theme_id]" v-for="(t, i) in themes[select_design_id]"> <div class="screen page"> <div class="theme-main"> <div v-html="$account.theme.html"></div> <div class="blocks-list has-pt-2 has-pb-2"> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-avatar container"> <div class="has-text-centered"><img :src="$account.avatar.url" class="profile-avatar profile-avatar-65"></div> <div class="has-text-centered text-avatar" v-if="$account.nickname">@{{$account.nickname}}</div> <div class="has-text-centered text-avatar" v-else>@nickname</div> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-text container"> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 1</a> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 2</a> </div> </div> <div class="blocks-item has-pb-1 has-pt-1"> <div class="block-link block-item container"> <a class="button btn-link btn-link-styled">{{\'Ссылка\'|gettext}} 3</a> </div> </div> </div> </div> </div> </div> </div> </div>'}),window.$app.defineModule("design",[]);
