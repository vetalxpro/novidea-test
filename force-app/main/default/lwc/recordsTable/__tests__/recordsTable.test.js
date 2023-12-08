import { createElement } from 'lwc';
import RecordsTable from 'c/recordsTable';
import { labels } from '../labels';
import { publish } from 'lightning/messageService';
import showObjectRecordsChannel from '@salesforce/messageChannel/showObjectRecords__c';
import getRecords from '@salesforce/apex/ObjectRecordsController.getRecords';
import mockGetRecords from './data/getRecords.json';
import mockMessagePayload from './data/messagePayload.json';

jest.mock(
  '@salesforce/apex/ObjectRecordsController.getRecords',
  () => {
    return {
      default: jest.fn()
    };
  },
  { virtual: true }
);

describe('c-records-table', () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('Renders message if no configuration provided', async () => {
    // Arrange
    const element = createElement('c-records-table', {
      is: RecordsTable
    });

    // Act
    document.body.appendChild(element);

    const messageEl = element.shadowRoot.querySelector([
      '[data-testid="set-config-message"]'
    ]);
    expect(messageEl.textContent).toEqual(labels.SetConfiguration);
  });

  it('Render datatable with columns and rows', async () => {
    const root = createElement('c-records-table', {
      is: RecordsTable
    });

    document.body.appendChild(root);

    let mock = getRecords.mockResolvedValue(mockGetRecords);
    await mock();
    publish(null, showObjectRecordsChannel, mockMessagePayload);

    await wait(0);
    const datatable = getDataTableEl(root);

    expect(datatable.columns.length).toEqual(4);
    expect(datatable.data.length).toEqual(mockGetRecords.length);

    datatable.dispatchEvent(new CustomEvent('loadmore'));
    mock = getRecords.mockResolvedValue(mockGetRecords);
    await mock();
    await Promise.resolve();
    expect(datatable.data.length).toEqual(mockGetRecords.length * 2);
  });
});

function getDataTableEl(root) {
  return root.shadowRoot.querySelector('[data-testid="datatable"]');
}

function wait(delay) {
  return new Promise((resolve) => {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    setTimeout(resolve, delay);
  });
}
