
window.$app.defineComponent("statistics", "vue-statistics-form", {props: ['block_id', 'period', 'period_back'],
		
		methods: {
			openBlock(block_id) {
				this.$modal('vue-pages-blocks-form-modal', {block_id: block_id}, this);
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Статистика блока'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>

		<section class="modal-card-body">
			<vue-pages-blocks-form-statistics :block_id="block_id" :period="period" :period_back="period_back"></vue-pages-blocks-form-statistics>
		</section>		

		<footer class="modal-card-foot level">
			<div class="level-left">
				<button class="button is-default" @click="openBlock(block_id)">{{'Открыть блок'|gettext}}</span></button>
			</div>
			
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			</div>
		</footer>
	</div>
		
`});

window.$app.defineComponent("statistics", "vue-statistics-list", {data() {
			return {
				isFetching: false,
				isFetchingChart: false,
				fields: [],
				total: 0,
				page: 1,
				chart: null,
				data: [],
				hits: 0,
				clicks: [],
				pages: [],
				data: [],
				period: 'day',
				period_back: 0,
				period_title: '',
			}
		},
		
		props: ['page_id'],
		
		watch: {
			page_id(val) {
				router.replace({name: 'statistics', params: {page_id: val}});
				this.fetchData(false);
			},
			
			period(val) {
				this.period_back = 0;
				this.fetchData(false);
			},
			
			period_back(val) {
				this.fetchData(false, ['clicks']);
			}
		},
		
		created() {
			if (this.page_id == 0) this.page_id = this.$account.page_id;
		},
		
		mounted() {
			this.fetchData(true);
		},
		
		methods: {
			fetchData(first, scope = ["chart", "clicks"]) {
				this.isFetching = true;
				this.isFetchingChart = !scope || scope.indexOf('chart') != -1;
				this.$api.get(first?['statistics/get', 'pages/list']:'statistics/get', {page_id: this.page_id, period: this.period, period_back: this.period_back, scope: scope?scope:['chart', 'clicks']}).then((data) => {

					if (scope.indexOf('chart') != -1) this.data = _.map(data.response.statistics.chart, (v, k) => {
						return {date: k, hits: v};
					});
					
					this.clicks = data.response.statistics.clicks;
					this.hits = data.response.statistics.hits;
					this.period_title = data.response.statistics.period.title;
					
					
					if (first) {
						this.pages = data.response.pages;
					}
					
					this.isFetching = false;
				}).catch((error) => {
                    this.isFetching = false;
                    throw error
                });
			},
			
            clickRow(row) {
	            this.$modal('vue-statistics-form', {block_id: row.block_id, slot_id: row.slot_id, period: this.period, period_back: this.period_back}, this);
			}
		}, template: `
	<div>
		<div class="top-panel">
			<div class="container">
<!-- 				<h2 class="is-hidden-touch">{{ 'Статистика'|gettext }}</h2> -->
<!-- 				<div class="has-pt-1 is-hidden-desktop"></div> -->
				
				<div class="row has-pb-1 has-pt-3" :class="{disabled: isFetching}">
					<div class="col-sm-4 col-md-3 has-mb-2 col-xs-12">
						<b-field class="has-tabs-style">
				            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="day">{{'День'|gettext}}</b-radio-button>
				            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="week">{{'Неделя'|gettext}}</b-radio-button>
				            <b-radio-button v-model="period" type="active" class="is-expanded" native-value="month">{{'Месяц'|gettext}}</b-radio-button>
						</b-field>
					</div>
					
					<div class="col-sm-4 col-md-3 has-mb-2 col-xs-12">
					<div class="field has-addons" :class="{disabled: isFetching || !$auth.isAllowTariff('pro')}">
						<p class="control"><button class="button" @click="period_back++"><i class="fas fa-caret-left"></i></button></p>
						<p class="control is-expanded"><span class="button is-static has-background-white is-fullwidth">{{ period_title }}</span></p>
						<p class="control"><button class="button" :disabled="period_back == 0" @click="period_back--"><i class="fas fa-caret-right"></i></button></p>
					</div>
					</div>
					
					<div class="col-sm-4 col-md-3 col-md-offset-3 has-mb-2 col-xs-12" v-if="$auth.isAllowTariff('business')">
						<b-select v-model="page_id" :loading="isFetching" icon-pack="fal" icon="mobile-android" expanded>
							<option :value='$account.page_id'>{{'-- Главная страница --'|gettext}}</option>
			                <option v-for="option in pages" :value="option.page_id" v-if="option.page_id != $account.page_id">
			                    {{option.title}}
			                </option>
			            </b-select>
					</div>
					
				</div>
			</div>
		</div>
		
		<div class="container has-mb-3 has-pt-3">
			<vue-component-statistics :data="data" :period="period" :period_back="period_back" :line-show="true" :title="'Просмотры страницы'|gettext"></vue-component-statistics>
			
			<h4 class="has-text-grey has-mt-1">
				<div class="is-pulled-right">{{ hits|number }}</div>
				<div v-if="period == 'day'">{{ 'Посетителей за день'|gettext }}:</div>
				<div v-if="period == 'week'">{{ 'Посетителей за неделю'|gettext }}:</div>
				<div v-if="period == 'month'">{{ 'Посетителей за месяц'|gettext }}:</div>
			</h4>

			<h3 class="has-text-centered has-mt-3 has-mb-2" :class="{'disabled': !$auth.isAllowTariff('pro')}">{{'Клики по ссылкам'|gettext}}</h3>
			
			<div class="message is-danger" v-if="!$auth.isAllowTariff('pro')">
				<div class="message-body">{{'Доступно на pro-тарифе'|gettext}} <a href="/tariffs/" class="is-pulled-right">{{'Подробнее'|gettext}} <i class="fa fa-angle-right" style="margin-left: 5px"></i></a></div>
			</div>
			
			<b-table :data="clicks" :loading="isFetching" :class="{'disabled': !$auth.isAllowTariff('pro')}" class="has-mb-10" @click="clickRow" hoverable>
			<b-table-column field="title" :label="'Заголовок'|gettext" v-slot="props">
				<span>{{ props.row.type }}<span class="has-text-grey" v-if="props.row.title"> / </span>{{ props.row.title }}</span>
			</b-table-column>
			<b-table-column field="clics" :label="'Клики'|gettext" :class='["has-width-20"]' numeric v-slot="props"><span :class='{"has-text-grey-light": props.row.clicks == 0}'>{{ props.row.clicks | number }}</span></b-table-column>
			<b-table-column field="cv" :label="'Конверсия'|gettext" :class='["has-width-20"]' numeric v-slot="props"><span :class='{"has-text-grey-light": props.row.cv == 0}'><span>{{ props.row.cv | number }} <span class="has-text-grey-light">%</span></span></span></b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching">
                    <p>{{'Недостаточно данных'|gettext}}</p>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>			
			</b-table>
			
		</div>
	</div>
`});
window.$app.defineModule("statistics", []);