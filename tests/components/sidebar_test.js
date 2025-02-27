/*
 * Copyright (c) 2016, Globo.com (https://github.com/globocom)
 *
 * License: MIT
 */

import React, { Component } from "react";
import { mount } from "enzyme";
import i18nConfig from "../../src/i18n";
import Sidebar, { ToggleButton, SideMenu } from "../../src/components/Sidebar";
import AtomicBlocksModal from "../../src/components/AtomicBlocksModal";
import image from "../../src/atomicBlocks/image";
import { editorStateFromRaw } from "../../src/utils";
import DEFAULT_ATOMIC_BLOCKS from "../../src/atomicBlocks/default.js";
import ImageButton from "../../src/atomicBlocks/image/ImageButton";

class SidebarWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props };
    this.editorHasFocus = true;
    this.atomicBlocks = this.props.atomicBlocks || DEFAULT_ATOMIC_BLOCKS;
    this.onChange = ::this.onChange;
  }

  onChange(editorState) {
    this.setState({ editorState: editorState });
  }

  render() {
    return (
      <div ref="editor">
        <Sidebar
          i18n={this.props.i18n}
          ref="sidebar"
          atomicBlocks={this.atomicBlocks}
          editorState={this.state.editorState}
          readOnly={this.props.readOnly}
          onChange={this.onChange}
          editorHasFocus={this.editorHasFocus}
        />
      </div>
    );
  }
}

class SidebarWithModalWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props };

    const atomicBlocksConcat = [...DEFAULT_ATOMIC_BLOCKS, ...DEFAULT_ATOMIC_BLOCKS];
    this.atomicBlocks = atomicBlocksConcat.map((block, i) => (
      {...block, type: `${block.type}${i}`}
    ));

    this.maxSidebarButtons = 3;
    this.modalOptions = { width: 500, height: 300 };
    this.editorHasFocus = true;
    this.onChange = ::this.onChange;
  }

  onChange(editorState) {
    this.setState({ editorState: editorState });
  }

  render() {
    return (
      <div ref="editor">
        <Sidebar
          i18n={this.props.i18n}
          ref="sidebar"
          atomicBlocks={this.atomicBlocks}
          editorState={this.state.editorState}
          readOnly={this.props.readOnly}
          onChange={this.onChange}
          maxSidebarButtons={this.maxSidebarButtons}
          modalOptions={this.modalOptions}
          editorHasFocus={this.editorHasFocus}
        />
      </div>
    );
  }
}

