import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authSlice from './slices/authSlice';
import profileSlice from './slices/profileSlice';
import clubsSlice from './slices/clubsSlice';
import shotSlice from './slices/shotSlice';
import historySlice from './slices/historySlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['profile', 'clubs', 'history'],
  blacklist: ['auth', 'shot'],
};

const rootReducer = combineReducers({
  auth: authSlice,
  profile: profileSlice,
  clubs: clubsSlice,
  shot: shotSlice,
  history: historySlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;