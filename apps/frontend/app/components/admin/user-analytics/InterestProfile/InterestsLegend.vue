<template>
  <div class="interests-legend">
    <div class="legend-group">
      <div class="rank-badges">
        <span class="rank-badge">#1</span>
        <span class="rank-badge opacity-75">#2</span>
        <span class="rank-badge opacity-50">#3</span>
      </div>
      <span class="legend-label">Top interests by affinity</span>
    </div>
    <div class="legend-divider" />
    <div class="legend-group">
      <div class="strength-bar-sample" />
      <span class="legend-label">Affinity strength</span>
    </div>
    <div class="legend-divider" />
    <div class="legend-group">
      <div class="conf-dots">
        <span class="conf-dot filled" />
        <span class="conf-dot filled" />
        <span class="conf-dot" />
      </div>
      <span class="legend-label">Confidence level</span>
    </div>
    <div class="legend-divider" />
    <div class="legend-group sources">
      <span class="source-badge survey">survey</span>
      <span class="source-badge stated">stated</span>
      <span class="legend-label">Interest source (no badge = from activity)</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.interests-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(13, 115, 119, 0.06);
  border-radius: var(--radius-md, 0.625rem);
  margin-bottom: 1.25rem;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: flex-start;
  }
}

.legend-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rank-badges {
  display: flex;
  gap: 0.25rem;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem 0.375rem;
  background: rgba(13, 115, 119, 0.1);
  border-radius: var(--radius-sm, 0.375rem);
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--accent-teal, #0d7377);

  &.opacity-75 {
    opacity: 0.75;
  }

  &.opacity-50 {
    opacity: 0.5;
  }
}

.strength-bar-sample {
  width: 2.5rem;
  height: 0.3125rem;
  background: var(--bg-subtle, #f5f5f3);
  border-radius: var(--radius-full, 9999px);
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 70%;
    height: 100%;
    background: linear-gradient(
      90deg,
      var(--accent-teal, #0d7377),
      var(--accent-teal-light, #14919b)
    );
    border-radius: var(--radius-full, 9999px);
  }
}

.conf-dots {
  display: flex;
  gap: 0.1875rem;
}

.conf-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: rgba(13, 115, 119, 0.2);

  &.filled {
    background: var(--accent-teal, #0d7377);
  }
}

.legend-label {
  font-size: 0.75rem;
  color: var(--text-muted, #8c8c8c);
}

.legend-divider {
  width: 0.0625rem;
  height: 1.25rem;
  background: var(--bg-muted, #edede9);

  @media (max-width: 700px) {
    display: none;
  }
}

.source-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full, 9999px);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: lowercase;

  &.survey {
    background: #d1fae5;
    color: var(--success, #2d6a4f);
  }

  &.stated {
    background: #ede9fe;
    color: #7c3aed;
  }
}
</style>
