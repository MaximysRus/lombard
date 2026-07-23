import { create } from 'zustand';

interface AppState {
  tariffs: any[];
  categories: any[];
  clients: any[];
  setTariffs: (tariffs: any[]) => void;
  setCategories: (categories: any[]) => void;
  setClients: (clients: any[]) => void;

  createForm: {
    selectedTariffId: string;
    clientId: string;
    isNewClient: boolean;
    newClientName: string;
    newClientPhone: string;
    items: any[];
  };
  setCreateForm: (data: Partial<AppState['createForm']>) => void;
  resetCreateForm: () => void;

  redeemForm: {
    selectedClientId: string;
  };
  setRedeemForm: (data: Partial<AppState['redeemForm']>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  tariffs: [],
  categories: [],
  clients: [],
  setTariffs: (tariffs) => set({ tariffs }),
  setCategories: (categories) => set({ categories }),
  setClients: (clients) => set({ clients }),

  createForm: {
    selectedTariffId: '',
    clientId: '',
    isNewClient: false,
    newClientName: '',
    newClientPhone: '',
    items: [],
  },
  setCreateForm: (data) => set((state) => ({ createForm: { ...state.createForm, ...data } })),
  resetCreateForm: () => set({
    createForm: { selectedTariffId: '', clientId: '', isNewClient: false, newClientName: '', newClientPhone: '', items: [] }
  }),

  redeemForm: {
    selectedClientId: '',
  },
  setRedeemForm: (data) => set((state) => ({ redeemForm: { ...state.redeemForm, ...data } })),
}));