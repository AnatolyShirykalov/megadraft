/*
 * Copyright (c) 2016, Globo.com (https://github.com/globocom)
 *
 * License: MIT
 */

import React, { Component } from "react";
import { EditorState, SelectionState } from "draft-js";
import Editor from "draft-js-plugins-editor";
import { mount } from "enzyme";

import MegadraftEditor from "../../src/components/MegadraftEditor";
import Media from "../../src/components/Media";
import Sidebar, { ToggleButton } from "../../src/components/Sidebar";
import Toolbar from "../../src/components/Toolbar";
import { editorStateFromRaw } from "../../src/utils";
import image from "../../src/atomicBlocks/image";
import NotFoundAtomicBlock from "../../src/atomicBlocks/not-found";
import i18nConfig from "../../src/i18n";

const replaceSelection = (newSelection, wrapper, blockKey) => {
  const selectionState = SelectionState.createEmpty(blockKey);
  const updatedSelection = selectionState.merge(newSelection);
  const oldState = wrapper.state("editorState");
  const editorState = EditorState.forceSelection(oldState, updatedSelection);

  wrapper.setState({ editorState: editorState });
};

class MegadraftEditorWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { ...props };
  }

  render() {
    return (
      <MegadraftEditor
        i18n={i18nConfig["en-US"]}
        editorState={this.state.editorState}
        onChange={this.props.onChange}
        blocksWithoutStyleReset={this.props.blocksWithoutStyleReset}
        resetStyleNewLine={this.props.resetStyleNewLine}
      />
    );
  }
}

