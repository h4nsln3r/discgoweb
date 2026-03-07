"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

export type TopbarActionsState = {
  backHref: string | null;
  editHref: string | null;
  editLabel: string | null;
  pageTitle: string | null;
  primaryActionHref: string | null;
  primaryActionLabel: string | null;
};

const defaultState: TopbarActionsState = {
  backHref: null,
  editHref: null,
  editLabel: null,
  pageTitle: null,
  primaryActionHref: null,
  primaryActionLabel: null,
};

const TopbarActionsContext = createContext<{
  actions: TopbarActionsState;
  setTopbarActions: (partial: Partial<TopbarActionsState>) => void;
}>({
  actions: defaultState,
  setTopbarActions: () => {},
});

export function TopbarActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setState] = useState<TopbarActionsState>(defaultState);
  const setTopbarActions = useCallback((partial: Partial<TopbarActionsState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);
  return (
    <TopbarActionsContext.Provider value={{ actions, setTopbarActions }}>
      {children}
    </TopbarActionsContext.Provider>
  );
}

export function useTopbarActions() {
  return useContext(TopbarActionsContext);
}

type SetTopbarActionsProps = {
  backHref?: string | null;
  editHref?: string | null;
  editLabel?: string | null;
  pageTitle?: string | null;
  primaryActionHref?: string | null;
  primaryActionLabel?: string | null;
};

/** Sätts av en sida för att visa Tillbaka/Redigera/titel/primär knapp i topbaren. Rensas vid unmount. */
export function SetTopbarActions({
  backHref,
  editHref,
  editLabel,
  pageTitle,
  primaryActionHref,
  primaryActionLabel,
}: SetTopbarActionsProps) {
  const { setTopbarActions } = useTopbarActions();
  React.useEffect(() => {
    setTopbarActions({
      backHref: backHref ?? null,
      editHref: editHref ?? null,
      editLabel: editLabel ?? null,
      pageTitle: pageTitle ?? null,
      primaryActionHref: primaryActionHref ?? null,
      primaryActionLabel: primaryActionLabel ?? null,
    });
    return () => {
      setTopbarActions({
        backHref: null,
        editHref: null,
        editLabel: null,
        pageTitle: null,
        primaryActionHref: null,
        primaryActionLabel: null,
      });
    };
  }, [backHref, editHref, editLabel, pageTitle, primaryActionHref, primaryActionLabel, setTopbarActions]);
  return null;
}
