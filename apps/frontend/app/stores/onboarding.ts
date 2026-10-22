import { useLocalStorage } from '@vueuse/core';

export interface PracticeInfo {
  firmAffiliation: string;
  yearsOfExperience: string;
  practiceModel: string;
  offerings: string[];
  targetInvestors: string[];
}

export type ApproachType =
  | 'contextual-guidance'
  | 'browse-by-topic'
  | 'learning-path'
  | null;

const defaultPracticeInfo: PracticeInfo = {
  firmAffiliation: '',
  yearsOfExperience: '',
  practiceModel: '',
  offerings: [],
  targetInvestors: [],
};

/**
 * Tracks onboarding completion status and practice info locally.
 * Survey answers are stored on the backend via submitOnboarding API.
 */
export const useOnboardingStore = defineStore('onboarding', () => {
  const completedAt = useLocalStorage<string | null>(
    'lx-onboarding-completed',
    null,
  );

  const _practiceInfo = useLocalStorage<PracticeInfo>(
    'lx-onboarding-practice',
    { ...defaultPracticeInfo },
  );

  const _selectedApproach = useLocalStorage<ApproachType>(
    'lx-onboarding-approach',
    null,
  );

  const practiceInfo = computed(() => ({
    ...defaultPracticeInfo,
    ..._practiceInfo.value,
  }));

  const selectedApproach = computed(() => _selectedApproach.value);

  const isCompleted = computed(() => !!completedAt.value);

  function updatePracticeInfo(info: Partial<PracticeInfo>) {
    _practiceInfo.value = { ..._practiceInfo.value, ...info };
  }

  function selectApproach(approach: ApproachType) {
    _selectedApproach.value = approach;
  }

  function markCompleted() {
    completedAt.value = new Date().toISOString();
  }

  function clearLocal() {
    completedAt.value = null;
    _practiceInfo.value = { ...defaultPracticeInfo };
    _selectedApproach.value = null;
  }

  /**
   * Sync localStorage with backend activity state.
   */
  function sync(activity: any): void {
    const backendCompletedAt = activity?.onboarding?.completedAt;
    if (backendCompletedAt && !completedAt.value) {
      completedAt.value = backendCompletedAt;
    } else if (!backendCompletedAt && completedAt.value) {
      clearLocal();
    }
  }

  return {
    practiceInfo,
    selectedApproach,
    isCompleted,
    updatePracticeInfo,
    selectApproach,
    markCompleted,
    clearLocal,
    sync,
  };
});
