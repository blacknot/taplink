
window.$app.defineComponent("design", "vue-design-editor-modal", {props: ['theme', 'group_id', 'design_id'],
		
		methods: {
			themeChanged(v) {
				this.$parent.$parent.themeChanged(v);
			},
			
			cancel() {
				this.$parent.$parent.editThemeCancel();
				this.$parent.close();
			},
			
			save() {
				this.$parent.$parent.editThemeSave();
				this.$parent.close();
			}
		}, template: `
	<div class="modal-card design-modal-form">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Редактирование дизайна'|gettext}}</p>
			<button class="modal-close is-large" @click="cancel"></button>
		</header>
		<section class="modal-card-body is-paddingless" style="position: relative">
			<vue-design-editor :theme="theme" :group_id="group_id" :design_id="design_id" @update:theme="themeChanged" ref="editor"></vue-design-editor>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button class="button is-light" @click="$refs.editor.sectionAdd()"><i class="fas fa-plus"></i></button>
			</div>
			<div class="level-right">
				<button class="button is-dark" type="button" @click="cancel">{{'Отмена'|gettext}}</button>
				<button class="button is-primary" @click="save">{{'Сохранить'|gettext}}</button>
			</div>
		</footer>
	</div>
`});

window.$app.defineComponent("design", "vue-design-editor", {data() {
			return {
				part: 1
			}
		},
		
		props: ['theme', 'group_id', 'design_id'],
		
		watch: {
			theme: {
				handler(v) {
					this.$emit('update:theme', this.theme);
				},
				deep: true
			},
			
			part(v) {
				let o = null;
				switch (v) {
					case 'block':
						this.$parent.view = 'pictures';
						o = $mx(this.$refs.b3);
						break;
					default:
						if ((typeof v == 'string' && v.substring(0, 1) == 's')) {
							o = $mx(this.$refs[v]);
							this.$parent.view = 'section';
							this.$parent.section = v.substring(1);
							
						} else {
							o = $mx(this.$refs['b'+v]);
							this.$parent.view = '';
						}
						break;
				}

				if (this.$device.mobile) this.$nextTick(() => { scrollIt(o.position().top + 1, 'y', o.closest('section')[0]); });
				this.$emit('update:theme', this.theme);
			}
		},
		
		computed: {
			isAllow() {
				return (this.design_id == 0) || this.$auth.isAllowEndpoint('design/manage/update');
			}
		},
		
		methods: {
			addExtended() {
				this.theme.options.extended.items.push({title: {en: ''}, html: '', css: ''});
				this.editExtended(this.theme.options.extended.items.length - 1);
			},
			
			baseCssExtended() {
				this.$modal('vue-design-extended-form', {extended: this.theme.options.extended, index: -1}).then(modal => {
					modal.$on('save', (d) => {
						this.theme.options.extended.base = d;
					});
				});
			},
			
			editExtended(index) {
				this.$modal('vue-design-extended-form', {extended: this.theme.options.extended, index: index}).then(modal => {
					modal.$on('save', (d) => {
						this.$set(this.theme.options.extended.items, index, d);
					});
				});
			},
			
			deleteExtended(index) {
				this.$confirm('Удалить анимацию?').then(() => {
					this.$delete(this.theme.options.extended.items, index);
				});
			},
			
/*
			activePicturesChooser(v) {
				this.$parent.view = v?'pictures':'';
			},
*/
			properyChanged(base, section, name, revert = false) {
				return this.isAllow?StylesFactory.properyChanged(base, section, name, revert, this):null;
			},
			
			selectPart(p) {
				this.part = (this.part == p)?null:p;
			},
			
			sectionAdd() {
				this.$confirm(this.$gettext('Добавить новую секцию?')).then(() => {
// 					if (this.theme.options.sections == undefined) this.$set(this.theme.options, 'sections', {_: 0});
					let idx = ++this.theme.options.sections._;
					let o = this.theme.options;
					
					this.$set(this.theme.options.sections, idx, StylesFactory.getDefaultSection(o));
					
					this.part = 's'+idx;//theme.options.sections._;
					
					if (!this.$device.mobile) this.$nextTick(() => {
						o = $mx(this.$refs[this.part]);
						scrollIt(o.offset().top - 35, 'y');
					});
				})
			},
			
			sectionDelete(idx) {
				this.$confirm(this.$gettext('Вы хотите удалить эту секцию?')).then(() => {
					this.$delete(this.theme.options.sections, idx);
				});
			}
		}, template: `
	<div :class="{disabled: !isAllow || !$auth.isAllowTariff('pro')}" v-if="theme">

	<div class="design-panel is-white" :class="{in: part == 1}" ref='b1'>
	<p @click="selectPart(1)">{{'Общие'|gettext}}</p>
	<div>
		<div class="has-mb-2">
			<vue-component-colorpicker v-model="theme.options.avatar.color" :label="'Цвет названия профиля'|gettext" />
		</div>

		<div class="has-mb-2 with-label color-picker-container">
			<label class="form-control-static">{{'Заголовок'|gettext}}</label>
			<div class="component-group">
				<vue-component-font-weight-chooser v-model="theme.options.heading.weight" :with-arrow="false" :font="theme.options.heading.font" />
				<vue-component-text-transform-chooser v-model="theme.options.heading.transform" :with-arrow="false" />
				<vue-component-font-chooser v-model="theme.options.heading.font" view="name" />
				<vue-component-colorpicker v-model="theme.options.heading.color" design="circle" :with-arrow="false" position-horizontal="left"/>
			</div>
		</div>

		<div class="with-label color-picker-container">
			<label class="form-control-static">{{'Текст'|gettext}}</label>
			<div class="component-group">
				<vue-component-font-chooser v-model="theme.options.screen.font" view="name" />
				<vue-component-colorpicker v-model="theme.options.screen.color" design="circle" :with-arrow="false" position-horizontal="left"/>
			</div>
		</div>
	</div>
	</div>
	
	<div class="design-panel is-white" :class="{in: part == 2}" ref='b2'>
	<p @click="selectPart(2)">{{'Ссылки'|gettext}}</p>
	<div>
		<div class="has-mb-2 with-label color-picker-container">
			<label class="form-control-static">{{'Заголовок ссылки'|gettext}}</label>
			<div class="component-group">
				<vue-component-font-weight-chooser v-model="theme.options.link.weight" :with-arrow="false" :font="theme.options.link.font" />
				<vue-component-text-transform-chooser v-model="theme.options.link.transform" :with-arrow="false" :font="theme.options.link.transform" />
				<vue-component-font-chooser v-model="theme.options.link.font" view="name" />
				<vue-component-colorpicker v-model="theme.options.link.color" design="circle" :with-arrow="false" position-horizontal="left"/>
			</div>
		</div>

		<div class="has-mb-2 with-label color-picker-container">
			<label class="form-control-static">{{'Подзаголовок ссылки'|gettext}}</label>
			<div class="component-group">
				<vue-component-font-chooser v-model="theme.options.link.subtitle.font" view="name" />
				<vue-component-colorpicker v-model="theme.options.link.subtitle.color" design="circle" :with-arrow="false" position-horizontal="left"/>
			</div>
		</div>

		<div class="has-mb-2">
			<vue-component-colorpicker v-model="theme.options.link.bg" :label="'Цвет фона ссылки'|gettext" />
		</div>
		
		<div class="has-mb-2 link-styles-container">
			<label class="form-control-static">{{'Прозрачность ссылки'|gettext}}</label>
			<vue-component-design-transparent-cooser v-model="theme.options.link.transparent" :disabled="!isAllow" />
<!--
			<div class="select">
			<select v-model="theme.options.link.transparent" :disabled="!isAllow">
				<option :value="v" v-for="v in [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]">{{v}}%</option>
			</select>
			</div>
-->
		</div>
		
		<transition name="fade">
		<div class="has-mb-2 link-styles-container" v-if="theme.options.link.transparent">
			<label class="form-control-static">{{'Толщина границы'|gettext}}</label>
			<input type="number" v-model.number="theme.options.link.border.width" max="10" min="0" class="input" style="width: 100px">
		</div>
		</transition>
<!-- 						<div class="has-mb-2"><mx-toggle v-model="theme.options.link.radius" value="40px" :space-between="true" :title="'Закругленная ссылка'|gettext" :disabled="design_id != 0"></mx-toggle></div> -->

		<div class="has-mb-2 link-styles-container">
			<label class="form-control-static">{{'Тень ссылки'|gettext}}</label>
			<vue-component-shadow-chooser v-model="theme.options.link.shadow" />
		</div>
		
		<div class="has-mb-2 link-styles-container">
			<label class="form-control-static">{{'Эффект при наведении'|gettext}}</label>
			<div class="select">
			<select v-model="theme.options.link.hover" :disabled="!isAllow">
				<option value="0">{{'Нет'|gettext}}</option>
				<option value="1">{{'Прозрачность'|gettext}}</option>
				<option value="2">{{'Увеличение'|gettext}}</option>
			</select>
			</div>
		</div>
		
		<div class="has-mb-2 link-styles-container">
			<label class="form-control-static">{{'Скругление ссылки'|gettext}}</label>
			<vue-component-design-radius-chooser v-model="theme.options.link.radius"></vue-component-design-radius-chooser>
		</div>

		<div class="has-mb-2 link-styles-container">
			<label class="form-control-static">{{'Стиль ссылки'|gettext}}</label>
			<ul class="link-styles">
				<li class="link-styles-center" :class="{in: theme.options.link.align == 'center'}" @click="theme.options.link.align = 'center'"><dd></dd></li>
				<li class="link-styles-left fa" :class="{in: theme.options.link.align == 'left'}" @click="theme.options.link.align = 'left'"><dd></dd></li>
			</ul>
		</div>
		
		<transition name="fade">
		<div class="link-styles-container" v-if="theme.options.link.align == 'center'">
			<label class="form-control-static">{{'Миниатюра'|gettext}}</label>
			<ul class="link-styles link-thumbs">
				<li class="link-thumb-left" :class="{in: theme.options.link.thumb == 'left'}" @click="theme.options.link.thumb = 'left'"><dt></dt><dd></dd><dt></dt></li>
				<li class="link-thumb-center" :class="{in: theme.options.link.thumb == 'center'}" @click="theme.options.link.thumb = 'center'"><dt></dt><dd></dd><dt></dt></li>
			</ul>
		</div>
		</transition>
	</div>
	</div>
	
	<div class="design-panel is-white" :class="{in: part == 'block'}" ref='b3'>
	<p @click="selectPart('block')">{{'Блоки'|gettext}}</p>
	<div>
		<div class="link-styles-container has-mb-2">
			<label class="form-control-static">{{'Скругление блока'|gettext}}</label>
			<vue-component-design-radius-chooser v-model="theme.options.block.radius"></vue-component-design-radius-chooser>
		</div>
		<div class="link-styles-container">
			<label class="form-control-static">{{'Карусель картинок'|gettext}}</label>
			<vue-component-design-pictures-chooser v-model="theme.options.block.pictures" />
		</div>
	</div>
	</div>	

	<div class="design-panel is-white" :class="{in: part == 4}" ref='b4'>
	<p @click="selectPart(4)">{{'Фон'|gettext}}</p>
	<div>
		<vue-component-background-editor v-model="theme.options.bg" />
		<mx-toggle v-model="theme.options.bg.fixed" :space-between="true" :title="'Фиксировать при прокрутке'|gettext" class="has-mb-2"></mx-toggle>
	</div>
	</div>

	<div class="design-panel is-white" :class="{in: part == 5}" ref='b5' v-if="$auth.hasFeature('design_animations')">
	<p @click="selectPart(5)">{{'Анимация'|gettext}}</p>
	<div>
		<b-table :data="theme.options.extended.items" :mobile-cards="false" class="table-header-hide has-mb-2" v-if="theme.options.extended.items.length">
			<b-table-column field="title" v-slot="props">
			<div style="display: flex;justify-content: space-between">
			<span>
				<span v-if="props.row.title.en">{{props.row.title.en}}</span>
				<span class="has-text-grey" v-else>{{'Без имени'|gettext}}</span>
			</span>
			<span>
				<a @click="deleteExtended(props.index)" class="has-text-danger">{{'Удалить'|gettext}}</a><span class="has-ml-1 has-mr-1">&bull;</span>
				<a @click="editExtended(props.index)">{{'Редактировать'|gettext}}</a>
			</span>
			</div>
			</b-table-column>
		</b-table>
		<button class="button is-light" @click="addExtended"><i class="fa fa-plus has-mr-1"></i>{{'Новая анимация'|gettext}}</button>
		<button class="button is-light" @click="baseCssExtended">{{'Базовые стили'|gettext}}</button>
	</div>
	</div>
	
	<div class="design-panel is-white" :class="{in: part == 's' + i}" v-for="(s, i) in theme.options.sections" v-if="i != '_'" :ref="'s'+i">
	<p @click="selectPart('s' + i)">{{'Секция'|gettext}}<span v-if="_.size(theme.options.sections) > 2"> {{i}} </span> <a class="has-text-danger is-text has-ml-2" @click.prevent.stop="sectionDelete(i)" v-if="part == 's' + i"><i class="fal fa-trash-alt"></i></a></p>
	<div>
		<div class="link-styles-container has-mb-2">
			<label class="form-control-static">{{'Отступ сверху'|gettext}}</label>
			
			<div style="width:120px">
				<div class="row row-small">
					<div class="col-xs col-shrink" style="display: flex;align-items: center">
						<b v-if="s.padding.top">{{s.padding.top}}x</b>
						<b v-else>{{'Нет'|gettext}}</b>
					</div>
					<div class="col-xs">
						<b-slider :min="0" :max="4" :tooltip="false" v-model="s.padding.top" size="is-line" rounded>
						<template v-for="(s, i) in [0, 1, 2, 3, 4, 5]">
			            	<b-slider-tick :value="i" :key="i"></b-slider-tick>
						</template>
						</b-slider>
					</div>
				</div>
			</div>
		</div>

		<div class="link-styles-container has-mb-2">
			<label class="form-control-static">{{'Отступ снизу'|gettext}}</label>
			
			<div style="width:120px">
				<div class="row row-small">
					<div class="col-xs col-shrink" style="display: flex;align-items: center">
						<b v-if="s.padding.bottom">{{s.padding.bottom}}x</b>
						<b v-else>{{'Нет'|gettext}}</b>
					</div>
					<div class="col-xs">
						<b-slider :min="0" :max="4" :tooltip="false" v-model="s.padding.bottom" size="is-line" rounded>
						<template v-for="(s, i) in [0, 1, 2, 3, 4, 5]">
			            	<b-slider-tick :value="i" :key="i"></b-slider-tick>
						</template>
						</b-slider>
					</div>
				</div>
			</div>
		</div>

		<mx-toggle v-model="s.indent.on" :space-between="true" :title="'Отступ сбоку'|gettext" :disabled="s.bg.size == 'adaptive'"></mx-toggle>
		
		<div class="has-mt-2 link-styles-container" v-if="s.indent.on">
			<label class="form-control-static">{{'Скругление секции'|gettext}}</label>
			<vue-component-design-radius-chooser v-model="s.indent.radius"></vue-component-design-radius-chooser>
		</div>
		
	</div>
	<div>
		<vue-component-background-editor v-model="s.bg" :sizes="s.indent.on?['width', 'tile']:['adaptive', 'width', 'tile']" :withOpacityBackground="true" />
	</div>
	<div>
		<div class="link-styles-container has-mb-2">
			<label class="form-control-static"><span :class="properyChanged(theme.options.heading, s.heading, 'heading')" @click="properyChanged(theme.options.heading, s.heading, 'heading', true)">{{'Заголовок'|gettext}}</span></label>
			<div class="component-group">
				<vue-component-font-weight-chooser v-model="s.heading.weight" :with-arrow="false" :font="s.heading.font" />
				<vue-component-text-transform-chooser v-model="s.heading.transform" :with-arrow="false" />
				<vue-component-font-chooser v-model="s.heading.font" view="name" />
				<vue-component-colorpicker v-model="s.heading.color" design="circle" :withArrow="false" position-horizontal="left"/>
			</div>
		</div>
		<div class="link-styles-container">
			<label class="form-control-static"><span :class="properyChanged(theme.options.screen, s.text, 'text')" @click="properyChanged(theme.options.screen, s.text, 'text', true)">{{'Текст'|gettext}}</span></label>
			<div class="component-group">
				<vue-component-font-chooser v-model="s.text.font" view="name" />
				<vue-component-colorpicker v-model="s.text.color" design="circle" :withArrow="false" position-horizontal="left"/>
			</div>
		</div>
	</div>
	<div>
		<div class="link-styles-container has-mb-2">
			<label class="form-control-static"><span :class="properyChanged(theme.options.link, s.link, 'link')" @click="properyChanged(theme.options.link, s.link, 'link', true)">{{'Цвет заголовка ссылки'|gettext}}</span></label>
			<vue-component-colorpicker v-model="s.link.color" :disabled="!isAllow" position-horizontal="left"/>
		</div>

		<div class="link-styles-container has-mb-2">
<!-- 			v-on:input="s.link.color = $event" -->
			<label class="form-control-static"><span :class="properyChanged(theme.options.link.subtitle, s.link.subtitle, 'link.subtitle')" @click="properyChanged(theme.options.link.subtitle, s.link.subtitle, 'link.subtitle', true)">{{'Цвет подзаголовка ссылки'|gettext}}</span></label>
			<vue-component-colorpicker v-model="s.link.subtitle.color" :disabled="!isAllow" position-horizontal="left"/>
		</div>

		<div class="has-mb-2 link-styles-container">
			<label class="form-control-static"><span :class="properyChanged(theme.options.link, s.link, 'link.bg')" @click="properyChanged(theme.options.link, s.link, 'link.bg', true)">{{'Цвет фона ссылки'|gettext}}</span></label>
			<vue-component-colorpicker v-model="s.link.bg" :disabled="!isAllow" position-horizontal="left"/>
		</div>

		<div class="has-mb-2 link-styles-container">
			<label class="form-control-static"><span :class="properyChanged(theme.options.link, s.link, 'link.transparent')" @click="properyChanged(theme.options.link, s.link, 'link.transparent', true)">{{'Прозрачность ссылки'|gettext}}</span></label>
			<vue-component-design-transparent-cooser v-model="s.link.transparent" :disabled="!isAllow" />
<!--
			<div class="select">
			<select v-model="s.link.transparent" :disabled="!isAllow">
				<option :value="v" v-for="v in [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]">{{v}}%</option>
			</select>
			</div>
-->
		</div>
		
		<transition name="fade">
		<div class="has-mb-2 link-styles-container" v-if="s.link.transparent">
			<label class="form-control-static"><span :class="properyChanged(theme.options.link.border, s.link.border, 'link.border')" @click="properyChanged(theme.options.link.border, s.link.border, 'link.border', true)">{{'Толщина границы'|gettext}}</span></label>
			<input type="number" v-model.number="s.link.border.width" max="10" min="0" class="input" style="width: 100px">
		</div>
		</transition>
		
		<div class="link-styles-container">
			<label class="form-control-static"><span :class="properyChanged(theme.options.link.shadow, s.link.shadow, 'link.shadow')" @click="properyChanged(theme.options.link.shadow, s.link.shadow, 'link.shadow', true)">{{'Тень ссылки'|gettext}}</span></label>
			<vue-component-shadow-chooser v-model="s.link.shadow"></vue-component-shadow-chooser>
		</div>
	</div>
	</div>
	
	<div class="design-panel is-plus has-text-primary is-hidden-mobile" @click="sectionAdd"><p>{{'Добавить секцию'|gettext}}</p></div>

	</div>
`});

