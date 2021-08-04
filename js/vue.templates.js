window.$app.defineComponent("templates","vue-templates-categories-form",{data:function(){return{isFetching:!1,language_code:i18n.locale,variants:{language_code:{}}}},created:function(){this.fetchData()},methods:{fetchData:function(){var a=this;this.isFetching=!0,this.$api.get("templates/info").then(function(e){var t=e.response.templates;a.variants=t.variants,a.isFetching=!1})},addCategory:function(e){var t=this;this.$modal("vue-templates-categories-item-form",{base:"ru"!=this.language_code?this.variants.category_id["en"==this.language_code?"ru":"en"][e.category_id].items:null,parent_id:e.category_id,language_id:this.variants.language_code[this.language_code].language_id,onUpdate:function(){t.fetchData()}})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">Категории</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Язык\'|gettext" v-if="!isFetching"> <b-select v-model="language_code"> <option v-for="(f, k) in variants.language_code" :value="k">{{f.title}}</option> </b-select> </b-field> <div class="template-categories-for-list panel panel-default" v-if="!isFetching"> <div v-for="g in variants.category_id[language_code]"> <div class="item"><div>{{g.title}}<button class="button is-light" @click="addCategory(g)"><i class="fa fa-plus"></i></button></div></div> <div class="list" v-if="_.size(g.items)"> <div v-for="c in g.items" class="item"> <div>{{c.category}}</div> </div> </div> </div> </div> </section> <footer class="modal-card-foot"> <button class="button is-dark level-item" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-categories-item-form",{data:function(){return{isFetching:!1,isUpdaing:!1,values:{category_id:null,parent_id:null,category:"",ref_id:null}}},props:["base","category_id","language_id","parent_id","onUpdate"],methods:{updateData:function(){var t=this;this.$api.post("templates/categories/set",_.merge(this.values,{category_id:this.category_id,parent_id:this.parent_id,language_id:this.language_id})).then(function(e){"success"==e.result&&(t.$parent.close(),t.onUpdate())})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">Категория</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название\'|gettext"> <input type="text" v-model="values.category" class="input" v-focus :disabled="isUpdaing"> </b-field> <b-field :label="\'Базовый\'|gettext" v-if="base != null"> <b-select v-model="values.ref_id" :placeholder="\'Не выбрано\'|gettext" :disabled="isUpdaing"> <option :value="null">-- {{\'Не выбрано\'|gettext}} --</option> <option v-for="f in base" :value="f.category_id">{{f.category}}</option> </b-select> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-primary" type="button" @click="updateData">{{\'Сохранить\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-form",{data:function(){return{isFetching:!1,isUpdating:!1,language_code:i18n.locale,values:{snapshot_id:null,title:"",category_id:null}}},props:["page_id","template_id"],mixins:[FormModel],created:function(){this.fetchData()},methods:{fetchData:function(){var a=this;this.isFetching=!0,this.$api.get(["templates/get","templates/info"],{page_id:this.page_id,template_id:this.template_id}).then(function(e){var t;"success"==e.result&&(t=e.response.templates,a.variants=t.variants,null!=t.values?(a.values=t.values,_.each(t.variants.category_id,function(e){_.each(e,function(e){_.each(e.items,function(e){e.category_id==t.values.category_id&&(a.language_code=e.language_code)})})})):a.language_code=Object.keys(t.variants.category_id)[0]),a.isFetching=!1})},updateData:function(){var t=this;this.isUpdating=!0,this.$api.post("templates/set",Object.assign({page_id:this.page_id,template_id:this.template_id},this.values)).then(function(e){"success"==e.result&&t.$parent.close(),t.isUpdating=!1})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title" v-if="values.snapshot_id">{{\'Обновление шаблона\'|gettext}}</p> <p class="modal-card-title" v-else>{{\'Добавление шаблона\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название\'|gettext"> <input type="text" v-model="values.title" class="input" v-focus> </b-field> <b-field :label="\'Язык\'|gettext" v-if="!isFetching"> <b-select v-model="language_code"> <option v-for="(f, k) in variants.language_code" :value="k">{{k}}: {{f.title}}</option> </b-select> </b-field> <b-field :label="\'Категория\'|gettext" v-if="!isFetching"> <b-select v-model="values.category_id" :placeholder="\'Не выбрано\'|gettext"> <option :value="null">-- {{\'Не выбрано\'|gettext}} --</option> <optgroup v-for="g in variants.category_id[language_code]" :label="g.title"> <option v-for="f in g.items" :value="f.category_id">{{f.category}}</option> </optgroup> </b-select> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-primary level-item" type="button" @click="updateData" :class="{\'is-loading\': isUpdating}">{{\'Сохранить\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-index",{data:function(){return{isFetching:!1,profiles:[],variants:null,filter:{language_code:i18n.locale,category_id:null}}},mixins:[ListModel],created:function(){this.$io.on("events:templates.list:refresh",this.refresh),this.fetchData(!0)},destroyed:function(){this.$io.off("events:templates.list:refresh",this.refresh)},watch:{filter:{handler:function(){this.refresh()},deep:!0}},methods:{fetchData:function(e,t){function a(e){s.profiles=e.snapshots,s.$nextTick(function(){_.each(s.profiles,function(e,t){var a=".templates-index .theme"+e.theme_id;e.theme=StylesFactory.checkStyles(e.theme);var i=buildStyles(e.theme,"design",a,!1);e.data=s.$page.prepareData(e.data,i,e.theme,a,"view"),StylesFactory.updateCSSBlock(i,s.$refs.styles_view[t])})})}var s=this;!t&&this.checkCache(a)||(this.isFetching=e,this.$api.get(this.variants?"templates/list":["templates/list","templates/info"],{filter:this.filter}).then(function(e){var t=e.response.templates;null!=t.variants&&(s.variants=t.variants),s.cachePage(t,a),s.isFetching=!1}))},openTemplate:function(e){this.$form.open("vue-templates-template",{value:e})},mouse_in:function(e){var t=(e=$mx(this.$refs["t"+e.template_id])).height(),a=e.find(".theme-main").height();e.find(".page").css({transform:"translate3d(0,-"+(a-t)+"px,0)",transition:"transform "+3/t*a+"s ease 0s"})},mouse_out:function(e){(e=$mx(this.$refs["t"+e.template_id]).find(".page")).css({transform:null})}},template:'<div> <div style="background: #fff" class="has-pt-5 has-pb-5"> <div class="container"> <h2 class="has-mb-3">Каталог шаблонов</h2> <div v-if="variants"> <b-field :label="\'Категория\'|gettext"> <b-select v-model="filter.category_id" :placeholder="\'Не выбрано\'|gettext"> <option :value="null">-- {{\'Не выбрано\'|gettext}} --</option> <optgroup v-for="g in variants.category_id[i18n.locale]" :label="g.title"> <option v-for="f in g.items" :value="f.category_id">{{f.category}}</option> </optgroup> </b-select> <button class="button is-light has-ml-1" @click="$modal(\'vue-templates-categories-form\')" v-if="$auth.isAllowEndpoint(\'templates/categories/set\')"><i class="fas fa-th-large"></i></button> </b-field> </div> </div> </div> <div class="templates-index templates-grid container has-mt-3 has-mb-3"> <div class="row"> <div v-for="p in profiles" class="col-sm-3"> <div class="device is-large" :class="\'theme\'+p.theme_id" @click="openTemplate(p)" @mouseenter="mouse_in(p)" @mouseleave="mouse_out(p)"> <div :ref="\'t\'+p.template_id"> <div ref=\'styles_view\'></div> <section class="modal-card-body is-paddingless screen page page-blocks" v-if="!isFetching"> <vue-pages-page-blocks :page_id="p.page_id" :page-data="p.data" :readonly="true" :show-hidden="false" :account="p.raw" :theme="p.theme"></vue-pages-page-blocks> </section> </div> </div> </div> </div> </div> </div>'}),window.$app.defineComponent("templates","vue-templates-template",{props:["value"],mounted:function(){var e=".templates-template .theme"+this.value.theme_id;this.value.theme=StylesFactory.checkStyles(this.value.theme);var t=buildStyles(this.value.theme,"design",e,!1);this.value.data=this.$page.prepareData(this.value.data,t,this.value.theme,e,"view"),StylesFactory.updateCSSBlock(t,this.$refs.styles_view),this.$form.top.title=this.value.title},methods:{edit:function(){this.$modal("vue-templates-form",{template_id:this.value.template_id})}},template:'<div class="templates-template container has-pt-3 has-pb-3"> <div ref=\'styles_view\'></div> <div class="media"> <div class="media-left"> <div class="device is-large" :class="\'theme\'+value.theme_id"> <section class="modal-card-body is-paddingless screen page page-blocks"> <vue-pages-page-blocks :page_id="value.page_id" :page-data="value.data" :readonly="true" :show-hidden="false" :account="value.raw" :theme="value.theme"></vue-pages-page-blocks> </section> </div> </div> <div class="media-content"> <button class="button is-light" @click="edit">{{\'Настройки\'|gettext}}</button> </div> </div> </div>'}),window.$app.defineModule("templates",[]);