describe("MegadraftEditor Component", () => {
  let testContext, kba;

  class FakeAtomicBlock {
    constructor(type) {
      this.type = type;
    }

    getType() {
      return "atomic";
    }

    getData() {
      return {
        toObject: () => {
          return { type: this.type };
        }
      };
    }
  }

  beforeEach(() => {
    console.log("before each");
    const INITIAL_CONTENT = {
      entityMap: {},
      blocks: [
        {
          key: "ag6qs",
          text: "Hello World!",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [
            {
              offset: 0,
              length: 12,
              style: "BOLD"
            },
            {
              offset: 6,
              length: 6,
              style: "ITALIC"
            }
          ],
          entityRanges: []
        },
        {
          key: "bqjdr",
          text: "Good usability",
          type: "ordered-list-item",
          depth: 0,
          inlineStyleRanges: [
            {
              offset: 0,
              length: 14,
              style: "BOLD"
            }
          ],
          entityRanges: [],
          data: {}
        },
        {
          key: "9vgd",
          text: "🍺",
          type: "atomic",
          depth: 0,
          inlineStyleRanges: [],
          data: {
            type: "image",
            src: "images/media.jpg",
            caption: "Picture from StockSnap.io",
            rightsHolder: "By Tim Marshall"
          },
          entityRanges: []
        }
      ]
    };

    kba = jest.fn();
    const keyBindings = [
      {
        name: "save",
        isKeyBound: e => {
          return e.keyCode === 83 && e.ctrlKey;
        },
        action: kba
      }
    ];
    const blocksWithoutStyleReset = [
      "ordered-list-item",
      "unordered-list-item"
    ];
    const resetStyleOn = true;
    const resetStyleOff = false;

    testContext = {};
    testContext.maxSidebarButtons = null;
    testContext.modalOptions = { width: 500, height: 300 };
    testContext.onChange = jest.fn();
    testContext.editorState = editorStateFromRaw(INITIAL_CONTENT);
    testContext.wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        keyBindings={keyBindings}
      />
    );
    testContext.component = testContext.wrapper.instance();

    testContext.wrapperWithReset = mount(
      <MegadraftEditorWrapper
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        keyBindings={keyBindings}
        blocksWithoutStyleReset={blocksWithoutStyleReset}
        resetStyleNewLine={resetStyleOn}
      />
    );

    testContext.wrapperWithoutReset = mount(
      <MegadraftEditorWrapper
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        keyBindings={keyBindings}
        blocksWithoutStyleReset={blocksWithoutStyleReset}
        resetStyleNewLine={resetStyleOff}
      />
    );
  });

  it("renders without problems", () => {
    expect(testContext.wrapper).toHaveLength(1);
  });

  it("has the initial text", () => {
    expect(testContext.component.editorEl.textContent).toContain(
      "Hello World!"
    );
  });

  it("renders media component", () => {
    const items = testContext.wrapper.find(Media);
    expect(items).toHaveLength(1);
  });

  it("passes extra props to the draft-js editor", () => {
    const handlePastedText = text => {
      return text;
    };
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        handlePastedText={handlePastedText}
      />
    );
    expect(wrapper.find(Editor).props().handlePastedText).toEqual(
      handlePastedText
    );
  });

  it("can't override megadraft props via extra props", () => {
    const blockRendererFn = text => {
      return text;
    };
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        blockRendererFn={blockRendererFn}
      />
    );
    expect(wrapper.find(Editor).props().blockRendererFn).not.toEqual(
      blockRendererFn
    );
  });

  it("provides a default id to the wrapping div", () => {
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
      />
    );
    expect(wrapper.find(".megadraft-editor").props().id).toBeDefined();
  });

  it("allows the wrapping div id to be overridden", () => {
    const id = "custom-id";
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        id={id}
      />
    );
    expect(wrapper.find(".megadraft-editor").props().id).toEqual(id);
  });

  it("allows blockRendererFn to be augmented with mediaBlockRenderer", () => {
    const contentBlock = {
      getType: () => "atomic"
    };
    const blockRendererFn = contentBlock => {
      const type = contentBlock.getType();
      if (type === "atomic") {
        return true;
      }
    };
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        blockRendererFn={blockRendererFn}
      />
    );
    expect(
      wrapper
        .find(Editor)
        .props()
        .blockRendererFn(contentBlock)
    ).toEqual(true);
  });

  it("allows blockStyleFn to be overridden", () => {
    const blockStyleFn = text => {
      return text;
    };
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        blockStyleFn={blockStyleFn}
      />
    );
    expect(wrapper.find(Editor).props().blockStyleFn).toEqual(blockStyleFn);
  });

  it("reset blockStyle in new block if resetStyle is true", () => {
    const blockKey = "ag6qs";
    replaceSelection(
      { anchorOffset: 12, focusOffset: 12 },
      testContext.wrapperWithReset,
      blockKey
    );

    const editor = testContext.wrapperWithReset.find(MegadraftEditor);

    editor.instance().handleReturn({ shiftKey: false });

    const content = testContext.onChange.mock.calls[0][0].getCurrentContent();
    const newBlock = content.getBlockAfter("ag6qs");

    expect(newBlock.getType()).toEqual("unstyled");
  });

  it("reset inlineStyle in new block if resetStyle is true", () => {
    const blockKey = "ag6qs";
    replaceSelection(
      { anchorOffset: 12, focusOffset: 12 },
      testContext.wrapperWithReset,
      blockKey
    );

    const editor = testContext.wrapperWithReset.find(MegadraftEditor);

    editor.instance().handleReturn({ shiftKey: false });

    const editorState = testContext.onChange.mock.calls[0][0];
    const inlineStyle = editorState.getCurrentInlineStyle();

    expect(inlineStyle.count()).toEqual(0);
  });

  it("reset inlineStyles if in blocksWithoutStyleReset", () => {
    const blockKey = "bqjdr";
    replaceSelection(
      { anchorOffset: 14, focusOffset: 14 },
      testContext.wrapperWithReset,
      blockKey
    );

    const editor = testContext.wrapperWithReset.find(MegadraftEditor);

    editor.instance().handleReturn({ shiftKey: false });

    const editorState = testContext.onChange.mock.calls[0][0];
    const inlineStyle = editorState.getCurrentInlineStyle();

    expect(inlineStyle.count()).toEqual(0);
  });

  it("reset style should not change list type", () => {
    const blockKey = "bqjdr";
    replaceSelection(
      { anchorOffset: 14, focusOffset: 14 },
      testContext.wrapperWithReset,
      blockKey
    );

    const editor = testContext.wrapperWithReset.find(MegadraftEditor);

    editor.instance().handleReturn({ shiftKey: false });

    const content = testContext.onChange.mock.calls[0][0].getCurrentContent();
    const newBlock = content.getBlockAfter("bqjdr");

    expect(newBlock.type).toEqual("ordered-list-item");
  });

  it("should not reset style if resetStyle is false", () => {
    const blockKey = "ag6qs";
    replaceSelection(
      { anchorOffset: 12, focusOffset: 12 },
      testContext.wrapperWithoutReset,
      blockKey
    );

    const editor = testContext.wrapperWithoutReset.find(MegadraftEditor);

    expect(editor.instance().handleReturn({ shiftKey: false })).toEqual(false);
  });

  describe("mediaBlockRenderer", () => {
    it("ignores non-atomic blocks", () => {
      const block = { getType: () => "metal" };
      const result = testContext.component.mediaBlockRenderer(block);
      expect(result).toBeNull();
    });

    it("returns media renderer for registered atomicBlock", () => {
      const block = new FakeAtomicBlock("image");
      const result = testContext.component.mediaBlockRenderer(block);
      expect(result).toEqual({
        component: Media,
        editable: false,
        props: {
          i18n: i18nConfig["en-US"],
          atomicBlock: image,
          plugin: image,
          onChange: testContext.component.onChange,
          editorState: testContext.editorState,
          setReadOnly: testContext.component.setReadOnly,
          getReadOnly: testContext.component.getReadOnly,
          getEditorState: testContext.component.getEditorState,
          setInitialReadOnly: testContext.component.setInitialReadOnly,
          getInitialReadOnly: testContext.component.getInitialReadOnly
        }
      });
    });

    it("returns media renderer with fallback for unregistered atomicBlock", () => {
      const block = new FakeAtomicBlock("unregistered");
      const result = testContext.component.mediaBlockRenderer(block);

      expect(result).toEqual({
        component: Media,
        editable: false,
        props: {
          i18n: i18nConfig["en-US"],
          atomicBlock: NotFoundAtomicBlock,
          plugin: NotFoundAtomicBlock,
          onChange: testContext.component.onChange,
          editorState: testContext.editorState,
          setReadOnly: testContext.component.setReadOnly,
          getReadOnly: testContext.component.getReadOnly,
          getEditorState: testContext.component.getEditorState,
          setInitialReadOnly: testContext.component.setInitialReadOnly,
          getInitialReadOnly: testContext.component.getInitialReadOnly
        }
      });
    });

    it("returns media renderer with atomicBlock from custom fallback", () => {
      const customFallbackAtomicBlock = {
        blockComponent: props => <pre>{props.data.type}</pre>
      };
      testContext.wrapper.setProps({
        handleBlockNotFound: () => customFallbackAtomicBlock
      });

      const block = new FakeAtomicBlock("unregistered");
      const result = testContext.component.mediaBlockRenderer(block);

      expect(result).toEqual({
        component: Media,
        editable: false,
        props: {
          i18n: i18nConfig["en-US"],
          atomicBlock: customFallbackAtomicBlock,
          plugin: customFallbackAtomicBlock,
          onChange: testContext.component.onChange,
          editorState: testContext.editorState,
          setReadOnly: testContext.component.setReadOnly,
          getReadOnly: testContext.component.getReadOnly,
          getEditorState: testContext.component.getEditorState,
          setInitialReadOnly: testContext.component.setInitialReadOnly,
          getInitialReadOnly: testContext.component.getInitialReadOnly
        }
      });
    });

    it("ignores empty atomicBlock from custom fallback", () => {
      testContext.wrapper.setProps({ handleBlockNotFound: () => null });

      const block = new FakeAtomicBlock("unregistered");
      const result = testContext.component.mediaBlockRenderer(block);

      expect(result).toEqual(null);
    });
  });

  it("passes extra plugins to the draft-js editor", function() {
    const fakePlugin = { fake: "plugin" };
    const wrapper = mount(
      <MegadraftEditor
        editorState={this.editorState}
        onChange={this.onChange}
        plugins={[fakePlugin]}
      />
    );
    const plugins = wrapper.ref("draft").props().plugins;
    expect(plugins.length).toEqual(2);
    expect(plugins[1]).toEqual(fakePlugin);
  });

  it("starts with default readOnly status", () => {
    const items = testContext.wrapper.find(Editor);
    expect(items.instance().props.readOnly).toBeFalsy();
  });

  it("changes readOnly status", () => {
    const items = testContext.wrapper.find(Editor);
    testContext.component.setReadOnly(true);
    expect(items.instance().props.readOnly).toBeTruthy();
  });

  it("is capable of inserting soft line breaks", () => {
    testContext.component.handleReturn({ shiftKey: true });

    const content = testContext.onChange.mock.calls[0][0].getCurrentContent();

    const text = content.getFirstBlock().getText();

    expect(text).toEqual("\nHello World!");
  });

  it("does not insert soft line breaks if option set to false", () => {
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        softNewLines={false}
      />
    );
    const component = wrapper.instance();
    expect(component.handleReturn({ shiftKey: true })).toEqual(false);
  });

  it("is capable of adding a new block when try to add a soft break before an exist one", () => {
    const SOFT_BREAK_ON_BEGINING = {
      entityMap: {},
      blocks: [
        {
          key: "ag6qs",
          text: "\nHello World!",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: []
        }
      ]
    };

    kba = jest.fn();
    const keyBindings = [
      {
        name: "save",
        isKeyBound: e => {
          return e.keyCode === 83 && e.ctrlKey;
        },
        action: kba
      }
    ];

    testContext.editorState = editorStateFromRaw(SOFT_BREAK_ON_BEGINING);

    testContext.wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        keyBindings={keyBindings}
      />
    );
    testContext.component = testContext.wrapper.instance();

    const addedASoftBreak = testContext.component.handleReturn({
      shiftKey: true
    });

    expect(addedASoftBreak).toBeFalsy();
  });

  it("is capable of adding a new block when try to add a soft break after an exist one", () => {
    const SOFT_BREAK_ON_END = {
      entityMap: {},
      blocks: [
        {
          key: "ag6qs",
          text: "Hello World!\n",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: []
        }
      ]
    };

    kba = jest.fn();
    const keyBindings = [
      {
        name: "save",
        isKeyBound: e => {
          return e.keyCode === 83 && e.ctrlKey;
        },
        action: kba
      }
    ];

    testContext.editorState = EditorState.moveSelectionToEnd(
      editorStateFromRaw(SOFT_BREAK_ON_END)
    );

    testContext.wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        keyBindings={keyBindings}
      />
    );

    testContext.component = testContext.wrapper.instance();

    const addedASoftBreak = testContext.component.handleReturn({
      shiftKey: true
    });

    expect(addedASoftBreak).toBeFalsy();
  });

  it("recognizes external key binding", () => {
    const defaultKeyBinding = { keyCode: 66, ctrlKey: true };
    expect(
      testContext.component.externalKeyBindings(defaultKeyBinding)
    ).toEqual("bold");

    const unknownKeyBinding = { keyCode: 70, ctrlKey: true };
    expect(
      testContext.component.externalKeyBindings(unknownKeyBinding)
    ).toBeNull();

    const externalKeyBinding = { keyCode: 83, ctrlKey: true };
    expect(
      testContext.component.externalKeyBindings(externalKeyBinding)
    ).toEqual("save");
  });

  it("handles external commands", () => {
    const defaultCommand = "bold";
    expect(testContext.component.handleKeyCommand(defaultCommand)).toBeTruthy();

    const unknownCommand = "foo";
    expect(testContext.component.handleKeyCommand(unknownCommand)).toBeFalsy();

    const externalCommand = "save";
    expect(
      testContext.component.handleKeyCommand(externalCommand)
    ).toBeTruthy();
    expect(kba).toHaveBeenCalled();
  });

  it("renders only valid atomicBlocks", () => {
    console.warn = jest.fn();

    const invalidAtomicBlock = {
      buttonComponent: {},
      blockComponent: {}
    };

    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        atomicBlocks={[image, invalidAtomicBlock]}
      />
    );
    const sidebar = wrapper.find(Sidebar);
    expect(sidebar.prop("atomicBlocks")).toHaveLength(1);
  });

  it("shows warning for missing `type` field", () => {
    console.warn = jest.fn();

    const atomicBlock = {
      buttonComponent: {},
      blockComponent: {}
    };
    const atomicBlocks = [atomicBlock];

    mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        atomicBlocks={atomicBlocks}
      />
    );

    expect(console.warn.mock.calls[0][0]).toEqual(
      "AtomicBlock: Missing `type` field. Details: "
    );
  });

  it("renders default sidebar if sidebarRendererFn not provided", () => {
    const sidebar = testContext.wrapper.find(Sidebar);
    expect(sidebar).toHaveLength(1);
  });

  it("passes required props to default sidebar", () => {
    const sidebar = testContext.wrapper.find(Sidebar);
    expect(sidebar.prop("atomicBlocks")).toEqual(
      testContext.component.atomicBlocks
    );
    expect(sidebar.prop("onChange")).toEqual(testContext.component.onChange);
    expect(sidebar.prop("editorState")).toEqual(testContext.editorState);
    expect(sidebar.prop("readOnly")).toBeFalsy();
  });

  it("calls sidebarRendererFn if it's provided", () => {
    const renderCustomSidebar = jest.fn();
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        maxSidebarButtons={testContext.maxSidebarButtons}
        sidebarRendererFn={renderCustomSidebar}
        modalOptions={testContext.modalOptions}
      />
    );

    const component = wrapper.instance();
    const expectedProps = {
      i18n: i18nConfig["en-US"],
      atomicBlocks: component.atomicBlocks,
      onChange: component.onChange,
      editorState: testContext.editorState,
      readOnly: false,
      maxSidebarButtons: testContext.maxSidebarButtons,
      modalOptions: testContext.modalOptions,
      editorHasFocus: false,
      hideSidebarOnBlur: false
    };
    expect(renderCustomSidebar).toHaveBeenCalledWith(expectedProps);
  });

  it("renders custom sidebar if sidebarRendererFn is provided", () => {
    class MyCustomSidebar extends React.Component {
      render() {
        return (
          <div>
            <span>My custom Sidebar</span>
          </div>
        );
      }
    }
    const renderCustomSidebar = (atomicBlocks, editorState) => {
      return (
        <MyCustomSidebar
          atomicBlocks={atomicBlocks}
          editorState={editorState}
        />
      );
    };
    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.onChange}
        sidebarRendererFn={renderCustomSidebar}
      />
    );
    const sidebar = wrapper.find(MyCustomSidebar);
    expect(sidebar).toHaveLength(1);
  });

  it("should hide sidebar on blur when editor has not focus", () => {
    const wrapper = mount(
      <MegadraftEditor
        hideSidebarOnBlur={true}
        hasFocus={false}
        editorState={testContext.editorState}
        onChange={testContext.onChange}
      />
    );

    const sidebar = wrapper.find(ToggleButton);
    expect(sidebar.children()).toHaveLength(0);
  });

  it("should not hide sidebar on blur when editor has not focus", () => {
    const wrapper = mount(
      <MegadraftEditor
        hideSidebarOnBlur={false}
        hasFocus={false}
        editorState={testContext.editorState}
        onChange={testContext.onChange}
      />
    );

    const sidebar = wrapper.find(ToggleButton);
    expect(sidebar.children()).toHaveLength(1);
  });

  it("renders default toolbar if Tooolbar not provided", () => {
    const toolbar = testContext.wrapper.find(Toolbar);
    expect(toolbar).toHaveLength(1);
  });

  it("passes required props to default toolbar", () => {
    const toolbar = testContext.wrapper.find(Toolbar);
    expect(toolbar.prop("actions")).toEqual(
      testContext.component.props.actions
    );
    expect(toolbar.prop("entityInputs")).toEqual(
      testContext.component.entityInputs
    );
    expect(toolbar.prop("onChange")).toEqual(testContext.component.onChange);
    expect(toolbar.prop("editorState")).toEqual(testContext.editorState);
    expect(toolbar.prop("readOnly")).toBeFalsy();
  });

  it("renders custom toolbar if Toolbar is provided", () => {
    class MyCustomToolbar extends React.Component {
      render() {
        return (
          <div>
            <span>My custom Toolbar</span>
          </div>
        );
      }
    }

    const wrapper = mount(
      <MegadraftEditor
        editorState={testContext.editorState}
        onChange={testContext.component.onChange}
        Toolbar={MyCustomToolbar}
      />
    );
    const toolbar = wrapper.find(MyCustomToolbar);
    expect(toolbar).toHaveLength(1);
    expect(toolbar.prop("actions")).toEqual(
      testContext.component.props.actions
    );
    expect(toolbar.prop("entityInputs")).toEqual(
      testContext.component.entityInputs
    );
    expect(toolbar.prop("editorState")).toEqual(testContext.editorState);
    expect(toolbar.prop("readOnly")).toBeFalsy();
  });
});