window.$app.defineComponent("design", "vue-design-extended-form", {data() {
			return {
				data: null
			}
		},
		
		props: ['extended', 'index'],
		
		created() {
			this.data = this.$clone((this.index == -1)?this.extended.base:this.extended.items[this.index]);
		},
		
		mounted() {
			this.update();
		},
		
		methods: {
			update() {
				StylesFactory.updateCSSBlock(this.data.css, this.$refs.styles);
				StylesFactory.updateCSSBlock(this.extended.base.css, this.$refs.styles_base);
			},
			
			save() {
				this.$parent.$emit('save', this.data);
				this.$parent.close();
			}
		}, template: `
	<div class="modal-card is-fullscreen">
		<header class="modal-card-head">
			<p class="modal-card-title"><input type="text" v-model="data.title.en" placeholder="Без имени" class="input is-large is-paddingless" style="border: 0;box-shadow: none" v-if="index != -1"><span v-else>Базовые стили</span></p>
			<button class="button is-light" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary has-ml-1" type="button" @click="save">{{'Сохранить'|gettext}}</button>
		</header>
		<section class="modal-card-body is-paddingless extended-editor">
			<div class="row is-marginless">
				<div class="col-xs-6 is-paddingless">
					<div class="extended-editor-panel" v-if="index != -1">
						<label>HTML</label>
						<vue-component-codemirror v-model="data.html"></vue-component-codemirror>
					</div>
					<div class="extended-editor-panel">
						<label>CSS</label>
						<vue-component-codemirror v-model="data.css" mode="text/css" @input="update"></vue-component-codemirror>
						<label>&nbsp;</label>
					</div>
				</div>
				<div class="col-xs-6 is-paddingless">
					<div class="extended-editor-panel">
					<label>Preview</label>
					<div style="transform: translate(0, 0);height:100%" class="has-transparent-bg page">
						<div ref='styles'></div>
						<div ref='styles_base'></div>
						<div class="theme-main" v-html="data.html"></div>
					</div>
					<label>&nbsp;</label>
					</div>
				</div>
			</div>
		</section>
	</div>
`});

