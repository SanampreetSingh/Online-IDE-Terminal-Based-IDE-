import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  status: 'inactive',
  mapping: null,
  previewPort: 3000,
  loading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspaceStatus: (state, action) => {
      state.status = action.payload.status;
      state.mapping = action.payload.mapping || state.mapping;
      state.loading = false;
    },
    setPreviewPort: (state, action) => {
      state.previewPort = action.payload;
    },
    setWorkspaceLoading: (state, action) => {
      state.loading = action.payload;
    },
    setWorkspaceError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setWorkspaceStatus, setPreviewPort, setWorkspaceLoading, setWorkspaceError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
