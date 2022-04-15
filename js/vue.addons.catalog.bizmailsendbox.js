window.$app.defineComponent("addons.catalog.bizmailsendbox","vue-addons-catalog-bizmailsendbox-entry",{props:["addons","addon","options","variants","values"],mixins:[FormModel],computed:{allowCustomField:function(){return this.values&&(this.values.fields&&_.size(this.values.fields)||this.values.fields_extended&&_.size(this.values.fields_extended))}},methods:{addCustomField:function(){this.options.fields.push({name:"",idx:null})},removeCustomField:function(e){this.options.fields.splice(e,1)}},template:'<div> <div class="field"> <p>{{\'Укажите списки рассылок для добавления контактов\'|gettext}}</p> </div> <b-field :label="\'Новая заявка\'|gettext"> <b-select v-model="options.created" expanded> <option :value="null">-- {{\'Рассылка не выбрана\'|gettext}} --</option> <option v-for="f in variants.list" :value="f.id">{{ f.name }}</option> </b-select> </b-field> <b-field :label="\'Успешная оплата\'|gettext"> <b-select v-model="options.paid" expanded> <option :value="null">-- {{\'Рассылка не выбрана\'|gettext}} --</option> <option v-for="f in variants.list" :value="f.id">{{ f.name }}</option> </b-select> </b-field> <div v-if="options.fields && options.fields.length"> <label class="label has-mt-2">{{\'Настраиваемые поля\'|gettext}}</label> <div v-for="(f, i) in options.fields" class="row row-small has-mb-2"> <div class="col-xs"> <vue-component-select-custom-fields v-model="f.idx" :values="values"></vue-component-select-custom-fields> </div> <div class="col-xs-4"><input type="text" class="input" v-model="f.name" :placeholder="\'Имя\'|gettext"></div> <div class="col-xs col-shrink"><button type="button" class="button is-danger" @click="removeCustomField(i)"><i class="fa fa-trash-alt"></i></button></div> </div> </div> <div><a @click="addCustomField" v-if="allowCustomField">{{\'Добавить настраиваемое поле\'|gettext}}</a></div> </div>'}),window.$app.defineComponent("addons.catalog.bizmailsendbox","vue-addons-catalog-bizmailsendbox-options",{props:["values","variants","addon_id","isInstalling","currentTab"],mixins:[FormModel],template:'<section class="modal-card-body modal-card-body-blocks"> <section class="content" v-if="currentTab == \'description\'"> <slot name="allow"></slot> <div class="field">{{\'Biz.Mail Sendbox — платформа автоматизации email маркетинга. Собирайте новых подписчиков электронной почты на своей странице. Свяжите формы с списками в Biz.Mail Sendbox и увеличивайте свою подписную базу. Вы также можете организовать отправку вашего онлайн продукта через Biz.Mail Sendbox.\'|gettext}}</div> <a href=\'https://biz.mail.ru/sendbox/\' target="_blank">{{\'Открыть сайт\'|gettext}}</a> </section> <section class="content" v-if="currentTab == \'options\'"> <div class="field"> Сформировать ключ доступа к API вы можете в настройках аккаунта в вкладке <a href="https://mailer.i.bizml.ru/settings/#api" target="_blank">API</a>. </div> <b-field label="ID" :message="errors.id" :class="{\'has-error\': errors.id}"> <input type="text" class="input" v-model="values.options.id"> </b-field> <b-field label="Secret" :message="errors.secret" :class="{\'has-error\': errors.secret}"> <input type="text" class="input" v-model="values.options.secret"> </b-field> <div class="field"> <b-checkbox v-model="values.options.confirmation">Добавление подписчиков методом double-opt-in</b-checkbox> </div> <b-field label="Ваш адрес отправителя" :message="errors.sender_email" :class="{\'has-error\': errors.sender_email}"> <input type="text" class="input" v-model="values.options.sender_email" :disabled="!values.options.confirmation"> </b-field> </section> </section>'}),window.$app.defineModule("addons.catalog.bizmailsendbox",[]);
