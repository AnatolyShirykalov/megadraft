/*
 * Copyright (c) 2016, Globo.com (https://github.com/globocom)
 *
 * License: MIT
 */

// i18n shim! I feel bad for doing this =(
// https://github.com/megawac/async/blob/d2dd36b4558f483682f3c672630fdcb36a96d4d2/lib/async.js#L16
(
  (typeof self === "object" && self.self === self && self) ||
  (typeof global === "object" && global.global === global && global) ||
  this
).__ = x => {
  console.warn(
    "__() has been deprecated and will be removed soon. " +
      "You can move this code to your app, instead. __() code can be found at " +
      "https://gist.github.com/marcelometal/768454831c0c10ee03b939187b7bebbf"
  );
  return x;
};
import React, { Component } from "react";
import {
  RichUtils,
  getDefaultKeyBinding,
  EditorState,
  genKey,
  ContentBlock,
  SelectionState
} from "draft-js";
import Immutable from "immutable";

import Media from "./Media";
import i18nConfig from "../i18n";
import notFoundAtomicBlock from "../atomicBlocks/not-found";
import Editor from "draft-js-plugins-editor";
import DefaultToolbar from "./Toolbar";
import Sidebar from "./Sidebar";
import DEFAULT_ATOMIC_BLOCKS from "../atomicBlocks/default";
import DEFAULT_ACTIONS from "../actions/default";
import DEFAULT_ENTITY_INPUTS from "../entity_inputs/default";
import { decorators as defaultDecorators } from "../decorators/defaultDecorator";

const NO_RESET_STYLE_DEFAULT = ["ordered-list-item", "unordered-list-item"];

export default class MegadraftEditor extends Component {
  static defaultProps = {
    actions: DEFAULT_ACTIONS,
    blockRendererFn: () => {},
    i18n: i18nConfig,
    language: "en-US"
  };

  constructor(props) {
    super(props);
    this.state = {
      readOnly: this.props.readOnly || false,
      hasFocus: false
    };

    this.onChange = ::this.onChange;
    this.onTab = ::this.onTab;

    this.mediaBlockRenderer = ::this.mediaBlockRenderer;

    this.handleKeyCommand = ::this.handleKeyCommand;
    this.handleReturn = ::this.handleReturn;
    this.handleFocus = ::this.handleFocus;
    this.handleBlur = ::this.handleBlur;

    this.setReadOnly = ::this.setReadOnly;
    this.getReadOnly = ::this.getReadOnly;
    this.getInitialReadOnly = ::this.getInitialReadOnly;
    this.setInitialReadOnly = ::this.setInitialReadOnly;

    this.entityInputs = this.props.entityInputs || DEFAULT_ENTITY_INPUTS;
    this.blocksWithoutStyleReset =
      this.props.blocksWithoutStyleReset || NO_RESET_STYLE_DEFAULT;

    this.atomicBlocksByType = this.getAtomicBlocksByType();

    this.keyBindings = this.props.keyBindings || [];
  }

