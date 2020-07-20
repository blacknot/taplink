window.$app.defineComponent("account","vue-account-access-form",{data:function(){return{isUpdating:!1,isFetching:!1,values:{profile_id:null,account_id:null,access_text:"full",access:{1:!0,2:!0,4:!0,8:!0,16:!0,32:!0,64:!0,128:!0}},errors:{profile_id:""}}},created:function(){(this.profile_id||this.account_id)&&this.fetchData()},props:["profile_id","account_id","owner_profile_id","part"],computed:{title:function(){return this.account_id?"main"==this.part?this.$gettext("Вы открыли совместный доступ аккаунту"):this.$gettext("Вам открыли совместный доступ к профилю"):this.$gettext("Укажите имя профиля или email которому вы хотите открыть доступ")},nickname:function(){return"main"==this.part?this.values.email:this.values.nickname}},methods:{fetchData:function(){var a=this;this.isFetching=!0,this.$api.get("account/access/get",{profile_id:this.profile_id,account_id:this.account_id,part:this.part}).then(function(e){a.isFetching=!1,a.values=e.response.access.values,a.values.access_text=255==a.values.access?"full":"restricted";for(var t={},s=1;s<=128;s*=2)t[s]=(a.values.access&s)==s;a.values.access=t})},updateData:function(){var t=this,e=_.merge(_.clone(this.values),{part:this.part}),s=0;"full"==this.values.access_text?s=255:_.each(this.values.access,function(e,t){s+=parseInt(e?t:0)}),e.access=s,this.isUpdating=!0,this.$api.post("account/access/set",e).then(function(e){"fail"==e.result?t.errors=e.errors:t.$parent.close(),t.isUpdating=!1}).catch(function(e){e.data;t.isUpdating=!1})},revokeAccess:function(e){var t=this;this.$confirm(e?this.$gettext("Вы уверены что хотите отозвать доступ?"):this.$gettext("Вы уверены что хотите отказаться от доступа?"),"is-danger").then(function(){t.$api.post("account/access/revoke",{profile_id:t.profile_id,account_id:t.account_id,owner_profile_id:t.owner_profile_id,part:t.part}).then(function(e){t.$parent.close()})})},changeProfile:function(){this.$auth.changeProfile(this.values.profile_id),this.$parent.close()}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Совместный доступ\'|gettext}} <span v-if="part == \'main\'"><span v-if="values.owner_profile_id">{{values.owner_nickname}}</span><span v-else>{{$account.nickname}}</span></span></p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body modal-card-body-blocks"> <section> <b-field :label="title" :message="errors.nickname" :class="{\'has-error\': errors.nickname}"> <input :value="nickname" class="input" disabled v-if=\'this.account_id\'></input> <b-input v-model="values.nickname" v-if=\'!this.account_id\'></b-input> </b-field> </section> <section class="radio-list" :class="{disabled: part== \'shared\'}"> <label class="is-block radio"><input type=\'radio\' v-model="values.access_text" :disabled="part == \'shared\'" value="full"> {{\'Предоставить полный доступ\'|gettext}}</label> <label class="is-block radio"><input type=\'radio\' v-model="values.access_text" :disabled="part == \'shared\'" value="restricted"> {{\'Предоставить ограниченный доступ\'|gettext}}</label> </section> <section :class="{disabled: part== \'shared\'}" v-show="values.access_text == \'restricted\'"> <div class="row"> <div class="col-xs-12 col-sm-6"> <div class="has-mb-2 checkbox-list"> <label class="is-block label has-text-grey">{{\'Страницы\'|gettext}}</label> <label class="is-block checkbox" :class="{disabled: part== \'main\'}"><input type=\'checkbox\' :disabled="true" v-model="values.access[1]" value="true"> {{\'Просматривать страницы\'|gettext}}</label> <label class="is-block checkbox"><input type=\'checkbox\' v-model="values.access[2]" :disabled="part == \'shared\'" value="true"> {{\'Редактировать страницы\'|gettext}}</label> </div> <div class="block-xs checkbox-list"> <label class="is-block label has-text-grey">{{\'Заявки\'|gettext}}</label> <label class="is-block checkbox"><input type=\'checkbox\' v-model="values.access[4]" :disabled="part == \'shared\'" value="true"> {{\'Просматривать заявки\'|gettext}}</label> <label class="is-block checkbox"><input type=\'checkbox\' v-model="values.access[8]" :disabled="part == \'shared\'" value="true"> {{\'Редактировать заявки\'|gettext}}</label> </div> </div> <div class="col-xs-12 col-sm-6"> <div class="has-mb-2 checkbox-list"> <label class="is-block label has-text-grey">{{\'Товары\'|gettext}}</label> <label class="is-block checkbox"><input type=\'checkbox\' v-model="values.access[16]" :disabled="part == \'shared\'" value="true"> {{\'Просматривать товары\'|gettext}}</label> <label class="is-block checkbox"><input type=\'checkbox\' v-model="values.access[32]" :disabled="part == \'shared\'" value="true"> {{\'Редактировать товары\'|gettext}}</label> </div> <div class="checkbox-list"> <label class="is-block label has-text-grey">{{\'Другое\'|gettext}}</label> <label class="is-block checkbox"><input type=\'checkbox\' v-model="values.access[64]" :disabled="part == \'shared\'" value="true"> {{\'Просматривать статистику\'|gettext}}</label> <label class="is-block checkbox"><input type=\'checkbox\' v-model="values.access[128]" :disabled="part == \'shared\'" value="true"> {{\'Редактировать настройки\'|gettext}}</label> </div> </div> </div> </section> </section> <footer class="modal-card-foot level"> <div class="level-left"> <button class="button level-item" type="button" @click="revokeAccess(1)" v-if="account_id && (part == \'main\')">{{\'Отозвать доступ\'|gettext}}</button> <button class="button level-item" type="button" @click="revokeAccess(0)" v-if="account_id && (part == \'shared\')">{{\'Отказаться\'|gettext}}</button> </div> <div class="level-right"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Отмена\'|gettext}}</button> <button class="button is-primary" :class="{\'is-loading\': isUpdating}" @click="updateData" v-if="part == \'main\'">{{\'Сохранить\'|gettext}}</button> <button class="button is-primary" v-if="part == \'shared\'" @click="changeProfile">{{\'Переключиться\'|gettext}}</button> </div> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("account","vue-account-access-list",{data:function(){return{isFetching:!1,sortField:"tms_shared",sortOrder:"desc",allowShare:!1,fields:[],total:0,page:1}},created:function(){this.fetchData(!0),this.$io.on("events:access.profiles:refresh",this.fetchData)},destroyed:function(){this.$io.off("events:access.profiles:refresh",this.fetchData)},props:["part"],watch:{part:function(){this.fields=[],this.fetchData(!0)}},methods:{fetchData:function(e){var t=this;this.isFetching=e,this.$api.get("account/access/list",{part:this.part,page:this.page,sort_field:this.sortField,sort_order:this.sortOrder}).then(function(e){t.fields="shared"==t.part?_.map(e.response.accesses.fields,function(e){return e.is_updating=!1,e}):e.response.accesses.fields,t.total=e.response.accesses.total,t.allowShare=e.response.accesses.allow_share,t.isFetching=!1}).catch(function(e){throw t.accesses=[],t.total=0,t.isFetching=!1,e})},revokeAccess:function(e){var t=this;this.$confirm(this.$gettext("Вы уверены что хотите отозвать доступ?"),"is-danger").then(function(){t.$api.post("account/access/revoke",{profile_id:e.profile_id,account_id:e.account_id,owner_profile_id:e.owner_profile_id,part:"main"})})},clickRow:function(e){this.$form("vue-account-access-form",{part:this.part,profile_id:e.profile_id,account_id:e.account_id,owner_profile_id:e.owner_profile_id},this)},onPageChange:function(e){this.page=e,this.fetchData()},setFavourite:function(t){t.is_updating=!0;var s=!t.is_favourite;this.$api.get("account/profiles/favourite",{profile_id:t.profile_id,val:s}).then(function(e){"success"==e.result&&(t.is_favourite=s),t.is_updating=!1}).catch(function(){t.is_updating=!1})},onSort:function(e,t){this.sortField=e,this.sortOrder=t,this.fetchData(!1)},openForm:function(){this.$form("vue-account-access-form",{part:this.part},this)}},template:'<div> <vue-component-filterbox :with-query="false" :with-buttons="true"> <template slot="buttons"> <div class="level"> <div class="level-left"> <div class="field has-addons has-tabs-style"> <div class="control is-expanded"> <router-link class="b-radio radio button" :class="{\'is-dark\': part== \'main\'}" :to="{name: \'access-main\'}"><span>{{\'Я открыл доступ\'|gettext}}</span></router-link> </div> <div class="control is-expanded"> <router-link class="b-radio radio button" :class="{\'is-dark\': part== \'shared\'}" :to="{name: \'access-shared\'}"><span>{{\'Доступные мне\'|gettext}}</span></router-link> </div> </div> </div> <div class="level-right" v-if="part == \'main\'"> <a @click="openForm()" class="button is-primary is-fullwidth" :class="{disabled: part== \'shared\', disabled: !allowShare}"><i class=\'fas fa-plus has-mr-1\'></i>{{\'Открыть доступ\'|gettext}}</a> </div> </div> </template> </vue-component-filterbox> <div class="container has-mb-4"> <b-table paginated backend-pagination backend-sorting :data="fields" :loading="isFetching" per-page="20" :total="total" :default-sort="[sortField, sortOrder]" @sort="onSort" @page-change="onPageChange" @click="clickRow" hoverable> <template slot-scope="props"> <b-table-column field="nickname" :label="\'Профиль\'|gettext" sortable> <span v-if="part == \'main\'">{{props.row.owner_nickname}} <span class="has-text-grey">{{\'для\'|gettext}}</span> {{ props.row.email }} </span> <span v-if="part == \'shared\'"> <span style="width:20px;display:inline-block;"> <i class="fal fa-spinner-third fa-spin" v-if="props.row.is_updating"></i> <i class="fa-star" :class="{fal: !props.row.is_favourite, fas: props.row.is_favourite}" @click.stop="setFavourite(props.row)" v-else></i> </span> {{ props.row.nickname }} </span> </b-table-column> <b-table-column :label="\'Права\'|gettext" numeric1 class="has-width-20"> <div class="has-text-grey"><span v-if="props.row.access == 255">{{\'Полный доступ\'|gettext}}</span><span v-else>{{ \'Ограниченный доступ\' | gettext }}</span></div> </b-table-column> <b-table-column :label="\'Действие\'|gettext" class="has-width-10"> <button v-if="part == \'main\'" @click.stop="revokeAccess(props.row)" class="button is-danger is-small">{{\'Отозвать доступ\'|gettext}}</button> <button v-if="part == \'shared\'" @click.stop="$auth.changeProfile(props.row.profile_id)" class="button is-dark is-small" :class="{disabled: props.row.profile_id == $account.profile_id}">{{\'Переключиться\'|gettext}}</button> </b-table-column> <b-table-column field="tms_shared" :label="\'Дата добавления\'|gettext" class="has-width-10 has-text-nowrap" numeric sortable> {{ props.row.tms_shared|datetime }} </b-table-column> </template> <template slot="empty"> <section class="has-mb-4 has-mt-4 content has-text-centered" v-if="!isFetching"> <div v-if="part == \'main\'"> <h3 class="has-text-grey">{{\'Список аккаунтов\'|gettext}}</h3> <p class="has-text-grey">{{\'Нажмите "Открыть доступ" для того чтобы открыть доступ к странице другому пользователю\'|gettext}}</p> </div> <div v-if="part == \'shared\'"> <h3 class="has-text-grey">{{\'Список профилей\'|gettext}}</h3> <p class="has-text-grey">{{\'Тут отображаются список профилей к которым у вас есть доступ\'|gettext}}</p> </div> </section> <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching"> <p>{{\'Загрузка данных\'|gettext}}</p> </section> </template> </b-table> </div> </div>'}),window.$app.defineComponent("account","vue-account-profiles-create-form",{data:function(){return{}},methods:{createEmpty:function(){var t=this;this.$confirm(this.$gettext("Вы хотите создать новый профиль?"),"is-info",{yes:this.$gettext("Да"),no:this.$gettext("Нет")}).then(function(){t.$api.get("account/profiles/create").then(function(e){"success"==e.result&&t.$auth.refresh(e.response,function(){t.$router.replace({name:"pages",params:{page_id:e.response.page_id}}),t.$parent.close()})})})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Новый профиль\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <div class="row create-form-choose"> <div class="col-xs-12 col-sm-6 has-xs-mb-2"> <a href="/login/instagrambasic/?method=connect"><dd class="button is-block-button"><dt><span><i class="fa fab fa-ig has-text-grey-light"></i>Instagram</span></dt></dd></a> </div> <div class="col-xs-12 col-sm-6"> <a @click="createEmpty"><dd class="button is-block-button"><dt><span><i class="fa fa fa-file has-text-grey-light"></i>{{\'Пустой профиль\'|gettext}}<span></dt></dt></a> </div> </div> </section> <footer class="modal-card-foot"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </footer> </div>'}),window.$app.defineComponent("account","vue-account-profiles-form",{data:function(){return{isUpdatingFavourite:!1,isUpdatingTransfer:!1,isUpdatingDelete:!1,isFetching:!0,values:{}}},created:function(){this.fetchData(!0)},computed:{isDisabled:function(){return this.$account.profile_id==this.values.profile_id}},props:["profile_id"],mixins:[FormModel],methods:{fetchData:function(e){var t=this;this.isFetching=e,this.$api.get("account/profiles/get",{profile_id:this.profile_id}).then(function(e){t.isFetching=!1,t.values=e.response.profiles.values})},changeProfileInternal:function(e){var t=this;this.$account.profile_id=null,this.$auth.changeProfile(e,"profiles",function(){t.$parent.$parent.refresh()})},deleteProfile:function(){var t=this;this.$confirm(this.$gettext('При выборе "Да, удалить мой профиль" ваши данные будут потеряны. Посетители больше не смогут открыть вашу страницу.'),"is-danger",{yes:this.$gettext("Да, удалить мой профиль")}).then(function(){t.isUpdatingDelete=!0,t.$api.get("account/profiles/delete",{profile_id:t.profile_id},t).then(function(e){"success"==e.result&&(e.response.profile_id&&t.changeProfileInternal(e.response.profile_id),t.$parent.close()),t.isUpdatingDelete=!1})})},transferProfile:function(){var t=this;this.isUpdatingTransfer=!0,this.$api.get("account/profiles/transfer",{profile_id:this.profile_id,transfer_email:this.values.transfer_email},this).then(function(e){"success"==e.result&&(e.response.profile_id&&t.changeProfileInternal(e.response.profile_id),t.$parent.close()),t.isUpdatingTransfer=!1})},transferProfileCancel:function(){var t=this;this.isUpdatingTransfer=!0,this.$api.get("account/profiles/transfercancel",{profile_id:this.profile_id},this).then(function(e){"success"==e.result&&t.$parent.close(),t.isUpdatingTransfer=!1})},changeProfile:function(){this.$auth.changeProfile(this.values.profile_id),this.$parent.close()}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title" v-if="values.nickname">{{values.nickname}}</p> <p class="modal-card-title" v-else>{{\'Профиль\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body modal-card-body-blocks"> <section> <div class="field"> <label class="label">{{\'Смена профиля\'|gettext}}</label> <p>{{\'Для того чтобы переключиться в выбранный профиль нажмите на кнопку ниже\'|gettext}}</p> </div> <button @click="changeProfile" class="button is-primary" :class="{disabled: isDisabled}" :disabled="isDisabled || values.is_transfer_pending == 1">{{\'Переключиться\'|gettext}}</button> </section> <section> <label class="label">{{\'Передача профиля на другой аккаунт\'|gettext}}</label> <p class="control has-mb-2">{{\'Укажите Email аккаунта на который хотите передать профиль\'|gettext}}</p> <b-field :message="errors.transfer_email" :class="{\'has-error\': errors.transfer_email}"> <b-input v-model="values.transfer_email" placeholder=\'example@mail.com\' :disabled="values.is_transfer_pending == 1"></b-input> </b-field> <button type="submit" class="button is-primary" @click="transferProfile" :class="{\'is-loading\': isUpdatingTransfer && values.is_transfer_pending == 0}" :disabled="values.is_transfer_pending == 1">{{\'Передать профиль\'|gettext}}</button> <button type="button" class="button is-primary has-ml-1" @click="transferProfileCancel" :class="{\'is-loading\': isUpdatingTransfer}" v-if="values.is_transfer_pending == 1">{{\'Отмена\'|gettext}}</button> </section> <section> <label class="label">{{\'Удаление профиля\'|gettext}}</label> <p class="control has-mb-2">{{\'Удаление вашего профиля необратимо, пожалуйста, действуйте с осторожностью\'|gettext}}</p> <button type="submit" class="button is-danger" @click="deleteProfile" :class="{\'is-loading\': isUpdatingDelete}" :disabled="values.is_transfer_pending == 1 || values.profile_status_id == 5">{{\'Удалить профиль\'|gettext}}</button> </section> </section> <footer class="modal-card-foot level"> <div class="level-left"> </div> <div class="level-right"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </div> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("account","vue-account-profiles-list",{data:function(){return{isFetching:!1,perPage:30,sortField:"tms_created",sortOrder:"desc"}},mixins:[ListModel],created:function(){this.fetchData(!0),this.$io.on("events:profiles.list:refresh",this.refresh)},destroyed:function(){this.$io.off("events:profiles.list:refresh",this.refresh)},props:["part"],methods:{refresh:function(){this.fetchData(!0,!0)},fetchData:function(e,t){function s(e){a.fields=_.map(e.fields,function(e){return e.is_updating=!1,e})}var a=this;!t&&this.checkCache(s)||(this.isFetching=e,this.$api.get("account/profiles/list",{part:this.part,next:this.next,count:this.perPage,sort_field:this.sortField,sort_order:this.sortOrder}).then(function(e){a.cachePage(e.response.profiles,s),a.isFetching=!1}).catch(function(e){throw a.accesses=[],a.total=0,a.isFetching=!1,e}))},clickRow:function(e){this.$form("vue-account-profiles-form",{profile_id:e.profile_id},this)},createProfile:function(){this.$form("vue-account-profiles-create-form",[],this)},transferTariff:function(){this.$form("vue-account-profiles-rateplan-form",[],this)},setFavourite:function(t){t.is_updating=!0;var s=!t.is_favourite;this.$api.get("account/profiles/favourite",{profile_id:t.profile_id,val:s}).then(function(e){"success"==e.result&&(t.is_favourite=s),t.is_updating=!1}).catch(function(){t.is_updating=!1})}},template:'<div> <vue-component-filterbox :with-query="false" :with-buttons="true"> <template slot="buttons"> <div class="row row-small"> <div class="col-xs-6 col-sm col-sm-grow"><a @click="transferTariff" class="button is-light is-fullwidth-mobile"><i class="fa fa-exchange has-mr-1"></i> {{\'Перенести тариф\'|gettext}}</a></div> <div class="col-xs-6 col-sm col-sm-shrink"><a @click="createProfile" class="button is-primary is-fullwidth-mobile"><i class="fa fa-plus has-mr-1"></i> {{\'Новый профиль\'|gettext}}</a></div> </div> </template> </vue-component-filterbox> <div class="container"> <b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @sort="onSort" @page-change="onPageChange" @click="clickRow" hoverable> <template slot-scope="props"> <b-table-column field="nickname" :label="\'Профиль\'|gettext" sortable> <div> <span style="width:20px;display:inline-block;" :class="{disabled: props.row.is_transfer_pending == 1}"> <i class="fal fa-spinner-third fa-spin" v-if="props.row.is_updating"></i> <i class="fa-star" :class="{fal: !props.row.is_favourite, fas: props.row.is_favourite}" @click.stop="setFavourite(props.row)" v-else></i> </span> {{ props.row.nickname }} <div class="is-pulled-right has-text-grey is-hidden-mobile" v-if="$account.profile_id == props.row.profile_id">{{\'Текущий профиль\'|gettext}}</div> <div class="is-pulled-right has-text-success is-hidden-mobile" v-if="props.row.is_transfer_pending == 1">{{\'Передача\'|gettext}}</div> </div> </b-table-column> <b-table-column :label="\'Действие\'|gettext" class="has-width-10"> <button @click.stop="$auth.changeProfile(props.row.profile_id)" class="button is-dark is-small" :class="{disabled: props.row.profile_id == $account.profile_id}" :disabled="props.row.is_transfer_pending == 1">{{\'Переключиться\'|gettext}}</button> </b-table-column> <b-table-column field="tariff" :label="\'Тариф\'|gettext" class="has-width-10"> <span class="tag is-danger" v-if="props.row.tariff == \'pro\'" style="background:#9d82da">pro</span><span class="tag is-danger" v-if="props.row.tariff == \'business\'">business</span><span class="tag is-default" v-if="props.row.tariff != \'business\' && props.row.tariff != \'pro\'">{{props.row.tariff}}</span> </b-table-column> <b-table-column field="tms_created" :label="\'Дата добавления\'|gettext" class="has-width-10 has-text-nowrap" numeric sortable> {{ props.row.tms_created|datetime }} </b-table-column> </template> <template slot="empty"> <section class="has-mb-4 has-mt-4 content has-text-centered" v-if="!isFetching"> <h3 class="has-text-grey">{{\'Список моих профилей\'|gettext}}</h3> </section> <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching"> <p>{{\'Загрузка данных\'|gettext}}</p> </section> </template> </b-table> </div> </div>'}),window.$app.defineComponent("account","vue-account-profiles-rateplan-form",{data:function(){return{isUpdating:!1,isFetching:!1,values:{profile_from:null,profile_to:null},variants:{profiles:{from:[],to:[]}}}},created:function(){this.fetchData(!0)},computed:{placeholder:function(){return"-- "+this.$gettext("Профиль")+" --"}},mixins:[FormModel],methods:{fetchData:function(e){var t=this;this.isFetching=e,this.$api.get("account/profiles/rateplan/info").then(function(e){t.isFetching=!1,t.variants=e.response.profiles.transfer.variants})},updateData:function(){var t=this;this.isUpdating=!0,this.$api.post("account/profiles/rateplan/set",this.values,this).then(function(e){"success"==e.result&&(t.$auth.refresh(),t.$parent.close()),t.isUpdating=!1}).catch(function(e){t.isUpdating=!1})}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Перенос тарифа\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="message is-info"> <div class="message-body">{{\'Вы можете перенести тариф с одного профиля на другой. Для этого выберите профиль с тарифом с которого вы будете переносить тариф, профиль без тарифа, на который вы будете переносить тариф и нажмите кнопку "Перенести"\'|gettext}}</div> </section> <section class="modal-card-body"> <b-field :label="\'Профиль с тарифом откуда перенести\'|gettext" :message="errors.profile_from" :class="{\'has-error\': errors.profile_from}"> <b-select v-model="values.profile_from" :placeholder="placeholder" expanded><option v-for="f in variants.profiles.from" :value="f.profile_id">{{ f.username }}</option></b-select> </b-field> <b-field :label="\'Профиль без тарифа куда перенести\'|gettext" :message="errors.profile_to" :class="{\'has-error\': errors.profile_to}"> <b-select v-model="values.profile_to" :placeholder="placeholder" expanded><option v-for="f in variants.profiles.to" :value="f.profile_id">{{ f.username }}</option></b-select> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> <button class="button is-primary" :class="{\'is-loading\': isUpdating}" @click="updateData" :disabled="!values.profile_from || !values.profile_to || (values.profile_from == values.profile_to)">{{\'Перенести\'|gettext}}</button> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("account","vue-account-settings-activity-form",{data:function(){return{isFetching:!1,isClosing:!1}},mixins:[ListModel],created:function(){this.fetchData()},methods:{onPageChange:function(e){this.page=e,this.fetchData(!1)},fetchData:function(e){var t=this;this.isFetching=!0;function s(e){t.fields=e.fields,t.isFetching=!1}!e&&this.checkCache(s)||this.$api.get("account/settings/activity/list",{next:this.next}).then(function(e){t.isFetching=t.isClosing=!1,t.cachePage(e.response.activity,s)})},closeSessions:function(){var t=this;this.isClosing=!0,this.$api.get("account/settings/activity/closesessions").then(function(e){t.$parent.$parent.fetchData(),t.$parent.close()})},titleIp:function(e){return this.$gettext("IP-адрес")+": "+e}},template:'<div class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">{{\'История активности\'|gettext}}</p> <button class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-table :data="fields" paginated backend-pagination pagination-simple :mobile-cards="false" class="table-header-hide" :per-page="perPage" :current-page="page" :total="total" @page-change="onPageChange"> <template slot-scope="props"> <b-table-column field="tms" style="display: flex;justify-content: space-between;align-items: center" :class="{disabled: !props.row.is_active}"> <div style="display: flex;"> <div class="icon-browser" :data-browser="props.row.client.browser.toLowerCase()"> <span :class="[\'iti__flag iti__flag-box\', \'iti__\'+props.row.country]" style="display: inline-block;position: absolute;right: 0;bottom: 0;" v-tippy="{placement: \'left\'}" :content="titleIp(props.row.ipv4)"></span> </div> <div> <div><b>{{props.row.client.device}}</b></div> <div class="has-text-grey">{{props.row.tms|datetime}} &bull; {{\'Браузер\'|gettext}} {{props.row.client.browser}}</div> </div> </div> <div class="tag has-tag-dot is-success" v-if="props.row.is_online">{{\'Онлайн\'|gettext}}</div> </b-table-column> </template> </b-table> </section> <footer class="modal-card-foot level"> <div class="level-left"> <button :class="[\'button is-danger\', {\'is-loading\': isClosing}]" @click="closeSessions" :disabled="isFetching">{{\'Завершить все сеансы\'|gettext}}</button> </div> <div class="level-right"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> </div> </footer> <b-loading :is-full-page="false" :active.sync="isFetching"></b-loading> </div>'}),window.$app.defineComponent("account","vue-account-settings-changeemail-form",{data:function(){return{isUpdating:!1,emailSent:!1,email:"",code:""}},mixins:[FormModel],computed:{allowUpdate:function(){return this.email.trim().length&&this.email.trim()!=this.$account.user.email}},methods:{updateData:function(){var t=this;this.isUpdating=!0,this.$api.post("account/settings/changeemail",{email:this.email,code:this.code,sent:this.emailSent},this).then(function(e){"sent"==e.result&&(t.emailSent=!0),"success"==e.result&&(t.$parent.$parent.fetchData(),t.$parent.close()),t.isUpdating=!1})}},template:'<form @submit.prevent="updateData" class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Email\'|gettext}}</p> <button type="button" class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <div class="message is-success" v-if="emailSent"> <div class="message-body"> {{\'Мы отправили проверочный код на вашу электронную почту. Введите его и нажмите кнопку "Продолжить"\'|gettext}} </div> </div> <b-field :class="{\'has-error\': errors.email}" :message="errors.email" :label="\'Электронная почта\'|gettext"> <input type="email" minlength="6" maxlength="40" v-model="email" class="input" :disabled="isUpdating || emailSent" v-focus required autocapitalize="off"></input> </b-field> <b-field :class="{\'has-error\': errors.code}" :message="errors.code" :label="\'Проверочный код\'|gettext" v-if="emailSent"> <vue-component-verifyfield v-model="code" :disabled="isUpdating" @keydown="errors.code = null" type="tel" style="max-width: 460px"></vue-component-verifyfield> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> <button class="button is-primary" type="submit" :class="{\'is-loading\': isUpdating}" :disabled="!allowUpdate">{{\'Продолжить\'|gettext}}</button> </footer> </form>'}),window.$app.defineComponent("account","vue-account-settings-changepassword-form",{data:function(){return{isUpdating:!1,password0:"",password1:"",password2:""}},props:["hasPassword"],mixins:[FormModel],computed:{allowUpdate:function(){return(6<=this.password0.trim().length||!this.hasPassword)&&6<=this.password1.trim().length}},created:function(){},methods:{updateData:function(){var t=this;this.isUpdating=!0,this.$api.post("account/settings/changepassword",{password0:this.password0,password1:this.password1,password2:this.password2},this).then(function(e){"success"==e.result&&(t.$parent.$parent.fetchData(),t.$parent.close()),t.isUpdating=!1})}},template:'<form @submit.prevent="updateData" class="modal-card"> <header class="modal-card-head"> <p class="modal-card-title">{{\'Пароль\'|gettext}}</p> <button type="button" class="modal-close is-large" @click="$parent.close()"></button> </header> <section class="modal-card-body"> <b-field :class="{\'has-error\': errors.password0}" :message="errors.password0" v-if="hasPassword" :label="\'Текущий пароль\'|gettext"> <input type="password" minlength="6" maxlength="40" v-model="password0" class="input" :class="{\'disabled\': isUpdating}" v-focus></input> </b-field> <b-field :class="{\'has-error\': errors.password}" :message="errors.password" :label="\'Новый пароль\'|gettext"> <input type="password" minlength="6" maxlength="40" v-model="password1" class="input" :class="{\'disabled\': isUpdating}"></input> </b-field> <b-field :class="{\'has-error\': errors.password}" :message="errors.password" :label="\'Повторите новый пароль\'|gettext"> <input type="password" minlength="6" maxlength="40" v-model="password2" class="input" :class="{\'disabled\': isUpdating}"></input> </b-field> </section> <footer class="modal-card-foot"> <button class="button is-dark" type="button" @click="$parent.close()">{{\'Закрыть\'|gettext}}</button> <button class="button is-primary" type="submit" :class="{\'is-loading\': isUpdating}" :disabled="!allowUpdate">{{\'Продолжить\'|gettext}}</button> </footer> </form>'}),window.$app.defineComponent("account","vue-account-settings-form",{data:function(){return{values:{email:"",password:"",sessions:[],externals:[]},isUpdating:!1,isFetching:!1,isExternalsUpdating:!1,state:""}},created:function(){this.fetchData()},computed:{localeRu:function(){return"ru"==window.i18n.locale}},methods:{titleIp:function(e){return this.$gettext("IP-адрес")+": "+e},fetchData:function(){var t=this;this.isFetching=!0,this.$api.get("account/settings/get").then(function(e){t.values=e.response,t.isFetching=!1})},showActivityForm:function(){this.$form("vue-account-settings-activity-form",null,this)},changePassword:function(){this.$form("vue-account-settings-changepassword-form",{hasPassword:0<this.values.password.length},this)},changeEmail:function(){this.$form("vue-account-settings-changeemail-form",null,this)},chooseState:function(e){var t=this;this.state=e,setTimeout(function(){t.state=""},1250)},deleteExternal:function(t){var s=this;this.$confirm(this.$gettext("Вы уверены что хотите удалить эту социальную сеть?"),"is-danger").then(function(){s.isExternalsUpdating=!0;var e=s.values.externals[t];s.$api.get("account/settings/externals/delete",{type_id:e.external_type_id,uniq:e.external_uniq}).then(function(e){"success"==e.result&&s.values.externals.splice(t,1),s.isExternalsUpdating=!1})})}},template:'<div class=\'has-mb-4 has-mt-4 has-xs-mb-3 has-xs-mt-3\'> <div class="container"> <div class="row has-mb-2-mobile"> <div class="col-xs-12 col-sm-4"> <h3 class="has-mb-2">{{\'Данные аккаунта\'|gettext}}</h3> </div> <div class="col-xs-12 col-sm-8"> <div class="panel panel-default"> <div class="has-p-2"> <div class="row"> <div class="col-xs-12 col-sm-6 has-xs-mb-2"> <b-field :label="\'Электронная почта\'|gettext"> <p class="control"> <b-field> <b-input type="email" v-model="values.email" disabled="true" expanded></b-input> <p class="control"> <button type="button" class="button is-default is-fullwidth-mobile" :class="{\'is-loading\': isUpdating}" @click="changeEmail" :disabled="isUpdating">{{\'Изменить\'|gettext}}</button> </p> </b-field> </p> </b-field> </div> <div class="col-xs-12 col-sm-6"> <b-field :label="\'Пароль\'|gettext"> <p class="control"> <b-field> <b-input type="password" :value="values.password" disabled="true" :placeholder="\'Пусто\'|gettext" expanded></b-input> <p class="control"> <button type="button" class="button is-default is-fullwidth-mobile" :class="{\'is-loading\': isUpdating}" @click="changePassword" :disabled="isUpdating">{{\'Изменить\'|gettext}}</button> </p> </b-field> </p> </b-field> </div> </div> </div> </div> </div> </div> <hr class="is-hidden-mobile"> <div class="row has-mb-2-mobile"> <div class="col-xs-12 col-sm-4"> <h3 class="has-mb-2">{{\'Безопасность\'|gettext}}</h3> <div class="has-text-grey has-mb-2 is-hidden-mobile">{{\'История активности показывает информацию о том, с каких устройств и в какое время вы входили на сайт\'|gettext}}</div> </div> <div class="col-xs-12 col-sm-8"> <div class="panel panel-default"> <div class="has-p-2"> <label class="label has-xs-mb-2">{{\'Последняя активность\'|gettext}}</label> <b-table :data="values.sessions" :loading="isFetching" :mobile-cards="false" class="table-header-hide has-mb-2"> <template slot-scope="props"> <b-table-column field="tms" style="display: flex;justify-content: space-between;align-items: center"> <div style="display: flex;"> <div class="icon-browser" :data-browser="props.row.client.browser.toLowerCase()"> <span :class="[\'iti__flag iti__flag-box\', \'iti__\'+props.row.country]" style="display: inline-block;position: absolute;right: 0;bottom: 0;" v-tippy="{placement: \'left\'}" :content="titleIp(props.row.ipv4)"></span> </div> <div> <div><b>{{props.row.client.device}}</b></div> <div class="has-text-grey">{{props.row.tms|datetime}} &bull; {{\'Браузер\'|gettext}} {{props.row.client.browser}}</div> </div> </div> <div class="tag has-tag-dot is-success" v-if="props.row.is_online">{{\'Онлайн\'|gettext}}</div> </b-table-column> </template> </b-table> <a @click="showActivityForm">{{\'Показать историю активности\'|gettext}}</a> </div> </div> </div> </div> <hr class="is-hidden-mobile"> <div class="row has-mb-2-mobile"> <div class="col-xs-12 col-sm-4"> <h3 class="has-mb-2">{{\'Социальные сети\'|gettext}}</h3> <div class="has-text-grey has-mb-2 is-hidden-mobile">{{\'Подключите свои социальные сети для быстрого входа в личный кабинет\'|gettext}}</div> </div> <div class="col-xs-12 col-sm-8"> <div class="panel panel-default"> <div class="has-p-2"> <label class="label" v-if="values.externals.length">{{\'Подключенные социальные сети\'|gettext}}</label> <b-table :data="values.externals" v-if="values.externals.length" :loading="isFetching" :mobile-cards="false" class="table-header-hide has-mb-2" :loading="isExternalsUpdating"> <template slot-scope="props"> <b-table-column field="external_type_name" style="display: flex;justify-content: space-between;align-items: center"> <div class="icon-external button fa fab" :class="\'is-\'+props.row.external_type_name" :data-id="props.row.external_type_name"></div> <div style="flex:1"> <b>{{props.row.external_title}}</b> <div class="has-text-grey">{{props.row.external_type_title}}</div> </div> <button class="button has-text-danger" @click="deleteExternal(props.index)"><i class="fal fa-trash-alt"></i></button> </b-table-column> </template> </b-table> <label class="label has-xs-mb-2">{{\'Подключить социальные сети\'|gettext}}</label> <div class="row row-small"> <div class="col-xs"> <a type="button" class="button is-medium is-fullwidth is-light" :class="{\'disabled\': state && state != \'facebook\', \'is-loading\': state== \'facebook\'}" :href="\'{1}/login/facebook/?method=connect\'|format(window.base_path_prefix)" @click="chooseState(\'facebook\')"><i class="fab fa-fb-o"></i><span class="is-hidden-mobile has-ml-1">Facebook</span></a> </div> <div class="col-xs"> <a type="button" class="button is-medium is-fullwidth is-light" :class="{\'disabled\': state && state != \'google\', \'is-loading\': state== \'google\'}" :href="\'{1}/login/google/?method=connect\'|format(window.base_path_prefix)" @click="chooseState(\'google\')"><i class="fab fa-g"></i><span class="is-hidden-mobile has-ml-1">Google</span></a> </div> <div class="col-xs" v-if="localeRu"> <a type="button" class="button is-medium is-fullwidth is-light" :class="{\'disabled\': state && state != \'vkontakte\', \'is-loading\': state== \'vkontakte\'}" :href="\'{1}/login/vkontakte/?method=connect\'|format(window.base_path_prefix)" @click="chooseState(\'vkontakte\')"><i class="fab fa-vk" style="font-size: 1.9rem"></i><span class="is-hidden-mobile has-ml-1">ВКонтакте</span></a> </div> </div> </div> </div> </div> </div> </div> </div>'}),window.$app.defineModule("account",[]);
