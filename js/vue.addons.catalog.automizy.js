window.$app.defineComponent("addons.catalog.automizy","vue-addons-catalog-automizy-entry",{props:["addons","addon","options","variants","values"],mixins:[FormModel],methods:{addCustomField:function(){this.options.fields.push({name:"",idx:null})},removeCustomField:function(e){this.options.fields.splice(e,1)}},template:'<div> <div class="field"> <p>{{\'Укажите списки рассылок для добавления контактов\'|gettext}}</p> </div> <b-field :label="\'Новая заявка\'|gettext"> <b-select :placeholder="\'-- Добавить поле --\'|gettext" v-model="options.created" expanded> <option :value="null">{{\'-- Рассылка не выбрана --\'|gettext}}</option> <option v-for="(f, i) in variants.list" :value="i">{{ f }}</option> </b-select> </b-field> <b-field :label="\'Успешная оплата\'|gettext"> <b-select :placeholder="\'-- Добавить поле --\'|gettext" v-model="options.paid" expanded> <option :value="null">{{\'-- Рассылка не выбрана --\'|gettext}}</option> <option v-for="(f, i) in variants.list" :value="i">{{ f }}</option> </b-select> </b-field> <div v-if="options.fields.length"> <label class="label has-mt-2">{{\'Настраиваемые поля\'|gettext}}</label> <div v-for="(f, i) in options.fields" class="row row-small has-mb-2"> <div class="col-xs"> <vue-component-select-custom-fields v-model="f.idx" :values="values"></vue-component-select-custom-fields> </div> <div class="col-xs-4"><input type="text" class="input" v-model="f.name" :placeholder="\'Имя\'|gettext"></div> <div class="col-xs col-shrink"><button type="button" class="button is-danger" @click="removeCustomField(i)"><i class="fa fa-trash-alt"></i></button></div> </div> </div> <div><a href=\'#\' @click="addCustomField" v-if="values && values.fields && _.size(values.fields)">{{\'Добавить настраиваемое поле\'|gettext}}</a></div> </div>'}),window.$app.defineComponent("addons.catalog.automizy","vue-addons-catalog-automizy-options",{props:["values","variants","addon_id","isInstalling","currentTab"],mixins:[FormModel],template:'<section class="modal-card-body modal-card-body-blocks"> <section class="content" v-if="currentTab == \'description\'"> <slot name="allow"></slot> <div class="field">{{\'Automizy — платформа автоматизации email маркетинга. Собирайте новых подписчиков электронной почты на своей странице. Свяжите формы с списками в Automizy и увеличивайте свою подписную базу. Вы также можете организовать отправку вашего онлайн продукта через Automizy.\'|gettext}}</div> <a href=\'https://automizy.com/\' target="_blank">{{\'Открыть сайт\'|gettext}}</a> </section> <section class="content" v-if="currentTab == \'options\'"> <b-field :label="\'API Token\'|gettext" :message="errors.key" :class="{\'has-error\': errors.key}"> <input type="text" class="input" v-model="values.options.key"> </b-field> <div class="field"> {{\'Сформировать ключ API Token в разделе "Settings -> API Tokens". Укажите полученный "API Token" в поле ввода выше и нажмите "Сохранить". После этого укажите списки рассылок в "Формах" или в настройках "Товаров".\'|gettext}} </div> </section> </section>'}),window.$app.defineModule("addons.catalog.automizy",[]);
