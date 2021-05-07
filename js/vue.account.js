
window.$app.defineComponent("account", "vue-account-access-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {profile_id: null, account_id: null, access_text: 'full', access: {1: true, 2: true, 4: true, 8: true, 16: true, 32: true, 64: true, 128: true}},
				errors: {profile_id: ''},
				modules: [],
			}
		},

		created() {
			this.fetchData();
		},

		props: ['profile_id', 'account_id', 'owner_profile_id', 'part'],
		
		computed: {
			title() {
				return (this.account_id)?((this.part == 'main')?this.$gettext('Вы открыли совместный доступ аккаунту'):this.$gettext('Вам открыли совместный доступ к профилю')):this.$gettext('Укажите имя профиля или email которому вы хотите открыть доступ');
			},
			
			username() {
				return (this.part == 'main')?(this.values.email):(this.values.username);
			}
		},

		methods: {
			fetchData() {
				this.isFetching = true;
				this.$api.get((this.profile_id || this.account_id)?['account/access/info', 'account/access/get']:'account/access/info', {owner_profile_id: this.owner_profile_id, profile_id: this.profile_id, account_id: this.account_id, part: this.part}).then((data) => {
					this.isFetching = false;
					
					this.modules = data.response.access.modules;
					
					if (data.response.access.values != undefined) {
						this.values = data.response.access.values;
	
						this.values.access_text = (this.values.access == 65535)?'full':'restricted';
						
						
						let access = {};
						_.each(this.modules, m => {
							_.each(m.items, i => {
								access[i.access_id] = ((this.values.access & i.access_id) == i.access_id);
							})
						})
						
						this.values.access = access;
					}
				});
			},
			
			updateData() {
				var values = _.merge(_.clone(this.values), {part: this.part});
				var access = 0;
				
				if (this.values.access_text == 'full') {
					access = 65535;
				} else {
					_.each(this.values.access, (v, i) => {
						access += parseInt(v?i:0);
					});
				}
				
				values.access = access;
				
				this.isUpdating = true;
				this.$api.post('account/access/set', values).then((data) => {
					if (data.result == 'fail') {
						this.errors = data.errors;
					} else {
						this.$parent.close()
					}
					this.isUpdating = false;
				}).catch(({ data }) => {
					this.isUpdating = false;
				})
			},
			
			revokeAccess(is_main) {
				this.$confirm(is_main?this.$gettext('Вы уверены что хотите отозвать доступ?'):this.$gettext('Вы уверены что хотите отказаться от доступа?'), 'is-danger').then(() => {
					this.$api.post('account/access/revoke', {profile_id: this.profile_id, account_id: this.account_id, owner_profile_id: this.owner_profile_id, part: this.part}).then((data) => {
						this.$parent.close();
					});
				});
			},
			
			changeProfile() {
				this.$auth.changeProfile(this.values.profile_id);
				this.$parent.close()
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Совместный доступ'|gettext}} <span v-if="part == 'main'"><span v-if="values.owner_profile_id">{{values.owner_username}}</span><span v-else>{{$account.username}}</span></span></p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
		<section>
			<b-field :label="title" :message="errors.username" :class="{'has-error': errors.username}">
            	<input :value="username" class="input" disabled v-if='this.account_id'></input>
            	<b-input v-model="values.username"  v-if='!this.account_id'></b-input>
			</b-field>
			
		</section>
		<section class="radio-list" :class="{disabled: part == 'shared'}">
			<label class="is-block radio"><input type='radio' v-model="values.access_text" :disabled="part == 'shared'" value="full"> {{'Предоставить полный доступ'|gettext}}</label>
			<label class="is-block radio"><input type='radio' v-model="values.access_text" :disabled="part == 'shared'" value="restricted"> {{'Предоставить ограниченный доступ'|gettext}}</label>
		</section>
		<section :class="{disabled: part == 'shared'}" v-show="values.access_text == 'restricted'">
			<div class="row">
				<div class="col-xs-12 col-sm-6" v-for="m in modules">
					<div class="has-mb-2 checkbox-list">
						<label class="is-block label has-text-grey">{{m.name}}</label>
						<label class="is-block checkbox" v-for="i in m.items" :class="{disabled: part == 'main' && i.access_id == 1}"><input type='checkbox' v-model="values.access[i.access_id]" :disabled="part == 'shared' || i.access_id == 1" value="true"> {{i.name}}</label>
					</div>
				</div>
					
<!--
			<div class="col-xs-12 col-sm-6">
				<div class="has-mb-2 checkbox-list">
					<label class="is-block label has-text-grey">{{'Страницы'|gettext}}</label>
					<label class="is-block checkbox" :class="{disabled: part == 'main'}"><input type='checkbox' :disabled="true" v-model="values.access[1]" value="true"> {{'Просматривать страницы'|gettext}}</label>
					<label class="is-block checkbox"><input type='checkbox' v-model="values.access[2]" :disabled="part == 'shared'" value="true"> {{'Редактировать страницы'|gettext}}</label>
				</div>
				<div class="block-xs checkbox-list">
					<label class="is-block label has-text-grey">{{'Заявки'|gettext}}</label>
					<label class="is-block checkbox"><input type='checkbox' v-model="values.access[4]" :disabled="part == 'shared'" value="true"> {{'Просматривать заявки'|gettext}}</label>
					<label class="is-block checkbox"><input type='checkbox' v-model="values.access[8]" :disabled="part == 'shared'" value="true"> {{'Редактировать заявки'|gettext}}</label>
				</div>
			</div>
			<div class="col-xs-12 col-sm-6">
				<div class="has-mb-2 checkbox-list">
					<label class="is-block label has-text-grey">{{'Товары'|gettext}}</label>
					<label class="is-block checkbox"><input type='checkbox' v-model="values.access[16]" :disabled="part == 'shared'" value="true"> {{'Просматривать товары'|gettext}}</label>
					<label class="is-block checkbox"><input type='checkbox' v-model="values.access[32]" :disabled="part == 'shared'" value="true"> {{'Редактировать товары'|gettext}}</label>
				</div>
				<div class="checkbox-list">
					<label class="is-block label has-text-grey">{{'Другое'|gettext}}</label>
					<label class="is-block checkbox"><input type='checkbox' v-model="values.access[64]" :disabled="part == 'shared'" value="true"> {{'Просматривать статистику'|gettext}}</label>
					<label class="is-block checkbox"><input type='checkbox' v-model="values.access[128]" :disabled="part == 'shared'" value="true"> {{'Редактировать настройки'|gettext}}</label>
				</div>
			</div>
-->
			</div>
		</section>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button class="button level-item" type="button" @click="revokeAccess(1)" v-if="account_id && (part == 'main')">{{'Отозвать доступ'|gettext}}</button>
				<button class="button level-item" type="button" @click="revokeAccess(0)" v-if="account_id && (part == 'shared')">{{'Отказаться'|gettext}}</button>
			</div>
			
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Отмена'|gettext}}</button>
				<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData" v-if="part == 'main'">{{'Сохранить'|gettext}}</button>
				<button class="button is-primary" v-if="part == 'shared'" @click="changeProfile">{{'Переключиться'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("account", "vue-account-access-list", {data() {
			return {
				isFetching: false,
                perPage: 100,
                sortField: 'tms_shared',
                sortOrder: 'desc',
                allowShare: false,
			}
		},
		
		mixins: [ListModel],
		

		created() {
			this.fetchData(true);
			this.$io.on('events:access.profiles:refresh', this.refresh);
		},
		
		destroyed: function() {
			this.$io.off('events:access.profiles:refresh', this.refresh);
		},
		
		props: ['part'],
		
		watch: {
			part() {
				this.clearPages();
				this.fetchData(true);
			}
		},
		
/*
		computed: {
			title: function() {
				return (this.part == 'main')?this.$gettext('Аккаунт'):this.$gettext('Профиль');
			}
		},
*/

		methods: {
			fetchData(withFetching) {
				
				if (!this.checkCache()) {
					this.isFetching = withFetching;

					this.$api.get('account/access/list', {part: this.part, next: this.next, sort_field: this.sortField, count: this.perPage, sort_order: this.sortOrder}).then((data) => {
						data.response.accesses.fields = (this.part == 'shared')?_.map(data.response.accesses.fields, (v) => { v.is_updating = false; return v; }):data.response.accesses.fields;
						this.cachePage(data.response.accesses);
						this.allowShare = data.response.accesses.allow_share;
						this.isFetching = false;
					}).catch((error) => {
	                    this.accesses = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
				}
			},
			
			revokeAccess(row) {
				this.$confirm(this.$gettext('Вы уверены что хотите отозвать доступ?'), 'is-danger').then(() => {
					 this.$api.post('account/access/revoke', {profile_id: row.profile_id, account_id: row.account_id, owner_profile_id: row.owner_profile_id, part: 'main'});
				});
			},
			
			clickRow(row) {
				this.$modal('vue-account-access-form', {part: this.part, profile_id: row.profile_id, account_id: row.account_id, owner_profile_id: row.owner_profile_id}, this);
			},
		            
            setFavourite(row) {
	            row.is_updating = true;
	            let val = !row.is_favourite;
	            
	            this.$api.get('account/profiles/favourite', {profile_id:row.profile_id,  val: val}).then((data) => {
		            if (data.result == 'success') {
						row.is_favourite = val;
		            }
		            
		            row.is_updating = false;
	            }).catch(() => {
		            row.is_updating = false;
	            })
            },

			openForm() {
				this.$modal('vue-account-access-form', {part: this.part}, this);
			}
		}, template: `
	<div>
		<vue-component-filterbox :with-query="false" :with-buttons="true">
			<template slot="buttons">
				<div class="level">
					
					<div class="level-left">
						<div class="field has-addons has-tabs-style">
							<div class="control is-expanded">
								<router-link class="b-radio radio button" :class="{'is-dark': part == 'main'}" :to="{name: 'access-main'}"><span>{{'Я открыл доступ'|gettext}}</span></router-link>
							</div>
							<div class="control is-expanded">
								<router-link class="b-radio radio button" :class="{'is-dark': part == 'shared'}" :to="{name: 'access-shared'}"><span>{{'Доступные мне'|gettext}}</span></router-link>
							</div>
						</div>
<!--
						
						<nav class="tabs is-toggle is-fullwidth"> 
							<ul> 
								<li :class="{'is-active': part == 'main'}" style="width:50%"><router-link :to="{name: 'access-main'}"><span>{{'Я открыл доступ'|gettext}}</span></router-link></li> 
								<li :class="{'is-active': part == 'shared'}" style="width:50%"><router-link :to="{name: 'access-shared'}"><span>{{'Доступные мне'|gettext}}</span></router-link></li> 
							</ul> 
						</nav>		
-->	
					</div>
					
					<div class="level-right" v-if="part == 'main'">
						<a @click="openForm()" class="button is-primary is-fullwidth" :class="{disabled: part == 'shared', disabled: !allowShare}"><i class='fas fa-plus has-mr-1'></i>{{'Открыть доступ'|gettext}}</a> 
					</div>

				</div>
<!--
				<b-tabs type="is-toggle">
		            <b-tab-item label="Pictures" icon="google-photos"></b-tab-item>
		            <b-tab-item label="Music" icon="library-music"></b-tab-item>
		            <b-tab-item label="Videos" icon="video"></b-tab-item>
		        </b-tabs>
-->
			</template>
		</vue-component-filterbox>
		
		<div class="container has-mb-4">
		<b-table paginated backend-pagination backend-sorting backend-sorting pagination-simple :data="fields" :loading="isFetching" :current-page="page" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @page-change="onPageChange" @sort="onSort" @click="clickRow" hoverable>
			
			<b-table-column field="username" :label="'Профиль'|gettext" sortable v-slot="props">
				<span v-if="part == 'main'">{{props.row.owner_username}} <span class="has-text-grey">{{'для'|gettext}}</span> {{ props.row.email }} <!-- <span class="has-text-grey">(@{{ props.row.username }})</span> --></span>
				<span v-if="part == 'shared'">
					<span style="width:20px;display:inline-block;">
					<i class="fal fa-spinner-third fa-spin" v-if="props.row.is_updating"></i>
					<i class="fa-star" :class="{fal: !props.row.is_favourite, fas: props.row.is_favourite}" @click.stop="setFavourite(props.row)" v-else></i>
					</span>

					{{ props.row.username }}
				</span>
				
			</b-table-column>

			<b-table-column :label="'Права'|gettext" cell-class="has-width-20" v-slot="props">
				<div class="has-text-grey"><span v-if="props.row.access == 65535">{{'Полный доступ'|gettext}}</span><span v-else>{{ 'Ограниченный доступ' | gettext }}</span></div>
			</b-table-column>
							
			<b-table-column :label="'Действие'|gettext" cell-class="has-width-10" v-slot="props">
				<button v-if="part == 'main'" @click.stop="revokeAccess(props.row)" class="button is-danger is-small">{{'Отозвать доступ'|gettext}}</button>
				<button v-if="part == 'shared'" @click.stop="$auth.changeProfile(props.row.profile_id)" class="button is-dark is-small" :class="{disabled: props.row.profile_id == $account.profile_id}">{{'Переключиться'|gettext}}</button>
			</b-table-column>

			<b-table-column field="tms_shared" :label="'Дата добавления'|gettext" cell-class="has-width-10 has-text-nowrap" numeric sortable v-slot="props">
				{{ props.row.tms_shared|datetime }} 
			</b-table-column>				
			
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-centered" v-if="!isFetching">
	                <div v-if="part == 'main'">
		                <h3 class="has-text-grey">{{'Список аккаунтов'|gettext}}</h3>
	                    <p class="has-text-grey">{{'Нажмите "Открыть доступ" для того чтобы открыть доступ к странице другому пользователю'|gettext}}</p>
	                </div>
	                <div v-if="part == 'shared'">
		                <h3 class="has-text-grey">{{'Список профилей'|gettext}}</h3>
	                    <p class="has-text-grey">{{'Тут отображаются список профилей к которым у вас есть доступ'|gettext}}</p>
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

window.$app.defineComponent("account", "vue-account-profiles-create-form", {methods: {
			createEmpty() {
				this.$confirm(this.$gettext('Вы хотите создать новый профиль?'), 'is-info', {yes: this.$gettext('Да'), no: this.$gettext('Нет')}).then(() => {
					this.$api.get('account/profiles/create').then((data) => {
						if (data.result == 'success') {
							this.$auth.refresh(data.response, () => {
								this.$router.replace({name: 'pages', params: {page_id: data.response.page_id}});
								this.$parent.close();
							});
						}
					});
				});
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Новый профиль'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			
			<div class="row create-form-choose">
				<div class="col-xs-12 col-sm-6 has-xs-mb-2">
					<a href="/login/instagrambasic/?method=connect"><dd class="button is-block-button"><dt><span><i class="fa fab fa-ig has-text-grey-light"></i>Instagram</span></dt></dd></a>
				</div>
				<div class="col-xs-12 col-sm-6">
					<a @click="createEmpty"><dd class="button is-block-button"><dt><span><i class="fa fa fa-file has-text-grey-light"></i>{{'Пустой профиль'|gettext}}<span></dt></dt></a>
				</div>
			</div>

		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
		</footer>
	</div>
		
`});

window.$app.defineComponent("account", "vue-account-profiles-form", {data() {
			return {
				isUpdatingFavourite: false,
				isUpdatingTransfer: false,
				isUpdatingDelete: false,
				isFetching: true,
				values: {}
			}
		},

		created() {
			this.fetchData(true);
		},
		
		computed: {
			isDisabled() {
				return this.$account.profile_id == this.values.profile_id;
			}
		},

		props: ['profile_id'],
		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('account/profiles/get', {profile_id: this.profile_id}).then((data) => {
					this.isFetching = false;
					if (data.result == 'success') {
						let r = data.response;
						this.values = r.profiles.values;
						this.account_token = r.account_token;
					}
				});
			},
			
			changeProfileInternal(profile_id) {
				this.$account.profile_id = null;
				this.$auth.changeProfile(profile_id, 'profiles', () => {
					this.$parent.$parent.refresh();
				});
			},
			
			deleteProfile() {
				this.$confirm(this.$gettext('При выборе "Да, удалить мой профиль" ваши данные будут потеряны. Посетители больше не смогут открыть вашу страницу.'), 'is-danger', {yes: this.$gettext('Да, удалить мой профиль')}).then(() => {
					this.$challenge({account_token: this.account_token}).then(code => {
						this.isUpdatingDelete = true;
						this.$api.get('account/profiles/delete', {profile_id: this.profile_id, hash: this.values.hash, challenge: code}, this).then((data) => {
							if (data.result == 'success') {
								if (data.response.profile_id) this.changeProfileInternal(data.response.profile_id);
								this.$parent.close();
							}
							this.isUpdatingDelete = false;
						});
					});
				});				
			},
			
			transferProfile() {
				this.isUpdatingTransfer = true;
				this.$api.get('account/profiles/transfer', {profile_id: this.profile_id, transfer_email: this.values.transfer_email, hash: this.values.hash}, this).then((data) => {
					if (data.result == 'success') {
						if (data.response.profile_id) this.changeProfileInternal(data.response.profile_id);
						this.$parent.close();
					}
					this.isUpdatingTransfer = false;
				});
			},
			
			transferProfileCancel() {
				this.isUpdatingTransfer = true;
				this.$api.get('account/profiles/transfercancel', {profile_id: this.profile_id}, this).then((data) => {
					if (data.result == 'success') {						
						this.$parent.close();
					}
					this.isUpdatingTransfer = false;
				});
			},
			
/*
			unconnectProfile() {
				this.$confirm(this.$gettext('Вы уверены что хотите убрать этот профиль из своего личного кабинета?'), 'is-danger').then(() => {
					this.isUpdating = true;
					this.$api.get('account/profiles/unconnect', {profile_id: this.profile_id, email: this.values.email}, this).then((data) => {
						if (data.result == 'success') {
							this.$parent.close();
						}
						this.isUpdating = false;
					});
				});
			},
*/
			
			changeProfile() {
				this.$auth.changeProfile(this.values.profile_id);
				this.$parent.close();
			}
			
/*
			setFavourite() {
				this.isUpdatingFavourite = true;
				let val = !this.values.is_favourite;
	            
	            this.$api.get('profiles/favourite', {profile_id:this.values.profile_id,  val: val}).then((data) => {
		            if (data.result == 'success') {
						this.values.is_favourite = val;
		            }
		            
		            this.isUpdatingFavourite = false;
	            }).catch(() => {
		            this.isUpdatingFavourite = false;
	            })
			}
*/
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title" v-if="values.nickname">{{values.nickname}}</p>
			<p class="modal-card-title" v-else>{{'Профиль'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
			<section>
				<div class="field">
					<label class="label">{{'Смена профиля'|gettext}}</label>
					<p>{{'Для того чтобы переключиться в выбранный профиль нажмите на кнопку ниже'|gettext}}</p>
				</div>
				<button @click="changeProfile" class="button is-primary" :class="{disabled: isDisabled}" :disabled="isDisabled || values.is_transfer_pending == 1">{{'Переключиться'|gettext}}</button>
			</section>
			<section>
				<label class="label">{{'Передача профиля на другой аккаунт'|gettext}}</label>
				<p class="control has-mb-2">{{'Укажите Email аккаунта на который хотите передать профиль'|gettext}}</p>
				<b-field :message="errors.transfer_email" :class="{'has-error': errors.transfer_email}">
					<b-input v-model="values.transfer_email" placeholder='example@mail.com' :disabled="values.is_transfer_pending == 1"></b-input>
				</b-field>
				<button type="submit" class="button is-primary" @click="transferProfile" :class="{'is-loading': isUpdatingTransfer && values.is_transfer_pending == 0}" :disabled="values.is_transfer_pending == 1">{{'Передать профиль'|gettext}}</button>
				<button type="button" class="button is-primary has-ml-1" @click="transferProfileCancel" :class="{'is-loading': isUpdatingTransfer}" v-if="values.is_transfer_pending == 1">{{'Отмена'|gettext}}</button>
			</section>

			<section>
				<label class="label">{{'Удаление профиля'|gettext}}</label>
				<p class="control has-mb-2">{{'Удаление вашего профиля необратимо, пожалуйста, действуйте с осторожностью'|gettext}}</p>
				<button type="submit" class="button is-danger" @click="deleteProfile" :class="{'is-loading': isUpdatingDelete}" :disabled="values.is_transfer_pending == 1 || values.profile_status_id == 5 || values.tariff_current != 'basic'">{{'Удалить профиль'|gettext}}</button>
			</section>
<!--
			<section>
				<label class="label">{{'Открепить профиль'|gettext}}</label>
-->
<!--
				<p class="control has-mb-2">{{'Вы можете передать профиль другому человеку. Для создания нового личного кабинета укажите email нового владельца'|gettext}}</p>
				<b-field :message="errors.email" :class="{'has-error': errors.email}">
					<b-input v-model="values.email" placeholder='sample@mail.com' :disabled="isDisabled"></b-input>
				</b-field>
-->
<!--
				<button type="submit" class="button is-danger" @click="unconnectProfile" :class="{'is-loading': isUpdating, disabled: isDisabled}" :disabled="isDisabled">{{'Открепить профиль'|gettext}}</button>
			</section>
-->
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
<!--
			<div class="button has-text-grey" style="border:0">
				<span style="margin: 0;width: 40px;text-align: left">
				<i class="fal fa-2x fa-spinner-third fa-spin has-text-grey-light" v-if="isUpdatingFavourite" style="margin: 0"></i>
				<i class="fa-star fa-2x has-text-grey-light" :class="{fal: !values.is_favourite, fas: values.is_favourite}" style="margin: 0" @click.stop="setFavourite" v-else></i>
				</span>
				Добавить в меню
			</div>
-->
			</div>

			<div class="level-right">			
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("account", "vue-account-profiles-list", {data() {
			return {
				isFetching: false,
				perPage: 30,
                sortField: 'tms_created',
                sortOrder: 'desc',
			}
		},
		
		mixins: [ListModel],

		created() {
			this.fetchData(true);
			this.$io.on('events:profiles.list:refresh', this.refresh);
		},
		
		destroyed: function() {
			this.$io.off('events:profiles.list:refresh', this.refresh);
		},
		
		props: ['part'],

		methods: {
			refresh() {
				this.fetchData(true, true);
			},
			
			fetchData(withFetching, force) {
				
				let resolve = (data) => {
					this.fields = _.map(data.fields, (v) => { v.is_updating = false; return v; });
				}
				
				if (force || !this.checkCache(resolve)) {
					this.isFetching = withFetching;
					this.$api.get('account/profiles/list', {part: this.part, next: this.next, count: this.perPage, sort_field: this.sortField, sort_order: this.sortOrder}).then((data) => {
						this.cachePage(data.response.profiles, resolve);
						this.isFetching = false;
					}).catch((error) => {
	                    this.accesses = []
	                    this.total = 0
	                    this.isFetching = false
	                    throw error
	                })
                }
			},
			
			clickRow(row) {
				this.$modal('vue-account-profiles-form', {profile_id: row.profile_id}, this);
			},
			
            createProfile() {
	            this.$modal('vue-account-profiles-create-form', [], this);
            },
            
            transferTariff() {
	            this.$modal('vue-account-profiles-rateplan-form', [], this);
            },
            
            setFavourite(row) {
	            row.is_updating = true;
	            let val = !row.is_favourite;
	            
	            this.$api.get('account/profiles/favourite', {profile_id:row.profile_id, val: val}).then((data) => {
		            if (data.result == 'success') {
						row.is_favourite = val;
		            }
		            
		            row.is_updating = false;
	            }).catch(() => {
		            row.is_updating = false;
	            })
            }
		}, template: `
	<div>
		<vue-component-filterbox :with-query="false" :with-buttons="true">
			<template slot="buttons">
			<div class="row row-small">
				<div class="col-xs-6 col-sm col-sm-grow"><a @click="transferTariff" class="button is-light is-fullwidth-mobile"><i class="fa fa-exchange has-mr-1"></i> {{'Перенести тариф'|gettext}}</a></div>
				<div class="col-xs-6 col-sm col-sm-shrink"><a @click="createProfile" class="button is-primary is-fullwidth-mobile"><i class="fa fa-plus has-mr-1"></i> {{'Новый профиль'|gettext}}</a></div>
			</div>
			</template>
		</vue-component-filterbox>
		
		<div class="container has-mb-3">
		<b-table paginated backend-pagination backend-sorting pagination-simple :data="fields" :loading="isFetching" :per-page="perPage" :total="total" :default-sort="[sortField, sortOrder]" @sort="onSort" @page-change="onPageChange" @click="clickRow" hoverable mobile-cards>
			
			<b-table-column field="nickname" :label="'Профиль'|gettext" sortable v-slot="props">
				<div>
				<span style="width:20px;display:inline-block;" :class="{disabled: props.row.is_transfer_pending == 1}">
				<i class="fal fa-spinner-third fa-spin" v-if="props.row.is_updating"></i>
				<i class="fa-star" :class="{fal: !props.row.is_favourite, fas: props.row.is_favourite}" @click.stop="setFavourite(props.row)" v-else></i>
				</span>
				{{ props.row.nickname }} 
				<div class="is-pulled-right has-text-grey is-hidden-mobile" v-if="$account.profile_id == props.row.profile_id">{{'Текущий профиль'|gettext}}</div>
				<div class="is-pulled-right has-text-success is-hidden-mobile" v-if="props.row.is_transfer_pending == 1">{{'Передача'|gettext}}</div>
				</div>
			</b-table-column>

			<b-table-column :label="'Действие'|gettext" cell-class="has-width-10" v-slot="props">
				<button @click.stop="$auth.changeProfile(props.row.profile_id)" class="button is-dark is-small" :class="{disabled: props.row.profile_id == $account.profile_id}" :disabled="props.row.is_transfer_pending == 1">{{'Переключиться'|gettext}}</button>
			</b-table-column>

			<b-table-column field="tariff" :label="'Тариф'|gettext" cell-class="has-width-10" v-slot="props">
				<span class="tag is-danger" v-if="props.row.tariff == 'pro'" style="background:#9d82da">pro</span><span class="tag is-danger" v-if="props.row.tariff == 'business'">business</span><span class="tag is-default" v-if="props.row.tariff != 'business' && props.row.tariff != 'pro'">{{props.row.tariff}}</span>
			</b-table-column>

			<b-table-column field="tms_created" :label="'Дата добавления'|gettext" cell-class="has-width-10 has-text-nowrap" numeric sortable v-slot="props">
				{{ props.row.tms_created|datetime }} 
			</b-table-column>
			
			<template slot="empty">
                <section class="has-mb-4 has-mt-4 content has-text-centered" v-if="!isFetching">
	                <h3 class="has-text-grey">{{'Список моих профилей'|gettext}}</h3>
                </section>
                <section class="has-mb-4 has-mt-4 content has-text-grey has-text-centered" v-if="isFetching">
	                <p>{{'Загрузка данных'|gettext}}</p>
                </section>
            </template>
            	        
		</b-table>

		</div>
	</div>
`});

window.$app.defineComponent("account", "vue-account-profiles-rateplan-form", {data() {
			return {
				isUpdating: false,
				isFetching: false,
				values: {profile_from: null, profile_to: null},
				variants: {profiles: {from: [], to: []}}
			}
		},

		created() {
			this.fetchData(true);
		},
		
		computed: {
			placeholder() {
				return '-- '+this.$gettext('Профиль')+' --';
			}
		},

		mixins: [FormModel],

		methods: {
			fetchData(withLoading) {
				this.isFetching = withLoading;
				this.$api.get('account/profiles/rateplan/info').then((data) => {
					this.isFetching = false;
					this.variants = data.response.profiles.transfer.variants;
				});

			},
			
			updateData() {
				this.isUpdating = true;
				this.$api.post('account/profiles/rateplan/set', this.values, this).then((data) => {
					if (data.result == 'success') {
						this.$auth.refresh();
						this.$parent.close();
					}
					this.isUpdating = false;
				}).catch((error) => {
					this.isUpdating = false;
				})
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Перенос тарифа'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="message is-info">
			<div class="message-body">{{'Вы можете перенести тариф с одного профиля на другой. Для этого выберите профиль с тарифом с которого вы будете переносить тариф, профиль без тарифа, на который вы будете переносить тариф и нажмите кнопку "Перенести"'|gettext}}</div>
		</section>
		<section class="modal-card-body">
			<b-field :label="'Профиль с тарифом откуда перенести'|gettext" :message="errors.profile_from" :class="{'has-error': errors.profile_from}">
	            <b-select v-model="values.profile_from" :placeholder="placeholder" expanded><option v-for="f in variants.profiles.from" :value="f.profile_id">{{ f.username }}</option></b-select>
	        </b-field>

			<b-field :label="'Профиль без тарифа куда перенести'|gettext" :message="errors.profile_to" :class="{'has-error': errors.profile_to}">
	            <b-select v-model="values.profile_to" :placeholder="placeholder" expanded><option v-for="f in variants.profiles.to" :value="f.profile_id">{{ f.username }}</option></b-select>
	        </b-field>

		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" :class="{'is-loading': isUpdating}" @click="updateData" :disabled="!values.profile_from || !values.profile_to || (values.profile_from == values.profile_to)">{{'Перенести'|gettext}}</button>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("account", "vue-account-settings-activity-form", {data: function() {
			return {
				isFetching: false,
				isClosing: false
			}
		},

		mixins: [ListModel],

		created: function () {
			this.fetchData();
		},

		methods: {
			onPageChange(page) {
                this.page = page;
                this.fetchData(false);
            },
           			
			fetchData(force) {
				this.isFetching = true;
				
				let resolve = (data) => {
					this.fields = data.fields;
					this.isFetching = false;
				}
				
				if (force || !this.checkCache(resolve)) {
					this.$api.get('account/settings/activity/list', {next: this.next}).then((data) => {
						this.isFetching = this.isClosing = false;
						this.cachePage(data.response.activity, resolve);
					});
				}
			},
			closeSessions() {
				this.isClosing = true;
				this.$api.get('account/settings/activity/closesessions').then((data) => {
/*
					this.clearPages();
					this.fetchData();
*/
					this.$parent.$parent.fetchData();
					this.$parent.close();
				});
			},
			titleIp(ip) {
				return this.$gettext('IP-адрес')+': '+ip;
			}
		}, template: `
	<div class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'История активности'|gettext}}</p>
			<button class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			<b-table :data="fields" paginated backend-pagination pagination-simple :mobile-cards="false" class="table-header-hide" :per-page="perPage" :current-page="page" :total="total" @page-change="onPageChange">
				<b-table-column field="tms" v-slot="props">
				<div style="display: flex;justify-content: space-between;align-items: center">
					<div style="display: flex;" :class="{disabled: !props.row.is_active}">
						<div class="icon-browser" :data-browser="props.row.client.browser.toLowerCase()">
							<span :class="['iti__flag iti__flag-box', 'iti__'+props.row.country]" style="display: inline-block;position: absolute;right: 0;bottom: 0;" v-tippy="{placement: 'left'}" :content="titleIp(props.row.ipv4)"></span>
						</div>
						<div>
							<div><b>{{props.row.client.device}}</b></div>
							<div class="has-text-grey">{{props.row.tms|datetime}} &bull; {{'Браузер'|gettext}} {{props.row.client.browser}}</div>
						</div>
					</div>
					<div class="tag has-tag-dot is-success" v-if="props.row.is_online">{{'Онлайн'|gettext}}</div>
				</div>
				</b-table-column>
			</b-table>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button :class="['button is-danger', {'is-loading': isClosing}]" @click="closeSessions" :disabled="isFetching">{{'Завершить все сеансы'|gettext}}</button>
			</div>
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>
	</div>
		
`});

window.$app.defineComponent("account", "vue-account-settings-authenticator-form", {data() {
			return {
				isFetching: true,
				isUpdating: false,
				secret: null,
				otpauth: null,
				values: {code: ''}
			}
		},
		
		mixins: [FormModel],

		computed: {
			secret_human() {
				let r = this.secret.match(/([A-Z0-9\*]{4})([A-Z0-9\*]{4})([A-Z0-9\*]{4})([A-Z0-9\*]{4})/);
				delete r[0];
				return r.join(' ');
			}
		},
		
		created() {
			this.$api.get('account/settings/security/authenticator/get').then((data) => {
				if (data.result == 'success') {
					let r = data.response;
					this.secret = r.secret;
					this.otpauth = r.otpauth;
				}
				this.isFetching = false;
			});
		},
		
		methods: {
			save() {
				this.isUpdating = true;
				this.$api.get('account/settings/security/authenticator/confirm', {secret: this.secret, code :this.values.code}, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.$parent.fetchData();
						this.$parent.close();
					}
					this.isUpdating = false;
				});
			}
		}, template: `
	<form @submit.prevent="checkCode" class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Настройка приложения для генерации кодов'|gettext}}</p>
			<button type="button" class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		
		<section class="modal-card-body modal-card-body-blocks">
			<section class="message is-warning">
				<div class="message-body">
					{{'Воспользуйтесь любым приложением для генерации кодов. Например, Google Authenticator. Просканируйте в приложении QR-код или введите секретный ключ, указанный ниже. После этого, введите проверочный код из приложения.'|gettext}}
				</div>
			</section>
			<transition name="fade">
			<section v-if="secret">
				<div class="row">
					<div class="col-xs-12 col-sm-4 col-sm-offset-4" v-if="otpauth">
						<label class="label">{{'QR-код'|gettext}}</label>
						<vue-component-qrcode :value="otpauth" size="100%"></vue-component-qrcode>

						<label class="label">{{'Секретный ключ'|gettext}}</label>
						<div class="has-mb-2">
						<b>{{secret_human}}</b> <vue-component-clipboard :text="secret" v-if=""/>
						</div>
						
						<b-field :class="{'has-error': errors.code}" :message="errors.code" :label="'Проверочный код'|gettext">
							<input type="text" class="input" v-model="values.code" @keydown="errors.code = null" type="tel" maxlength="6" v-focus>
						</b-field>
						
					</div>
					<div class="col-xs-12 has-text-centered" v-else>
						<label class="label">{{'Секретный ключ'|gettext}}</label>
						<div class="has-mb-2">
						<b>{{secret_human}}</b>
						</div>
					</div>
			</section>
			</transition>
		</section>
		<footer class="modal-card-foot level">
			<div class="level-left">
				<button class="button is-danger" type="button" @click="$parent.$parent.deleteAuthenticator()" v-if="secret && !otpauth">{{'Отключить'|gettext}}</button>
			</div>
			<div class="level-right">
				<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
				<button class="button is-success" type="submit" @click="save()" v-if="otpauth" :disabled="values.code.length < 6 || !secret" :class="{'is-loading': isUpdating}">{{'Подключить'|gettext}}</button>
			</div>
		</footer>
		<b-loading :is-full-page="false" :active.sync="isFetching"></b-loading>		
	</form>
`});

window.$app.defineComponent("account", "vue-account-settings-changeemail-form", {data: function() {
			return {
				isUpdating: false,
				emailSent: false,
				email: '',
				code: ''
			}
		},

		mixins: [FormModel],
		
		computed: {
			allowUpdate() {
				return this.email.trim().length && (this.email.trim() != this.$account.user.email);
			}
		},

		methods: {
			updateData() {
				this.isUpdating = true;

				this.$api.post('account/settings/changeemail', {email: this.email, code: this.code, sent: this.emailSent}, this).then((data) => {
					if (data.result == 'sent') {
						this.emailSent = true;
					}
					
					if (data.result == 'success') {
						this.$account.user.email = this.email;
						this.$parent.$parent.fetchData();
						this.$parent.close();
					}
					
					this.isUpdating = false;
				});
			}
		}, template: `
	<form @submit.prevent="updateData" class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Email'|gettext}}</p>
			<button type="button" class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body">
			
			<div class="message is-success" v-if="emailSent">
				<div class="message-body">
				{{'Мы отправили проверочный код на вашу электронную почту. Введите его и нажмите кнопку "Продолжить"'|gettext}}
				</div>
			</div>
			
			<b-field :class="{'has-error': errors.email}" :message="errors.email" :label="'Электронная почта'|gettext">
	            <input type="email" minlength="6" maxlength="40" v-model="email" class="input" :disabled="isUpdating || emailSent" v-focus required autocapitalize="off"></input>
	        </b-field>
	        
			<b-field :class="{'has-error': errors.code}" :message="errors.code" :label="'Проверочный код'|gettext" v-if="emailSent">
				<vue-component-verifyfield v-model="code" :disabled="isUpdating" @keydown="errors.code = null" type="tel" style="max-width: 460px"></vue-component-verifyfield>
	        </b-field>
	        
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" type="submit" :class="{'is-loading': isUpdating}" :disabled="!allowUpdate">{{'Продолжить'|gettext}}</button>
		</footer>
	</form>
`});

window.$app.defineComponent("account", "vue-account-settings-changepassword-form", {data: function() {
			return {
				isUpdating: false,
				password0: '',
				password1: '',
				password2: ''
			}
		},
		
		props: ['hasPassword'],

		mixins: [FormModel],
		
		computed: {
			allowUpdate() {
				return ((this.password0.trim().length >= 6) || !this.hasPassword) && (this.password1.trim().length >= 6);
			}
		},

		created: function () {
			
		},

		methods: {
			updateData() {
				this.isUpdating = true;
				this.$api.post('account/settings/changepassword', {password0: this.password0, password1: this.password1, password2: this.password2}, this).then((data) => {
					if (data.result == 'success') {
						this.$parent.$parent.fetchData();
						this.$parent.close();
					}

					this.isUpdating = false;
				});
			}
		}, template: `
	<form @submit.prevent="updateData" class="modal-card">
		<header class="modal-card-head">
			<p class="modal-card-title">{{'Пароль'|gettext}}</p>
			<button type="button" class="modal-close is-large" @click="$parent.close()"></button>
		</header>
		<section class="modal-card-body modal-card-body-blocks">
		<section>
			<b-field :class="{'has-error': errors.password0}" :message="errors.password0" v-if="hasPassword" :label="'Текущий пароль'|gettext">
	            <input type="password" minlength="6" maxlength="40" v-model="password0" class="input" :class="{'disabled': isUpdating}" v-focus></input>
	        </b-field>
		</section>
		<section>
			<b-field :class="{'has-error': errors.password}" :message="errors.password" :label="'Новый пароль'|gettext">
	            <input type="password" minlength="6" maxlength="40" v-model="password1" class="input" :class="{'disabled': isUpdating}"></input>
	        </b-field>

			<b-field :class="{'has-error': errors.password}" :message="errors.password" :label="'Повторите новый пароль'|gettext">
	            <input type="password" minlength="6" maxlength="40" v-model="password2" class="input" :class="{'disabled': isUpdating}"></input>
	        </b-field>
		</section>
		</section>
		<footer class="modal-card-foot">
			<button class="button is-dark" type="button" @click="$parent.close()">{{'Закрыть'|gettext}}</button>
			<button class="button is-primary" type="submit" :class="{'is-loading': isUpdating}" :disabled="!allowUpdate">{{'Продолжить'|gettext}}</button>
		</footer>
	</form>
`});

window.$app.defineComponent("account", "vue-account-settings-form", {data() {
			return {
				values: {
					email: '',
					password: '',
					sessions: [],
					externals: [],
					security: {operations: [], twofactor_methods: []}
				},
				isUpdating: false,
				isFetching: false,
				isUpdatingSecurity: false,
				isExternalsUpdating: false,
				state: ''
			}
		},
		
		created() {
			this.fetchData();
		},
		
		computed: {
			localeRu() {
				return window.i18n.locale == 'ru';
			}
		},
		
		methods: {
			showAuthenticatorForm() {
				this.$modal('vue-account-settings-authenticator-form', {}, this);
			},
			
			changeSecurityOperations(field) {
				let value = this.values.security.operations.indexOf(field) != -1;
				
				let texts = {
					'auth': [this.$gettext('Отключить двойную аутентификацию при авторизации в систему?'), this.$gettext('Включить двойную аутентификацию при авторизации в систему?')],
					'payments': [this.$gettext('Отключить подтверждение действий при изменении платежных систем?'), this.$gettext('Включить подтверждение действий при изменении платежных систем?')],
				}
				
				this.$confirm(texts[field][value?0:1], 'is-warning', {yes: this.$gettext('Да'), no: this.$gettext('Нет')}).then(() => {
					if (!value) {
						this.changeSecurityOperationsInternal(field, true);
					} else {
						this.$challenge().then(code => {
							this.changeSecurityOperationsInternal(field, false, code);
						});
					}
				});
			},
			
			changeSecurityOperationsInternal(field, value, challenge) {
				this.isUpdatingSecurity = true;
				this.$api.post('account/settings/security/update', {field: field, value: value, challenge: challenge}).then((data) => {
					if (data.result == 'success') {
						this.isUpdatingSecurity = false;
						if (value) {
							this.values.security.operations.push(field);
						} else {
							this.values.security.operations.splice(this.values.security.operations.indexOf(field), 1);
						}
					}
				});
			},			
			
			titleIp(ip) {
				return this.$gettext('IP-адрес')+': '+ip;
			},
			
			deleteAuthenticator() {
				this.$challenge().then(code => {
					this.isUpdatingSecurity = true;
					this.$api.post('account/settings/security/delete', {method: 'authenticator', challenge: code}).then((data) => {
						this.isUpdatingSecurity = false;
						if (data.result == 'success') {
							this.values.security.twofactor_methods.splice(this.values.security.twofactor_methods.indexOf('authenticator'), 1);
						}
					});
				})
			},
			
			challengeSuccess(code, tag) {
				switch (tag) {
					case 'delete:authenticator':
						break;
				}
			},
						
			fetchData() {
				this.isFetching = true;
				this.$api.get('account/settings/get').then((data) => {
					this.values = data.response;
					this.isFetching = false;
				});
			},
			showActivityForm() {
				this.$modal('vue-account-settings-activity-form', null, this);
			},
			changePassword() {
				this.$modal('vue-account-settings-changepassword-form', {hasPassword: this.values.password.length > 0}, this);
			},
			changeEmail() {
				this.$modal('vue-account-settings-changeemail-form', null, this);
			},
			chooseState(v) {
				this.state = v;
				setTimeout(() => {
					this.state = '';
				}, 1250);
			},
			deleteExternal(idx) {
				this.$confirm(this.$gettext('Вы уверены что хотите удалить эту социальную сеть?'), 'is-danger').then(() => {
					this.isExternalsUpdating = true;
					let e = this.values.externals[idx];
					this.$api.get('account/settings/externals/delete', {type_id: e.external_type_id, uniq: e.external_uniq}).then((data) => {
						if (data.result == 'success') this.values.externals.splice(idx, 1);
						this.isExternalsUpdating = false;
					});
				});
			}
		}, template: `
	<div class='has-mb-4 has-mt-4 has-xs-mb-3 has-xs-mt-3'>
	<div class="container">
		<div class="row has-mb-2-mobile">
			<div class="col-xs-12 col-sm-4">
				<h3 class="has-mb-2">{{'Данные аккаунта'|gettext}}</h3>
<!-- 				<div class="has-text-grey has-mb-2">{{'Настройка интерфейса и локализация страницы'|gettext}}</div> -->
			</div>
			<div class="col-xs-12 col-sm-8">
				<div class="panel panel-default">
					<div class="has-p-2">
						<div class="row">
						<div class="col-xs-12 col-sm-6 has-xs-mb-2">
							<b-field :label="'Электронная почта'|gettext">
								<p class="control">
									<b-field>
										<b-input type="email" v-model="values.email" disabled="true" expanded></b-input>
										<p class="control">
											<button type="button" class="button is-default is-fullwidth-mobile" :class="{'is-loading': isUpdating}" @click="changeEmail" :disabled="isUpdating">{{'Изменить'|gettext}}</button>					
										</p>
									</b-field>
								</p>
							</b-field>
						</div>
						<div class="col-xs-12 col-sm-6">
							<b-field :label="'Пароль'|gettext">
								<p class="control">
									<b-field>
										<b-input type="password" :value="values.password" disabled="true" :placeholder="'Пусто'|gettext" expanded></b-input>
										<p class="control">
											<button type="button" class="button is-default is-fullwidth-mobile" :class="{'is-loading': isUpdating}" @click="changePassword" :disabled="isUpdating">{{'Изменить'|gettext}}</button>					
										</p>
									</b-field>
								</p>
							</b-field>
						</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<hr class="is-hidden-mobile">
		
		<div class="row has-mb-2-mobile">
			<div class="col-xs-12 col-sm-4">
				<h3 class="has-mb-2">{{'Безопасность'|gettext}}</h3>
				<div class="has-text-grey has-mb-2 is-hidden-mobile">{{'История активности показывает информацию о том, с каких устройств и в какое время вы входили на сайт'|gettext}}</div>
			</div>
			<div class="col-xs-12 col-sm-8">
				<div class="panel panel-default">
					<div class="has-p-2">
						<label class="label has-xs-mb-2">{{'Последняя активность'|gettext}}</label>

						<b-table :data="values.sessions" :loading="isFetching" :mobile-cards="false" class="table-header-hide has-mb-2">
							<b-table-column field="tms" v-slot="props">
							<div style="display: flex;justify-content: space-between;align-items: center">
								<div style="display: flex;">
									<div class="icon-browser" :data-browser="props.row.client.browser.toLowerCase()">
										<span :class="['iti__flag iti__flag-box', 'iti__'+props.row.country]" style="display: inline-block;position: absolute;right: 0;bottom: 0;" v-tippy="{placement: 'left'}" :content="titleIp(props.row.ipv4)"></span>
									</div>
									<div>
										<div><b>{{props.row.client.device}}</b></div>
										<div class="has-text-grey">{{props.row.tms|datetime}} &bull; {{'Браузер'|gettext}} {{props.row.client.browser}}</div>
									</div>
								</div>
								<div class="tag has-tag-dot is-success" v-if="props.row.is_online">{{'Онлайн'|gettext}}</div>
							</div>
							</b-table-column>
						</b-table>

						<a @click="showActivityForm">{{'Показать историю активности'|gettext}}</a>
					</div>
					
					<div class="has-p-2" style="border-top: 1px solid #e9edef;border-color: var(--border-grey-color);">
						<label class="label has-xs-mb-2">{{'Подтверждение действий'|gettext}}</label>
						<div><b-checkbox v-model="values.security.operations" native-value="auth" @click.native.prevent="changeSecurityOperations('auth')" :disabled="isUpdatingSecurity">{{'Авторизация'|gettext}}</b-checkbox></div>
						<div><b-checkbox v-model="values.security.operations" native-value="payments" @click.native.prevent="changeSecurityOperations('payments')" :disabled="isUpdatingSecurity">{{'Изменение платежных систем'|gettext}}</b-checkbox></div>
					</div>
					<transition name="fade">
					<div class="has-p-2" style="border-top: 1px solid #e9edef;border-color: var(--border-grey-color);" v-if="values.security.operations.length">
						<label class="label has-xs-mb-2">{{'Способы получить код безопасности'|gettext}}</label>
						
						<div class="b-table table-header-hide has-mb-2">
						<div class="table-wrapper">
							<table class="table">
								<tbody>
								<tr>
									<td class="media">
										<img src="/s/i/messengers/icons/email.svg" class="has-mr-1" style="width:40px">
										<div>
											<label class="label is-marginless">{{'Электронная почта'|gettext}}</label>
											<span class="has-text-success">{{'Включено'|gettext}}</span>
										</div>
									</td>
								</tr>
								<tr>
									<td class="media">
										<img src="/s/i/icons/authenticator.svg" class="has-mr-1" style="width:40px">
										<div>
											<label class="label is-marginless">{{'Приложение для генерации кодов'|gettext}}</label>
											<div v-if="values.security.twofactor_methods.indexOf('authenticator') == -1">
												<span class="has-text-grey">{{'Выключено'|gettext}}</span> &bull; <a @click="showAuthenticatorForm">{{'Настроить'|gettext}}
											</div>
											<div v-else>
												<span class="has-text-success">{{'Включено'|gettext}}</span> &bull; <a @click="deleteAuthenticator" class="has-text-danger">{{'Отключить'|gettext}}
											</div>
										</div>
									</td>
								</tr>
								</tbody>
							</table>
						</div>	
						</div>		
			

<!--
						<div><b-checkbox :value="true" disabled>{{'Электронная почта'|gettext}}</b-checkbox></div>
						<div><b-checkbox v-model="values.security.twofactor_methods" native-value="authenticator" :disabled="isUpdatingSecurity" @input="changeSecurity('twofactor_methods')" >{{'Приложение для генерации кодов'|gettext}} &bull; <a @click.prevent.stop="showAuthenticatorForm">Настроить</a></b-checkbox></div>
-->
					</div>
					</transition>
				</div>
			</div>
		</div>	
		
		<hr class="is-hidden-mobile">
		
		<div class="row has-mb-2-mobile">
			<div class="col-xs-12 col-sm-4">
				<h3 class="has-mb-2">{{'Социальные сети'|gettext}}</h3>
				<div class="has-text-grey has-mb-2 is-hidden-mobile">{{'Подключите свои социальные сети для быстрого входа в личный кабинет'|gettext}}</div>
			</div>
			<div class="col-xs-12 col-sm-8">
				<div class="panel panel-default">
					<div class="has-p-2">
						<label class="label" v-if="values.externals.length">{{'Подключенные социальные сети'|gettext}}</label>
						<b-table :data="values.externals" v-if="values.externals.length" :loading="isFetching" :mobile-cards="false" class="table-header-hide has-mb-2" :loading="isExternalsUpdating">
							<b-table-column field="external_type_name" v-slot="props">
								<div style="display: flex;justify-content: space-between;align-items: center">
								<div class="icon-external button fa fab" :class="'is-'+props.row.external_type_name" :data-id="props.row.external_type_name"></div>
								<div style="flex:1">
									<b>{{props.row.external_title}}</b>
									<div class="has-text-grey">{{props.row.external_type_title}}</div>
								</div>
								<button class="button has-text-danger" @click="deleteExternal(props.index)"><i class="fal fa-trash-alt"></i></button>
								</div>
							</b-table-column>
						</b-table>
					
						<label class="label has-xs-mb-2">{{'Подключить социальные сети'|gettext}}</label>
						<div class="row row-small">
							<div class="col-xs">
								<a type="button" class="button is-medium is-fullwidth is-light" :class="{'disabled': state && state != 'facebook', 'is-loading': state == 'facebook'}" :href="'{1}/login/facebook/?method=connect'|format(window.base_path_prefix)" @click="chooseState('facebook')"><i class="fab fa-fb-o"></i><span class="is-hidden-mobile has-ml-1">Facebook</span></a>
							</div>
							<div class="col-xs">
								<a type="button" class="button is-medium is-fullwidth is-light" :class="{'disabled': state && state != 'google', 'is-loading': state == 'google'}" :href="'{1}/login/google/?method=connect'|format(window.base_path_prefix)" @click="chooseState('google')"><i class="fab fa-g"></i><span class="is-hidden-mobile has-ml-1">Google</span></a>
							</div>
							<div class="col-xs" v-if="localeRu">
								<a type="button" class="button is-medium is-fullwidth is-light" :class="{'disabled': state && state != 'vkontakte', 'is-loading': state == 'vkontakte'}" :href="'{1}/login/vkontakte/?method=connect'|format(window.base_path_prefix)" @click="chooseState('vkontakte')"><i class="fab fa-vk" style="font-size: 1.9rem"></i><span class="is-hidden-mobile has-ml-1">ВКонтакте</span></a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>			

	</div>
	</div>
`});
window.$app.defineModule("account", []);