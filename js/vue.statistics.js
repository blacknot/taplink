window.$app.defineComponent("statistics","vue-statistics-form",{props:["block_id","period","period_back"],methods:{openBlock:function(t){this.$modal("vue-pages-blocks-form-modal",{block_id:t},this)}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Статистика блока\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <vue-pages-blocks-form-statistics :block_id="block_id" :period="period" :period_back="period_back"></vue-pages-blocks-form-statistics> </section> <footer class="modal-card-foot level"> <div class="level-left"> <button class="button is-default" @click="openBlock(block_id)">{{\'Открыть блок\'|gettext}}</span></button> </div> <div class="level-right"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </div> </footer> </div>'}),window.$app.defineComponent("statistics","vue-statistics-list",{data:function(){return{isFetching:!1,isFetchingChart:!1,fields:[],total:0,page:1,chart:null,data:[],hits:0,clicks:[],pages:[],period:"day",period_back:0,period_title:"",periods:{day:this.$gettext("День"),week:this.$gettext("Неделя"),month:this.$gettext("Месяц")}}},props:["page_id"],watch:{page_id:function(t){router.replace({name:"statistics",params:{page_id:t}}),this.fetchData(!1)},period:function(){this.period_back=0,this.fetchData(!1)},period_back:function(){this.fetchData(!1,["clicks"])}},created:function(){0==this.page_id&&(this.page_id=this.$account.page_id)},mounted:function(){this.fetchData(!0)},methods:{fetchData:function(s,t){var i=this,e=1<arguments.length&&void 0!==t?t:["chart","clicks"];this.isFetching=!0,this.isFetchingChart=!e||-1!=e.indexOf("chart"),this.$api.get(s?["statistics/get","pages/list"]:"statistics/get",{page_id:this.page_id,period:this.period,period_back:this.period_back,scope:e||["chart","clicks"]}).then(function(t){-1!=e.indexOf("chart")&&(i.data=_.map(t.response.statistics.chart,function(t,s){return{date:s,hits:t}})),i.clicks=t.response.statistics.clicks,i.hits=t.response.statistics.hits,i.period_title=t.response.statistics.period.title,s&&(i.pages={},_.each(t.response.pages,function(t){i.pages[t.page_id]=t.title})),i.isFetching=!1}).catch(function(t){throw i.isFetching=!1,t})},clickRow:function(t){this.$modal("vue-statistics-form",{block_id:t.block_id,slot_id:t.slot_id,period:this.period,period_back:this.period_back},this)}},template:'<div> <div class="top-panel"> <div class="container"> <div class="row has-pb-1 has-pt-3" :class="{disabled: isFetching}"> <div class="col-sm-4 col-md-3 has-mb-2 col-xs-12"> <vue-component-toggle-list v-model="period" :items="periods"/> </div> <div class="col-sm-4 col-md-3 has-mb-2 col-xs-12"> <div class="field has-addons" :class="{disabled: isFetching || !$auth.isAllowTariff(\'pro\')}"> <p class="control"><button class="button" @click="period_back++"><i class="fas fa-caret-left"></i></button></p> <p class="control is-expanded"><span class="button is-static has-background-white is-fullwidth">{{ period_title }}</span></p> <p class="control"><button class="button" :disabled="period_back == 0" @click="period_back--"><i class="fas fa-caret-right"></i></button></p> </div> </div> <div class="col-sm-4 col-md-3 col-md-offset-3 has-mb-2 col-xs-12" v-if="$auth.isAllowTariff(\'business\')"> <vue-component-page-chooser v-model="page_id" :disabled="isFetching" :pages="pages"/> </div> </div> </div> </div> <div class="container has-mb-3 has-pt-3"> <vue-component-statistics :data="data" :period="period" :period_back="period_back" :line-show="true" :title="\'Просмотры страницы\'|gettext"></vue-component-statistics> <h4 class="has-text-grey has-mt-1"> <div class="is-pulled-right">{{ hits|number }}</div> <div v-if="period == \'day\'">{{ \'Посетителей за день\'|gettext }}:</div> <div v-if="period == \'week\'">{{ \'Посетителей за неделю\'|gettext }}:</div> <div v-if="period == \'month\'">{{ \'Посетителей за месяц\'|gettext }}:</div> </h4> <h3 class="has-text-centered has-mt-3 has-mb-2" :class="{\'disabled\': !$auth.isAllowTariff(\'pro\')}">{{\'Клики по ссылкам\'|gettext}}</h3> <div class="message is-danger" v-if="!$auth.isAllowTariff(\'pro\')"> <div class="message-body">{{\'Доступно на pro-тарифе\'|gettext}} <a @click="$form.open(\'vue-index-pricing-form\')" class="is-pulled-right">{{\'Подробнее\'|gettext}} <i class="fa fa-angle-right" style="margin-left: 5px"></i></a></div> </div> <b-table :data="clicks" :loading="isFetching" :class="{\'disabled\': !$auth.isAllowTariff(\'pro\')}" class="has-mb-10" @click="clickRow" hoverable> <b-table-column field="title" :label="\'Заголовок\'|gettext" v-slot="props"> <span>{{ props.row.type }}<span class="has-text-grey" v-if="props.row.title"> / </span>{{ props.row.title }}</span> </b-table-column> <b-table-column field="clics" :label="\'Клики\'|gettext" :class=\'["has-width-20"]\' numeric v-slot="props"><span :class=\'{"has-text-grey-light": props.row.clicks == 0}\'>{{ props.row.clicks | number }}</span></b-table-column> <b-table-column field="cv" :label="\'Конверсия\'|gettext" :class=\'["has-width-20"]\' numeric v-slot="props"><span :class=\'{"has-text-grey-light": props.row.cv == 0}\'><span>{{ props.row.cv | number }} <span class="has-text-grey-light">%</span></span></span></b-table-column> <template slot="empty"> <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="!isFetching"> <p>{{\'Недостаточно данных\'|gettext}}</p> </section> <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching"> <p>{{\'Загрузка данных\'|gettext}}</p> </section> </template> </b-table> </div> </div>'}),window.$app.defineModule("statistics",[]);