window.$app.defineComponent("design", "vue-design-index", {data() {
			return {
				isUpdating: false,
				isSetting: false,
				isFetching: false,
				isDeleting: false,
				isAllowPro: false,
				isScrollingThemes: false,
				groups: [{group_id: 0, groupname: this.$gettext('Мои дизайны')}, {group_id: 1, groupname: this.$gettext('Стандартные')}],
				designs: [],
				designsTitles: [],
				themes: {},
				design_id: null,
				theme_id: null,
				need_theme_id: null, //Открыть эту тему после загрузки 
				current_theme_id: null,
				current_design_id: null,
				current_group_id: null,
				fetchingGroups: [],
				isFetchingThemes: false,
				deltaMouseWheel: 0,
				timerMouseWheel: null,
				tmpTheme: null,
				stopTransition: false,
				
				deviceFix: '',
				devicePageFix: {},
				buttonsPanelFix: {},
				deviceParentFix: '',
				
				themeScrollIndex: 0,
				themeIndex: 0,
				mode: 'themes',
				stage: 0,
				stageEnded: false,
				
				select_theme: null,
				widthDevice: 395,
				
				touchClientX: 0,
				touchClientY: 0,
				touchMouseStarted: false,
				demoText: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
				view: '',
				section: null,
				widthScrollView: 0,
				buttonsHide: true,
				viewModal: null
			}
		},
		
		props: {group_id: Number, page_id: Number},

		created() {
			this.isAllowPro = this.$auth.isAllowTariff('pro');
			this.select_theme = this.$account.theme;
			
			this.current_theme_id = this.$account.theme_id;
			
			this.$page.fetchData(this.page_id, false);
			this.group_id = parseInt(this.group_id);
			
			//this.fetchData(true);

			$mx(window).on('resize orientationchange scroll', this.scrollCheck);
		},
		
		destroyed() {
			$mx(window).off('resize orientationchange scroll', this.scrollCheck);
		},
		
		beforeRouteEnter (to, from, next) {
			$mx(document.body).addClass('is-hide-support');
			next();
		},
		
		beforeRouteLeave (to, from, next) {
			if (this.mode == 'edit') this.editThemeCancel();
			if (this.mode == 'view_modal') this.viewThemeCancel();
			$mx(document.body).removeClass('is-hide-support');
			next();
		},
		
		computed: {
			withView() {
				return this.$page.data.blocks_order.length > 1;
			},

			show_theme_editor() {
				return !this.$auth.isAllowTariff('pro') && !this.design_id && !this.isFetching && !this.$device.mobile && (this.themes[0] != undefined) && (this.themes[0].length < 2);
			},
			
			theme_editor() {
				if (this.show_theme_editor) {
					return this.prepare_theme_editor(this.$account.theme);
				} else {
					return this.tmpTheme;
				}
			},
			
			translateThemesScroll() {
				let max = Math.max(0, (this.themes[this.design_id] == undefined)?0:((this.widthDevice * this.themes[this.design_id].length) - this.widthScrollView));
				
				let w = (this.themeScrollIndex*this.widthDevice)+this.deltaMouseWheel;
				return - (this.$device.mobile?w:Math.min(max, Math.max(0, w - (this.widthScrollView - this.widthDevice)/ 2)));
			},
			
			isAdmin() {
				return this.$auth.isAllowEndpoint('design/manage/list') || this.$auth.isAllowEndpoint('design/manage/move') || this.$auth.isAllowEndpoint('design/manage/clone') || this.$auth.isAllowEndpoint('design/manage/reorder');
			},
/*
			current() {
// 				let t = this.themes[this.$account.theme_id];
				return this.select_theme?this.buildStyles(this.select_theme, true):{screen: null};
			},
*/
			menu() {
				return _.map(this.groups, (v, k) => { return {/* name: 'design', */ meta: {title: v.groupname}, params: {group_id: v.group_id}} } );
			},
			
			designTitle() {
				if (this.mode == 'edit') return '';
				if (this.mode == 'view') return this.$gettext('Предпросмотр');
				if (this.design_id == 0) {
					return this.$gettext('Мои дизайны');
				}
				else if (this.designsTitles[this.design_id] != undefined) {
					return this.$gettext(this.designsTitles[this.design_id]);
				} else {
					return this.$gettext('Выберите цветовую схему');
				}
			},
			
			showSection() {
				return this.view == 'section';
			}
		},
		
		mixins: [FormModel],

		watch: {
			group_id(v) {
				this.group_id = parseInt(v);
				
				this.fetchData();
				if (this.mode == 'edit') this.editThemeCancel();
				if (this.mode == 'view' || this.mode == 'view_modal') this.viewThemeCancel();
			},
			
			theme_id(v) {
				this.setThemeId(v);
			},
		},

		methods: {
			keyboardMove(e) {
				if (this.mode == 'edit' || this.themes[this.design_id] == undefined) return;
				let themes = this.themes[this.design_id];
				if (e.keyCode == 37 && this.themeIndex > 0) this.prevTheme();
				if (e.keyCode == 39 && this.themeIndex < themes.length-1) this.nextTheme();

				if (e.keyCode == 27 && (this.mode == 'view')) this.viewThemeCancel();
			},
			
			nextTheme() {
				let themes = this.themes[this.design_id];
				this.setThemeId(themes[this.themeIndex+1].theme_id, true);
			},
			
			prevTheme() {
				if (this.group_id == 0 && this.themeIndex == 1) return;
				
				let themes = this.themes[this.design_id];
				this.setThemeId(themes[this.themeIndex-1].theme_id, true);
			},
			
			nextScroll(e) {
				if (this.mode == 'view') {
					this.nextTheme();
				} else  {
					this.themeScrollIndex = Math.min(this.themes[this.design_id].length - 1, this.themeScrollIndex + Math.floor(this.$refs.device.clientWidth / this.widthDevice));
				}
			},
			
			prevScroll() {
				if (this.mode == 'view') {
					this.prevTheme();
				} else {
					this.themeScrollIndex = Math.max(0, this.themeScrollIndex - Math.floor(this.$refs.device.clientWidth / this.widthDevice));
				}
			},
			
			scrollCheckForce(delay) {
				setTimeout(() => {
					this.$nextTick(this.scrollCheck);
				}, delay)
			},

			scrollCheck() {
				if (this.$refs.device == undefined) return;
				
				const scrollY = window.scrollY;
// 				const visible = document.documentElement.clientHeight;
				const visible = window.innerHeight || document.documentElement.clientHeight;
				const buttonsPanelHeight = (this.$refs.buttonsPanel == undefined)?0:this.$refs.buttonsPanel.clientHeight;
				
				let w = ((scrollY > this.$refs.device.offsetTop));
				
				this.widthScrollView = this.$refs.device.clientWidth;
				
				let device = $mx(this.$refs.device);
				let t = device.offset().top;
				let dd = device.find('.device.in');
				let h = dd.length?dd[0].clientHeight:0;
				
				let needFix = ((this.mode == 'edit') && (document.documentElement.scrollHeight - (h + 35) - scrollY - 35 > 0 + 35))?true:false;
				
				this.deviceFix = (w && this.stageEnded)?(needFix?'position:fixed;top:35px;left:auto;':'margin-bottom: 2rem;'):'';
				this.devicePageFix = (w && this.stageEnded)?(needFix?{position:'fixed',top: '35px', left: 'auto'}:{left:'auto', bottom: '35px'}):null;
				this.deviceParentFix = (w && this.stageEnded)?(needFix?'':'bottom: 0'):'';
				
				
// 				this.buttonsPanelFix = (this.$refs.buttonsPanel != undefined && (scrollY + visible < this.$refs.device.offsetTop + h + this.$refs.buttonsPanel.clientHeight + 30))?{position:'fixed', bottom: '2.5rem', top: 'auto', left:0}:null;
				
// 				this.buttonsPanelFix =  (t+h > (visible + scrollY-buttonsPanelHeight+60))?{position:'fixed', bottom: '2.5rem', top: 'auto', left:0}:{position:'absolute', bottom: 'auto', top:(h-20-buttonsPanelHeight)+'px', left: 0};
				
				this.widthDevice = this.$device.mobile?253:395;
				
				if (['edit', 'view'].indexOf(this.mode) != -1)	 {
					if (w && needFix) {
						this.buttonsPanelFix = {top: Math.min(650, (visible - buttonsPanelHeight - 60))+'px', bottom: 'auto'};
					} else {
						let top = (t+h > (visible + scrollY-buttonsPanelHeight+60))?((visible + scrollY-buttonsPanelHeight+60) - t - h + (needFix?10:-10)):0;
						this.buttonsPanelFix = {transform: this.$device.mobile?null:('translate(0, '+top+'px)')};
					}
				} else {
					let top = (t+h > (visible + scrollY-buttonsPanelHeight+60))?((visible + scrollY-buttonsPanelHeight+60) - t - h):0;
					this.buttonsPanelFix = {transform: this.$device.mobile?null:('translate('+this.themeIndex*this.widthDevice+'px, '+top+'px)')};
				}
			},
			
			setThemeId(v, need_move = false) {
				let idx = 0;
				this.select_theme = this.themes[this.design_id][0];
				for (let i = 0; i < this.themes[this.design_id].length; i++) {
					let t = this.themes[this.design_id][i];
					if (t.theme_id == v) {
						idx = i;
						this.select_theme = t;
						break;
					}
				}
				
				this.theme_id = v;
					
				if (this.$device.mobile || need_move) this.themeScrollIndex = idx;
				this.themeIndex = idx;
				if (this.mode == 'view' || this.mode == 'view_modal') this.viewTheme();
				
				this.scrollCheck();
			},
			
			themeChanged(v) {
				this.$nextTick(this.scrollCheck);
				this.prepareThemes([v]);
			},
			
			onAction(v) {
				switch (v) {
					case 'clone':
						this.cloneTheme();
						break;
					case 'manage':
						this.$modal('vue-design-manage-form', {}, this);
						break;
					case 'move':
						this.$modal('vue-design-move-form', {theme_id: this.theme_id}, this);
						break;
					case 'delete':
						this.deleteTheme();
						break;
					case 'right':
					case 'left':
						let delta = (v == 'right')?1:-1;
						let themes = this.themes[this.design_id];
						let tmp = themes[this.themeIndex+delta];
						this.$api.get('design/manage/reorder', {design_id: this.design_id, theme_ids: [themes[this.themeIndex].theme_id, tmp.theme_id]}).then(d => {
							if (d.result == 'success') {
								let t = themes[this.themeIndex+delta] = themes[this.themeIndex];
								themes[this.themeIndex] = tmp;
								this.$forceUpdate();
								this.setThemeId(t.theme_id, true);
							}
						});
						break;
					case 'tariff':
						let tariff = (this.select_theme.tariff == 'basic')?'pro':'basic';
						this.$api.get('design/manage/tariff', {theme_id: this.theme_id, tariff: tariff}).then(d => {
							this.select_theme.tariff = tariff;
						});
						break;
				}
			},
			
			cloneTheme() {
				this.editThemeInternal();
			},
			
			viewTheme() {
				let t = this.select_theme;

				if (this.$device.mobile) {
					this.$modal('vue-design-view-modal', {theme: t, page_id: this.page_id}, this).then((modal) => {
						this.viewModal = modal;
						this.mode = 'view_modal';
					})
				} else {
					this.stopTransition = true;
					this.buttonsHide = true;
					
					this.mode = 'view';
					this.stage = 1;
					this.$nextTick(() => {
						this.stopTransition = false;
// 						this.$page.fetchData(this.page_id, false).then(() => {
							this.scrollCheckForce(200);
							let styles = {};
							
							this.$page.prepareSections(Vue.prototype.$page.data, styles, t.options, '.theme'+t.theme_id, 'view');
							StylesFactory.updateCSSBlock(styles, this.$refs.styles_view);
							this.buttonsHide = false;
// 						});
					});
				}
			},
			
			prepare_theme_editor(theme) {
				let tmpTheme = this.$clone(theme);
				tmpTheme.options = _.merge(StylesFactory.getBaseStyles(), tmpTheme.options, true);
				
				_.each(tmpTheme.options.sections, (s, i) => {
					if (i != '_') tmpTheme.options.sections[i] = _.merge(StylesFactory.getDefaultSection(tmpTheme.options), s, true);
				});

				return tmpTheme;
			},
			
			editTheme() {
				if (!this.isAllowPro) {
					this.$alert(this.$gettext('Свой дизайн доступен на PRO-тарифе'), 'is-danger');
					return;
				}
				
				if (this.design_id && !this.$auth.isAllowEndpoint('design/manage/update')) {
					this.$confirm(this.$gettext('Вы хотите создать новый дизайн на основе этого?'), 'is-warning', {yes: this.$gettext('Да'), no: this.$gettext('Нет')}).then(this.editThemeInternal);
				} else {
					let tmpTheme = this.prepare_theme_editor(this.themes[this.design_id][this.themeIndex]);
/*
					let tmpTheme = this.$clone(this.themes[this.design_id][this.themeIndex]);
					tmpTheme.options = _.merge(StylesFactory.getBaseStyles(), tmpTheme.options, true);
					
					_.each(tmpTheme.options.sections, (s, i) => {
						if (i != '_') tmpTheme.options.sections[i] = _.merge(StylesFactory.getDefaultSection(tmpTheme.options), s, true);
					});
*/
					
// 					if (tmpTheme.options.link.border.width == undefined) tmpTheme.options.link.border = {width: 2};

					this.tmpTheme = tmpTheme;
					
					if (this.$device.mobile) {
						this.$modal('vue-design-editor-modal', {theme: this.tmpTheme, group_id: this.group_id, design_id: this.design_id}, this);
					} else {
						this.stageEnded = false;
						this.$nextTick(() => {
							this.mode = 'edit';
							this.stage = 1;
							setTimeout(() => {
								this.stage = 2;
								this.scrollCheck();
								setTimeout(() => {
									this.stageEnded = true;
									this.scrollCheckForce();
								}, 400);
							}, 200);
						});
					}
				}
			},
			
			editThemeInternal() {
				this.isUpdating = true;
				this.$api.post('design/create', {theme_id: this.theme_id}, this).then((data) => {
					if (data.result == 'success') {
						let d = data.response;

						
						d.themes = _.map(d.themes, t => { if (t.theme_id) t.options = StylesFactory.checkStyles(t.options); return t } )
						
						if (this.designs[0] == undefined) this.designs[0] = [];

						this.prepareThemes(d.themes);
						this.themes[0] = d.themes;
						
						if (this.group_id == 0) {
/*
							this.current_group_id = this.group_id = 0;
							this.current_design_id = this.design_id = 0;
*/

							// Если это тема с нуля - просто создаем
							this.$nextTick(() => {
								this.setThemeId(d.theme_id);
								this.editTheme();
							});
						} else {
/*
							this.group_id = 0;
							this.design_id = 0;
*/

							// Если это тема на основе другой - нужно перейти в "мои темы" и только потом редактировать
							this.need_theme_id = d.theme_id;
							this.$router.push({name: 'design', params: {page_id: this.page_id, group_id: 0}});
						}
						

/*
						this.$nextTick(() => {
// 							this.setThemeId(d.theme_id);
							this.editTheme();
						});
*/

/*
						this.selectDesign(0);
						this.$nextTick(() => {
							this.setThemeId(this.theme_id = d.theme_id);
							this.editTheme();
						});
*/
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			},

			
			viewThemeCancel() {
				this.stopTransition = true;
				this.buttonsHide = true;
				this.mode = 'themes';
				this.stage = 0;
				
				
				if (this.viewModal != null) {
					this.viewModal.close();
					this.viewModal = null;
				}
				
				setTimeout(() => {
					this.stopTransition = false;
					this.buttonsHide = false;
					this.scrollCheck();
				}, 200);
			},
			
			editThemeCancel() {
				this.stopTransition = true;
				this.buttonsHide = true;
				this.view = '';
				this.section = null;
				
				this.prepareThemes(this.themes[this.design_id]);
				this.tmpTheme = null;
				this.stage = 0;
				this.mode = 'themes';
				
				if (this.viewModal != null) {
					this.viewModal.close();
					this.viewModal = null;
				}

				setTimeout(() => {
					this.stopTransition = false;
					this.buttonsHide = false;
					this.scrollCheck();
				}, 200);
			},
			
			editThemeSave() {
				let theme = this.themes[this.design_id][this.themeIndex] = this.select_theme = this.tmpTheme;
				this.isUpdating = true;
				
				
				let options = _.differenceWith(theme.options, StylesFactory.getBaseStyles());
				if (options.bg != undefined && options.bg.picture != undefined && options.bg.picture.link != undefined && options.bg.picture.picture_id != undefined) delete options.bg.picture.link;

				if (theme.options.sections != undefined && _.size(theme.options.sections) > 1) {
					options.sections = _.clone(theme.options.sections);
					
					if (options.sections != undefined && _.size(options.sections) > 1) {
						let defSection = StylesFactory.getDefaultSection(theme.options);
						_.each(options.sections, (s, i) => {
							if (typeof s == 'object') {
								options.sections[i] = _.differenceWith(s, defSection);
							}
						})
					}
				}
				
				this.$api.post('design/update', {theme_id: this.theme_id, options: options}, this).then((data) => {
					if (data.result == 'success') {
						if (this.theme_id == this.current_theme_id) {
							this.$account.theme = theme.options;
							this.$auth.refreshStyles();
						}
					}
					this.isUpdating = false;
					this.editThemeCancel();
				}).catch((error) => {
					this.isUpdating = false;
				})
			},
			
			newTheme() {
				if (!this.isAllowPro) {
					this.$alert(this.$gettext('Свой дизайн доступен на PRO-тарифе'), 'is-danger');
					return;
				}
				
				this.$confirm(this.$gettext('Вы хотите создать новый дизайн?'), 'is-warning', {yes: this.$gettext('Да'), no: this.$gettext('Нет')}).then(() => {
					//this.select_theme = this.themes[1][0];
					this.editThemeInternal();
				});
			},
			
			themesTouchstart(e) {
				this.touchClientX = e.clientX || e.changedTouches[0].clientX;
				this.touchClientY = e.clientY || e.changedTouches[0].clientY;
				$mx('html').addClass('is-dragging');
				
				if (e.changedTouches == undefined) this.touchMouseStarted = true;
				
				this.stopTransition = true;
			},
			
			themesTouchstop(e) {
				$mx('html').removeClass('is-dragging');
				this.stopTransition = false;
				if ((this.deltaMouseWheel < -20) && (this.themeIndex > 0)) {
					this.themeScrollIndex--;
				} else if ((this.deltaMouseWheel > 20) && (this.themeIndex < this.themes[this.design_id].length - 1)) {
					this.themeScrollIndex++;
				}
				
				if (this.$device.mobile) this.theme_id = this.themes[this.design_id][this.themeScrollIndex].theme_id;
				
				this.touchMouseStarted = false;
				this.deltaMouseWheel = 0;
			},
			
			themesMouseWheel(e) {
				let deltaX = deltaY = 0;
				 
				if (e.changedTouches != undefined) {
					deltaX = this.touchClientX - e.changedTouches[0].clientX;
					deltaY = this.touchClientY - e.changedTouches[0].clientY;
					this.themesTouchstart(e);
				} else {
					if (this.touchMouseStarted) {
						deltaX = this.touchClientX - e.clientX;
						deltaY = this.touchClientY - e.clientY;
						this.touchClientX = e.clientX;
						this.touchClientY = e.clientY;
					} else {
						deltaX = e.deltaX || 0;
						deltaY = e.deltaY || 0;
					}
				}
				
			//	let screenRatio = window.devicePixelRatio || this.$device.mobile?2:1;
				
				if ((this.mode == 'themes') && (Math.abs(deltaX) > Math.abs(deltaY))) {
					e.preventDefault();
					
					this.deltaMouseWheel += deltaX;
					this.isScrollingThemes = true;
					
					if (this.deltaMouseWheel < 0 && this.themeScrollIndex == 0) this.deltaMouseWheel = 0;
					if (this.deltaMouseWheel > 0 && this.themes[this.design_id] != undefined && this.themeScrollIndex == this.themes[this.design_id].length - 1) this.deltaMouseWheel = 0;
					
					let w = 395;// / screenRatio;
					
					if (this.deltaMouseWheel > w) {
						this.themeScrollIndex++;
						this.deltaMouseWheel -= w;
					} else if (this.deltaMouseWheel < -w) {
						this.themeScrollIndex--;
						this.deltaMouseWheel += w;
					}
					
					if (this.$device.mobile) this.theme_id = this.themes[this.design_id][this.themeScrollIndex].theme_id;
	
					if (e.deltaX) {	
						if (this.timerMouseWheel) clearTimeout(this.timerMouseWheel);
						
						this.timerMouseWheel = setTimeout(() => {
							let w = 200;// / screenRatio;
							if (this.deltaMouseWheel > w) {
								this.themeScrollIndex++;
							} else if (this.deltaMouseWheel < -w) {
								this.themeScrollIndex--;
							}
	
							if (this.$device.mobile) this.theme_id = this.themes[this.design_id][this.themeScrollIndex].theme_id;
							this.deltaMouseWheel = 0;
							this.timerMouseWheel = null;
						}, 250);
					}
				}
			},
			
			fetchData(withLoading) {
				if (this.designs[this.group_id] != undefined) {
					if (this.current_group_id == this.group_id) {
						this.selectDesign(this.current_design_id);
					} else {
						this.selectDesign(this.group_id?this.designs[this.group_id][0].design_id:0);
					}
					return;
				} else {
					let group_id = this.group_id;
					this.isFetchingThemes = this.isFetching = withLoading;
					this.fetchingGroups[group_id] = [1, 2, 3];
					
					if (_.size(this.designs)) {
						//this.design_id = null;
						this.buttonsHide = true;
						
						this.$api.get('design/designs', {group_id: group_id}).then((data) => {
							this.buttonsHide = this.isFetchingThemes = this.isFetching = false;

							let d = data.response;
							this.fetchingGroups[group_id] = [];
							this.$set(this.designs, group_id, this.prepareDesigns(d.designs));
							
							this.selectDesign(group_id?this.designs[group_id][0].design_id:0);
	// 						this.setThemeId(this.designs[group_id][0].theme_id);
	// 						this.theme_id = this.designs[group_id][0].theme_id;
							
							this.scrollCheckForce();
						});
					} else {
						this.$api.get('design/current', {group_id: (group_id == -1)?null:group_id}).then((data) => {
							this.fetchingGroups[group_id] = [];
							this.buttonsHide = this.isFetchingThemes = this.isFetching = false;
							let d = data.response;
							
							if (d.group_id != this.group_id) {
								this.$router.replace({name: 'design', params: {group_id: d.group_id}});
							}
							
							this.groups = d.groups;
							this.designs[d.group_id] = this.prepareDesigns(d.designs);
							
							this.group_id = d.group_id;
							this.themes[d.design_id] = _.map(d.themes, t => { if (t.theme_id) t.options = StylesFactory.checkStyles(t.options); return t } );
							
							this.design_id = d.design_id;
							this.current_design_id = d.current_design_id;
							this.current_group_id = d.current_group_id;
							
							this.prepareThemes(d.themes);
							this.setThemeId(d.theme_id, true);

							this.scrollCheckForce();
							this.$nextTick(() => {
								this.moveDesignMenu(0);
							});
						});
					}
				}
			},
			
			prepareDesigns(designs) {
				_.each(designs, (v) => {
					if (v.options != undefined) {
						v.options = StylesFactory.checkStyles(v.options);
						
/*
						if (v.options.bg.opacity == undefined) {
							v.options.bg.opacity = "0.95";
						} else {
							v.options.bg.opacity = v.options.bg.opacity.toString();
						}
*/
						
						v.styles = this.buildStyles(v);
						if (v.title) this.designsTitles[v.design_id] = v.title;
					}
				});
				
				return designs;
			},
			
			prepareThemes(themes) {
				let styles = '';
				_.each(themes, t => {
					let options = Object.assign({}, t.options);
					//if (this.showSection) options = _.merge(options, options.sections[this.showSection], true);
					if (t.theme_id) styles += buildStyles(options, 'design', '.theme'+t.theme_id);
					
					if (this.showSection) {
						styles_sections = {};
						StylesFactory.prepareSectionStyles(_.merge(StylesFactory.getDefaultSection(options), options.sections[this.section]), 1, options, styles_sections, '.theme'+t.theme_id, 'design');
						
						styles += _.values(styles_sections['s:1']).join("\n");
					}
				});
				
				StylesFactory.updateCSSBlock(styles, this.$refs.styles);
				//StylesFactory.prepareStyles(f.block_id, f.block_type_name, f.options, this.styles);
			},
			
			fetchThemes(design_id) {
				return new Promise((resolve, reject) => {
					if (this.themes[design_id] == undefined) {
						this.isFetchingThemes = true;
						this.themeScrollIndex = this.themeIndex = 0;
						
						this.$api.get('design/themes', {design_id: design_id}).then((data) => {
							let d = data.response;
							this.$set(this.themes, design_id,  _.map(d.themes, t => { if (t.theme_id) t.options = StylesFactory.checkStyles(t.options); return t } ));
							this.isFetchingThemes = false;
							resolve(d.themes);
						});
					} else {
						resolve(this.themes[design_id]);
					}
				});
			},
			
			buildStyles(v, view) {
				let o = this.$clone(v.options);

				let r = {
					html_thumb: buildStylesBackground(o, 'html', 'thumb'),
					body_thumb: buildStylesBackground(o, 'body', 'thumb')+';font-family: '+FontsFactory.getFont(o.screen.font)+';color: '+o.screen.color+(v.thumb?(';background:url('+v.thumb+')'):''),
					header_thumb: 'color: '+o.heading.color+';font-family: '+FontsFactory.getFont(o.heading.font)+";text-transform:"+FontsFactory.getTransform(o.heading.transform)+";font-weight:"+FontsFactory.getWeight(o.heading.font, o.heading.weight),
					
					link: 'background: '+(transparentColor(o.link.transparent, o.link.bg))+';border-color:'+o.link.bg+';box-shadow: ' + StylesFactory.getShadow(o.link.shadow)+';border-width:'+o.link.border.width+'px;color: '+o.link.color+';border-radius:'+o.link.radius+'px',
					link_class: (o.link.align == 'left')?'btn-link-align-left':'',
					page_class: StylesFactory.getPageClasses(o)
				};
				
				
				FontsFactory.check();
				
				return r;
			},
			
			setGroup(id) {
				this.group_id = id;
				this.$nextTick(() => {
					this.$refs.scroll.scrollTo(0, 0);
					if (id == 0) this.$refs.tabs.scrollTo(0, 0);
				});
			},
						
			selectDesign(design_id) {
// 				if (design_id == undefined) design_id = this.design_id;
				this.stopTransition = true;
				this.$nextTick(() => {
					if (this.mode == 'edit') this.editThemeCancel();
	
					this.design_id = design_id;
					this.moveDesignMenu();
				
					this.fetchThemes(design_id).then((themes) => {
						this.prepareThemes(themes);
						this.setThemeId(this.need_theme_id?this.need_theme_id:(themes.length?((this.current_design_id == design_id)?this.current_theme_id:themes[0].theme_id):null), true);
						
						if (this.need_theme_id) this.editTheme();
						
						this.need_theme_id = null;
						setTimeout(() => {
							this.stopTransition = false;
						}, 200);
					});
				});
				
			},
			
			moveDesignMenu(duration = 300) {
				if (this.$refs.designList != undefined) /* && (this.themes[this.design_id] != undefined) */ {
					let idx = 0;
					let designs = this.designs[this.group_id];
					
					if (designs.length) {
						for (i = 0; i < designs.length; i++) {
							if (designs[i].design_id == this.design_id) {
								idx = i;
								break;
							}
						}

						let o = this.$refs.designList.children[idx];
						$mx.scrollIt(o.offsetLeft - ((this.$refs.designList.parentNode.offsetWidth - o.offsetWidth) / 2), 'x', this.$refs.designList.parentNode, duration);
					}
				}
			},

			setTheme(t) {
				//if (t) this.selectTheme(t);
				
				if ((t.tariff == 'pro') && !this.isAllowPro) return this.$alert(this.$gettext('Этот дизайн доступен на PRO-тарифе'));
				
				
				if (t.is_pro && !this.isAllowPro) return;
				this.isSetting = true;
				
				let theme_id = this.theme_id;
				let design_id = this.design_id;
				let group_id = this.group_id;
				
				this.$api.post('design/set', {theme_id: theme_id}, this).then((data) => {
					if (data.result == 'success') {
						this.$account.theme_id = this.current_theme_id = theme_id;
						this.$account.theme = StylesFactory.checkStyles(data.response.theme);

						this.current_design_id = design_id;
						this.current_group_id = group_id;
						
						this.$auth.refreshStyles();

						this.current_theme = this.$account.theme;
						this.current_style = this.$account.styles;
						
						this.viewThemeCancel();
					}
					this.isSetting = false;
				}).catch((error) => {
					this.isSetting = false;
				})
			},
			
			deleteTheme() {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить этот дизайн?'), 'is-danger').then(() => {
					this.isDeleting = true;
					
					this.$api.post('design/delete', {theme_id: this.theme_id}, this).then((data) => {
						if (data.result == 'success') this.removeThemeFromList();
						this.isDeleting = false;
					});
				});
			},
			
			removeThemeFromList() {
				this.stopTransition = true;
				let themes = this.themes[this.design_id];
				themes.splice(this.themeIndex, 1);
				this.themeIndex = Math.min(this.themeIndex, themes.length - 1);
				this.theme_id = themes[this.themeIndex].theme_id;
				setTimeout(() => {
					this.stopTransition = false;
				}, 200);							
			},
			
			clearThemesList(design_id) {
				delete this.themes[this.design_id];
			}
		}, template: `
	<div tabindex="0" @keydown="keyboardMove" :class="['design-background', {'has-design-edit-background': mode == 'edit' || show_theme_editor}]">
		<vue-component-submenu :menu="menu" :page_id="page_id"></vue-component-submenu>
		<div ref='styles'></div>
		<div ref='styles_view'></div>
		
		<div class="design-list-panel" :class="{editmode: ['edit', 'view'].indexOf(mode) != -1, 'own-designs': !group_id}">
		<vue-component-vbar v-model="designs[group_id]" class="design-panel-scroller" ref='scroll' shadow="horizontal" :vBarShow="false" :hBarShow="false" :vBarEnabled="false" :hBarEnabled="true" shadow-color="var(--design-shadow-color)" shadow-color-transparent="var(--design-shadow-color-transparent)">
		<div class="design-list" ref="designList">
<!--
			<div class="design-item" v-if="group_id == 0 && (fetchingGroups[group_id] == undefined || !fetchingGroups[group_id].length)">
				<div class="design-block is-main-design" :class="{in: !design_id, current: !current_design_id}" @click="selectDesign(0)">
					<span class="tag is-pro" v-tippy :content="'Свой дизайн доступен на PRO-тарифе'|gettext" v-if="!isAllowPro">pro</span>
					<div style="border: 1px dashed #aaa;box-shadow: none;"><div> <div class="design-block-btn" style="border:1px dashed #aaa;border-radius: 40px">{{'Мои дизайны'|gettext}}</div> </div> </div> 
					<svg width="16" height="6" xmlns="http://www.w3.org/2000/svg" v-if="0 == design_id"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg>
				</div> 
			</div>
-->
			
			<div class="design-item" v-for="i in fetchingGroups[group_id]">
			<div class="design-block">
				<div style="border: 1px solid #d9d9d9;box-shadow: none;"><div>
					<div><div> <span class="skeleton" style="margin:0 auto;width: 60%">Text</span> <div class="design-block-btn skeleton">Link</div> </div> </div>
				</div></div> 
			</div>
			</div>

			<div class="design-item" v-for="(t, index) in designs[group_id]" :class="t.styles.page_class">
				<div class="design-block" :class="{in: t.design_id == design_id, current: t.design_id == current_design_id}" @click="selectDesign(t.design_id)">
<!-- 					<span class="tag is-pro" v-tippy :content="'Этот дизайн доступен на PRO-тарифе'|gettext" v-if="t.is_pro && !isAllowPro">pro</span> -->
					<div :style="t.styles?t.styles.html_thumb:''"><div :style="t.styles?t.styles.body_thumb:''"> <b :style="t.styles?t.styles.header_thumb:''">Heading text</b>Lorem ipsum dolor sit amet, consectetuer adipiscing elit <div class="design-block-btn" :class="t.styles?t.styles.link_class:''" :style="t.styles?t.styles.link:''">{{'Ссылка'|gettext}}</div><div class="design-block-btn" :class="t.styles?t.styles.link_class:''" :style="t.styles?t.styles.link:''">{{'Ссылка'|gettext}}</div> </div> </div>
					<svg width="16" height="6" xmlns="http://www.w3.org/2000/svg" v-if="t.design_id == design_id"><path d="M0 6s1.796-.013 4.67-3.615C5.851.9 6.93.006 8 0c1.07-.006 2.148.887 3.343 2.385C14.233 6.005 16 6 16 6H0z"></svg>
				</div> 
			</div>
			
			<div class="design-item" style="pointer-events: none; visibility: hidden"></div>
		</div>
		</vue-component-vbar>
		</div>
		
<!--
		<div class="theme-panel">
			<div style="padding:0 1rem">
				<vue-component-vbar class="theme-panel-scroller" ref='scroll' shadow="horizontal" shadow-color="var(--design-shadow-color)" shadow-color-transparent="var(--design-shadow-color-transparent)">
					<div class="theme-list" tabindex="0" @keydown.left.prevent.stop="selectPrev" @keydown.right.prevent.stop="selectNext">
					<div class="theme-item" v-if="group_id == 0">
						<div class="theme-block" @click="newTheme">
							<span class="tag is-pro" v-tippy :content="'Свой дизайн доступен на PRO-тарифе'|gettext" v-if="!isAllowPro">pro</span>
							<div style="border: 1px dashed #aaa;box-shadow: none;"><div> <div class="theme-block-btn" style="border:1px dashed #aaa;border-radius: 40px">{{'Новая тема'|gettext}}</div> </div> </div> 
						</div> 
					</div>
					
					<div class="theme-item" v-for="(t, index) in designs[group_id]">
						<div class="theme-block" :class="{in: t.design_id == design_id, current: t.design_id == current_design_id}" @click="selectDesign(t)">
							<span class="tag is-pro" v-tippy :content="'Этот дизайн доступен на PRO-тарифе'|gettext" v-if="t.is_pro && !isAllowPro">pro</span>
							<div :style="t.styles.html_thumb"><div :style="t.styles.body_thumb"> {{'Текст'|gettext}} <div class="theme-block-btn" :class="t.styles.link_class" :style="t.styles.link">{{'Ссылка'|gettext}}</div> </div> </div>
						</div> 
						<button type="button" class="button is-danger is-small" v-if="group_id == 0" :disabled="(current_theme_id == t.theme_id) || isDeleting" @click="deleteTheme(t.theme_id, index)"><i class="fa fa-trash-alt"></i></button>
					</div>
					</div>
				</vue-component-vbar>
			</div>
		</div>
-->
		
		<div :class="{'themes-list-panel': mode != 'edit'}" :data-mode="mode">
			<div class="themes-list-panel-left" v-if="mode != 'edit'"></div>
			<div class="themes-list-button-left" :class="{hidden: (themeScrollIndex == 0) || (group_id == 0 && this.themeIndex == 1)}" @click="prevScroll" v-if="mode != 'edit'"></div>
			<h4 class="has-mt-5 has-xs-mt-3 has-xs-pb-2 has-text-centered" style="text-transform: uppercase;margin-bottom: -30px" v-if="designTitle">
				<div class="is-hidden-mobile level container"><div class="level-left">{{designTitle}}</div><div class="level-right has-text-right" v-if="themes[design_id] != undefined">{{themeIndex+1}} /  {{_.size(themes[design_id])}}</div></div>
				<div class="is-hidden-tablet">{{designTitle}}</div>
			</h4>
<!-- 			<div class="has-text-centered" v-if="!group_id && !isAllowPro"><div class="tag is-danger" style="top: -1px; position: relative;">pro</div> <span class="has-text-danger">{{'Свой дизайн доступен на PRO-тарифе'|gettext}}</span></div> -->
			
	<!-- 		min-height: 800px -->
	<!-- height: 850px; -->
	<!-- has-pt-5 has-xs-pt-3 has-pb-5 -->
	<!-- +(isEditMode?'':'overflow:hidden') -->
			<div class="container themes-container" :class="{container: mode == 'edit'}" :style="'padding-top: 35px;padding-bottom:35px;position:relative;'" @mousewheel="themesMouseWheel" @mousedown="themesTouchstart" @mouseup="themesTouchstop" @touchstart="themesTouchstart" @touchend="themesTouchstop" @touchmove="themesMouseWheel" @mousemove="themesMouseWheel" ref="device">
	<!-- 			top:2.5rem -->
				<div style="left:0;right: 0;margin: 0 1rem" :class="{'has-text-centered': mode != 'edit', 'is-hidden-tablet': !isFetchingThemes}" :style="(isFetchingThemes?'':'position:absolute;')+((mode == 'edit')?deviceParentFix:'')">
					<div class="device device-theme-back is-large has-shadow" :class="[{editmode: mode == 'edit', ended: stageEnded}, 'stage'+stage]" :style="(mode == 'edit')?deviceFix:''">
						<div class="screen page" style="background: transparent !important"></div>
						<b-loading :is-full-page="false" :active.sync="isFetchingThemes"></b-loading>
					</div>
				</div>
				
				<div :class="$device.mobile?[]:['themes-list', {editmode: mode == 'edit' || show_theme_editor, viewmode: mode == 'view', stoptransition: stopTransition}, 'stage'+stage]" :style="[{display: 'flex', transform: (stage || $device.mobile)?null:('translate('+translateThemesScroll+'px, 0)')}, (mode == 'edit')?devicePageFix:null]" ref="themesList">
					<div :class="$device.mobile?['themes-list', {editmode: mode == 'edit', viewmode: mode == 'view', stoptransition: stopTransition}, 'stage'+stage]:[]">
						<div :style="{transform: (stage || !$device.mobile)?null:('translate('+translateThemesScroll+'px, 0)')}">
						<div class="device is-large has-transparent-mobile has-shadow page-blocks" :class="[{in: themeIndex == i, current: current_theme_id == t.theme_id, editmode: mode == 'edit'}, 'theme'+t.theme_id]" v-for="(t, i) in themes[design_id]" v-if="(['edit', 'view'].indexOf(mode) != -1 && themeIndex == i) || (['edit', 'view'].indexOf(mode) == -1)" :style="{cursor: isScrollingThemes?'grab':null}">
<!-- 							@mouseup="console.log(deltaMouseWheel);if (deltaMouseWheel == 0) themeScrollIndex = themeIndex = i" -->
							 <div class="screen page" :class="StylesFactory.getPageClasses(((mode == 'edit' && tmpTheme)?tmpTheme:t).options)" @click="if (!isScrollingThemes) setThemeId(t.theme_id, true); isScrollingThemes = false">
							 	<b-loading :is-full-page="false" :active="!$page.data.page.page_id" v-if="mode == 'view'"></b-loading>	

							 	<span class="tag is-pro" v-tippy :content="'Этот дизайн доступен на PRO-тарифе'|gettext" v-if="(t.tariff == 'pro') && !isAllowPro">pro</span>
								<div v-if="mode == 'view'">
<!-- 								<div v-html="select_theme.options.html" v-if="mode == 'view'"></div> -->
									<div v-for="a in select_theme.options.extended.items" v-html="a.html"></div>
								</div>
								
							 	<vue-pages-page-blocks :page_id="page_id" :theme="select_theme" v-if="mode == 'view'" :readonly="true" :show-hidden="false"></vue-pages-page-blocks>
								<div class="theme-main" v-else-if="t.theme_id">
<!-- 									<div v-html="t.options.html"></div> -->
									<div v-for="a in t.options.extended.items" v-html="a.html"></div>
							    	<div class="blocks-list has-pt-2 has-pb-2" v-if="t.theme_id">
									<div class="block-item">
										<div class="block-avatar container">
											<div class="has-text-centered"><img src="/s/i/avatar-girl.png" class="profile-avatar profile-avatar-65"></div>
											<div class="has-text-centered text-avatar">username</div>
										</div>
									</div>
									
									<div :class="showSection?'blocks-section s-1':''">
									<div :class="showSection?'section-main':''">
									
									<div class="block-item" v-if="view == 'pictures'">
										<div class="block-slider container is-shadow-block" :class="'is-'+lightOrDark(tmpTheme.options.block.pictures.bg)" style="pointer-events: none">
											<div class="block-slider-inner">
												<div class="slider slider-pictures has-mb-2 slider-has-text slider-has-link slider-has-border">
													<div class="slider-inner">
														<div class="slider-slide active">
															<div class="picture-container" style="background-image: url(/s/i/sample-picture.jpg)"></div>
															<div class="slider-slide-text">
																<div class="slider-slide-title">{{'Заголовок'|gettext}}</div>
																<div class="slider-slide-snippet">{{'Описание'|gettext}}</div>
															</div>
									
															<a class="slider-slide-link">{{'Открыть'|gettext}}</a>
														</div>
													</div>
													<div class="slider-nav">
														<div class="slider-dot active"></div>
														<div class="slider-dot"></div>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div v-else> 
									<div class="block-item">
										<div class="block-text is-heading container" style="text-align: center; line-height: 1.25; font-size: 2.2rem;">{{'Заголовок'|gettext}}</div>
									</div>
									<div class="block-item">
										<div class="block-text container" v-html="demoText"></div>
									</div>
									<div class="blocks-item" v-for="i in [0,1,2]">
										<div class="block-link block-item container">
											<a class="button btn-link btn-link-styled" :class="(mode == 'edit')?'with-thumb':'without-thumb'"><figure class="thumb" v-if="mode == 'edit'"><div class="is-icon" style="-webkit-mask-image:url(/s/icons/world.svg);mask-image:url(/s/icons/world.svg)"><img src="data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw=="></div></figure><div><div class="btn-link-title">{{'Заголовок'|gettext}}</div><div class="btn-link-subtitle">{{'Подзаголовок'|gettext}}</div></div></a>
										</div>
									</div>
									</div>
									
									</div>
									</div>
							    </div>
								</div>
								<div class="theme-main" v-else>
									<a @click="newTheme" class="plus" :class="{'is-loading': isSetting}" v-if="theme_id == t.theme_id"></a>
									<h3 class="has-mt-3" :class="{'has-text-grey': theme_id != t.theme_id}">{{'Новый дизайн'|gettext}}</h3>
								</div>
	
	
						    </div>
						</div>
					</div>
					</div>
					
					<div class="float-panel" :style="buttonsPanelFix" :class="{editmode: (mode == 'edit'), hide: theme_id == 0 || buttonsHide || ((mode == 'edit') && stage != 2) || isFetchingThemes, 'is-top': mode == 'view_modal'}" ref="buttonsPanel">
						<div class="container"> <!-- :class="{container: isEditMode && stage == 2}" -->
						<div v-if="mode == 'edit'">
							<button class="button is-black" @click="editThemeCancel">{{'Отменить'|gettext}}</button>
							<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="editThemeSave">{{'Сохранить'|gettext}}</button>
						</div>
						<div v-else>
							<vue-component-action-button @action="onAction" :withTitle="false" classname="button is-black" class="has-mr-2" v-if="(mode == 'themes') && isAdmin && (themes[design_id] != undefined)">
								<template slot="actions">
									<b-dropdown-item value="tariff" v-if="$auth.isAllowEndpoint('design/manage/tariff')"><i class="fa fa-usd-circle"></i> Установить: <span v-if="select_theme.tariff == 'basic'">PRO</span> <span v-else>BASIC</span></b-dropdown-item> 
									<hr class="dropdown-divider" v-if="$auth.isAllowEndpoint('design/manage/move')" />
									<b-dropdown-item value="left" v-if="$auth.isAllowEndpoint('design/manage/reorder')" :disabled="themeIndex == 0"><i class="fa fa-arrow-left"></i> {{'Передвинуть влево'|gettext}}</b-dropdown-item> 
									<b-dropdown-item value="right" v-if="$auth.isAllowEndpoint('design/manage/reorder')" :disabled="(themeIndex == _.size(themes[design_id])-1)"><i class="fa fa-arrow-right"></i> {{'Передвинуть вправо'|gettext}}</b-dropdown-item> 
									<hr class="dropdown-divider" v-if="$auth.isAllowEndpoint('design/manage/move')" />
									<b-dropdown-item value="manage" v-if="$auth.isAllowEndpoint('design/manage/list')"><i class="fa fa-list"></i> {{'Настроить список'|gettext}}</b-dropdown-item> 
									<b-dropdown-item value="move" v-if="$auth.isAllowEndpoint('design/manage/move')"><i class="fa fa-exchange"></i> {{'Перенести в тему'|gettext}}</b-dropdown-item> 
									<b-dropdown-item value="clone" v-if="$auth.isAllowEndpoint('design/manage/clone')"><i class="fa fa-clone"></i> {{'Клонировать'|gettext}}</b-dropdown-item>
									<hr class="dropdown-divider" v-if="$auth.isAllowEndpoint('design/manage/move')" />
									<b-dropdown-item value="delete" class="has-text-danger"><i class="fa fa-trash-alt"></i> {{'Удалить'|gettext}}</b-dropdown-item>
								</template>
							</vue-component-action-button>
							
							<button class="button is-danger" style="flex:0" v-if="design_id == 0 && mode == 'themes' && !isAdmin" :disabled="(current_theme_id == theme_id) || (theme_id == 0) || isDeleting" @click="deleteTheme"><i class="fa fa-trash-alt"></i></button>
							
			<!-- 				<button class="button is-black" style="flex:0" v-if="design_id == 0" @click="cloneTheme"><i class="fa fa-clone"></i></button> -->
							
							<button class="button is-black" @click="editTheme" :disabled="theme_id == 0" v-if="mode == 'themes'">{{'Редактировать'|gettext}}</button>
							<button class="button is-black" @click="viewThemeCancel" :disabled="theme_id == 0" v-if="mode == 'view' || mode == 'view_modal'">{{'Отмена'|gettext}}</button>
							<button class="button is-primary" @click="viewTheme()" :class="{'is-loading': isSetting}" v-if="mode == 'themes' && withView">{{'Просмотр'|gettext}}</button>
							<button class="button is-primary" :disabled="(theme_id == current_theme_id) || (theme_id == 0) || !select_theme || (select_theme.is_pro == 1 && !isAllowPro)" @click="setTheme(select_theme)" :class="{'is-loading': isSetting}" v-else>{{'Выбрать'|gettext}}</button>
						</div>
						</div>
					</div>
					
				</div>
	
				<div v-if="stage == 2 || show_theme_editor" style="flex:1;padding-left:460px">
					<h2 class="has-mb-5 has-pt-2">{{'Редактирование дизайна'|gettext}}</h2>
					<vue-design-editor :theme="theme_editor" :group_id="group_id" :design_id="design_id" @update:theme="themeChanged"></vue-design-editor>
				</div>
			</div>
			<div class="themes-list-button-right" :class="{hidden: (themes[design_id] == undefined) || (themeScrollIndex == _.size(themes[design_id])-1)}" @click="nextScroll" v-if="mode != 'edit'"></div>
			<div class="themes-list-panel-right" v-if="mode != 'edit'"></div>
		</div>
	</div>
`});

window.$app.defineComponent("design", "vue-design-manage-form", {data() {
			return {
				isFetching: false,
				groups: {},
				currentGroup: null
			}
		},
		
		created() {
			this.fetchData();
		},
		
		computed: {
			currentGroupId() {
				return this.groups[this.currentGroup].group_id;
			}
		},
		
		methods: {
			fetchData() {
				this.isFetching = true;
				this.$api.get('design/manage/list', {}).then((data) => {
					this.isFetching = false;
					
					if (data.result == 'success') this.groups = data.response.groups;
				});
			},
			
			editGroup(g) {
				this.$prompt('Укажите имя', {value: g.title}).then(s => {
					if (g.title != s) {
						this.$api.get('design/manage/renamegroup', {group_id: g.group_id, title: s}).then((data) => {
							if (data.result == 'success') g.title = s;
						});
					}
				});				
			},
			
			editDesign(d) {
				this.$prompt('Укажите имя', {value: d.title}).then(s => {
					if (d.title != s) {
						this.$api.get('design/manage/renamedesign', {design_id: d.design_id, title: s}).then((data) => {
							if (data.result == 'success') d.title = s;
						});
					}
				});				
			},
			
			addGroup() {
				this.$prompt('Укажите имя').then(s => {
					this.$api.get('design/manage/addgroup', {title: s}).then((data) => {
						this.fetchData();
					});
				})
			},
			
			addDesign() {
				this.$prompt('Укажите имя').then(s => {
					this.$api.get('design/manage/adddesign', {title: s, group_id: this.currentGroupId}).then((data) => {
						this.fetchData();
					});
				})
			},
			
			activeGroup(g) {
				g.is_active = g.is_active?0:1;
				this.active('group', g.group_id, g.is_active);
			},
			
			togglePro(d) {
				d.is_pro = d.is_pro?0:1;
				this.$api.get('design/manage/setpro', {value: d.is_pro, design_id: d.design_id}).then((data) => {
					this.fetchData();
				});
			},
			
			activeDesign(d) {
				d.is_active = d.is_active?0:1;
				this.active('design', d.design_id, d.is_active);
			},
			
			active(type, id, value) {
				this.$api.get('design/manage/active', {type: type, value: value, id: id}).then((data) => {
					this.fetchData();
				});
			}
		}, template: `
	<div class="modal-card modal-card-large">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Темы'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<section class="modal-card-body">
		<div>
			<div class="row row-small">
				<div class="col-xs-6">
					<div class="manage-design-list">
						<div class="is-header"><span>Группы</span><a class="button is-small is-dark" @click="addGroup"><i class="fa fa-plus"></i></a></div>
						<div v-for="(g, i) in groups" @click="currentGroup = i" :class="{'has-background-primary': i == currentGroup}">
							<span style="flex:1">{{g.title}}</span>
							<i class="fa has-text-grey fa-edit has-mr-2" @click.stop="editGroup(g)"></i>
							<i class="fa has-text-grey" :class="{'fa-eye': g.is_active, 'fa-eye-slash': !g.is_active}" @click.stop="activeGroup(g)"></i>
						</div>
					</div>
				</div>
				<div class="col-xs-6">
					<div class="manage-design-list" v-if="currentGroup != null">
						<div class="is-header"><span>Дизайны</span><a class="button is-small is-dark" @click="addDesign"><i class="fa fa-plus"></i></a></div>
						<div v-for="d in groups[currentGroup].list">
							<span v-if="d.title" style="flex:1">{{d.title}}</span><span v-else style="flex:1">Без имени</span>
							<span class="tag is-pro has-mr-2" :class="{'is-off': !d.is_pro}" @click="togglePro(d)">pro</span>
							<i class="fa has-text-grey fa-edit has-mr-2" @click.stop="editDesign(d)"></i>
							<i class="fa has-text-grey" :class="{'fa-eye': d.is_active, 'fa-eye-slash': !d.is_active}" @click.stop="activeDesign(d)"></i>
						</div>
					</div>
				</div>
			</div>
		</div>
		</section>
		
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>

	</div>
`});

window.$app.defineComponent("design", "vue-design-move-form", {data() {
			return {
				isFetching: false,
				info: {},
				groups: {},
				group_index: null,
				design_id: null
			}
		},
		
		props: ['theme_id'],
		
		created() {
			this.fetchData();
		},
		
		methods: {
			fetchData() {
				this.isFetching = true;
				this.$api.get(['design/manage/info', 'design/manage/list'], {theme_id: this.theme_id}).then(d => {
					this.isFetching = false;
					
					if (d.result == 'success') {
						let r = d.response;
						this.info = r.info;
						this.groups = r.groups;
						
						this.group_index = null;
						_.each(r.groups, (g, idx) => {
							if (this.info.group_id  == g.group_id) this.group_index = idx;
						});
						this.design_id = this.info.design_id;
					}
				});
			},
			
			save() {
				if (this.info.design_id == this.design_id) return this.$parent.close();
				this.isFetching = true;
				this.$api.post('design/manage/move', {theme_id: this.theme_id, design_id: this.design_id}).then(d => {
					if (d.result == 'success') {
// 						this.$parent.$parent.removeThemeFromList();
						this.$parent.close();
						
						this.$parent.$parent.clearThemesList(this.design_id);
						this.$parent.$parent.clearThemesList(this.info.design_id);
						
						this.$nextTick(() => {
							this.$parent.$parent.selectDesign(this.info.design_id);
						});
					}
					this.isFetching = false;
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">Перенос в тему</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<section class="modal-card-body">
		<div class="has-mb-2">
			<label class="label">Группа</label>
			<div class="select">
			<b-select v-model="group_index" placeholder="-- Не выбрано --" @input="design_id = null">
				<option :value="null">-- Не выбрано --</option>
				<option :value="idx" v-for="(g, idx) in groups">{{g.title}}</option>
			</b-select>
			</div>
		</div>

		<div v-if="group_index != null">
			<label class="label">Тема</label>
			<div class="select">
			<b-select v-model="design_id" placeholder="-- Не выбрано --">
				<option :value="null">-- Не выбрано --</option>
				<option :value="d.design_id" v-for="d in groups[group_index].list"><span v-if="d.title">{{d.title}}</span><span v-else>Тема {{d.design_id}}</span></option>
			</b-select>
			</div>
		</div>
		
		</section>
		
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" type="button" @click="save" :disabled="!design_id">{{'Сохранить'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>

	</div>
`});

window.$app.defineComponent("design", "vue-design-view-modal", {data() {
			return {
				isFetching: false
			}
		},
		
		props: ['theme', 'page_id'],
		
		watch: {
			theme(v) {
				this.themeChanged();
			}
		},
		
		mounted() {
			this.isFetching = true;
			this.themeChanged();
// 			this.$page.fetchData(this.page_id, false).then(this.themeChanged);
		},
		
		methods: {
			themeChanged() {
				this.isFetching = false;
				let prefix = '.modal-card-view-design .theme'+this.theme.theme_id;
				let styles = buildStyles(this.theme.options, 'design', prefix);
				StylesFactory.updateCSSBlock(styles, this.$refs.styles_view);
				
				let styles_sections = {};
				this.$page.prepareSections(Vue.prototype.$page.data, styles_sections, this.theme.options, prefix, 'view');
				StylesFactory.updateCSSBlock(styles_sections, this.$refs.styles_view_sections);
			}
		}, template: `
	<div class="modal-card modal-card-view-design">
		<section class="modal-card-body is-paddingless screen page page-blocks" :class="'theme'+theme.theme_id">
		<div ref='styles_view'></div>
		<div ref='styles_view_sections'></div>
		<div class="screen page">
			<div v-for="a in theme.options.extended.items" v-html="a.html"></div>
			
		 	<vue-pages-page-blocks :page_id="page_id" :readonly="true" :show-hidden="false"></vue-pages-page-blocks>
		</div>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
		</section>
	</div>
`});
window.$app.defineModule("design", []);