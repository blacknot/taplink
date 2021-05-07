/** CodeBox
  *
  * Code syntax highlighting tool for Editor.js
  *
  * @version 1.0.0
  * @created - 2020.02.12
  * @author - Adombang Munang Mbomndih (Bomdi) <dzedock@gmail.com> (https://bomdisoft.com)
  */


DEFAULT_THEMES = ['light', 'dark'];
COMMON_LANGUAGES =  {
    none: 'Auto-detect', apache: 'Apache', bash: 'Bash', cs: 'C#', cpp: 'C++', css: 'CSS', coffeescript: 'CoffeeScript', diff: 'Diff',
    go: 'Go', html: 'HTML, XML', http: 'HTTP', json: 'JSON', java: 'Java', javascript: 'JavaScript', kotlin: 'Kotlin',
    less: 'Less', lua: 'Lua', makefile: 'Makefile', markdown: 'Markdown', nginx: 'Nginx', objectivec: 'Objective-C',
    php: 'PHP', perl: 'Perl', properties: 'Properties', python: 'Python', ruby: 'Ruby', rust: 'Rust', scss: 'SCSS',
    sql: 'SQL', shell: 'Shell Session', swift: 'Swift', toml: 'TOML, also INI', typescript: 'TypeScript', yaml: 'YAML',
    plaintext: 'Plaintext'
  }
  

class CodeBox {
  constructor({ data, api, config }){
    this.api = api;
    this.config = {
      themeName: config.themeName && typeof config.themeName === 'string' ? config.themeName : '',
      themeURL: config.themeURL && typeof config.themeURL === 'string' ? config.themeURL : '',
      useDefaultTheme: (config.useDefaultTheme && typeof config.useDefaultTheme === 'string'
        && DEFAULT_THEMES.includes(config.useDefaultTheme.toLowerCase())) ? config.useDefaultTheme : 'light',
    };
    this.data = {
      code: data.code && typeof data.code === 'string' ? data.code : '',
      language: data.language && typeof data.language === 'string' ? data.language : 'Auto-detect',
      theme: data.theme && typeof data.theme === 'string' ? data.theme : this._getThemeURLFromConfig(),
    };
    this.highlightScriptID = 'highlightJSScriptElement';
    this.highlightCSSID = 'highlightJSCSSElement';
    this.codeArea = document.createElement('div');
    this.selectInput = document.createElement('input');
    this.selectDropIcon = document.createElement('i');

    this._injectHighlightJSScriptElement();
    this._injectHighlightJSCSSElement();

    this.api.listeners.on(window, 'click', this._closeAllLanguageSelects, true);
  }

  static get sanitize(){
    return {
      code: true,
      language: false,
      theme: false,
    }
  }

  static get toolbox() {
    return {
      title: 'Code',
      icon: '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9.71,6.29a1,1,0,0,0-1.42,0l-5,5a1,1,0,0,0,0,1.42l5,5a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42L5.41,12l4.3-4.29A1,1,0,0,0,9.71,6.29Zm11,5-5-5a1,1,0,0,0-1.42,1.42L18.59,12l-4.3,4.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0l5-5A1,1,0,0,0,20.71,11.29Z"/></svg>'
    };
  }

  static get displayInToolbox() {
    return true;
  }

  static get enableLineBreaks() {
    return true;
  }

  render(){
    const codeAreaHolder = document.createElement('pre');
    const languageSelect = this._createLanguageSelectElement();

    codeAreaHolder.setAttribute('class', 'codeBoxHolder');
    this.codeArea.setAttribute('class', `codeBoxTextArea ${ this.config.useDefaultTheme } ${ this.data.language }`);
    this.codeArea.setAttribute('contenteditable', true);
    this.codeArea.innerText = this.data.code;
    this.api.listeners.on(this.codeArea, 'blur', event => this._highlightCodeArea(event), false);
    this.api.listeners.on(this.codeArea, 'paste', event => this._handleCodeAreaPaste(event), false);

    codeAreaHolder.appendChild(this.codeArea);
    codeAreaHolder.appendChild(languageSelect);

    hljs.highlightBlock(this.codeArea);

    return codeAreaHolder;
  }

  save(blockContent){
    return { language: this.data.language, code: this.codeArea.innerText};
  }

  validate(savedData){
    if (!savedData.code.trim()) return false;
    return true;
  }

  destroy(){
    this.api.listeners.off(window, 'click', this._closeAllLanguageSelects, true);
    this.api.listeners.off(this.codeArea, 'blur', event => this._highlightCodeArea(event), false);
    this.api.listeners.off(this.codeArea, 'paste', event => this._handleCodeAreaPaste(event), false);
    this.api.listeners.off(this.selectInput, 'click', event => this._handleSelectInputClick(event), false);
  }

