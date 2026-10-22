import accordion from '@tailor-cms/ce-accordion-server';
import audio from '@tailor-cms/ce-audio-server';
import brightcoveVideo from '@tailor-cms/ce-brightcove-video-server';
import carousel from '@tailor-cms/ce-carousel-server';
import dragDrop from '@tailor-cms/ce-drag-drop-server';
import embed from '@tailor-cms/ce-embed-server';
import file from '@tailor-cms/ce-file-server';
import fillBlank from '@tailor-cms/ce-fill-blank-server';
import html from '@tailor-cms/ce-html-server';
import image from '@tailor-cms/ce-image-server';
import joditHtml from '@tailor-cms/ce-jodit-html-server';
import matchingQuestion from '@tailor-cms/ce-matching-question-server';
import modal from '@tailor-cms/ce-modal-server';
import multipleChoice from '@tailor-cms/ce-multiple-choice-server';
import numericalResponse from '@tailor-cms/ce-numerical-response-server';
import pageBreak from '@tailor-cms/ce-page-break-server';
import pdf from '@tailor-cms/ce-pdf-server';
import quillHtml from '@tailor-cms/ce-quill-html-server';
import singleChoice from '@tailor-cms/ce-single-choice-server';
import table from '@tailor-cms/ce-table-server';
import textResponse from '@tailor-cms/ce-text-response-server';
import trueFalse from '@tailor-cms/ce-true-false-server';
import video from '@tailor-cms/ce-video-server';

const elements = new Map([
  [accordion.type, accordion],
  [audio.type, audio],
  [brightcoveVideo.type, brightcoveVideo],
  [carousel.type, carousel],
  [dragDrop.type, dragDrop],
  [embed.type, embed],
  [file.type, file],
  [fillBlank.type, fillBlank],
  [html.type, html],
  [image.type, image],
  [joditHtml.type, joditHtml],
  [matchingQuestion.type, matchingQuestion],
  [modal.type, modal],
  [multipleChoice.type, multipleChoice],
  [numericalResponse.type, numericalResponse],
  [pageBreak.type, pageBreak],
  [pdf.type, pdf],
  [quillHtml.type, quillHtml],
  [singleChoice.type, singleChoice],
  [table.type, table],
  [textResponse.type, textResponse],
  [trueFalse.type, trueFalse],
  [video.type, video],
]);

export const getRuntime = (type: string) => elements.get(type);
