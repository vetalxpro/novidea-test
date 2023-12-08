import { createElement } from 'lwc';
import UserConfiguration from 'c/userConfiguration';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import mockGetObjectInfo from './data/getObjectInfo.json';
import mockGetObjects from './data/getObjects.json';
import getObjects from '@salesforce/apex/ObjectRecordsController.getObjects';
import { buildFieldOptionsFromObjectInfo } from '../utils';
import { publish } from 'lightning/messageService';
import showObjectRecordsChannel from '@salesforce/messageChannel/showObjectRecords__c';

jest.mock(
  '@salesforce/apex/ObjectRecordsController.getObjects',
  () => {
    return {
      default: jest.fn()
    };
  },
  { virtual: true }
);

describe('c-user-configuration', () => {
  afterEach(() => {
    // The jsdom instance is shared across test cases in a single file so reset the DOM
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('Shows object options in combobox', async () => {
    const element = createElement('c-user-configuration', {
      is: UserConfiguration
    });
    const mock = getObjects.mockResolvedValue(mockGetObjects);

    document.body.appendChild(element);
    await mock();
    await Promise.resolve();
    const combobox = element.shadowRoot.querySelector(
      '[data-testid="objectsCombobox"]'
    );

    expect(combobox.options.length).toEqual(mockGetObjects.length);
  });

  it('Shows object fields options after object selection', async () => {
    const root = createElement('c-user-configuration', {
      is: UserConfiguration
    });
    const mock = getObjects.mockResolvedValue(mockGetObjects);

    document.body.appendChild(root);
    await mock();
    await Promise.resolve();
    const objectComboboxEl = getObjectComboboxEl(root);
    objectComboboxEl.value = mockGetObjects[0];
    objectComboboxEl.dispatchEvent(new CustomEvent('change'));
    getObjectInfo.emit(mockGetObjectInfo);
    await Promise.resolve();
    const dualListEl = getDualListEl(root);
    const fieldOptions = buildFieldOptionsFromObjectInfo(mockGetObjectInfo);

    expect(dualListEl.options.length).toEqual(fieldOptions.length);
  });

  it('Send message after submit', async () => {
    const root = createElement('c-user-configuration', {
      is: UserConfiguration
    });
    const mock = getObjects.mockResolvedValue(mockGetObjects);

    // Act
    document.body.appendChild(root);
    await mock();
    await Promise.resolve();

    const objectComboboxEl = getObjectComboboxEl(root);
    objectComboboxEl.value = mockGetObjects[0];
    objectComboboxEl.dispatchEvent(new CustomEvent('change'));

    getObjectInfo.emit(mockGetObjectInfo);
    await Promise.resolve();

    const fieldOptions = buildFieldOptionsFromObjectInfo(mockGetObjectInfo);
    const dualListEl = getDualListEl(root);
    dualListEl.value = fieldOptions.slice(0, 3).map((item) => item.value);
    dualListEl.dispatchEvent(new CustomEvent('change'));
    const submitButtonEl = getSubmitButton(root);
    submitButtonEl.click();
    await Promise.resolve();
    expect(publish).toHaveBeenCalledWith(
      undefined,
      showObjectRecordsChannel,
      expect.objectContaining({
        config: expect.any(Object)
      })
    );
  });
});

function getObjectComboboxEl(root) {
  return root.shadowRoot.querySelector('[data-testid="objectsCombobox"]');
}

function getDualListEl(root) {
  return root.shadowRoot.querySelector('[data-testid="fieldsListbox"]');
}

function getSubmitButton(root) {
  return root.shadowRoot.querySelector('[data-testid="submitButton"]');
}
