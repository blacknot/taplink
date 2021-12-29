window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-contact-form",{data:function(){return{isFetching:!1,isUpdating:!1,values:{lead_id:null,email:""},variants:{}}},mixins:[FormModel],props:["lead_id","course_id"],created:function(){var e=this;this.isFetching=!0,this.$api.get("addons/addon/courses/contacts/get",{lead_id:this.lead_id}).then(function(s){"success"==s.result&&(e.values=s.response.values),e.isFetching=!1})},methods:{removeUser:function(){var e=this;this.$confirm("Вы уверены что хотите удалить этого участника из потока?").then(function(){e.isUpdating=!0,e.$api.get("addons/addon/courses/contacts/remove",{lead_id:e.lead_id,course_id:e.course_id}).then(function(s){"success"==s.result&&e.$parent.close(),e.isUpdating=!1})})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">Участник</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <label class="label">Email</label> <span v-if="values.email">{{values.email}}</span><span v-else>{{values.user_id}}</span> </section> <footer class="modal-card-foot level"> <div class="level-left"> <button class="button is-danger" type="button" @click="removeUser" :class="{\'is-loading\': isUpdating}"><i class="has-mr-2 fa fa-trash-alt"></i>{{\'Удалить\'|gettext}}</button> </div> <div class="level-right"> </div> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-contacts",{data:function(){return{isFetching:[],fields:[],sortField:"tms_join",sortOrder:"desc"}},props:["course_id"],mixins:[ListModel],created:function(){this.$io.on("events:courses.users.list:refresh",this.refreshUsers),this.fetchData(!0)},beforeDestroy:function(){this.$io.off("events:courses.users.list:refresh",this.refreshUsers)},methods:{refreshUsers:function(s){s.course_id==this.course_id&&this.fetchData(!1,!0)},fetchData:function(s,e){function t(s){i.fields=s.fields}var i=this;!e&&this.checkCache(t)||(s&&(this.fields=[1,2,3,4,5,6,7]),this.isFetching=s,this.$api.get("addons/addon/courses/contacts/list",{next:this.next,count:this.perPage,course_id:this.course_id,filter:this.filter,sort_field:this.sortField,sort_order:this.sortOrder}).then(function(s){i.cachePage(s.response,t),i.isFetching=!1}).catch(function(s){throw i.total=0,i.isFetching=!1,s}))},clickRow:function(s){this.$modal("vue-addons-catalog-courses-contact-form",{course_id:this.course_id,lead_id:s.lead_id})}},template:'<div> <b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered> <b-table-column :label="\'Email\'|gettext" v-slot="props"> <div class="skeleton" v-if="isFetching"></div> <span v-else><span v-if="props.row.email">{{props.row.email}}</span><span v-else>{{props.row.user_id}}</span></span> </b-table-column> <b-table-column :label="\'Прогресс\'|gettext" v-slot="props" cell-class="has-width-25"> <div class="skeleton" v-if="isFetching"></div> <div class="progress-bar" v-else> <div class="is-done" :style="{width: (props.row.lessons_done / props.row.lessons_amount * 100)+\'%\'}">{{props.row.lessons_done}}</div> <div class="is-opened" :style="{width: ((props.row.lessons_opened - props.row.lessons_done) / props.row.lessons_amount * 100)+\'%\'}" v-if="!props.row.lessons_opened || props.row.lessons_done != props.row.lessons_amount || props.row.lessons_done != props.row.lessons_opened">{{props.row.lessons_opened - props.row.lessons_done}}</div> </div> </b-table-column> <b-table-column field="tms_join" :label="\'Дата добавления\'|gettext" v-slot="props" numeric sortable> <div class="skeleton" v-if="isFetching"></div> <span v-else> {{ props.row.tms_join|datetime }} </span> </b-table-column> </b-table> </div>'}),window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-course-form",{data:function(){return{isFetching:!1,isUpdating:!1,values:{title:"",landing_page_id:null,open_access_lessons:"all",is_hide_future_lessons:!1},variants:{}}},mixins:[FormModel],props:["course","page_id"],created:function(){var e=this;this.course&&(this.values=_.clone(this.course)),this.isFetching=!0,this.$api.get("addons/addon/courses/variants",{}).then(function(s){"success"==s.result&&(e.variants=s.response.variants),e.isFetching=!1})},methods:{updateData:function(){var e=this;this.isUpdating=!0,this.$api.post("addons/addon/courses/set",this.values,this).then(function(s){"success"==s.result&&(e.course?Object.assign(e.course,e.values):e.$parent.$parent.$router.push({name:"courses-course",params:{page_id:e.page_id,course_id:s.response.values.course_id}}),e.$parent.close()),e.isUpdating=!1}).catch(function(){e.isUpdating=!1})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title"><span v-if="values.course_id">{{\'Редактирование курса\'|gettext}}</span><span v-else>{{\'Новый курс\'|gettext}}</span></p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название курса\'|gettext" :message="errors.title" :class="{\'has-error\': errors.title}"> <b-input v-model="values.title" maxlength="255" :has-counter="false" class="has-rtl" v-focus></b-input> </b-field> <b-field label="Страница продажи курса" :class="{\'has-error\': errors.landing_page_id}" :message="errors.landing_page_id"> <b-select v-model="values.landing_page_id" :placeholder="\'-- Не выбрано --\'|gettext" expanded> <option v-for="(v, k) in variants.page_id" :value="k">{{v}}</option> </b-select> </b-field> <div class="field"> <label class="label">Порядок открытия доступа к урокам</label> <div class="has-mb-1"><label class="radio"><input type="radio" v-model="values.open_access_lessons" value="all">Открыть все сразу</label></div> <div class="has-mb-1"><label class="radio"><input type="radio" v-model="values.open_access_lessons" value="in_order">Открывать по порядку</label></div> <div><label class="radio"><input type="radio" v-model="values.open_access_lessons" value="manual">Открывать вручную</label></div> </div> <div><label class="checkbox"><input type="checkbox" v-model="values.is_hide_future_lessons" value="1" :disabled="values.open_access_lessons == \'all\'">Скрыть будущие уроки</label></div> </section> <footer class="modal-card-foot level"> <div class="level-left"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </div> <div class="level-right"> <button class="button is-primary" :class="{\'is-loading\': isUpdating}" @click="updateData">{{\'Сохранить\'|gettext}}</button> </div> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-course",{data:function(){return{part:"content",isFetching:!1,isContactsInited:!1,action:"",course:{title:"",modules:[],open_access_lessons:"in_order"}}},props:["course_id","page_id"],watch:{part:function(s){"contacts"==s&&(this.isContactsInited=!0)}},computed:{title:function(){return this.course.title?this.course.title:this.$gettext("Курс")}},created:function(){this.$io.on("events:courses.lessons.list:refresh",this.refreshLessons),this.fetchData(!0)},beforeDestroy:function(){this.$io.off("events:courses.lessons.list:refresh",this.refreshLessons)},methods:{lessonsSortEnd:function(s){var e=this;this.$nextTick(function(){e.$api.post("addons/addon/courses/lessons/reorder",{course_id:e.course_id,module_id:s.module_id,lessons_order:s.lessons_order},e)})},modulesSortEnd:function(){var s=this;this.$nextTick(function(){s.$api.post("addons/addon/courses/modules/reorder",{course_id:s.course_id,modules_order:s.course.modules_order},s)})},pictureUpdated:function(s){var e=this;this.$api.post("addons/addon/courses/picture",{course_id:this.course_id,picture_id:s&&s.picture_id?s.picture_id:null},this).then(function(s){"success"==s.result&&(e.action=null)})},onActionCourse:function(){var e=this;if(this.action){switch(this.action){case"edit:page:lesson":case"edit:page:index":this.$router.push({name:"pages-back",params:{page_id:this.course["page_id_"+this.action.split(":")[2]],back_page_id:this.page_id}});break;case"edit:course":this.$modal("vue-addons-catalog-courses-course-form",{course:this.course});break;case"delete":this.$confirm("Вы уверены что хотите удалить этот курс?","is-danger").then(function(){e.$api.post("addons/addon/courses/delete",{course_id:e.course_id},e).then(function(s){"success"==s.result&&e.$router.replace({name:"courses-list"})})})}this.$nextTick(function(){e.action=null})}},onActionLesson:function(s){var e=this;if(this.action)switch(this.action){case"delete":this.$confirm(this.$gettext("Вы уверены что хотите удалить этот урок?"),"is-danger").then(function(){e.$api.post("addons/addon/courses/lessons/delete",{course_id:e.course_id,lesson_id:s},e).then(function(s){"success"==s.result&&(e.action=null)})})}},onActionModule:function(s){var e=this;if(this.action)switch(this.action){case"delete":this.$confirm(this.$gettext("Вы уверены что хотите удалить этот модуль?"),"is-danger").then(function(){e.$api.post("addons/addon/courses/modules/delete",{course_id:e.course_id,module_id:s},e).then(function(s){"success"==s.result&&(e.action=null)})})}},fetchData:function(s){var e=this;this.isFetching=s,this.$api.get("addons/addon/courses/get",{course_id:this.course_id}).then(function(s){"success"==s.result&&(e.course=s.response.course,e.isFetching=!1)})},refreshLessons:function(s){var t=this;s.course_id==this.course_id&&this.$api.get("addons/addon/courses/content",{course_id:this.course_id}).then(function(s){var e;"success"==s.result&&(e=s.response.course,t.course.modules=e.modules,t.course.modules_order=e.modules_order)})},addModuleForm:function(){this.$modal("vue-addons-catalog-courses-module-form",{course_id:this.course_id})},addLessonForm:function(s){this.$form.open("vue-addons-catalog-courses-lesson-form",{module_id:s})},editLessonForm:function(s){this.$form.open("vue-addons-catalog-courses-lesson-form",{lesson_id:s})},editModuleForm:function(s){this.$modal("vue-addons-catalog-courses-module-form",{module_id:s})}},template:'<div class="container has-mt-3 has-mb-3"> <div class="level has-mb-3"> <div class="level-left"> <h3>{{title}}</h3> </div> <div class="level-right"> <router-link :to="{name: \'courses-list\'}" class="button is-light has-mr-1"><i class="fa fa-undo has-text-grey-light has-mr-1"></i>К списку</router-link> <b-dropdown v-model="action" @input="onActionCourse" position="is-bottom-left"> <button class="button is-black is-fullwidth" slot="trigger"> Редактировать<i class="fa fa-angle-down has-ml-2"></i> </button> <b-dropdown-item value="edit:course"><i class="fa fa-pencil has-mr-1"></i>{{\'Курс\'|gettext}}</b-dropdown-item> <hr class="dropdown-divider" aria-role="menuitem"> <b-dropdown-item value="edit:page:index"><i class="fa fa-file has-mr-1"></i>{{\'Страницу курса\'|gettext}}</b-dropdown-item> <b-dropdown-item value="edit:page:lesson"><i class="fa fa-file has-mr-1"></i>{{\'Страницу урока\'|gettext}}</b-dropdown-item> <hr class="dropdown-divider" aria-role="menuitem"> <b-dropdown-item value="delete" :class="{\'has-text-danger\': !_.size(course.modules)}" :disabled="_.size(course.modules)"><i class="fa fa-trash-alt has-mr-1"></i>{{\'Удалить\'|gettext}}</b-dropdown-item> </b-dropdown> </div> </div> <div class="panel panel-default has-p-2 has-mb-6"> <vue-component-pictures v-model="course.picture" class="courses-picture" :cropper-options="{aspectRatio: 510/228, autoCropArea: .9, viewMode: 1, movable: true, zoomable: false}" :button-title="\'Загрузить картинку\'|gettext" button-icon="fa fal fa-cloud-upload" updatable @input="pictureUpdated"></vue-component-pictures> </div> <b-field class="has-tabs-style has-mb-2"> <b-radio-button v-model="part" type="active" class="is-expanded" native-value="content" style="width:50%">{{\'Контент\'|gettext}}</b-radio-button> <b-radio-button v-model="part" type="active" class="is-expanded" native-value="contacts" style="width:50%">{{\'Участники\'|gettext}}</b-radio-button> </b-field> <div class="panel panel-default" v-show="part == \'content\'"> <div v-if="_.size(course.modules)"> <sortable-list lockAxis="y" v-model="course.modules_order" use-drag-handle @sortEnd="modulesSortEnd(m)" :useWindowAsScrollContainer="true" helperClass="courses-lesson-reordering"> <sortable-item v-for="(cid, ci) in course.modules_order" class="courses-module" :item="course.modules[cid]" :index="ci" :key="cid"> <div> <div><b><i class="fas fa-bars has-mr-2 has-text-grey-light" v-sortable-handle style="cursor: -webkit-grabbing"></i>{{course.modules[cid].title}}</b></div> <div> <button class="button is-light" @click="editModuleForm(cid)">Редактировать</button> <b-dropdown v-model="action" @input="onActionModule(cid)" position="is-bottom-left"> <button class="button is-light is-fullwidth" slot="trigger"> <i class="fa fa-ellipsis-v"></i> </button> <b-dropdown-item value="delete" :class="{\'has-text-danger\': !_.size(course.modules[cid].lessons)}" :disabled="_.size(course.modules[cid].lessons)"><i class="fa fa-trash-alt has-mr-1"></i>{{\'Удалить\'|gettext}}</b-dropdown-item> </b-dropdown> </div> </div> <div class="is-lessons"> <sortable-list lockAxis="y" v-model="course.modules[cid].lessons_order" use-drag-handle @sortEnd="lessonsSortEnd(course.modules[cid])" :useWindowAsScrollContainer="true" helperClass="courses-lesson-reordering"> <sortable-item v-for="(id, i) in course.modules[cid].lessons_order" class="courses-lesson" :item="course.modules[cid].lessons[id]" :index="i" :key="id"> <div> <div><span><i class="fas fa-bars has-mr-2 has-text-grey-light" v-sortable-handle style="cursor: -webkit-grabbing"></i>{{course.modules[cid].lessons[id].title}}</span><span v-if="course.modules[cid].lessons[id].delay && course.open_access_lessons == \'in_order\'" class="has-text-grey has-mr-2"><i class="fa fas fa-clock has-text-grey-light has-mr-1"></i>{{course.modules[cid].lessons[id].delay}}</span></div> <div> <button class="button is-light" @click="editLessonForm(id)">Редактировать</button> <b-dropdown v-model="action" @input="onActionLesson(id)" position="is-bottom-left"> <button class="button is-light is-fullwidth" slot="trigger"> <i class="fa fa-ellipsis-v"></i> </button> <b-dropdown-item value="delete" class="has-text-danger"><i class="fa fa-trash-alt has-mr-1"></i>{{\'Удалить\'|gettext}}</b-dropdown-item> </b-dropdown> </div> </div> </sortable-item> </sortable-list> <div class="courses-lesson is-link" @click="addLessonForm(cid)"> <div><div><i class="fa fa-plus has-mr-2"></i>{{\'Добавить урок\'|gettext}}</div></div> </div> </div> </sortable-item> </sortable-list> <div class="courses-module is-link" @click="addModuleForm"> <div><div><i class="fa fa-plus has-mr-2"></i>{{\'Добавить модуль\'|gettext}}</div></div> </div> </div> <div v-else class="has-p-2"> <center><b><a @click="addModuleForm">Добавьте содержание</a></b></center> </div> </div> <div v-show="part == \'contacts\'"> <vue-addons-catalog-courses-contacts :course_id="course_id" v-if="isContactsInited"/> </div> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-index",{data:function(){return{isFetching:!1,isReadonly:!1,filter:{query:""}}},mixins:[ListModel],props:["page_id"],created:function(){this.$io.on("events:courses.list:refresh",this.refresh),this.fetchData(!0)},beforeDestroy:function(){this.$io.off("events:courses.list:refresh",this.refresh)},methods:{onFilter:function(){this.clearPages(),this.fetchData(!0)},clickRow:function(s){this.$router.push({name:"courses-course",params:{course_id:s.course_id}})},newCourse:function(){this.$modal("vue-addons-catalog-courses-course-form",{course_id:null,page_id:this.page_id},this)},fetchData:function(s,e){function t(s){i.fields=s.fields}var i=this;!e&&this.checkCache(t)||(this.isFetching=s,this.$api.post("addons/addon/courses/list",{next:this.next,count:this.perPage,filter:this.filter,sort_field:this.sortField,sort_order:this.sortOrder}).then(function(s){i.cachePage(s.response,t),i.isFetching=!1}).catch(function(s){throw i.total=0,i.isFetching=!1,s}))}},template:'<div> <vue-component-filterbox :is-visible="fields.length" :disabled="isFetching" v-model="filter" :with-buttons="true" @filter="onFilter"> <template slot="buttons"> <a @click="newCourse" class="button is-primary is-fullwidth" :class="{disabled: isReadonly}"><i class=\'fas fa-plus\'></i><span class=\'is-hidden-touch has-ml-1\'>{{\'Новый курс\'|gettext}} </span></a> </template> </vue-component-filterbox> <div class="container has-mb-3"> <b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered> <b-table-column :label="\'Название\'|gettext" v-slot="props"> <span> {{ props.row.title }} </span> <span> {{ props.row.tms_created|datetime }} </span> </b-table-column> <template slot="empty"> <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching"> <div class="row"> <div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3"> <h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-users-class has-text-grey-light" style="font-size: 5rem"></i></h3> <div class="has-mb-2">{{\'Курсы\'|gettext}}</div> <a @click="newCourse" class="button is-primary" :class="{disabled: isReadonly}"><i class=\'fas fa-plus\'></i><span class=\'has-ml-1\'>{{\'Новый курс\'|gettext}} </span></a> </div> </div> </section> <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching"> <p>{{\'Загрузка данных\'|gettext}}</p> </section> </template> </b-table> </div> </div>'}),window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-lesson-form",{data:function(){return{currentTab:"common",isFetching:!1,isUpdating:!1,values:{title:"",subtitle:"",body:null,events:{before:[],after:[]}},variants:{},events_types:{before:"Событие перед открытием урока",after:"Событие после выполнения урока"}}},mixins:[FormModel],props:["lesson_id","module_id"],watch:{values:{handler:function(){this.$form.top.title=this.values.title?this.values.title:this.$gettext("Урок")},deep:!0},isUpdating:function(s){this.$form.top.buttons.save.classname="is-primary"+(s?" is-loading":"")}},created:function(){this.$form.top.title=this.$gettext("Урок"),this.$form.top.buttons={save:{title:this.$gettext("Сохранить"),classname:"is-primary",click:this.updateData}},this.lesson_id?this.fetchData():(this.values.module_id=this.module_id,this.values.body={})},methods:{addEvent:function(s){this.values.events[s].push({type:null,value:null})},removeEvent:function(s,e){this.values.events[s].splice(e,1)},fetchData:function(){var e=this;this.isFetching=!0,this.$api.get("addons/addon/courses/lessons/get",{lesson_id:this.lesson_id}).then(function(s){"success"==s.result&&(e.values=s.response.values,e.variants=s.response.variants),e.isFetching=!1})},setTab:function(s){this.currentTab=s},updateData:function(){var e=this;this.isUpdating=!0,this.$api.post("addons/addon/courses/lessons/set",this.values,this).then(function(s){"success"==s.result&&e.$form.close(),e.isUpdating=!1}).catch(function(){e.isUpdating=!1})}},template:'<div class="has-mb-3"> <div class="top-panel has-mb-3 is-form-menu"> <div class="container"> <div class="scrolling-container is-submenu"> <div style="overflow-x: scroll"> <a class="button" :class="{active: \'common\' == currentTab}" @click="setTab(\'common\')">{{\'Контент\'|gettext}}</a> <a class="button" :class="{active: \'options\' == currentTab}" @click="setTab(\'options\')">{{\'Настройки\'|gettext}}</a> </div> </div> </div> </div> <div class="container" v-show="\'common\' == currentTab"> <b-field :label="\'Название урока\'|gettext" :message="errors.title" :class="{\'has-error\': errors.title}"> <b-input v-model="values.title" maxlength="255" :has-counter="false" class="has-rtl" v-focus :placeholder="\'Заголовок\'|gettext"></b-input> </b-field> <b-field :message="errors.subtitle" :class="{\'has-error\': errors.subtitle}"> <b-input v-model="values.subtitle" maxlength="255" :has-counter="false" class="has-rtl" :placeholder="\'Подзаголовок\'|gettext"></b-input> </b-field> <div class="page"> <vue-component-htmleditor class="block-lesson is-editor" v-model="values.body" v-if="values.body"/> </div> </div> <div class="container" v-show="\'options\' == currentTab"> <div class="row"> <div class="col-xs-12 col-sm-6"> <b-field label="Ожидание перед открытием урока" :message="errors.delay" :class="{\'has-error\': errors.delay}"> <vue-component-delay-input v-model="values.delay"/> </b-field> <b-field v-for="(title, k) in events_types" :label="title"> <mx-item class="has-mb-2" v-for="(e, i) in values.events[k]"> <div class="item-row row"> <div class="col-xs"> <vue-component-actionchooser v-model="e" :action_types="variants.action_types" :action_values="variants.action_type_values" :except="[\'courses:lesson\']"/> </div> <div class="col-xs col-shrink"> <button type="button" class="button has-text-danger is-text" @click="removeEvent(k, i)"><i class="fa fa-trash-alt"></i></button> </div> </div> </mx-item> <button class="button is-dark" @click="addEvent(k)"><i class="fas fa-plus has-mr-1"></i>Добавить событие</button> </b-field> </div> </div> </div>'}),window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-module-form",{data:function(){return{isFetching:!1,isUpdating:!1,values:{}}},mixins:[FormModel],props:["module_id","course_id"],created:function(){this.module_id?this.fetchData():this.values.course_id=this.course_id},methods:{fetchData:function(){var e=this;this.isFetching=!0,this.$api.get("addons/addon/courses/modules/get",{module_id:this.module_id}).then(function(s){"success"==s.result&&(e.values=s.response.values),e.isFetching=!1})},updateData:function(){var e=this;this.isUpdating=!0,this.$api.post("addons/addon/courses/modules/set",this.values,this).then(function(s){"success"==s.result&&e.$parent.close(),e.isUpdating=!1}).catch(function(){e.isUpdating=!1})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title"><span v-if="values.course_id">{{\'Редактирование модуля\'|gettext}}</span><span v-else>{{\'Новый модуль\'|gettext}}</span></p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :label="\'Название модуля\'|gettext" :message="errors.title" :class="{\'has-error\': errors.title}"> <b-input v-model="values.title" maxlength="255" :has-counter="false" class="has-rtl" v-focus></b-input> </b-field> </section> <footer class="modal-card-foot level"> <div class="level-left"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </div> <div class="level-left"> <button class="button is-primary" :class="{\'is-loading\': isUpdating}" @click="updateData">{{\'Сохранить\'|gettext}}</button> </div> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("addons.catalog.courses","vue-addons-catalog-courses-options",{data:function(){return{}},template:"<div> </div>"}),window.$app.defineModule("addons.catalog.courses",[]);