describe("Sidebar Component", () => {
  let editorState, wrapper, wrapperSidebarModal;
  beforeEach(() => {
    const INITIAL_CONTENT = {
      entityMap: {},
      blocks: [
        {
          key: "ag6qs",
          text: "Hello World!",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: []
        }
      ]
    };

    editorState = editorStateFromRaw(INITIAL_CONTENT);
    wrapper = mount(
      <SidebarWrapper editorState={editorState} i18n={i18nConfig["en-US"]} />
    );
    wrapperSidebarModal = mount(
      <SidebarWithModalWrapper
        editorState={editorState}
        i18n={i18nConfig["en-US"]}
      />
    );
  });

  it("renders correctly on the page", () => {
    const sidebar = wrapper.find(Sidebar);
    expect(sidebar).toHaveLength(1);
    expect(sidebar.html()).not.toBeNull();
  });

  it("renders as null when readOnly is set", () => {
    const wrapper = mount(
      <SidebarWrapper
        readOnly
        editorState={editorState}
        i18n={i18nConfig["en-US"]}
      />
    );
    const sidebar = wrapper.find(Sidebar);
    expect(sidebar.html()).toBeNull();
  });

  it("renders enabled atomicBlocks", () => {
    const button = wrapper.find(image.buttonComponent);
    expect(button).toHaveLength(1);
  });

  it("renders only valid atomicBlocks", () => {
    const invalidAtomicBlock = {
      type: "invalid-atomcBlock",
      blockComponent: {}
    };
    const atomicBlocks = [image, invalidAtomicBlock];
    const wrapper = mount(
      <SidebarWrapper editorState={this.editorState} atomicBlocks={atomicBlocks} />
    );
    const sidemenu = wrapper.find(SideMenu);
    expect(sidemenu.prop("atomicBlocks")).toHaveLength(1);
  });

  it("has the menu hidden by default", () => {
    const menu = wrapper.find(SideMenu);
    const domMenu = menu.find("button").at(0);
    expect(domMenu.hasClass("sidemenu__items--open")).toBeFalsy();
  });

  it("opens the menu on click", () => {
    const toggleButton = wrapper.find(ToggleButton);
    const domButton = toggleButton.find("button");

    domButton.simulate("click");

    const menu = wrapper.find(SideMenu);
    const domMenu = menu.find("button").at(0);
    expect(domMenu.hasClass("sidemenu__button--open")).toBeTruthy();
  });

  it("is possible to click on the button", () => {
    const toggleButton = wrapper.find(ImageButton);
    const domButton = toggleButton.find("button");

    window.prompt = () => "http://www.globo.com";
    domButton.simulate("click");

    const contentState = wrapper.state("editorState").getCurrentContent();
    let data = null;
    contentState.getBlockMap().forEach(block => {
      if (block.getType() === "atomic") {
        data = block.getData();
      }
    });
    expect(data.get("src")).toEqual("http://www.globo.com");
  });

  it("should have a modal button when there is 4 atomicBlocks", () => {
    const toggleButton = wrapperSidebarModal.find(ToggleButton);
    const domButton = toggleButton.find("button");

    domButton.simulate("click");

    const menu = wrapperSidebarModal.find(SideMenu);
    const domMenu = menu.find("button");
    const domModalButton = domMenu.at(4);
    domModalButton.simulate("click");

    const modal = wrapperSidebarModal.find(AtomicBlocksModal);
    const domModal = modal.find("Modal");
    expect(domModal.prop("className")).toEqual("megadraft-modal");
  });

  it("should not have a modal button with less than 4 atomicBlocks", () => {
    const toggleButton = wrapper.find(ToggleButton);
    const domButton = toggleButton.find("button");

    domButton.simulate("click");

    const menu = wrapper.find(SideMenu);
    const domMenu = menu.find("button");
    const domModalButton = domMenu.at(4);

    expect(domModalButton.exists()).toBeFalsy();
  });

  it("should have atomicBlocks in modal if it's avaiable", () => {
    const toggleButton = wrapperSidebarModal.find(ToggleButton);
    const domButton = toggleButton.find("button");

    domButton.simulate("click");

    const menu = wrapperSidebarModal.find(SideMenu);
    const domMenu = menu.find("button");
    const domModalButton = domMenu.at(4);

    domModalButton.simulate("click");

    const modal = wrapperSidebarModal.find(PluginsModal);
    const items = modal.prop("atomicBlocks").length;
    expect(items).toBeGreaterThanOrEqual(1);
  });

  it("should have modal with props width", () => {
    const toggleButton = wrapperSidebarModal.find(ToggleButton);
    const domButton = toggleButton.find("button");
    domButton.simulate("click");

    const menu = wrapperSidebarModal.find(SideMenu);
    const domMenu = menu.find("button");
    const domModalButton = domMenu.at(4);

    domModalButton.simulate("click");
    const modal = wrapperSidebarModal.find(AtomicBlocksModal);
    const domModal = modal.find("Modal");

    expect(domModal.prop("width")).toBeDefined();
  });

  it("should have modal with props height", () => {
    const toggleButton = wrapperSidebarModal.find(ToggleButton);
    const domButton = toggleButton.find("button");
    domButton.simulate("click");

    const menu = wrapperSidebarModal.find(SideMenu);
    const domMenu = menu.find("button");
    const domModalButton = domMenu.at(4);

    domModalButton.simulate("click");
    const modal = wrapperSidebarModal.find(PluginsModal);
    const domModal = modal.find("Modal");

    expect(domModal.prop("height")).toBeDefined();
  });

  it("should have modal with props title equals to 'Block List' by default", () => {
    const modal = wrapperSidebarModal.find(PluginsModal);
    const domModal = modal.find("Modal");

    expect(domModal.prop("title")).toEqual("Block List");
  });

  it("should be able to change the modal title via i18n", () => {
    wrapperSidebarModal.setProps({ i18n: i18nConfig["pt-BR"] });
    const modal = wrapperSidebarModal.find(AtomicBlocksModal);
    const domModal = modal.find("Modal");

    expect(domModal.prop("title")).toEqual("Lista de Blocos");
  });
});