  _createLanguageSelectElement(){
    const selectHolder = document.createElement('div');
    const selectPreview = document.createElement('div');
    const languages = Object.entries(COMMON_LANGUAGES);

    selectHolder.setAttribute('class', 'codeBoxSelectDiv');

    this.selectDropIcon.setAttribute('class', `codeBoxSelectDropIcon ${ this.config.useDefaultTheme }`);
    this.selectDropIcon.innerHTML = '&#8595;';
    this.selectInput.setAttribute('class', `codeBoxSelectInput ${ this.config.useDefaultTheme }`);
    this.selectInput.setAttribute('type', 'text');
    this.selectInput.setAttribute('readonly', true);
    this.selectInput.value = this.data.language;
    this.api.listeners.on(this.selectInput, 'click', event => this._handleSelectInputClick(event), false);

    selectPreview.setAttribute('class', 'codeBoxSelectPreview');

    languages.forEach(language => {
      const selectItem = document.createElement('p');
      selectItem.setAttribute('class', `codeBoxSelectItem ${ this.config.useDefaultTheme }`);
      selectItem.setAttribute('data-key', language[0]);
      selectItem.textContent = language[1];
      this.api.listeners.on(selectItem, 'click', event => this._handleSelectItemClick(event, language), false);

      selectPreview.appendChild(selectItem);
    });

    selectHolder.appendChild(this.selectDropIcon);
    selectHolder.appendChild(this.selectInput);
    selectHolder.appendChild(selectPreview);

    return selectHolder;
  }

  _highlightCodeArea(event){
    hljs.highlightBlock(this.codeArea);
  }

  _handleCodeAreaPaste(event){
    event.stopPropagation();
  }

  _handleSelectInputClick(event){
    event.target.nextSibling.classList.toggle('codeBoxShow');
  }

  _handleSelectItemClick(event, language){
    event.target.parentNode.parentNode.querySelector('.codeBoxSelectInput').value = language[1];
    event.target.parentNode.classList.remove('codeBoxShow');
    this.codeArea.removeAttribute('class');
    this.data.language = language[0];
    this.codeArea.setAttribute('class', `codeBoxTextArea ${ this.config.useDefaultTheme } ${ this.data.language }`);
    hljs.highlightBlock(this.codeArea);
  }

  _closeAllLanguageSelects(){
    const selectPreviews = document.querySelectorAll('.codeBoxSelectPreview');
    for (let i = 0, len = selectPreviews.length; i < len; i++) selectPreviews[i].classList.remove('codeBoxShow');
  }

  _injectHighlightJSScriptElement(){
	  $mx.lazy('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/highlight.min.js');
	  
/*
    const highlightJSScriptElement = document.querySelector(`#${ this.highlightScriptID }`);
    const highlightJSScriptURL = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/highlight.min.js';
    if (!highlightJSScriptElement) {
      const script = document.createElement('script');
      const head = document.querySelector('head');
      script.setAttribute('src', highlightJSScriptURL);
      script.setAttribute('id', this.highlightScriptID);

      if (head) head.appendChild(script);
    }
    else highlightJSScriptElement.setAttribute('src', highlightJSScriptURL);
*/
  }

  _injectHighlightJSCSSElement(){
    const highlightJSCSSElement = document.querySelector(`#${ this.highlightCSSID }`);
    let highlightJSCSSURL = this._getThemeURLFromConfig();
    if (!highlightJSCSSElement) {
      const link = document.createElement('link');
      const head = document.querySelector('head');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', highlightJSCSSURL);
      link.setAttribute('id', this.highlightCSSID);

      if (head) head.appendChild(link);
    }
    else highlightJSCSSElement.setAttribute('href', highlightJSCSSURL);
  }

  _getThemeURLFromConfig(){
    let themeURL = `https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/atom-one-${ this.config.useDefaultTheme }.min.css`;

    if (this.config.themeName) themeURL = `https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/${ this.config.themeName }.min.css`;
    if (this.config.themeURL) themeURL = this.config.themeURL;

    return themeURL;
  }
}

/**
 * Marker Tool for the Editor.js
 *
 * Allows to wrap inline fragment and style it somehow.
 */
class Marker {

  /**
   * @param {{api: object}}  - Editor.js API
   */
  constructor({api}) {
    this.api = api;

    /**
     * Toolbar Button
     *
     * @type {HTMLElement|null}
     */
    this.button = null;

    /**
     * Tag represented the term
     *
     * @type {string}
     */
    this.tag = 'MARK';

    /**
     * CSS classes
     */
    this.iconClasses = {
      base: this.api.styles.inlineToolButton,
      active: this.api.styles.inlineToolButtonActive
    };
  }

  /**
   * Specifies Tool as Inline Toolbar Tool
   *
   * @return {boolean}
   */
  static get isInline() {
    return true;
  }

  /**
   * Create button element for Toolbar
   *
   * @return {HTMLElement}
   */
  render() {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add(this.iconClasses.base);
    this.button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="1 2 13 12" width="13" height="12"><path d="M8.367 9.633L10.7 10.98l-.624 1.135-.787-.025-.78 1.35H6.94l1.193-2.066-.407-.62.642-1.121zm.436-.763l2.899-5.061a1.278 1.278 0 011.746-.472c.617.355.835 1.138.492 1.76l-2.815 5.114-2.322-1.34zM2.62 11.644H5.39a.899.899 0 110 1.798H2.619a.899.899 0 010-1.798z"/></svg>';

    return this.button;
  }

