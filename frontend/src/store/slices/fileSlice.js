import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tree: [],
  openTabs: [],
  activeTabPath: null,
  selectedPath: null,
  loading: false,
};

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setFileTree: (state, action) => {
      state.tree = action.payload;
    },
    setSelectedPath: (state, action) => {
      state.selectedPath = action.payload;
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
    closeTabsUnderPath: (state, action) => {
      const targetPath = action.payload;
      state.openTabs = state.openTabs.filter(
        (tab) => tab.path !== targetPath && !tab.path.startsWith(targetPath + '/')
      );
      if (state.activeTabPath === targetPath || state.activeTabPath?.startsWith(targetPath + '/')) {
        state.activeTabPath = state.openTabs.length > 0 ? state.openTabs[state.openTabs.length - 1].path : null;
      }
      if (state.selectedPath === targetPath || state.selectedPath?.startsWith(targetPath + '/')) {
        state.selectedPath = null;
      }
    },
    renameTabsUnderPath: (state, action) => {
      const { oldPath, newPath } = action.payload;
      state.openTabs = state.openTabs.map((tab) => {
        if (tab.path === oldPath) {
          const name = newPath.includes('/') ? newPath.split('/').pop() : newPath;
          return { ...tab, path: newPath, name };
        }
        if (tab.path.startsWith(oldPath + '/')) {
          const updatedPath = newPath + tab.path.substring(oldPath.length);
          const name = updatedPath.includes('/') ? updatedPath.split('/').pop() : updatedPath;
          return { ...tab, path: updatedPath, name };
        }
        return tab;
      });
      if (state.activeTabPath === oldPath) {
        state.activeTabPath = newPath;
      } else if (state.activeTabPath?.startsWith(oldPath + '/')) {
        state.activeTabPath = newPath + state.activeTabPath.substring(oldPath.length);
      }
      if (state.selectedPath === oldPath) {
        state.selectedPath = newPath;
      } else if (state.selectedPath?.startsWith(oldPath + '/')) {
        state.selectedPath = newPath + state.selectedPath.substring(oldPath.length);
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

export const {
  setFileTree,
  setSelectedPath,
  openTab,
  closeTab,
  closeTabsUnderPath,
  renameTabsUnderPath,
  setActiveTab,
  updateTabContent,
  markTabSaved,
} = fileSlice.actions;
export default fileSlice.reducer;
