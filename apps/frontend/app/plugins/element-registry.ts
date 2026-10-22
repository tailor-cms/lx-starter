import { defineComponent, h } from 'vue';
import accordion from '@tailor-cms/ce-accordion-display';
import audio from '@tailor-cms/ce-audio-display';
import carousel from '@tailor-cms/ce-carousel-display';
import dragDrop from '@tailor-cms/ce-drag-drop-display';
import embed from '@tailor-cms/ce-embed-display';
import file from '@tailor-cms/ce-file-display';
import fillBlank from '@tailor-cms/ce-fill-blank-display';
import html from '@tailor-cms/ce-html-display';
import image from '@tailor-cms/ce-image-display';
import matchingQuestion from '@tailor-cms/ce-matching-question-display';
import modal from '@tailor-cms/ce-modal-display';
import multipleChoice from '@tailor-cms/ce-multiple-choice-display';
import muxVideo from '@tailor-cms/ce-mux-video-display';
import numericalResponse from '@tailor-cms/ce-numerical-response-display';
import pageBreak from '@tailor-cms/ce-page-break-display';
import pdf from '@tailor-cms/ce-pdf-display';
import singleChoice from '@tailor-cms/ce-single-choice-display';
import table from '@tailor-cms/ce-table-display';
import textResponse from '@tailor-cms/ce-text-response-display';
import trueFalse from '@tailor-cms/ce-true-false-display';
import video from '@tailor-cms/ce-video-display';
import jodit from '@tailor-cms/ce-jodit-html-display';

import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

const pascalCase = (val: string) => upperFirst(camelCase(val));

// Wrap jodit Display with padding and font styles
const JoditDisplayWrapper = defineComponent({
  name: 'JoditDisplayWrapper',
  props: {
    element: { type: Object, required: true },
  },
  setup(props) {
    return () =>
      h(jodit.Display, {
        element: props.element,
        class: 'px-5 pt-4',
        style: { fontFamily: 'Prompt, sans-serif' },
      });
  },
});

const wrappedJodit = {
  ...jodit,
  Display: JoditDisplayWrapper,
};

export const elements = [
  accordion,
  audio,
  carousel,
  dragDrop,
  embed,
  file,
  fillBlank,
  html,
  image,
  matchingQuestion,
  modal,
  multipleChoice,
  muxVideo,
  numericalResponse,
  pageBreak,
  pdf,
  singleChoice,
  table,
  textResponse,
  trueFalse,
  video,
  wrappedJodit,
];

export default defineNuxtPlugin((app) => {
  elements.forEach(({ type, Display }) => {
    return app.vueApp.component(pascalCase(type), Display);
  });
});
