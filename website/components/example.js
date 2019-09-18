/*
 * Copyright (c) 2016, Globo.com (https://github.com/globocom)
 *
 * License: MIT
 */

import React from "react";

import { MegadraftEditor } from "../../src/Megadraft";
import { editorStateToJSON, editorStateFromRaw } from "../../src/utils";
import { highlightCode } from "./highlightCode";

import INITIAL_CONTENT from "./contentExample";

import relatedArticles from "megadraft-related-articles-plugin";
import image from "../../src/atomicBlocks/image";
import video from "../../src/atomicBlocks/video";

class Example extends React.Component {
  constructor(props) {
    super(props);
    const content = editorStateFromRaw(INITIAL_CONTENT);
    this.keyBindings = [
      {
        name: "save",
        isKeyBound: e => {
          return e.keyCode === 83 && e.ctrlKey;
        },
        action: () => {
          this.onSave();
        }
      }
    ];
    this.resetStyleNewLine = true;
    this.state = {
      value: content
    };
    this.onChange = ::this.onChange;
    this.maxSidebarButtons = null;
  }

  componentDidMount() {
    highlightCode(this);
  }

  onChange(value) {
    this.setState({
      value
    });
  }

  onSave() {
    console.log("save");
  }

  renderEditor() {
    return (
      <div className="tab-container-editor">
        <MegadraftEditor
          atomicBlocks={[image, video, relatedArticles]}
          editorState={this.state.value}
          placeholder="Text"
          onChange={this.onChange}
          keyBindings={this.keyBindings}
          resetStyleNewLine={this.resetStyleNewLine}
          maxSidebarButtons={this.maxSidebarButtons}
        />
      </div>
    );
  }

  renderJsonPreview() {
    return (
      <div>
        <link
          rel="stylesheet"
          href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.4.0/styles/gruvbox-dark.min.css"
        />
        <div className="tab-container-json">
          <pre className="jsonpreview">
            <code className="json hljs">
              {editorStateToJSON(this.state.value)}
            </code>
          </pre>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.activeContent) {
      return this.renderEditor();
    }
    return this.renderJsonPreview();
  }
}

/* global hljs */
hljs.initHighlightingOnLoad();

export default Example;
