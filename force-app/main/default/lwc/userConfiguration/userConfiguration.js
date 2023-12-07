import { MessageContext, publish } from 'lightning/messageService';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { LightningElement, wire } from 'lwc';
import { formFieldNames } from './constants';
import { labels } from './labels';
import { buildFieldOptionsFromObjectInfo, buildObjectOptions } from './utils';
import getObjects from '@salesforce/apex/ObjectRecordsController.getObjects';
// @ts-ignore
import showObjectRecords from '@salesforce/messageChannel/showObjectRecords__c';
import { toastService } from 'c/toastService';
import { reduceErrorsToString } from 'c/utils';

export default class UserConfiguration extends LightningElement {
  @wire(MessageContext)
  messageContext;
  isLoading = false;
  formValues = {
    objectApiName: '',
    fields: []
  };
  objectInfo = null;
  objectOptions = [];
  objectFieldsOptions = [];

  connectedCallback() {
    this.fetchObjectOptions();
  }

  get labels() {
    return labels;
  }

  get isFieldsVisible() {
    return this.formValues.objectApiName && this.objectFieldsOptions.length > 0;
  }

  get selectedObjectApiName() {
    return this.formValues.objectApiName;
  }

  get isSubmitButtonDisabled() {
    return this.isLoading || !this.isFieldsVisible;
  }

  @wire(getObjectInfo, { objectApiName: '$selectedObjectApiName' })
  wiredObjectInfo({ error, data }) {
    if (this.objectOptions.length === 0) {
      return;
    }
    this.isLoading = false;
    if (error) {
      return;
    }
    if (data) {
      this.objectInfo = data;
      this.objectFieldsOptions = buildFieldOptionsFromObjectInfo(
        this.objectInfo
      );
    }
  }

  /**  @returns {any[]} */
  getFormFields() {
    return [...this.template.querySelectorAll('[data-form-field]')];
  }

  async fetchObjectOptions() {
    this.isLoading = true;
    try {
      const res = await getObjects();
      this.objectOptions = buildObjectOptions(res);
      // this.formValues = Object.assign({}, this.formValues, {
      //   objectApiName: this.objectOptions[0].value
      // });
    } catch (err) {
      const errMessages = reduceErrorsToString(err);
      toastService.error(this, { message: errMessages });
    } finally {
      this.isLoading = false;
    }
  }

  handleFormFieldChange(event) {
    const { name, value } = event.target;
    const formValues = Object.assign({}, this.formValues, { [name]: value });
    if (name === formFieldNames.objectApiName) {
      formValues.fields = [];
      this.isLoading = true;
    }
    this.formValues = formValues;
  }

  handleSubmitClick() {
    if (this.isSubmitButtonDisabled) {
      return;
    }
    const isValid = this.validateFormValues();
    if (!isValid) {
      return;
    }

    const payload = {
      config: {
        objectApiName: this.formValues.objectApiName,
        fields: this.formValues.fields,
        objectInfo: this.objectInfo
      }
    };

    publish(this.messageContext, showObjectRecords, payload);
  }

  validateFormValues() {
    let isValid = true;

    const fields = this.getFormFields();

    fields.forEach((field) => {
      field.reportValidity();
      isValid = isValid && field.checkValidity();
    });

    return isValid;
  }
}
