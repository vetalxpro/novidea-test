import {
  MessageContext,
  subscribe,
  unsubscribe
} from 'lightning/messageService';
import { LightningElement, wire } from 'lwc';
import { labels } from './labels';
import getRecords from '@salesforce/apex/ObjectRecordsController.getRecords';
// @ts-ignore
import showObjectRecords from '@salesforce/messageChannel/showObjectRecords__c';
import { toastService } from 'c/toastService';
import { reduceErrorsToString } from 'c/utils';
import { tableSizes } from './contants';
import { buildTableColumns, buildTableRows } from './utils';

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

  get computedTitleText() {
    if (this.objectInfo) {
      return `${labels.Title} - ${this.objectInfo.labelPlural}`;
    }
    return labels.Title;
  }

  /**@returns {HTMLElement} */
  getCardEl() {
    // @ts-ignore
    return this.refs && this.refs.card;
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
    this.fetchRecords();
  }

  scrollToCard() {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(() => {
      const cardEl = this.getCardEl();
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 0);
  }

  unsubscribeToMessageChannel() {
    unsubscribe(this.subscription);
    this.subscription = null;
  }

  updateTableColumns() {
    const { fields, objectInfo } = this.config;
    const columns = buildTableColumns(fields, objectInfo);
    this.tableColumns = columns;
  }

  async fetchRecords() {
    this.isLoading = true;
    try {
      const { fields, objectInfo } = this.config;
      const params = {
        objectApiName: objectInfo.apiName,
        fields: fields.join(','),
        perPage: this.perPage,
        lastRecordId: null
      };
      const res = await getRecords(params);
      this.isInfiniteLoadingEnabled = true;
      this.updateTableColumns();
      this.tableRows = buildTableRows(res);
      this.scrollToCard();
    } catch (err) {
      this.tableRows = [];
      const errMessages = reduceErrorsToString(err);
      toastService.error(this, { message: errMessages });
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
        objectApiName: objectInfo.apiName,
        fields: fields.join(','),
        perPage: this.perPage,
        lastRecordId: lastRow.Id
      };
      const res = await getRecords(params);
      const rows = buildTableRows(res);
      if (rows.length > 0) {
        this.tableRows = this.tableRows.concat(rows);
      } else {
        this.isInfiniteLoadingEnabled = false;
      }
    } catch (err) {
      const errMessages = reduceErrorsToString(err);
      toastService.error(this, { message: errMessages });
    } finally {
      this.isLoadMoreLoading = false;
    }
  }
}
