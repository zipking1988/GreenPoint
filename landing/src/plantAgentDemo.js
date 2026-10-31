// A deterministic concept. No model or sensor inference occurs here.
export const SCENARIOS = [
  { value: 'dry', label: 'Imagine the soil feels dry' },
  { value: 'damp', label: 'Imagine the soil feels damp' },
  { value: 'unknown', label: 'Leave the soil unchecked' },
];

export function requestForScenario(scenario) {
  if (scenario === 'dry') return { title: 'Thanks. That gives us more context.', body: 'You chose dry soil. Could you check my usual care routine and growing conditions before deciding what to do next?', status: 'Follow-up requested', pending: true };
  if (scenario === 'damp') return { title: 'There’s more to check than water.', body: 'You chose damp soil. Could you take a closer look at my leaves and drainage? A photo alone cannot tell us why a plant looks different.', status: 'Follow-up requested', pending: true };
  return { title: 'Could you check my soil?', body: 'A photo can show my leaves. It cannot tell us how moist my soil is. Could you check before we decide what care makes sense?', status: scenario === 'unknown' ? 'Still waiting for an observation' : 'A request for human care', pending: true };
}

export function scenarioEvent(scenario, number, at) {
  const choice = SCENARIOS.find(item => item.value === scenario);
  if (!choice) throw new Error('Choose a soil-check scenario.');
  return { id: `scenario-${number}`, at, type: 'scenario_selected', source: 'visitor_selected_simulation', soil_scenario: scenario, label: choice.label };
}

export function journalExport(demo, exportedAt) {
  return {
    schema_version: 'greenpoint.plant-agent-concept.v1', session_id: demo.id,
    mode: 'scripted_illustrative_concept',
    plant: { id: 'milo-tomato-example', name: 'Milo', species_context: 'Tomato', identity_source: 'authored_example_not_tracking' },
    image: { source: 'ai_generated_illustration', path: '/assets/plant-agent-milo.webp' },
    request: requestForScenario(demo.events.at(-1)?.soil_scenario), events: demo.events,
    total_scenarios_recorded: demo.total, retained_events: demo.events.length, events_retention_limit: 30,
    model_called: false, sensor_readings: false, treatment_authorized: false, exported_at: exportedAt,
  };
}
