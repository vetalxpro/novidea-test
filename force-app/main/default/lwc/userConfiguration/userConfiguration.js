import { LightningElement, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { labels } from './labels';
import { formFieldNames } from './constants';
import { buildFieldOptionsFromObjectInfo, buildObjectOptions } from './utils';
import { publish, MessageContext } from 'lightning/messageService';
import showObjectRecords from '@salesforce/messageChannel/showObjectRecords__c';
import getObjects from '@salesforce/apex/ObjectRecordsController.getObjects';

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
      this.objectFieldsOptions = buildFieldOptionsFromObjectInfo(data);
    }
  }

  getFormFields() {
    return [...this.template.querySelectorAll('[data-form-field]')];
  }

  async fetchObjectOptions() {
    this.isLoading = true;
    try {
      const res = await getObjects();
      this.objectOptions = buildObjectOptions(res);
      console.log(this.objectOptions);
    } catch (err) {
      console.error(err);
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
    console.log(this.formValues);
    this.formValues = formValues;
  }

  handleSubmitClick() {
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
