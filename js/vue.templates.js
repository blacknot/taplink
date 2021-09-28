window.$app.defineComponent("templates","vue-templates-categories-form",{data:function(){return{isFetching:!1,language_code:i18n.locale,variants:{language_code:{}}}},created:function(){this.fetchData()},methods:{fetchData:function(){var i=this;this.isFetching=!0,this.$api.get("templates/info").then(function(e){var t=e.response.templates;i.variants=t.variants,i.isFetching=!1})},addCategory:function(e){var t=this;this.$modal("vue-templates-categories-item-form",{base:"ru"!=this.language_code?this.variants.category_id["en"==this.language_code?"ru":"en"][e.category_id].items:null,parent_id:e.category_id,language_id:this.variants.language_code[this.language_code].language_id,onUpdate:function(){t.fetchData()}})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">Категории</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Язык\'|gettext" v-if="!isFetching"> <b-select v-model="language_code"> <option v-for="(f, k) in variants.language_code" :value="k">{{f.title}}</option> </b-select> </b-field> <div class="template-categories-for-list panel panel-default" v-if="!isFetching"> <div v-for="g in variants.category_id[language_code]"> <div class="item"><div>{{g.title}}<button class="button is-light" @click="addCategory(g)"><i class="fa fa-plus"></i></button></div></div> <div class="list" v-if="_.size(g.items)"> <div v-for="c in g.items" class="item"> <div>{{c.category}}</div> </div> </div> </div> </div> </section> <footer class="modal-card-foot"> <button class="button is-dark level-item" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-categories-item-form",{data:function(){return{isFetching:!1,isUpdaing:!1,values:{category_id:null,parent_id:null,category:"",ref_id:null}}},props:["base","category_id","language_id","parent_id","onUpdate"],methods:{updateData:function(){var t=this;this.$api.post("templates/categories/set",_.merge(this.values,{category_id:this.category_id,parent_id:this.parent_id,language_id:this.language_id})).then(function(e){"success"==e.result&&(t.$parent.close(),t.onUpdate())})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">Категория</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название\'|gettext"> <input type="text" v-model="values.category" class="input" v-focus :disabled="isUpdaing"> </b-field> <b-field :label="\'Базовый\'|gettext" v-if="base != null"> <b-select v-model="values.ref_id" :placeholder="\'Не выбрано\'|gettext" :disabled="isUpdaing"> <option :value="null">-- {{\'Не выбрано\'|gettext}} --</option> <option v-for="f in base" :value="f.category_id">{{f.category}}</option> </b-select> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-primary" type="button" @click="updateData">{{\'Сохранить\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-form",{data:function(){return{isFetching:!1,isUpdating:!1,language_code:i18n.locale,values:{snapshot_id:null,title:"",category_id:null}}},props:["page_id","template_id"],mixins:[FormModel],created:function(){this.fetchData()},methods:{fetchData:function(){var i=this;this.isFetching=!0,this.$api.get(["templates/get","templates/info"],{page_id:this.page_id,template_id:this.template_id}).then(function(e){var t;"success"==e.result&&(t=e.response.templates,i.variants=t.variants,null!=t.values?(i.values=t.values,_.each(t.variants.category_id,function(e){_.each(e,function(e){_.each(e.items,function(e){e.category_id==t.values.category_id&&(i.language_code=e.language_code)})})})):i.language_code=Object.keys(t.variants.category_id)[0]),i.isFetching=!1})},makeScreenshot:function(o){var n=this;$mx.lazy("https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js",function(){var e=$mx(".screen.page")[0];html2canvas(e,{useCORS:!0,allowTaint:!0}).then(function(e){var t=e.toDataURL("image/png"),i=260*e.height/e.width,a=document.createElement("canvas");a.width=260,a.height=i;var s=a.getContext("2d"),l=new Image;l.crossOrigin="anonymous",l.onload=function(){s.drawImage(l,0,0,260,i),a.toBlob(function(e){var t=new FormData;t.append("file",e),t.append("template_id",o),n.$http.request({url:"/pictures/upload?target=template",method:"post",data:t}).then(function(e){"success"==e.result||"error"==e.result&&n.$alert(e.error,"is-danger"),n.isUpdating=!1,n.$parent.close()}).catch(function(){n.isUpdating=!1,n.$alert(n.$gettext("Во время загрузки картинки возникла ошибка"))})},"image/jpeg",.7)},l.src=t})})},updateData:function(){var t=this;this.isUpdating=!0,this.$api.post("templates/set",Object.assign({page_id:this.page_id,template_id:this.template_id},this.values)).then(function(e){"success"==e.result?t.makeScreenshot(e.response.template_id):t.isUpdating=!1})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title" v-if="values.snapshot_id">{{\'Обновление шаблона\'|gettext}}</p> <p class="modal-card-title" v-else>{{\'Добавление шаблона\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название\'|gettext"> <input type="text" v-model="values.title" class="input" v-focus> </b-field> <b-field :label="\'Язык\'|gettext" v-if="!isFetching"> <b-select v-model="language_code"> <option v-for="(f, k) in variants.language_code" :value="k">{{k}}: {{f.title}}</option> </b-select> </b-field> <b-field :label="\'Категория\'|gettext" v-if="!isFetching"> <b-select v-model="values.category_id" :placeholder="\'Не выбрано\'|gettext"> <option :value="null">-- {{\'Не выбрано\'|gettext}} --</option> <optgroup v-for="g in variants.category_id[language_code]" :label="g.title"> <option v-for="f in g.items" :value="f.category_id">{{f.category}}</option> </optgroup> </b-select> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-primary level-item" type="button" @click="updateData" :class="{\'is-loading\': isUpdating}">{{\'Сохранить\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-index",{data:function(){return{isFetching:!1,profiles:[],variants:null,bottom:!1,filter:{language_code:i18n.locale,category_id:null,parent_id:2},loadingProfiles:[],isFlowFetching:!1,cache:{}}},mixins:[ListModel],props:{withScratch:Boolean},mounted:function(){$mx(window).on("scroll",this.scroll)},beforeDestroy:function(){$mx(window).off("scroll",this.scroll)},created:function(){this.$form.top&&(this.$form.top.title=this.$gettext("Шаблоны")),this.$io.on("events:templates.list:refresh",this.refresh),this.fetchData(!0)},destroyed:function(){this.$io.off("events:templates.list:refresh",this.refresh)},watch:{filter:{handler:function(){this.profiles=[],this.next=null,this.refresh()},deep:!0},bottom:function(e){e&&!this.isFlowFetching&&this.next&&this.fetchData(!1,!0)}},computed:{menu:function(){var t=[{meta:{title:this.$gettext("Все")},name:null}];return _.each(this.variants.category_id[i18n.locale],function(e){_.each(e.items,function(e){t.push({meta:{title:e.category,is_category:!0},name:e.category_id})})}),t},cacheKey:function(){return(this.filter.category_id?this.filter.category_id:0)+":"+(this.next?this.next:0)}},methods:{scroll:function(){this.bottom=this.bottomVisible()},bottomVisible:function(){var e=window.scrollY,t=document.documentElement.clientHeight;return document.documentElement.scrollHeight<t+e+200},currentMenuCheck:function(e){return this.filter.category_id==e.name},fetchData:function(e,t){function i(e){a.profiles=t?a.profiles.concat(e.fields):e.fields,a.loadingProfiles=[],setTimeout(function(){a.bottom=a.bottomVisible()},100)}var a=this;this.checkCache(i)||(this.isFetching=t?this.isFlowFetching=e:e,this.loadingProfiles=new Array(6),this.$api.get(this.variants?"templates/list":["templates/list","templates/info"],{filter:this.filter,next:this.next,count:this.filter.category_id||this.next?9:8}).then(function(e){var t=e.response;null!=t.variants&&(a.variants=t.variants),a.cachePage(t,i),a.isFetching=a.isFlowFetching=!1}))},openTemplate:function(e){this.$device.mobile?this.$modal("vue-templates-template",{template_id:e.template_id}):this.$form.open("vue-templates-template",{template_id:e.template_id})},mouse_in:function(e){var t=(e=$mx(this.$refs["t"+e.template_id])).height(),i=e.find("img").height();e.find("img").css({transform:"translate3d(0,-"+(i-t)+"px,0)",transition:"transform "+3/t*i+"s ease 0s"})},mouse_out:function(e){(e=$mx(this.$refs["t"+e.template_id]).find("img")).css({transform:null})}},template:'<div> <vue-component-submenu :menu="menu" :active_function="currentMenuCheck" class="is-hidden-tablet" :is-manual-menu="true" v-if="variants" :current.sync="filter.category_id"/> <div class="container has-pt-5 has-pb-5 has-pt-2-mobile has-pb-2-mobile"> <div class="row"> <div class="col-sm-3 is-hidden-mobile"> <div class="sidebar-menu" v-if="variants"> <a @click="filter.category_id = null" :class="{active: filter.category_id == null}">{{\'Все\'|gettext}}</a> <div v-for="g in variants.category_id[i18n.locale]"> <hr v-if="_.size(g.items)"> <a @click="filter.category_id = f.category_id" v-for="f in g.items" :class="{active: filter.category_id == f.category_id}">{{f.category}}</a> </div> <hr> <a @click="$modal(\'vue-templates-categories-form\')">{{\'Настроить\'|gettext}}</a> </div> </div> <div class="col-sm-9 col-xs-12"> <div class="templates-index templates-grid"> <div class="row"> <div class="col-sm-4 col-xs-6" v-if="filter.category_id == null"> <div class="device is-large" @click="openTemplate(null)"> <div class="is-scratch"><div><i class="fal fa-file has-mb-2 has-text-grey-light"></i><h4 class="has-mb-2"><b>Пустой шаблон</b></h4>Вариант для тех, любит создавать с нуля</div></div> </div> </div> <div v-for="p in profiles" class="col-sm-4 col-xs-6"> <div class="device is-large" :class="\'theme\'+p.theme_id" @click="openTemplate(p)" @mouseenter="mouse_in(p)" @mouseleave="mouse_out(p)"> <div :ref="\'t\'+p.template_id"> <img :src="\'//\'+$account.storage_domain+\'/t/\'+p.picture_filename"> </div> </div> </div> <div v-for="p in loadingProfiles" class="col-sm-4 col-xs-6"> <div class="device is-large skeleton"><div></div></div> </div> </div> </div> </div> </div> </div> </div>'}),window.$app.defineComponent("templates","vue-templates-template",{data:function(){return{isFetching:!1,isUpdating:!1,language_code:i18n.locale,template:{}}},props:["template_id"],mounted:function(){var a=this;this.isFetching=!0,this.$api.get("templates/template",{template_id:this.template_id}).then(function(e){var t,i;"success"==e.result&&(a.template=e.response.templates.template,t=".templates-template .theme"+a.template.theme_id,a.template.theme=StylesFactory.checkStyles(a.template.theme),_.each(a.template.data.blocks,function(e){e.tariff="basic"}),i=buildStyles(a.template.theme,"design",t,!1),a.template.data=a.$page.prepareData(a.template.data,i,a.template.theme,t,"view"),StylesFactory.updateCSSBlock(i,a.$refs.styles_view)),a.isFetching=!1}),this.$form.top&&(this.$form.top.title=this.template.title||this.$gettext("Выбор шаблона"))},methods:{edit:function(){this.$modal("vue-templates-form",{template_id:this.template.template_id})},close:function(){this.$form.top?this.$form.close():this.$parent.close()}},template:'<div class="templates-template container has-pt-3 has-pb-3"> <div ref=\'styles_view\'></div> <div> <div :class="[\'theme\'+template.theme_id, {\'device is-large\': !$device.mobile}]"> <section class="screen page"> <vue-pages-page-blocks :page_id="template.page_id" :page-data="template.data" :readonly="true" :show-hidden="false" :account="template.raw" :theme="template.theme" v-if="!isFetching"/> </section> </div> </div> <div class="float-panel is-light-mobile is-page-edit"> <div class="container"> <div style="margin: 0px auto;"> <button class="button is-black is-large" @click="close">{{\'Отмена\'|gettext}}</button> <button class="button is-primary is-large">{{\'Выбрать\'|gettext}}</button> </div> </div> </div> </div>'}),window.$app.defineModule("templates",[]);
