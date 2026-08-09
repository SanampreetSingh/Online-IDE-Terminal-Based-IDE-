import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tree: [],
  openTabs: [],
  activeTabPath: null,
  loading: false,
};

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setFileTree: (state, action) => {
      state.tree = action.payload;
    },
    openTab: (state, action) => {
      const { path, name, content } = action.payload;
      const existing = state.openTabs.find(tab => tab.path === path);
      if (!existing) {
        state.openTabs.push({
          path,
          name,
          content,
          originalContent: content,
          isDirty: false
        });
      }
      state.activeTabPath = path;
    },
    closeTab: (state, action) => {
      const path = action.payload;
      state.openTabs = state.openTabs.filter(tab => tab.path !== path);
      if (state.activeTabPath === path) {
        state.activeTabPath = state.openTabs.length > 0 ? state.openTabs[state.openTabs.length - 1].path : null;
      }
    },
    setActiveTab: (state, action) => {
      state.activeTabPath = action.payload;
    },
    updateTabContent: (state, action) => {
      const { path, content } = action.payload;
      const tab = state.openTabs.find(t => t.path === path);
      if (tab) {
        tab.content = content;
        tab.isDirty = tab.content !== tab.originalContent;
      }
    },
    markTabSaved: (state, action) => {
      const path = action.payload;
      const tab = state.openTabs.find(t => t.path === path);
      if (tab) {
        tab.originalContent = tab.content;
        tab.isDirty = false;
      }
    },
  },
});

export const { setFileTree, openTab, closeTab, setActiveTab, updateTabContent, markTabSaved } = fileSlice.actions;
export default fileSlice.reducer;
