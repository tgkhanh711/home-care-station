"use client";
import { create } from "zustand";

interface PatientStore {
  selectedElderlyId: string | null;
  setSelectedElderlyId: (id: string | null) => void;
}

export const usePatientStore = create<PatientStore>((set) => ({
  selectedElderlyId: null,
  setSelectedElderlyId: (id) => set({ selectedElderlyId: id }),
}));