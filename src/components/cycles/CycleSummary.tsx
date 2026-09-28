import {
  confidenceLabel,
  evidenceSummary,
  formatRange,
  ovulationLabel,
  phaseLabel,
  predictionRanges,
  type CycleOverview,
} from '@/src/lib/cycles/presentation';

export function CycleSummary({ data, today }: { data: CycleOverview; today: string }) {
  const { state } = data;
  const ranges = predictionRanges(data);
  const evidence = evidenceSummary(data, today);
  return (
    <section className="panel cycle-summary" aria-labelledby="cycle-now">
      <div className="cycle-summary-top">
        <div>
          <p className="eyebrow">RIGHT NOW</p>
          <p className="cycle-day">
            {state.cycleDay ? `Cycle day ${state.cycleDay}` : 'Getting to know your cycle'}
          </p>
          <h2 id="cycle-now">{phaseLabel(state)}</h2>
          <p className="muted">
            {ovulationLabel(state)}
            {state.ovulationStatus === 'likely' ? ' · not confirmed' : ''}
          </p>
        </div>
        <span className="cycle-confidence">
          Confidence: {confidenceLabel(state.phaseConfidence)}
        </span>
      </div>
      <div className="cycle-predictions">
        {(
          [
            ['Next period', ranges.period, 'Estimated start'],
            ['Fertile window', ranges.fertile, 'Prediction'],
            [
              state.ovulationStatus === 'likely'
                ? 'Likely ovulation'
                : state.ovulationStatus === 'confirmed'
                  ? 'Confirmed ovulation'
                  : 'Estimated ovulation',
              ranges.ovulation,
              state.ovulationStatus === 'likely'
                ? 'Based on recorded signals'
                : state.ovulationStatus === 'confirmed'
                  ? 'Confirmed'
                  : 'Prediction',
            ],
          ] as const
        ).map(([title, range, label]) => (
          <div key={title}>
            <span className="cycle-small-label">{title}</span>
            <strong>{formatRange(range)}</strong>
            <small>
              {range &&
              range.end < today &&
              label !== 'Based on recorded signals' &&
              label !== 'Confirmed'
                ? 'Earlier estimate · timing now uncertain'
                : label}
            </small>
          </div>
        ))}
      </div>
      <details className="cycle-explanation">
        <summary>Why this estimate?</summary>
        <div>
          <p>Based on:</p>
          <ul>
            {evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            Current phase confidence: <strong>{confidenceLabel(state.phaseConfidence)}</strong>.
            Ovulation confidence: <strong>{confidenceLabel(state.ovulationConfidence)}</strong>.
          </p>
          <p className="muted">
            {data.profile?.irregularCycles
              ? 'Cycle lengths vary, so predictions cover a wider range. '
              : ''}
            Estimates can change as you log. A predicted date passing does not confirm ovulation.
          </p>
        </div>
      </details>
    </section>
  );
}
