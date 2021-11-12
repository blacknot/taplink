window.$app.defineComponent("templates","vue-templates-categories-form",{data:function(){return{isFetching:!1,language_code:i18n.locale,updating:[],variants:{language_code:{}}}},created:function(){this.fetchData()},methods:{changeVisible:function(t){var i=this;this.updating.push(t.category_id),this.$api.post("templates/categories/visible",_.merge(this.values,{category_id:t.category_id,is_visible:!t.is_visible})).then(function(e){"success"==e.result&&(t.is_visible=!t.is_visible),i.updating.splice(i.updating.indexOf(t.category_id),1)})},fetchData:function(){var i=this;this.isFetching=!0,this.$api.get("templates/info",{with_invisible:!0,with_languages:!0,with_translate:!0}).then(function(e){var t=e.response.templates;i.variants=t.variants,i.isFetching=!1})},addCategory:function(e){var t=this;this.$modal("vue-templates-categories-item-form",{base:"ru"!=this.language_code?this.variants.category_id["en"==this.language_code?"ru":"en"][e.category_id].items:null,parent_id:e.category_id,language_id:this.variants.language_code[this.language_code].language_id,onUpdate:function(){t.fetchData()}})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">Категории</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Язык\'|gettext" v-if="!isFetching"> <b-select v-model="language_code"> <option v-for="(f, k) in variants.language_code" :value="k">{{f.title}}</option> </b-select> </b-field> <div class="template-categories-for-list panel panel-default" v-if="!isFetching"> <div v-for="g in variants.category_id[language_code]"> <div class="item"><div>{{g.title}}<button class="button is-light" @click="addCategory(g)"><i class="fa fa-plus"></i></button></div></div> <div class="list" v-if="_.size(g.items)"> <div v-for="c in g.items" class="item"> <div :class="{\'has-text-grey\': !c.is_visible}">{{c.category}}<button class="button is-clear" @click="changeVisible(c)" :class="{\'is-loading\': updating.indexOf(c.category_id) != -1}"><i class="fa" :class="{\'fa-eye-slash\': !c.is_visible, \'fa-eye\': c.is_visible},"></i></button></div> </div> </div> </div> </div> </section> <footer class="modal-card-foot"> <button class="button is-dark level-item" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-categories-item-form",{data:function(){return{isFetching:!1,isUpdaing:!1,values:{category_id:null,parent_id:null,category:"",ref_id:null}}},props:["base","category_id","language_id","parent_id","onUpdate"],methods:{updateData:function(){var t=this;this.$api.post("templates/categories/set",_.merge(this.values,{category_id:this.category_id,parent_id:this.parent_id,language_id:this.language_id})).then(function(e){"success"==e.result&&(t.$parent.close(),t.onUpdate())})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">Категория</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название\'|gettext"> <input type="text" v-model="values.category" class="input" v-focus :disabled="isUpdaing"> </b-field> <b-field :label="\'Базовый\'|gettext" v-if="base != null"> <b-select v-model="values.ref_id" :placeholder="\'Не выбрано\'|gettext" :disabled="isUpdaing"> <option :value="null">-- {{\'Не выбрано\'|gettext}} --</option> <option v-for="f in base" :value="f.category_id">{{f.category}}</option> </b-select> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-primary" type="button" @click="updateData">{{\'Сохранить\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-form",{data:function(){return{isFetching:!1,isUpdating:!1,language_code:i18n.locale,values:{snapshot_id:null,title:"",category_id:null,is_visible:!0}}},props:["page_id","template_id"],mixins:[FormModel],created:function(){this.fetchData()},methods:{fetchData:function(){var i=this;this.isFetching=!0,this.$api.get(["templates/get","templates/info"],{page_id:this.page_id,template_id:this.template_id,with_languages:!0,with_translate:!0}).then(function(e){var t;"success"==e.result&&(t=e.response.templates,i.variants=t.variants,null!=t.values?(i.values=t.values,_.each(t.variants.category_id,function(e){_.each(e,function(e){_.each(e.items,function(e){e.category_id==t.values.category_id&&(i.language_code=e.language_code)})})})):i.language_code=Object.keys(t.variants.category_id)[0]),i.isFetching=!1})},makeScreenshot:function(n){var o=this;$mx.lazy("https://cdn.jsdelivr.net/npm/html2canvas@1.3.2/dist/html2canvas.min.js",function(){var e=$mx(".screen.page")[0];html2canvas(e,{useCORS:!0,allowTaint:!0}).then(function(e){var t=e.toDataURL("image/png"),i=260*e.height/e.width,a=document.createElement("canvas");a.width=260,a.height=i;var s=a.getContext("2d"),l=new Image;l.crossOrigin="anonymous",l.onload=function(){s.drawImage(l,0,0,260,i),a.toBlob(function(e){var t=new FormData;t.append("file",e),t.append("template_id",n),o.$http.request({url:"/pictures/upload?target=template",method:"post",data:t}).then(function(e){"success"==e.result||"error"==e.result&&o.$alert(e.error,"is-danger"),o.isUpdating=!1,o.$parent.close()}).catch(function(){o.isUpdating=!1,o.$alert(o.$gettext("Во время загрузки картинки возникла ошибка"))})},"image/jpeg",.7)},l.src=t})})},updateData:function(){var t=this;this.isUpdating=!0,this.$api.post("templates/set",Object.assign({page_id:this.page_id,template_id:this.template_id},this.values)).then(function(e){"success"==e.result?t.$parent.close():t.isUpdating=!1})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title" v-if="values.snapshot_id">{{\'Обновление шаблона\'|gettext}}</p> <p class="modal-card-title" v-else>{{\'Добавление шаблона\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название\'|gettext"> <input type="text" v-model="values.title" class="input" v-focus> </b-field> <b-field :label="\'Ключевые слова\'|gettext" message="Простой текст, через пробел"> <input type="text" v-model="values.keywords" class="input" v-focus> </b-field> <b-field :label="\'Язык\'|gettext" v-if="!isFetching"> <b-select v-model="language_code"> <option v-for="(f, k) in variants.language_code" :value="k">{{k}}: {{f.title}}</option> </b-select> </b-field> <b-field :label="\'Категория\'|gettext" v-if="!isFetching"> <b-select v-model="values.category_id" :placeholder="\'Не выбрано\'|gettext"> <option :value="null">-- {{\'Не выбрано\'|gettext}} --</option> <optgroup v-for="g in variants.category_id[language_code]" :label="g.title"> <option v-for="f in g.items" :value="f.category_id">{{f.category}}</option> </optgroup> </b-select> </b-field> <mx-toggle v-model="values.is_visible" title="Отображать в каталоге"/> </section> <footer class="modal-card-foot"> <button class="button is-primary level-item" type="button" @click="updateData" :class="{\'is-loading\': isUpdating}">{{\'Сохранить\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-index",{data:function(){return{isFetching:!1,isChoosing:!1,search:"",profiles:[],variants:null,filter:{category_id:null,parent_id:2,query:""},loadingProfiles:[],loadingCategories:new Array(20),isFlowFetching:!1,scrollValue:0,cache:{}}},mixins:[ListModel,InfinityModel],props:{page_id:Number,isNewProfile:Boolean,isEditProfile:Boolean},created:function(){this.$form.top&&(this.$form.top.title=this.$gettext("Новый профиль")),this.$events.fire("statistic:event",{name:"template_list"}),this.$io.on("events:templates.list:refresh",this.refresh),this.fetchData(!0)},beforeDestroy:function(){this.$io.off("events:templates.list:refresh",this.refresh)},computed:{menu:function(){var t=[{meta:{title:this.$gettext("Все")},name:null}];return _.each(this.variants.category_id,function(e){_.each(e.items,function(e){t.push({meta:{title:e.category,is_category:!0},name:e.category_id})})}),t},cacheKey:function(){return(this.filter.category_id?this.filter.category_id:this.filter.query)+":"+(this.next?this.next:0)}},methods:{menuChanged:function(e){return this.changeCategory(e.name)},applyFilter:function(){this.profiles=[],this.next=null,this.fetchData(!0)},changeCategory:function(e){this.filter.category_id=e,this.filter.query="",this.applyFilter(),this.$events.fire("statistic:event",{name:"template_category"})},changeQuery:_.debounce(function(){this.applyFilter()},500),createEmpty:function(){var t=this;this.isEditProfile?(this.isChoosing=!0,this.$api.get("templates/choose",{template_id:1,is_edit:!0}).then(function(e){"success"==e.result&&(t.$events.fire("statistic:event",{name:"template_choose",params:{type:"empty",template_id:null}}),t.$auth.refresh(e.response,function(){t.$page.clearData(),t.$router.replace({name:"pages",params:{page_id:e.response.page_id}}),t.$form.close()}))})):this.$confirm(this.$gettext("Вы хотите создать новый профиль?"),"is-info",{yes:this.$gettext("Да"),no:this.$gettext("Нет")}).then(function(){t.isChoosing=!0,t.$api.get("account/profiles/create").then(function(e){"success"==e.result&&t.$auth.refresh(e.response,function(){t.$router.replace({name:"pages",params:{page_id:e.response.page_id}}),t.$form.close()})})})},currentMenuCheck:function(e){return this.filter.category_id==e.name},fetchData:function(e,t){function a(e){s.profiles=t?s.profiles.concat(e.fields):e.fields,s.loadingProfiles=[],setTimeout(function(){s.bottom=s.bottomVisible(),s.checkBottom()},100)}var i,s=this;this.checkCache(a)?this.isFlowFetching=!1:(t||(this.isFetching=e),i=this.filter.category_id||this.next||!this.isNewProfile?9:8,this.loadingProfiles=new Array(i),this.$api.get(this.variants?"templates/list":["templates/list","templates/info"],{filter:this.filter,next:this.next,count:i}).then(function(e){var t,i;"success"==e.result&&(null==(t=e.response).templates||null!=(i=t.templates).variants&&(i.variants.category_id=i.variants.category_id[_.keys(i.variants.category_id)[0]],s.variants=i.variants),s.cachePage(t,a)),s.isFetching=s.isFlowFetching=!1}))},openTemplate:function(e){var t=this;this.isInfinityActive=!1;var i={template_id:e.template_id,isNewProfile:this.isNewProfile,isEditProfile:this.isEditProfile};this.$events.fire("statistic:event",{name:"template_view",params:{template_id:e.template_id}}),this.$device.mobile?(this.$modal("vue-templates-template",i),this.isInfinityActive=!0):(this.scrollValue=window.scrollY,this.$form.open("vue-templates-template",i,function(){t.$nextTick(function(){t.$nextTick(function(){window.scrollTo(0,t.scrollValue),t.isInfinityActive=!0})})}))},mouse_in:function(e){var t,i;this.$device.mobile||(t=(e=$mx(this.$refs["t"+e.template_id])).height(),i=e.find("img").height(),e.find("img").css({transform:"translate3d(0,-"+(i-t)+"px,0)",transition:"transform "+3/t*i+"s ease 0s"}))},mouse_out:function(e){this.$device.mobile||(e=$mx(this.$refs["t"+e.template_id]).find("img")).css({transform:null})}},template:'<div> <div class="top-panel hero-block hero-link" v-if="isNewProfile || isEditProfile"> <div class="container"> <vue-pages-user-flow-steps :step="1" :page_id="page_id" :page_has_template="isEditProfile"/> </div> </div> <vue-component-submenu :menu="menu" :active_function="currentMenuCheck" class="is-hidden-tablet" :is-manual-menu="true" v-if="variants" :current.sync="filter.category_id" @changed="menuChanged"/> <div class="container has-pt-5 has-pb-5 has-pt-2-mobile has-pb-2-mobile"> <div class="row"> <div class="col-sm-3 is-hidden-mobile"> <div class="templates-sidebar sidebar-menu" v-if="variants"> <a @click="changeCategory(null)" :class="{active: filter.category_id == null}">{{\'Все\'|gettext}}</a> <div v-for="g in variants.category_id"> <hr v-if="_.size(g.items)"> <a @click="changeCategory(f.category_id)" v-for="f in g.items" :class="{active: filter.category_id == f.category_id}">{{f.category}}</a> </div> </div> <div class="sidebar-menu" v-else> <a style="pointer-events: none"><span class="skeleton">&nbsp;</span></a> <hr> <div v-for="g in loadingCategories"><a style="pointer-events: none"><span class="skeleton">&nbsp;</span></a></div> </div> </div> <div class="col-sm-9 col-xs-12"> <transition name="slide-fade"> <b-input icon="search" v-if="filter.category_id == null" @input="changeQuery" v-model="filter.query" class="templates-search has-mb-5 has-xs-mb-3" :placeholder="\'Поиск\'|gettext" :loading="isFetching && filter.query" :disabled="isFetching && !filter.query"></b-input> </transition> <div class="templates-index templates-grid"> <div class="row row-small"> <div class="col-sm-4 col-xs-6" v-if="filter.category_id == null"> <div class="device is-large" @click="createEmpty"> <div class="is-scratch"><div><i class="fal has-mb-2 has-text-grey-light" :class="{\'fa-spinner-third fa-spin\': isChoosing, \'fa-file\': !isChoosing}"></i><h4 class="has-mb-2"><b>{{\'Пустой шаблон\'|gettext}}</b></h4>{{\'Вариант для тех, любит создавать с нуля\'|gettext}}</div></div> </div> </div> <div v-for="p in profiles" class="col-sm-4 col-xs-6"> <div class="device is-large" :class="\'theme\'+p.theme_id" @click="openTemplate(p)" @mouseenter="mouse_in(p)" @mouseleave="mouse_out(p)"> <div :ref="\'t\'+p.template_id"> <img :src="\'//\'+$account.storage_domain+\'/t/\'+p.picture_filename"> </div> </div> </div> <div v-for="p in loadingProfiles" class="col-sm-4 col-xs-6"> <div class="device is-large skeleton"><div></div></div> </div> </div> </div> </div> </div> </div> </div>'}),window.$app.defineComponent("templates","vue-templates-locales-form",{data:function(){return{locales:[],isUpdating:!1,isFetching:!0,blocks:[],keywords:[],blocks_order:[],mustchange:[],blocks_types:{},variants:{},add_language_id:null,add_language_choosing:!1,base_language_id:null}},props:["template_id"],created:function(){var i=this;this.$form.top.title=this.$gettext("Многоязычность"),this.$api.get("templates/locales/get",{template_id:this.template_id}).then(function(e){var t;"success"==e.result&&(Object.assign(i,e.response),t=i.clearData(_.clone(i.locales[i.base_language_id])),_.each(_.keys(i.locales),function(e){e!=i.base_language_id&&(i.locales[e]=_.merge(t,i.locales[e],!0))})),i.isFetching=!1}),this.$form.top.buttons={save:{title:this.$gettext("Сохранить"),classname:"is-primary",click:this.updateData}}},watch:{isUpdating:function(e){this.$form.top.buttons.save.classname="is-primary"+(e?" is-loading":"")}},methods:{addLanguage:function(){this.add_language_id=null,this.add_language_choosing=!0},addLanguageDone:function(){this.$set(this.locales,this.add_language_id,this.clearData(_.clone(this.locales[this.base_language_id]))),this.$set(this.keywords,this.add_language_id,""),this.add_language_choosing=!1},updateData:function(){var t=this;this.isUpdating=!0,this.$api.post("templates/locales/set",{template_id:this.template_id,locales:this.locales,keywords:this.keywords,mustchange:this.mustchange}).then(function(e){t.isUpdating=!1,"success"==e.result&&t.$form.close()})},clearData:function(a){var s=this;return _.each(a,function(e,t){if(_.isArray(e))for(i=0;i<e.length;i++)s.clearData(e[i]);else _.isObject(e)?s.clearData(e):a[t]=""}),a},deleteLanguage:function(e){var t=this;this.$confirm("Вы уверенны что хотите удалить этот язык?").then(function(){t.$delete(t.locales,e),t.$delete(t.keywords,e)})}},template:'<div class="templates-locales"> <div v-for="(l, language_id) in locales" class="col-sm-4 col-md-3 col-lg-3 col-xs-12"> <div class="templates-locales-header"> <b-field grouped> <b-select v-model="language_id" :disabled="true" expanded> <option v-for="(title, id) in variants.language_id" :value="id">{{title}}</option> </b-select> <p class="control" v-if="language_id != base_language_id"> <button class="button is-danger" @click="deleteLanguage(language_id)"><i class="fa fa-times"></button> </p> </b-field> </div> <div class="templates-locales-header"> <input type="text" v-model="keywords[language_id]" class="input" placeholder="Ключевые слова" :disabled="base_language_id == language_id"> </div> <vue-templates-locales-node v-for="id in blocks_order" v-model="l[id].options" :title="blocks[id]" :block_id="id" :types="blocks_types[id].options" :mustchange.sync="mustchange" :has-mustchange="base_language_id == language_id" v-if="l[id]" :disabled="base_language_id == language_id"/> </div> <div class="col-sm-4 col-md-3 col-lg-3 col-xs-12"> <div class="templates-locales-header"> <b-field grouped v-if="add_language_choosing"> <b-select v-model="add_language_id" expanded :placeholder="\'Выберите язык\'|gettext"> <option :value="null">{{\'Выберите язык\'|gettext}}</option> <option v-for="(title, id) in variants.language_id" :value="id" v-if="_.keys(locales).indexOf(id) == -1">{{title}}</option> </b-select> <p class="control"> <button class="button is-primary" :disabled="!add_language_id" @click="addLanguageDone"><i class="fa fa-plus"></button> <button class="button is-danger" @click="add_language_choosing = false"><i class="fa fa-times"></button> </p> </b-field> <button class="button is-light is-fullwidth" @click="addLanguage" v-else><i class="fa fa-plus has-mr-2"></i>Добавить язык</button> </div> </div> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("templates","vue-templates-locales-node",{props:["value","title","block_id","types","disabled","mustchange","hasMustchange"],methods:{updated:function(){this.$emit("input",this.value)},mustchangeInput:function(){this.$emit("update:mustchange",this.mustchange)}},template:'<div> <label class="checkbox is-pulled-right has-p-2" v-if="hasMustchange"><input type="checkbox" v-model="mustchange" :value="block_id" @change="$emit(\'update:mustchange\', mustchange)">Поменять</label> <label v-if="title" class="label has-p-2" style="margin: 0 !important;padding-bottom: 0 !important">{{title}}</label> <div> <div v-if="_.isArray(value)"> <vue-templates-locales-node v-for="(v, i) in value" v-model="v" :types="types[i]" :disabled="disabled" @input="updated"/> </div> <div v-else> <div v-for="(v, k) in value"> <div v-if="_.isObject(v) || _.isArray(v)"> <vue-templates-locales-node v-model="v" :types="types[k]" :disabled="disabled" @input="updated"/> </div> <div v-else class="templates-locales-node"> <input v-model="value[k]" class="input" v-if="types[k] == \'string\'" :disabled="disabled"> <textarea v-model="value[k]" class="input" v-if="types[k] == \'text\'" rows="4" :disabled="disabled"></textarea> </div> </div> </div> </div> </div>'}),window.$app.defineComponent("templates","vue-templates-template",{data:function(){return{isFetching:!1,isChoosing:!1,language_code:i18n.locale,template:{}}},props:{template_id:Number,isNewProfile:Boolean,isEditProfile:Boolean},mounted:function(){var a=this;this.isFetching=!0,this.$api.get("templates/template",{template_id:this.template_id}).then(function(e){var t,i;"success"==e.result&&(a.template=e.response.templates.template,t=".templates-template .theme"+a.template.theme_id,a.template.theme=StylesFactory.checkStyles(a.template.theme),_.each(a.template.data.blocks,function(e){e.tariff="basic"}),i=buildStyles(a.template.theme,"design",t,!1),a.template.data=a.$page.prepareData(a.template.data,i,a.template.theme,t,"view"),StylesFactory.updateCSSBlock(i,a.$refs.styles_view)),a.isFetching=!1}),this.$form.top&&(this.$form.top.title=this.template.title||this.$gettext("Выбор шаблона"),this.$auth.isAllowEndpoint("templates/locales/get")&&!this.$device.mobile&&(this.$form.top.buttons={locales:{title:this.$gettext("Многоязычность"),icon:"fa fa-language",classname:"is-light is-hidden-mobile",click:function(){a.$form.open("vue-templates-locales-form",{template_id:a.template_id})}}},this.$auth.isAllowEndpoint("manager/profiles/signin")&&(this.$form.top.buttons.auth={title:"Войти в аккаунт",icon:"fa fa-user",classname:"is-light",click:function(){a.$auth.changeProfile(a.template.profile_id,function(){a.$form.close()})}})))},methods:{edit:function(){this.$modal("vue-templates-form",{template_id:this.template.template_id})},close:function(e){this.$device.mobile?(this.$parent.close(),this.isNewProfile&&e&&this.$form.close()):this.$form.close(e)},choose:function(){var e=this;this.isEditProfile||this.isNewProfile?this.chooseInternal(this.isEditProfile):this.$confirm("Создать новый профиль с этим шаблоном?").then(function(){e.chooseInternal(!1)})},chooseInternal:function(e){var t=this;this.isChoosing=!0,this.$api.get("templates/choose",{template_id:this.template_id,is_edit:e}).then(function(e){"success"==e.result?(t.$events.fire("statistic:event",{name:"template_choose",params:{type:"template",template_id:t.template_id}}),t.$auth.refresh(e.response,function(){t.close(!0),t.$nextTick(function(){t.$page.clearData(),$vue.$router.replace({name:"pages",params:{page_id:e.response.page_id}})})})):t.close(!0)})}},template:'<div class="templates-template" :class="{\'modal-card\': $device.mobile, \'container has-pt-5 has-pb-5\': !$device.mobile}"> <div ref=\'styles_view\'></div> <div class="is-flex-fullheight" :class="{\'modal-card-body is-paddingless\': $device.mobile}"> <div :class="[\'theme\'+template.theme_id, {\'device is-large has-shadow\': !$device.mobile}]" class="page-blocks is-flex-fullheight"> <section class="screen page is-flex-fullheight" :class="{skeleton: isFetching}"> <vue-pages-page-blocks :page_id="template.page_id" :page-data="template.data" :readonly="true" :show-hidden="false" :account="template.raw" :theme="template.theme" :is-view-mode="true" v-if="!isFetching"/> </section> </div> </div> <div class="float-panel is-light-mobile is-page-edit"> <div class="container"> <div style="margin: 0px auto;"> <button class="button is-black is-large" @click="close(false)">{{\'Отмена\'|gettext}}</button> <button class="button is-primary is-large" @click="choose" :class="{\'is-loading\': isChoosing}">{{\'Выбрать\'|gettext}}</button> </div> </div> </div> </div>'}),window.$app.defineModule("templates",[]);
