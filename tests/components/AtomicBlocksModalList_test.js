/*
 * Copyright (c) 2016, Globo.com (https://github.com/globocom)
 *
 * License: MIT
 */

import React, { Component } from "react";
import { mount } from "enzyme";

import { ModalBody } from "backstage-modal";
import AtomicBlocksModalList from "../../src/components/AtomicBlocksModalList";
import DEFAULT_ATOMIC_BLOCKS from "../../src/atomicBlocks/default.js";

const baseAtomicBlock = DEFAULT_ATOMIC_BLOCKS[0];

class ModalWithAtomicBlocks extends Component {
  generateAtomicBlocks() {
    let atomicBlocks = [];
    for (let i = 0; i < 4; i++) {
      atomicBlocks.push(Object.assign({}, baseAtomicBlock, {
        title: "atomicBlock" + i,
        type: "atomicBlock" + i
      }));
    }
    return atomicBlocks;
  }

  onChange = (editorState) => {
    this.props.onChange(editorState);
    this.setState({ editorState: editorState });
  }

  render() {
    const atomicBlocks = this.generateAtomicBlocks();
    return (
      <div ref="editor">
        <AtomicBlocksModalList
          handleModal={this.handleModal}
          atomicBlocks={atomicBlocks}
          onChange={this.onChange}
          toggleModalVisibility={this.props.toggleModalVisibility}
          editorState={this.props.editorState}
        />
      </div>
    );
  }
}

describe("Sidebar Modal Component", () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
    testContext.onChangeSpy = jest.fn();
    testContext.toggleModalVisibilitySpy = jest.fn();

    testContext.wrapper = mount(
      <ModalWithAtomicBlocks
        onChange={testContext.onChangeSpy}
        toggleModalVisibility={testContext.toggleModalVisibilitySpy}
      />
    );
  });

  it("should have atomcBlocks inside modal", () => {
    const modal = testContext.wrapper.find(ModalBody);


    const atomicBlock = modal.find("li");

    expect(atomicBlock.length).toBeGreaterThanOrEqual(1);
  });

  it("should have the all atomicBlocks inside modal", () => {
    const modal = testContext.wrapper.find(ModalBody);

    const atomicBlock = modal.find(".megadraft-modal__item");

    expect(atomicBlock).toHaveLength(4);
  });

  it("should be a real atomicBlock", () => {
    const modal = testContext.wrapper.find(ModalBody);

    const atomicBlock = modal.find(baseAtomicBlock.buttonComponent);

    expect(atomicBlock.length).toBeGreaterThanOrEqual(1);
  });

  it("should callback a function received when receives onChange call", () => {
    const newEditorState = {};
    const modal = testContext.wrapper.find(AtomicBlocksModalList);
    modal.instance().onChange(newEditorState);
    expect(testContext.onChangeSpy).toHaveBeenCalledWith(newEditorState);
  });

  it("should toggle visibility when receives onChange call", () => {
    const newEditorState = {};
    const modal = testContext.wrapper.find(AtomicBlocksModalList);
    modal.instance().onChange(newEditorState);
    expect(testContext.toggleModalVisibilitySpy).toHaveBeenCalled();
  });
});