  getAtomicBlocksByType() {
    let atomicBlocksByType = {};

    for (let atomicBlock of this.props.atomicBlocks || DEFAULT_ATOMIC_BLOCKS) {
      atomicBlocksByType[atomicBlock.type] = atomicBlock;
    }

    return atomicBlocksByType;
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.readOnly !== nextProps.readOnly) {
      this.setState({ readOnly: nextProps.readOnly });
    }
  }

  onChange(editorState) {
    this.props.onChange(editorState);
  }

  externalKeyBindings(e): string {
    for (const kb of this.keyBindings) {
      if (kb.isKeyBound(e)) {
        return kb.name;
      }
    }
    return getDefaultKeyBinding(e);
  }

  onTab(event) {
    if (this.props.onTab) {
      this.props.onTab(event);
    }
  }

  handleKeyCommand(command) {
    // external key bindings
    if (this.keyBindings.length) {
      const extKb = this.keyBindings.find(kb => kb.name === command);
      if (extKb) {
        extKb.action();
        return true;
      }
    }

    const { editorState } = this.props;
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.props.onChange(newState);
      return true;
    }
    return false;
  }

  /*
   * Copyright (c) 2016 Icelab
   *
   * License: MIT
   */
  //Based on https://github.com/icelab/draft-js-block-breakout-plugin
  resetBlockStyle(
    editorState,
    selection,
    contentState,
    currentBlock,
    blockType
  ) {
    const { List } = Immutable;
    const emptyBlockKey = genKey();

    const emptyBlock = new ContentBlock({
      key: emptyBlockKey,
      text: "",
      type: blockType,
      depth: 0,
      characterList: List(),
      inlineStyleRanges: []
    });
    const blockMap = contentState.getBlockMap();

    const blocksBefore = blockMap.toSeq().takeUntil(function(v) {
      return v === currentBlock;
    });
    const blocksAfter = blockMap
      .toSeq()
      .skipUntil(function(v) {
        return v === currentBlock;
      })
      .rest();

    const augmentedBlocks = [
      [currentBlock.getKey(), currentBlock],
      [emptyBlockKey, emptyBlock]
    ];

    const focusKey = emptyBlockKey;
    const newBlocks = blocksBefore
      .concat(augmentedBlocks, blocksAfter)
      .toOrderedMap();
    const newContentState = contentState.merge({
      blockMap: newBlocks,
      selectionBefore: selection,
      selectionAfter: selection.merge({
        anchorKey: focusKey,
        anchorOffset: 0,
        focusKey: focusKey,
        focusOffset: 0,
        isBackward: false
      })
    });
    const noStyle = Immutable.OrderedSet([]);
    const resetState = EditorState.push(
      editorState,
      newContentState,
      "split-block"
    );
    const emptySelection = SelectionState.createEmpty(emptyBlockKey);
    const editorSelected = EditorState.forceSelection(
      resetState,
      emptySelection
    );
    const noStyleState = EditorState.setInlineStyleOverride(
      editorSelected,
      noStyle
    );
    this.props.onChange(noStyleState);
  }

  handleReturn(event) {
    if (this.props.softNewLines === false) {
      return false;
    }

    if (!event.shiftKey) {
      const { editorState } = this.props;
      const selection = editorState.getSelection();
      const contentState = editorState.getCurrentContent();
      const currentBlock = contentState.getBlockForKey(selection.getEndKey());
      const endOffset = selection.getEndOffset();
      const atEndOfBlock = endOffset === currentBlock.getLength();
      const resetStyleNewLine = this.props.resetStyleNewLine;
      const noReset = this.blocksWithoutStyleReset.includes(currentBlock.type);

      if (atEndOfBlock && resetStyleNewLine) {
        const blockType = noReset ? currentBlock.type : "unstyled";
        this.resetBlockStyle(
          editorState,
          selection,
          contentState,
          currentBlock,
          blockType
        );
        return true;
      }
      return false;
    }

    const { editorState } = this.props;

    const currentContent = editorState.getCurrentContent();
    const currentSelection = editorState.getSelection();
    const contentBlock = currentContent
      .getBlockMap()
      .get(currentSelection.getFocusKey());
    const contentText = contentBlock.getText();

    if (
      contentText.charAt(currentSelection.focusOffset - 1) == "\n" ||
      contentText.charAt(currentSelection.focusOffset) == "\n"
    ) {
      return false;
    }

    const newState = RichUtils.insertSoftNewline(editorState);
    this.props.onChange(newState);
    return true;
  }

  getValidAtomicBlocks(atomicBlocks) {
    return atomicBlocks.filter(atomicBlock => {
      const isInvalid = !atomicBlock || typeof atomicBlock.type !== "string";
      if (isInvalid) {
        console.warn(
          "AtomicBlock: Missing `type` field. Details: ",
          atomicBlock
        );
      }
      return !isInvalid;
    });
  }

  focus() {
    this.draftEl.focus();
  }

  setReadOnly(readOnly) {
    this.setState({ readOnly });
  }

  getReadOnly() {
    return this.state.readOnly;
  }

  getInitialReadOnly() {
    return this.props.readOnly || false;
  }

  setInitialReadOnly() {
    let readOnly = this.props.readOnly || false;
    this.setState({ readOnly });
  }

  handleBlockNotFound(block) {
    if (this.props.handleBlockNotFound) {
      return this.props.handleBlockNotFound(block);
    }
    return notFoundAtomicBlock;
  }

  handleFocus() {
    clearTimeout(this.blurTimeoutID);

    if (!this.state.hasFocus) {
      this.setState({
        hasFocus: true
      });
    }
  }

  handleBlur() {
    this.blurTimeoutID = setTimeout(() => {
      if (this.state.hasFocus) {
        this.setState({
          hasFocus: false
        });
      }
    }, 200);
  }

  componentWillUnmount() {
    clearTimeout(this.blurTimeoutID);
  }

  mediaBlockRenderer(block) {
    const handled = this.props.blockRendererFn(block);
    if (handled) {
      return handled;
    }

    if (block.getType() !== "atomic") {
      return null;
    }

    const type = block.getData().toObject().type;

    let atomicBlock =
      this.atomicBlocksByType[type] || this.handleBlockNotFound(block);
    if (!atomicBlock) {
      return null;
    }

    return {
      component: Media,
      editable: false,
      props: {
        i18n: this.props.i18n[this.props.language],
        atomicBlock: atomicBlock,
        // TODO: temporary compatibility for old plugins
        get plugin() {
          console.warn(
            "Megadraft will remove `blockProps.plugin` prop from future versions, please use `blockProps.atomicBlock` instead"
          );
          return atomicBlock;
        },
        onChange: this.onChange,
        editorState: this.props.editorState,
        getEditorState: this.getEditorState,
        setReadOnly: this.setReadOnly,
        getReadOnly: this.getReadOnly,
        getInitialReadOnly: this.getInitialReadOnly,
        setInitialReadOnly: this.setInitialReadOnly
      }
    };
  }

  getEditorState = () => {
    return this.props.editorState;
  };

  blockStyleFn(contentBlock) {
    const type = contentBlock.getType();
    if (type === "unstyled") {
      return "paragraph";
    }
  }

  renderSidebar(props) {
    const { sidebarRendererFn } = this.props;
    if (typeof sidebarRendererFn === "function") {
      return sidebarRendererFn(props);
    }
    return <Sidebar {...props} />;
  }

  renderToolbar(props) {
    const { Toolbar = DefaultToolbar } = this.props;
    return <Toolbar {...props} />;
  }

  render() {
    const hideSidebarOnBlur = this.props.hideSidebarOnBlur || false;
    const i18n = this.props.i18n[this.props.language];
    let { atomicBlocks, ...props } = this.props;
    atomicBlocks = this.getValidAtomicBlocks(
      atomicBlocks || DEFAULT_ATOMIC_BLOCKS
    );

    const plugins = this.props.plugins || [];
    const decorators = [...(this.props.decorators || []), ...defaultDecorators];

    return (
      <div className="megadraft">
        <div
          className="megadraft-editor"
          id={this.props.id || "megadraft-editor"}
          ref={el => {
            this.editorEl = el;
          }}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
        >
          {this.renderSidebar({
            i18n: i18n,
            atomicBlocks: atomicBlocks,
            editorState: props.editorState,
            readOnly: this.state.readOnly,
            onChange: this.onChange,
            maxSidebarButtons: props.maxSidebarButtons,
            modalOptions: props.modalOptions,
            editorHasFocus: this.state.hasFocus,
            hideSidebarOnBlur: hideSidebarOnBlur
          })}
          <Editor
            {...props}
            ref={el => {
              this.draftEl = el;
            }}
            readOnly={this.state.readOnly}
            atomicBlocks={atomicBlocks}
            decorators={decorators}
            blockRendererFn={::this.mediaBlockRenderer}
            blockStyleFn={this.props.blockStyleFn || ::this.blockStyleFn}
            onTab={this.onTab}
            handleKeyCommand={::this.handleKeyCommand}
            handleReturn={this.props.handleReturn || ::this.handleReturn}
            keyBindingFn={::this.externalKeyBindings}
            plugins={plugins}
            onChange={::this.onChange}
          />
          {this.renderToolbar({
            i18n: i18n,
            editor: this.editorEl,
            draft: this.draftEl,
            editorState: props.editorState,
            editorHasFocus: this.state.hasFocus,
            readOnly: this.state.readOnly,
            onChange: this.onChange,
            actions: props.actions,
            entityInputs: this.entityInputs,
            shouldDisplayToolbarFn: this.props.shouldDisplayToolbarFn
          })}
        </div>
      </div>
    );
  }
}
