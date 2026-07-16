/* eslint-disable @typescript-eslint/no-explicit-any */
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import SlashCommandList from './SlashCommandList';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  Wand2,
  Minimize2,
  CheckCheck
} from "lucide-react";

export const getSuggestionItems = (query: string, aiHandlers: any) => {
  const items = [
    // AI Actions
    {
      title: 'AI: Continue Writing',
      description: 'Let AI generate the next sentences',
      icon: Sparkles,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        if (aiHandlers?.handleAIContinue) aiHandlers.handleAIContinue();
      },
    },
    {
      title: 'AI: Expand Text',
      description: 'Make the selected text longer and more detailed',
      icon: Wand2,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        if (aiHandlers?.handleAIExpand) aiHandlers.handleAIExpand();
      },
    },
    {
      title: 'AI: Shorten Text',
      description: 'Make the selected text more concise',
      icon: Minimize2,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        if (aiHandlers?.handleAIShorten) aiHandlers.handleAIShorten();
      },
    },
    {
      title: 'AI: Fix Grammar',
      description: 'Correct grammar and improve style',
      icon: CheckCheck,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        if (aiHandlers?.handleAIFixGrammar) aiHandlers.handleAIFixGrammar();
      },
    },
    // Formatting
    {
      title: 'Heading 1',
      description: 'Big section heading',
      icon: Heading1,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: Heading2,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Heading 3',
      description: 'Small section heading',
      icon: Heading3,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Bullet List',
      description: 'Create a simple bulleted list',
      icon: List,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Create a list with numbering',
      icon: ListOrdered,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Quote',
      description: 'Capture a quote',
      icon: Quote,
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
  ];

  return items.filter(item => item.title.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
};

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: TippyInstance[] | null = null;

  return {
    onStart: (props: any) => {
      component = new ReactRenderer(SlashCommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },

    onUpdate(props: any) {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup?.[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },

    onKeyDown(props: any) {
      if (props.event.key === 'Escape') {
        popup?.[0].hide();
        return true;
      }

      return (component?.ref as any)?.onKeyDown(props);
    },

    onExit() {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};
