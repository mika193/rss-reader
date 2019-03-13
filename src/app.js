import WatchJS from 'melanke-watchjs';
import { isURL } from 'validator';
import axios from 'axios';
import 'bootstrap/js/dist/modal';
import getChanelData from './getData';
import createModal from './modal';

const getAction = (actionsList, param) => actionsList.find(({ check }) => check(param));

const { watch } = WatchJS;

export default () => {
  const addField = document.querySelector('[data-name = add-field]');
  const addForm = document.querySelector('[data-name = add-form]');
  const addButton = document.querySelector('[data-name = add-button]');
  const invalidFeedbackField = document.querySelector('.invalid-feedback');
  const errorField = document.querySelector('.errors');
  const proxiUrl = 'https://cors-anywhere.herokuapp.com/';

  const state = {
    feedbackText: '',
    input: 'initial',
    href: '',
    feedList: new Set(),
    submittButton: 'disabled',
    chanels: [],
    buttonText: 'Submit',
    form: 'calm',
    error: '',
  };

  const validationActions = [
    {
      check: value => value === '',
      process: () => ({
        input: 'initial',
        submittButton: 'disabled',
      }),
    },

    {
      check: value => !(isURL(value)),
      process: () => ({
        feedbackText: 'Введите URL, например: https://mail.ru',
        input: 'invalid',
      }),
    },

    {
      check: value => state.feedList.has(value),
      process: () => ({
        feedbackText: 'Такой URL уже есть в списке',
        input: 'invalid',
      }),
    },

    {
      check: value => !state.feedList.has(value),
      process: () => ({
        feedbackText: '',
        input: 'valid',
        submittButton: 'enabled',
      }),
    },
  ];

  const formActions = {
    calm: () => {},
    reset: () => {
      addForm.reset();
    },
  };

  const submitButtonActions = {
    disabled: () => {
      addButton.disabled = true;
    },
    enabled: () => {
      addButton.disabled = false;
    },
  };

  const getClassName = value => `is-${value}`;

  const inputActions = {
    initial: () => {
      addField.classList.remove('is-valid', 'is-invalid');
      addField.disabled = false;
    },

    disabled: () => {
      addField.disabled = true;
    },

    valid: () => {
      addField.disabled = false;
      addField.classList.add(getClassName('valid'));
      addField.classList.remove(getClassName('invalid'));
    },

    invalid: () => {
      addField.disabled = false;
      addField.classList.add(getClassName('invalid'));
      addField.classList.remove(getClassName('valid'));
    },
  };

  watch(state, ['input', 'feedbackText'], () => {
    inputActions[state.input]();
  });

  watch(state, 'feedbackText', () => {
    invalidFeedbackField.textContent = state.feedbackText;
  });

  watch(state, 'submittButton', () => {
    submitButtonActions[state.submittButton]();
  });

  watch(state, 'form', () => {
    formActions[state.form]();
  });

  watch(state, 'chanels', () => {
    const { chanels } = state;
    let modalIndex = 0;
    const chanelsList = document.querySelector('.feeds');
    const articlesList = document.querySelector('.articles');
    const modalsContainer = document.querySelector('.modals');
    const newChanelsList = document.createElement('ul');
    const newArticlesList = document.createElement('ul');
    const newmodalsContainer = document.createElement('div');
    newChanelsList.classList.add('feeds', 'list-group');
    newArticlesList.classList.add('articles', 'list-group');
    newmodalsContainer.classList.add('modals');

    chanels.forEach(({ title, description, articles }) => {
      const chanel = document.createElement('li');
      chanel.classList.add('list-group-item');
      const chanelContent = `<h3>${title}</h3><p>${description}</p>`;
      chanel.innerHTML = chanelContent;
      newChanelsList.append(chanel);

      articles.forEach(({ name, href, text }) => {
        const article = document.createElement('li');
        article.classList.add('row');
        const modalId = `modal${modalIndex}`;
        const articleContent = `<a href="${href}" class="col-8">${name}</a><button class="col-3" type="button" data-toggle="modal" data-target="#${modalId}">Подробнее</button>`;
        article.innerHTML = articleContent;
        newArticlesList.append(article);
        const modal = createModal(name, text, modalId);
        modalIndex += 1;
        newmodalsContainer.append(modal);
      });
    });

    modalIndex = 0;
    chanelsList.replaceWith(newChanelsList);
    articlesList.replaceWith(newArticlesList);
    modalsContainer.replaceWith(newmodalsContainer);
  });

  watch(state, 'buttonText', () => {
    addButton.textContent = state.buttonText;
  });

  watch(state, 'error', () => {
    errorField.textContent = state.error;
  });

  addField.addEventListener('input', ({ target }) => {
    state.error = '';
    const { process } = getAction(validationActions, target.value);
    const newParams = process();
    state.href = target.value.split('//').slice(1).join('');
    Object.assign(state, newParams);
  });

  addForm.addEventListener('submit', (evt) => {
    evt.preventDefault();
    if (state.input === 'valid') {
      state.submittButton = 'disabled';
      state.buttonText = 'Searching...';
      state.input = 'disabled';
      axios.get(`${proxiUrl}${state.href}`)
        .then((response) => {
          try {
            const chanelData = getChanelData(response.data);
            state.chanels.push(chanelData);
            state.feedList.add(addField.value);
            state.form = 'reset';
            state.input = 'initial';
          } catch (e) {
            state.input = 'invalid';
            state.feedbackText = 'Данный URL не является RSS';
          } finally {
            state.buttonText = 'Submit';
          }
        }).catch(() => {
          state.error = 'Произошла ошибка сети. Попробуйте повторить запрос';
          state.input = 'valid';
          state.buttonText = 'Submit';
        });
    }
  });

  addForm.addEventListener('reset', () => {
    state.form = 'calm';
  });
};
