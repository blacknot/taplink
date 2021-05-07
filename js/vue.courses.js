
window.$app.defineComponent("courses", "vue-courses-contacts", {data() {
			return {
				isFetching: [],
				fields: [],
                sortField: 'tms_join',
                sortOrder: 'desc',
			}
		},
		
		props:['course_id'], 
		
		mixins: [ListModel],
		
		created() {
			this.fetchData();
		},
		
		methods: {
			fetchData(withLoading, force) {
				let resolve = (data) => {
					this.fields = data.fields
				}
				
				if (force || !this.checkCache(resolve)) {
					this.isFetching = withLoading;
					this.$api.get('courses/contacts/list', {next: this.next, count: this.perPage, course_id: this.course_id, filter: this.filter, sort_field: this.sortField, sort_order: this.sortOrder}).then((data) => {
						this.cachePage(data.response, resolve);

						this.isFetching = false;
					}).catch((error) => {
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
				}
			},
			
			clickRow() {
				
			}
		}, template: `
	<div>
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered>
			<b-table-column :label="'Email'|gettext" v-slot="props">
				<span> {{ props.row.email }} </span>
			</b-table-column>
			

			<b-table-column :label="'Прогресс'|gettext" v-slot="props" cell-class="has-width-25">
				<div class="progress-bar">
					<div class="is-done" :style="{width: (props.row.lessons_done / props.row.lessons_amount * 100)+'%'}">{{props.row.lessons_done}}</div>
					<div class="is-opened" :style="{width: ((props.row.lessons_opened - props.row.lessons_done) / props.row.lessons_amount * 100)+'%'}" v-if="!props.row.lessons_opened || props.row.lessons_done != props.row.lessons_amount || props.row.lessons_done != props.row.lessons_opened">{{props.row.lessons_opened - props.row.lessons_done}}</div>
				</div>
			</b-table-column>
			
			<b-table-column field="tms_join" :label="'Дата добавления'|gettext" v-slot="props" numeric sortable>
				<span> {{ props.row.tms_join|datetime }} </span>
			</b-table-column>
			
			
<!--
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                    
					<div class="row">
						<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
							<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-users-class has-text-grey-light" style="font-size: 5rem"></i></h3>
							<div class="has-mb-2">{{'Курсы'|gettext}}</div>
							<a @click="newCourse" class="button is-primary" :class="{disabled: isReadonly}"><i class='fas fa-plus'></i><span class='has-ml-1'>{{'Новый курс'|gettext}} </span></a>
						</div>
					</div>
                    
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
-->
			</b-table>
	</div>
`});

window.$app.defineComponent("courses", "vue-courses-course-form", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				values: {title: '', landing_page_id: null, open_access_lessons: 'all', is_hide_future_lessons: false},
				variants: {}
			}
		},
		
		mixins: [FormModel],
		props: ['course', 'page_id'],
		
		created() {
			if (this.course) this.values = _.clone(this.course);
			
			this.isFetching = true;
			this.$api.get('courses/variants', {}).then(r => {
				if (r.result == 'success') {
					this.variants = r.response.variants;
				}
				
				this.isFetching = false;
			})
		},
		
		methods: {
			updateData() {
				this.isUpdating = true;
				this.$api.post('courses/set', this.values, this).then((r) => {
					if (r.result == 'success') {
						if (this.course) {
							Object.assign(this.course, this.values);
						} else {
							this.$parent.$parent.$router.push({name: 'courses-course', params: {page_id: this.page_id, course_id: r.response.values.course_id}});
						}
						
						this.$parent.close();
					}
					this.isUpdating = false;
				}).catch(() => {
					this.isUpdating = false;					
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title"><span v-if="values.course_id">{{'Редактирование курса'|gettext}}</span><span v-else>{{'Новый курс'|gettext}}</span></p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Название курса'|gettext" :message="errors.title" :class="{'has-error': errors.title}">
            	<b-input v-model="values.title" maxlength="255" :has-counter="false" class="has-rtl" v-focus></b-input>
			</b-field>
			
			<b-field label="Страница продажи курса" :class="{'has-error': errors.landing_page_id}" :message="errors.landing_page_id">
				<b-select v-model="values.landing_page_id" :placeholder="'-- Не выбрано --'|gettext" expanded>
					<option v-for="(v, k) in variants.page_id" :value="k">{{v}}</option>
				</b-select>
			</b-field>
			
			<div class="field">
				<label class="label">Порядок открытия доступа к урокам</label>
				<div class="has-mb-1"><label class="radio"><input type="radio" v-model="values.open_access_lessons" value="all">Открыть все сразу</label></div>
				<div><label class="radio"><input type="radio" v-model="values.open_access_lessons" value="in_order">Открывать по порядку</label></div>
			</div>
			
			<div><label class="checkbox"><input type="checkbox" v-model="values.is_hide_future_lessons" value="1" :disabled="values.open_access_lessons == 'all'">Скрыть будущие уроки</label></div>

		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});

window.$app.defineComponent("courses", "vue-courses-course", {data() {
			return {
				part: 'content',
				isFetching: false,
				isContactsInited: false,
				action: '',
				course: {title: '', modules: []}
			}
		},
		
		props: ['course_id', 'page_id'],
		
		watch: {
			part(v) {
				if (v == 'contacts') this.isContactsInited = true;
			}
		},
		computed: {
			title() {
				return this.course.title?this.course.title:this.$gettext('Курс');
			}
		},
		
		created() {
// 			this.$form.top.title = this.$gettext('Курс');// + (this.values.options.title?(': '+this.values.options.title):'');
// 			this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.updateData}};

			this.$io.on('events:courses.lessons.list:refresh', this.refreshLessons);

			this.fetchData(true);
		},
		
		beforeDestroy() {
			this.$io.off('events:courses.lessons.list:refresh', this.refreshLessons);
		},
		
		methods: {
			lessonsSortEnd(m) {
				this.$nextTick(() => {
					this.$api.post('courses/lessons/reorder', {course_id: this.course_id, module_id: m.module_id, lessons_order: m.lessons_order}, this);
				});
			},
			
			modulesSortEnd() {
				this.$nextTick(() => {
					this.$api.post('courses/modules/reorder', {course_id: this.course_id, modules_order: this.course.modules_order}, this);
				});
			},
			
			pictureUpdated(picture) {
				this.$api.post('courses/picture', {course_id: this.course_id, picture_id: (picture && picture.picture_id)?picture.picture_id:null}, this).then((data) => {
                   	if (data.result == 'success') {
	                   	this.action = null;
					}
				});
			},
			
			onActionCourse() {
				if (!this.action) return;
				
				switch (this.action) {
					case 'edit:page:lesson':
					case 'edit:page:index':
						this.$router.push({name: 'pages-back', params: {page_id: this.course['page_id_'+this.action.split(':')[2]], back_page_id: this.page_id}});
						break;
					case 'edit:course':
						this.$modal('vue-courses-course-form', {course: this.course});
						break;
					case 'delete': 
						this.$confirm('Вы уверены что хотите удалить этот курс?', 'is-danger').then(() => {
							this.$api.post('courses/delete', {course_id: this.course_id}, this).then((data) => {
			                   	if (data.result == 'success') {
							   		this.$router.replace({name: 'courses-list'});
								}
							});
						});
						break;
				}
				
				this.$nextTick(() => {
					this.action = null;
				});
			},
			
			onActionLesson(lesson_id) {
	            if (!this.action) return;
	            
	            switch (this.action) {
					case 'delete': 
						this.$confirm(this.$gettext('Вы уверены что хотите удалить этот урок?'), 'is-danger').then(() => {
							this.$api.post('courses/lessons/delete', {course_id: this.course_id, lesson_id: lesson_id}, this).then((data) => {
			                   	if (data.result == 'success') {
				                   	this.action = null;
								}
							});
						});
						break;
	            }
			},
			
			onActionModule(module_id) {
				if (!this.action) return;
	            
	            switch (this.action) {
					case 'delete': 
						this.$confirm(this.$gettext('Вы уверены что хотите удалить этот модуль?'), 'is-danger').then(() => {
							this.$api.post('courses/modules/delete', {course_id: this.course_id, module_id: module_id}, this).then((data) => {
			                   	if (data.result == 'success') {
				                   	this.action = null;
								}
							});
						});
						break;
	            }
			},

			fetchData(withLoading) {
				this.isFetching = withLoading;
				
				this.$api.get('courses/get', {course_id: this.course_id}).then((r) => {
					if (r.result == 'success') {
						this.course = r.response.course;
						this.isFetching = false;
					}
				});
			},
			
			refreshLessons(d) {
				if (d.course_id == this.course_id) {
					this.$api.get('courses/content', {course_id: this.course_id}).then((r) => {
						if (r.result == 'success') {
							this.course.modules = r.response.course.modules;
						}
					});
				}
			},
			
			addModuleForm() {
				this.$modal('vue-courses-module-form', {course_id: this.course_id});
			},
			
			addLessonForm(module_id) {
				this.$form.open('vue-courses-lesson-form', {module_id: module_id});
			},
			
			editLessonForm(lesson_id) {
				this.$form.open('vue-courses-lesson-form', {lesson_id: lesson_id});
			},
			
			editModuleForm(module_id) {
				this.$modal('vue-courses-module-form', {module_id: module_id});
			}
		}, template: `
	<div class="container has-mt-3 has-mb-3">
		<div class="level has-mb-3">
			<div class="level-left">
				<h3>{{title}}</h3>
			</div>
			<div class="level-right">
				<router-link :to="{name: 'courses-list'}" class="button is-light has-mr-1"><i class="fa fa-undo has-text-grey-light has-mr-1"></i>К списку</router-link>
				<b-dropdown v-model="action" @input="onActionCourse" position="is-bottom-left">
		            <button class="button is-black is-fullwidth" slot="trigger">
		                Редактировать<i class="fa fa-angle-down has-ml-2"></i>
		            </button>
					<b-dropdown-item value="edit:course"><i class="fa fa-pencil has-mr-1"></i>{{'Курс'|gettext}}</b-dropdown-item>
					<hr class="dropdown-divider" aria-role="menuitem">
					<b-dropdown-item value="edit:page:index"><i class="fa fa-file has-mr-1"></i>{{'Страницу курса'|gettext}}</b-dropdown-item>
					<b-dropdown-item value="edit:page:lesson"><i class="fa fa-file has-mr-1"></i>{{'Страницу урока'|gettext}}</b-dropdown-item>
					<hr class="dropdown-divider" aria-role="menuitem">
					<b-dropdown-item value="delete" :class="{'has-text-danger': !_.size(course.modules)}" :disabled="_.size(course.modules)"><i class="fa fa-trash-alt has-mr-1"></i>{{'Удалить'|gettext}}</b-dropdown-item>
				</b-dropdown>
			</div>
		</div>
		<div class="panel panel-default has-p-2 has-mb-6">
			<vue-component-pictures v-model="course.picture" class="courses-picture" :cropper-options="{aspectRatio: 510/228, autoCropArea: .9, viewMode: 1, movable: true, zoomable: false}" :button-title="'Загрузить картинку'|gettext" button-icon="fa fal fa-cloud-upload" updatable @input="pictureUpdated"></vue-component-pictures>
		</div>

		<b-field class="has-tabs-style has-mb-2">
            <b-radio-button v-model="part" type="active" class="is-expanded" native-value="content" style="width:50%">{{'Контент'|gettext}}</b-radio-button>
            <b-radio-button v-model="part" type="active" class="is-expanded" native-value="contacts" style="width:50%">{{'Участники'|gettext}}</b-radio-button>
		</b-field>

		<div class="panel panel-default" v-show="part == 'content'">
			<div v-if="_.size(course.modules)">

				<sortable-list lockAxis="y" v-model="course.modules_order" use-drag-handle @sortEnd="modulesSortEnd(m)" :useWindowAsScrollContainer="true" helperClass="courses-lesson-reordering">
				<sortable-item v-for="(cid, ci) in course.modules_order" class="courses-module" :item="course.modules[cid]" :index="ci" :key="cid">

<!-- 				<div v-for="m in course.modules" class="courses-module"> -->
					<div>
						<div><b><i class="fas fa-bars has-mr-2 has-text-grey-light" v-sortable-handle style="cursor: -webkit-grabbing"></i>{{course.modules[cid].title}}</b></div>
						<div>
							<button class="button is-light" @click="editModuleForm(cid)">Редактировать</button>
							<b-dropdown v-model="action" @input="onActionModule(cid)" position="is-bottom-left">
					            <button class="button is-light is-fullwidth" slot="trigger">
					                <i class="fa fa-ellipsis-v"></i>
					            </button>
								<b-dropdown-item value="delete" :class="{'has-text-danger': !_.size(course.modules[cid].lessons)}" :disabled="_.size(course.modules[cid].lessons)"><i class="fa fa-trash-alt has-mr-1"></i>{{'Удалить'|gettext}}</b-dropdown-item>
							</b-dropdown>
						</div>
					</div>
					<div class="is-lessons">
						<sortable-list lockAxis="y" v-model="course.modules[cid].lessons_order" use-drag-handle @sortEnd="lessonsSortEnd(course.modules[cid])" :useWindowAsScrollContainer="true" helperClass="courses-lesson-reordering">
							<sortable-item v-for="(id, i) in course.modules[cid].lessons_order" class="courses-lesson" :item="course.modules[cid].lessons[id]" :index="i" :key="id">
								<div>
									<div><span><i class="fas fa-bars has-mr-2 has-text-grey-light" v-sortable-handle style="cursor: -webkit-grabbing"></i>{{course.modules[cid].lessons[id].title}}</span><span v-if="course.modules[cid].lessons[id].delay" class="has-text-grey has-mr-2"><i class="fa fas fa-clock has-text-grey-light has-mr-1"></i>{{course.modules[cid].lessons[id].delay}}</span></div>
									<div>
										<button class="button is-light" @click="editLessonForm(id)">Редактировать</button>
										<b-dropdown v-model="action" @input="onActionLesson(id)" position="is-bottom-left">
								            <button class="button is-light is-fullwidth" slot="trigger">
								                <i class="fa fa-ellipsis-v"></i>
								            </button>
											<b-dropdown-item value="delete" class="has-text-danger"><i class="fa fa-trash-alt has-mr-1"></i>{{'Удалить'|gettext}}</b-dropdown-item>
										</b-dropdown>
									</div>
								</div>
							</sortable-item>
						</sortable-list>
						<div class="courses-lesson is-link" @click="addLessonForm(cid)">
							<div><div><i class="fa fa-plus has-mr-2"></i>{{'Добавить урок'|gettext}}</div></div>
						</div>
					</div>
<!-- 				</div> -->
				
				</sortable-item>
				</sortable-list>
				
				<div class="courses-module is-link" @click="addModuleForm">
					<div><div><i class="fa fa-plus has-mr-2"></i>{{'Добавить модуль'|gettext}}</div></div>
				</div>
			</div>
			<div v-else class="has-p-2">
				<center><b><a @click="addModuleForm">Добавьте содержание</a></b></center>
			</div>
		</div>
		<div v-show="part == 'contacts'">
			<vue-courses-contacts :course_id="course_id" v-if="isContactsInited"/>
		</div>
		
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
`});

window.$app.defineComponent("courses", "vue-courses-index", {data() {
			return {
				isFetching: false,
				isReadonly: true,
				filter: {query: ''}
			}
		},

		mixins: [ListModel],
		
		props: ['page_id'],
		
		created() {
			this.isReadonly = !this.$auth.isAllowEndpoint('courses/set');
			
			this.$io.on('events:courses.list:refresh', this.refresh);
			
			this.fetchData(true);
		},	
		
		beforeDestroy() {
			this.$io.off('events:courses.list:refresh', this.refresh);
		},
			
		methods: {
            onFilter() {
                this.clearPages();
	            this.fetchData(true);
            },
			
            clickRow(row) {
	            this.$router.push({name: 'courses-course', params: {course_id: row.course_id}});
			},
			
			newCourse() {
				this.$modal('vue-courses-course-form', {course_id: null, page_id: this.page_id}, this);
			},
			
			fetchData(withLoading, force) {
				let resolve = (data) => {
					this.fields = data.fields
				}
				
				if (force || !this.checkCache(resolve)) {
					this.isFetching = withLoading;
					this.$api.post('courses/list', {next: this.next, count: this.perPage, filter: this.filter, sort_field: this.sortField, sort_order: this.sortOrder}).then((data) => {
						this.cachePage(data.response, resolve);

						this.isFetching = false;
					}).catch((error) => {
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
				}
			},
		}, template: `
	<div>
		<vue-component-filterbox :is-visible="fields.length" :disabled="isFetching" v-model="filter" :with-buttons="true" @filter="onFilter">
			<template slot="buttons">
				<a @click="newCourse" class="button is-primary is-fullwidth" :class="{disabled: isReadonly}"><i class='fas fa-plus'></i><span class='is-hidden-touch has-ml-1'>{{'Новый курс'|gettext}} </span></a>
			</template>
		</vue-component-filterbox>
		
		<div class="container has-mb-3">
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @click="clickRow" @sort="onSort" hoverable bordered>
			<b-table-column :label="'Название'|gettext" v-slot="props">
				<span> {{ props.row.title }} </span>
				<span> {{ props.row.tms_created|datetime }} </span>
			</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                    
					<div class="row">
						<div class="col-xs-12 col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
							<h3 class="has-p-2 has-text-grey-light has-text-centered has-mb-2"><i class="fal fa-users-class has-text-grey-light" style="font-size: 5rem"></i></h3>
							<div class="has-mb-2">{{'Курсы'|gettext}}</div>
							<a @click="newCourse" class="button is-primary" :class="{disabled: isReadonly}"><i class='fas fa-plus'></i><span class='has-ml-1'>{{'Новый курс'|gettext}} </span></a>
						</div>
					</div>
                    
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
		</b-table>
		</div>
	</div>
`});

window.$app.defineComponent("courses", "vue-courses-lesson-form", {data() {
			return {
				currentTab: 'common',
				isFetching: false,
				isUpdating: false,
				values: {title: '', subtitle: '', body: null}
			}
		},
		
		mixins: [FormModel],
		props: ['lesson_id', 'module_id'],
		
		watch: {
			values: {
				handler(v) {
					this.$form.top.title = this.values.title?this.values.title:this.$gettext('Урок');
				}, deep: true
			}
		},
		
		created() {
			this.$form.top.title = this.$gettext('Урок');// + (this.values.options.title?(': '+this.values.options.title):'');
			this.$form.top.buttons = {save: {title: this.$gettext('Сохранить'), classname: 'is-primary', click: this.updateData}};

			if (this.lesson_id) {
				this.fetchData();
			} else {
				this.values.module_id = this.module_id;
				this.values.body = {};
			}
		},
		
		methods: {
			fetchData() {
				this.isFetching = true;
				
				this.$api.get('courses/lessons/get', {lesson_id: this.lesson_id}).then((r) => {
					if (r.result == 'success') {
						this.values = r.response.values;
					}
					
					this.isFetching = false;
				});
			},
			
			setTab(v) {
				this.currentTab = v;
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('courses/lessons/set', this.values, this).then((r) => {
					if (r.result == 'success') {
						this.$form.close();
					}
					this.isUpdating = false;
				}).catch(() => {
					this.isUpdating = false;					
				});
			}
		}, template: `
	<div class="has-mb-3">
	<div class="top-panel has-mb-3">
		<div class="container">
		<div class="scrolling-container is-submenu">
			<div style="overflow-x: scroll">
				<a class="button" :class="{active: 'common' == currentTab}" @click="setTab('common')">{{'Контент'|gettext}}</a>
				<a class="button" :class="{active: 'options' == currentTab}" @click="setTab('options')">{{'Настройки'|gettext}}</a>
			</div>
		</div>
		</div>
	</div>
		
	<div class="container" v-show="'common' == currentTab">
<!-- 			<p class="modal-card-title"><span v-if="values.course_id">{{'Редактирование урока'|gettext}}</span><span v-else>{{'Новый урок'|gettext}}</span></p> -->
			<b-field :label="'Название урока'|gettext" :message="errors.title" :class="{'has-error': errors.title}">
            	<b-input v-model="values.title" maxlength="255" :has-counter="false" class="has-rtl" v-focus :placeholder="'Заголовок'|gettext"></b-input>
			</b-field>

			<b-field :message="errors.subtitle" :class="{'has-error': errors.subtitle}">
				<b-input v-model="values.subtitle" maxlength="255" :has-counter="false" class="has-rtl" :placeholder="'Подзаголовок'|gettext"></b-input>
			</b-field>
			
			<vue-component-htmleditor v-model="values.body" v-if="values.body"></vue-component-htmleditor>
<!--
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
-->
	</div>
	<div class="container" v-show="'options' == currentTab">
		<div class="row">
			<div class="col-xs-12 col-sm-3">
			<b-field label="Ожидание перед открытием урока" :message="errors.delay" :class="{'has-error': errors.delay}">
				<vue-component-delay-input v-model="values.delay" />
	<!-- 			<b-input v-model="values.delay" type="number" :has-counter="false" class="has-rtl"></b-input> -->
			</b-field>
			</div>
		</div>
	</div>	
	</div>
`});

window.$app.defineComponent("courses", "vue-courses-module-form", {data() {
			return {
				isFetching: false,
				isUpdating: false,
				values: {}
			}
		},
		
		mixins: [FormModel],
		props: ['module_id', 'course_id'],
		
		created() {
			if (this.module_id) {
				this.fetchData();
			} else {
				this.values.course_id = this.course_id;
			}
		},
		
		methods: {
			fetchData() {
				this.isFetching = true;
				
				this.$api.get('courses/modules/get', {module_id: this.module_id}).then((r) => {
					if (r.result == 'success') {
						this.values = r.response.values;
					}
					
					this.isFetching = false;
				});
			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('courses/modules/set', this.values, this).then((r) => {
					if (r.result == 'success') {
						this.$parent.close();
					}
					this.isUpdating = false;
				}).catch(() => {
					this.isUpdating = false;					
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title"><span v-if="values.course_id">{{'Редактирование модуля'|gettext}}</span><span v-else>{{'Новый модуль'|gettext}}</span></p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-field :label="'Название модуля'|gettext" :message="errors.title" :class="{'has-error': errors.title}">
            	<b-input v-model="values.title" maxlength="255" :has-counter="false" class="has-rtl" v-focus></b-input>
			</b-field>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark level-item" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</div>
`});
window.$app.defineModule("courses", []);