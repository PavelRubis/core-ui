import template from './templates/field.hbs';
import dropdown from 'dropdown';
import ErrorButtonView from './views/ErrorButtonView';
import InfoButtonView from './views/InfoButtonView';
import TooltipPanelView from './views/TooltipPanelView';
import ErrosPanelView from './views/ErrosPanelView';
import formRepository from '../formRepository';

const classes = {
    REQUIRED: 'required',
    READONLY: 'readonly',
    DISABLED: 'disabled',
    ERROR: 'error'
};

export default class {
    constructor(options = {}) {
        this.schema = options.schema;

        this.fieldId = _.uniqueId('field-');
        this.model = options.model;
        this.__createEditor(options, this.fieldId);

        if (this.schema.getReadonly || this.schema.getHidden) {
            this.model.on('change', this.__updateExternalChange);
        }

        if (this.schema.updateEditorEvents) {
            this.model.on(this.schema.updateEditorEvents, this.__updateEditor);
        }

        return this.editor;
    }

    onRender() {
        this.showChildView('editorRegion', this.editor);
        if (this.schema.helpText) {
            const viewModel = new Backbone.Model({
                helpText: this.schema.helpText,
                errorText: null
            });

            const infoPopout = dropdown.factory.createPopout({
                buttonView: InfoButtonView,
                panelView: TooltipPanelView,
                panelViewOptions: {
                    model: viewModel,
                    textAttribute: 'helpText'
                },
                popoutFlow: 'right',
                customAnchor: true
            });
            this.showChildView('helpTextRegion', infoPopout);
        }
        this.__updateEditorState(this.schema.readonly, this.schema.enabled);
    }

    validate() {
        const error = this.editor.validate();
        if (error) {
            this.setError([error]);
        } else {
            this.clearError();
        }
        return error;
    }

    setError(errors: Array<any>): void {
        if (!this.__checkUiReady()) {
            return;
        }

        this.$el.addClass(classes.ERROR);
        this.errorCollection ? this.errorCollection.reset(errors) : (this.errorCollection = new Backbone.Collection(errors));
        if (!this.isErrorShown) {
            const errorPopout = dropdown.factory.createPopout({
                buttonView: ErrorButtonView,
                panelView: ErrosPanelView,
                panelViewOptions: {
                    collection: this.errorCollection
                },
                popoutFlow: 'right',
                customAnchor: true
            });
            this.showChildView('errorTextRegion', errorPopout);
            this.isErrorShown = true;
        }
    }

    clearError(): void {
        if (!this.__checkUiReady()) {
            return;
        }
        this.editor.$el.removeClass(classes.ERROR);
        this.errorCollection && this.errorCollection.reset();
    }

    setRequired(required = this.schema.required) {
        this.schema.required = required;
        this.__updateEmpty();
    },

    __updateEmpty(isEmpty = this.editor?.isEmptyValue()) {
        if (this.schema.required) {
            this.__toggleRequiredClass(isEmpty);
        } else {
            this.__toggleRequiredClass(false);
        }
    },

    __toggleRequiredClass(required) {
        if (!this.__checkUiReady()) {
            return;
        }
        this.editor.$el.toggleClass(classes.REQUIRED, Boolean(required));
    }

    __updateEditorState(readonly, enabled) {
        if (!this.__checkUiReady()) {
            return;
        }
        this.editor.$el.toggleClass(classes.READONLY, Boolean(readonly));
        this.editor.$el.toggleClass(classes.DISABLED, Boolean(readonly || !enabled));
    }

    __updateExternalChange() {
        if (typeof this.schema.getReadonly === 'function') {
            this.editor.setReadonly(this.schema.getReadonly(this.model));
        }
        if (typeof this.schema.getHidden === 'function') {
            this.editor.setHidden(Boolean(this.schema.getHidden(this.model)));
        }
    }

    __createEditor(options, fieldId) {
        let schemaExtension = {};

        if (_.isFunction(this.schema.schemaExtension)) {
            schemaExtension = this.schema.schemaExtension(this.model);
        }

        this.schema = Object.assign({}, this.schema, schemaExtension);

        const EditorConsturctor = typeof this.schema.type === 'string' ? formRepository.editors[this.schema.type] : this.schema.type;

        this.editor = new EditorConsturctor({
            schema: this.schema,
            form: options.form,
            field: this,
            class: options.class,
            key: options.key,
            model: this.model,
            id: this.__createEditorId(options.key),
            value: options.value,
            fieldId,
            setRequired: this.setRequired.bind(this),
            tagName: options.tagName,
            fieldUpdateEmpty: this.__updateEmpty.bind(this)
        });
        this.key = options.key;
        this.editor.on('readonly', readonly => {
            this.__updateEditorState(readonly, this.editor.getEnabled());
        });
        this.editor.on('enabled', enabled => {
            this.__updateEditorState(this.editor.getReadonly(), enabled);
        });
    }

    __updateEditor() {
        this.__createEditor(this.options, this.fieldId);
        this.showChildView('editorRegion', this.editor);
    }

    __createEditorId(key) {
        if (this.model) {
            return `${this.model.cid}_${key}`;
        }
        return key;
    }

    __checkUiReady() {
        return this.editor.isRendered() && !this.editor.isDestroyed();
    }
}
