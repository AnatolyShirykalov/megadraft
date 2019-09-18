/*
 * Copyright (c) 2016, Globo.com (https://github.com/globocom)
 *
 * License: MIT
 */

import React, { Component } from "react";

import Modal from "backstage-modal";
import AtomicBlocksModalList from "./AtomicBlocksModalList";

class atomicBlocksModal extends Component {
  constructor(props) {
    super(props);
    this.onCloseRequest = ::this.onCloseRequest;
    this.modalOptions = this.props.modalOptions ? this.props.modalOptions : {};
    this.modalWidth = this.modalOptions.width || 528;
    this.modalHeight = this.modalOptions.height || 394;
  }

  onCloseRequest() {
    if (!this.props.isOpen) {
      return;
    }
    document.body.classList.remove("megadraft-modal--open");
    this.props.toggleModalVisibility();
  }

  render() {
    const { i18n } = this.props;

    return (
      <Modal
        className="megadraft-modal"
        title={i18n["Block List"]}
        isOpen={this.props.isOpen}
        onCloseRequest={this.onCloseRequest}
        width={this.modalWidth}
        height={this.modalHeight}
      >
        <AtomicBlocksModalList
          toggleModalVisibility={this.onCloseRequest}
          atomicBlocks={this.props.atomicBlocks}
          onChange={this.props.onChange}
          editorState={this.props.editorState}
        />
      </Modal>
    );
  }
}

export default atomicBlocksModal;
