import { LightningElement, wire } from 'lwc';
import { labels } from './labels';
import {
  subscribe,
  unsubscribe,
  MessageContext
} from 'lightning/messageService';
import showObjectRecords from '@salesforce/messageChannel/showObjectRecords__c';
import { buildTableColumns, buildTableRows } from './utils';
import { tableSizes } from './contants';
import getRecords from '@salesforce/apex/ObjectRecordsController.getRecords';

export default class RecordsTable extends LightningElement {
  @wire(MessageContext)
  messageContext;
  subscription = null;
  config = {
    objectApiName: '',
    fields: [],
    objectInfo: null
  };
  perPage = 15;
  tableColumns = [];
  tableRows = [];
  isLoading = false;
  isLoadMoreLoading = false;
  isInfiniteLoadingEnabled = false;

  connectedCallback() {
    this.subscribeToMessageChannel();
  }

  disconnectedCallback() {
    this.unsubscribeToMessageChannel();
  }

  get labels() {
    return labels;
  }

  get objectInfo() {
    return this.config.objectInfo;
  }

  get hasTableRows() {
    return this.tableRows.length > 0;
  }

  get tableStyles() {
    return this.tableRows.length > tableSizes.tableScrollItemsCount
      ? `height:${
          tableSizes.rowHeight * tableSizes.tableScrollItemsCount +
          tableSizes.headerHeight
        }px;`
      : '';
  }

  subscribeToMessageChannel() {
    if (!this.subscription) {
      this.subscription = subscribe(
        this.messageContext,
        showObjectRecords,
        (message) => this.showObjectRecordsHandler(message)
      );
    }
  }

  showObjectRecordsHandler(message) {
    this.config = message.config;
    this.tableRows = [];
    this.updateTableColumns();
    this.fetchRecords();
  }

  unsubscribeToMessageChannel() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }

  updateTableColumns() {
    const { fields, objectInfo } = this.config;
    console.log(fields, objectInfo);
    const columns = buildTableColumns(fields, objectInfo);
    this.tableColumns = columns;
  }

  async fetchRecords() {
    this.isLoading = true;
    try {
      const { fields, objectInfo } = this.config;
      const params = {
        SObjectApiName: objectInfo.apiName,
        fields: fields.join(','),
        perPage: this.perPage
      };
      console.log(params);
      const res = await getRecords(params);
      this.isInfiniteLoadingEnabled = true;
      this.tableRows = buildTableRows(res);
      console.log(this.tableRows);
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async loadMoreHandler() {
    const lastRow = this.tableRows[this.tableRows.length - 1];
    if (!lastRow) {
      return;
    }
    this.isLoadMoreLoading = true;

    try {
      const { fields, objectInfo } = this.config;

      const params = {
        SObjectApiName: objectInfo.apiName,
        fields: fields.join(','),
        perPage: this.perPage,
        lastRecordId: lastRow.Id
      };
      console.log(params);
      const res = await getRecords(params);
      const rows = buildTableRows(res);
      if (rows.length > 0) {
        this.tableRows = this.tableRows.concat(rows);
      } else {
        this.isInfiniteLoadingEnabled = false;
      }
      console.log(this.tableRows);
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoadMoreLoading = false;
    }
  }
}