  /**
   * Wrap/Unwrap selected fragment
   *
   * @param {Range} range - selected fragment
   */
  surround(range) {
    if (!range) {
      return;
    }

    let termWrapper = this.api.selection.findParentTag(this.tag, Marker.CSS);

    /**
     * If start or end of selection is in the highlighted block
     */
    if (termWrapper) {
      this.unwrap(termWrapper);
    } else {
      this.wrap(range);
    }
  }

  /**
   * Wrap selection with term-tag
   *
   * @param {Range} range - selected fragment
   */
  wrap(range) {
    /**
     * Create a wrapper for highlighting
     */
    let marker = document.createElement(this.tag);

//     marker.classList.add(Marker.CSS);

    /**
     * SurroundContent throws an error if the Range splits a non-Text node with only one of its boundary points
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Range/surroundContents}
     *
     * // range.surroundContents(span);
     */
    marker.appendChild(range.extractContents());
    range.insertNode(marker);

    /**
     * Expand (add) selection to highlighted block
     */
    this.api.selection.expandToTag(marker);
  }

  /**
   * Unwrap term-tag
   *
   * @param {HTMLElement} termWrapper - term wrapper tag
   */
  unwrap(termWrapper) {
    /**
     * Expand selection to all term-tag
     */
    this.api.selection.expandToTag(termWrapper);

    let sel = window.getSelection();
    let range = sel.getRangeAt(0);

    let unwrappedContent = range.extractContents();

    /**
     * Remove empty term-tag
     */
    termWrapper.parentNode.removeChild(termWrapper);

    /**
     * Insert extracted content
     */
    range.insertNode(unwrappedContent);

    /**
     * Restore selection
     */
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Check and change Term's state for current selection
   */
  checkState() {
//     const termTag = this.api.selection.findParentTag(this.tag, Marker.CSS);
//     this.button.classList.toggle(this.iconClasses.active, !!termTag);
  }

  /**
   * Sanitizer rule
   * @return {{mark: {class: string}}}
   */
  static get sanitize() {
    return {
      mark: {
        class: Marker.CSS
      }
    };
  }
}
class Blockquote {
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    this._settings = config;

    this._data = this.normalizeData(data);
    this.settingsButtons = [];
    this._element = this.getTag();
  }

  normalizeData(data) {
    const newData = {};

    if (typeof data !== 'object') {
      data = {};
    }

    newData.text = data.text || '';
//    newData.level = parseInt(data.level) || this.defaultLevel.number;

    return newData;
  }

  render() {
    return this._element;
  }

  renderSettings() {
    const holder = document.createElement('DIV');
    return holder;
  }

  merge(data) {
    const newData = {
      text: this.data.text + data.text,
    };

    this.data = newData;
  }

  validate(blockData) {
    return blockData.text.trim() !== '';
  }

  save(toolsContent) {
    return {
      text: toolsContent.innerHTML,
    };
  }

  static get conversionConfig() {
    return {
      export: 'text', // use 'text' property for other blocks
      import: 'text', // fill 'text' property from other block's export string
    };
  }

  static get sanitize() {
    return {
      text: {},
    };
  }

  static get isReadOnlySupported() {
    return true;
  }

  get data() {
    this._data.text = this._element.innerHTML;

    return this._data;
  }

  set data(data) {
    this._data = this.normalizeData(data);

    if (data.text !== undefined) {
      this._element.innerHTML = this._data.text || '';
    }
  }

  getTag() {
    const tag = document.createElement('BLOCKQUOTE');

    tag.innerHTML = this._data.text || '';
    tag.contentEditable = this.readOnly ? 'false' : 'true';
    tag.dataset.placeholder = this.api.i18n.t(this._settings.placeholder || '');

    return tag;
  }

  onPaste(event) {
    const content = event.detail.data;

    this.data = {
      text: content.innerHTML,
    };
  }

  static get pasteConfig() {
    return {
      tags: ['BLOCKQUOTE'],
    };
  }

  static get toolbox() {
    return {
      icon: '<svg aria-hidden="true" focusable="false" data-prefix="fas" width="16px" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M464 32H336c-26.5 0-48 21.5-48 48v128c0 26.5 21.5 48 48 48h80v64c0 35.3-28.7 64-64 64h-8c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24h8c88.4 0 160-71.6 160-160V80c0-26.5-21.5-48-48-48zm-288 0H48C21.5 32 0 53.5 0 80v128c0 26.5 21.5 48 48 48h80v64c0 35.3-28.7 64-64 64h-8c-13.3 0-24 10.7-24 24v48c0 13.3 10.7 24 24 24h8c88.4 0 160-71.6 160-160V80c0-26.5-21.5-48-48-48z"></path></svg>',
      title: 'Quote',
    };
  }
}