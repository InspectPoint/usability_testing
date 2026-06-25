// data.jsx — seed component data for the IP Test Building Components tab.
// Roles: 'group' (condensed high-level item) | 'individual' (leaf device).
// Children point at a parent group via parentId.

const SEED_SYSTEMS = [
  { id: 'sys-fa',  name: 'Fire Alarm', type: 'System' },
  { id: 'sys-wet', name: 'Wet 1',      type: 'System' },
  { id: 'sys-dry', name: 'Dry',        type: 'System' },
  { id: 'sys-stand', name: 'Standpipe', type: 'System' },
  { id: 'sys-pump',  name: 'Fire Pump', type: 'System' },
  { id: 'sys-hood',  name: 'Kitchen Hood', type: 'System' },
];

const SEED_COMPONENTS = [
  // ── Fire Alarm ──────────────────────────────────────────────────────────
  { id:'c-alarmgrp', system:'sys-fa', parentId:null, role:'group',
    name:'Alarm 2 Devices', type:'Alarm Group', location:'Panel Room',
    description:'', barcode:'', externalId:'', notes:'' },
  { id:'c-cm9',  system:'sys-fa', parentId:'c-alarmgrp', role:'individual',
    name:'alarm 2 - Control Module 9', type:'Alarm Device', location:'Panel Room', status:'passed' },
  { id:'c-vsc',  system:'sys-fa', parentId:'c-alarmgrp', role:'individual',
    name:'alarm 2 - VSC', type:'Alarm Device', location:'Panel Room', status:'passed' },
  { id:'c-vsc12',system:'sys-fa', parentId:'c-alarmgrp', role:'individual',
    name:'alarm 2 - VSC-12', type:'Alarm Device', location:'Stairwell B', status:'deficient' },
  { id:'c-vsct12',system:'sys-fa', parentId:'c-alarmgrp', role:'individual',
    name:'alarm 2 - VSC-t12', type:'Alarm Device', location:'Stairwell B', status:'passed' },
  { id:'c-facp', system:'sys-fa', parentId:null, role:'individual',
    name:'FACP Main Panel', type:'Control Panel', location:'Electrical Rm', status:'passed',
    barcode:'FA-0001', specs:{ manufacturer:'Notifier', model:'NFS2-3030', panelType:'Addressable', zones:'12', battery:'Sealed lead-acid' } },

  // ── Wet 1 ───────────────────────────────────────────────────────────────
  { id:'c-kitchen', system:'sys-wet', parentId:null, role:'group',
    name:'Kitchen Heads', type:'Sprinkler Head Group', location:'Kitchen',
    specs:{ sprinklerType:'Pendent', response:'Quick response', tempRating:'High (250–300°F)', kFactor:'5.6', manufacturer:'Tyco' } },
  { id:'c-k1', system:'sys-wet', parentId:'c-kitchen', role:'individual',
    name:'Pendent Head K-1', type:'Sprinkler Head', location:'Kitchen — Cookline', status:'passed',
    specs:{ sprinklerType:'Pendent', response:'Quick response', tempRating:'High (250–300°F)', kFactor:'5.6' } },
  { id:'c-k2', system:'sys-wet', parentId:'c-kitchen', role:'individual',
    name:'Pendent Head K-2', type:'Sprinkler Head', location:'Kitchen — Dish area', status:'passed',
    specs:{ sprinklerType:'Pendent', response:'Quick response', tempRating:'High (250–300°F)', kFactor:'5.6' } },
  { id:'c-k3', system:'sys-wet', parentId:'c-kitchen', role:'individual',
    name:'Pendent Head K-3', type:'Sprinkler Head', location:'Kitchen — Prep', status:'passed',
    specs:{ sprinklerType:'Pendent', response:'Quick response', tempRating:'High (250–300°F)', kFactor:'5.6' } },
  { id:'c-k4', system:'sys-wet', parentId:'c-kitchen', role:'individual',
    name:'Concealed Head K-4', type:'Sprinkler Head', location:'Kitchen — Server station', status:'deficient',
    specs:{ sprinklerType:'Concealed', response:'Quick response', tempRating:'Ordinary (135–170°F)', kFactor:'5.6' } },
  { id:'c-k5', system:'sys-wet', parentId:'c-kitchen', role:'individual',
    name:'Pendent Head K-5', type:'Sprinkler Head', location:'Kitchen — Walk-in entry', status:'untested',
    specs:{ sprinklerType:'Pendent', response:'Standard response', tempRating:'Ordinary (135–170°F)', kFactor:'5.6' } },
  { id:'c-k6', system:'sys-wet', parentId:'c-kitchen', role:'individual', name:'Pendent Head K-6', type:'Sprinkler Head', location:'Kitchen — Pass line', status:'passed' },
  { id:'c-k7', system:'sys-wet', parentId:'c-kitchen', role:'individual', name:'Pendent Head K-7', type:'Sprinkler Head', location:'Kitchen — Pantry', status:'passed' },
  { id:'c-k8', system:'sys-wet', parentId:'c-kitchen', role:'individual', name:'Concealed Head K-8', type:'Sprinkler Head', location:'Kitchen — Office', status:'deficient' },
  { id:'c-k9', system:'sys-wet', parentId:'c-kitchen', role:'individual', name:'Pendent Head K-9', type:'Sprinkler Head', location:'Kitchen — Mop sink', status:'passed' },
  { id:'c-k10', system:'sys-wet', parentId:'c-kitchen', role:'individual', name:'Sidewall Head K-10', type:'Sprinkler Head', location:'Kitchen — Entry vestibule', status:'untested' },

  { id:'c-storage', system:'sys-wet', parentId:null, role:'group',
    name:'Storage Room Heads', type:'Sprinkler Head Group', location:'Storage' },
  { id:'c-s1', system:'sys-wet', parentId:'c-storage', role:'individual',
    name:'Upright Head S-1', type:'Sprinkler Head', location:'Storage', status:'passed' },
  { id:'c-s2', system:'sys-wet', parentId:'c-storage', role:'individual',
    name:'Upright Head S-2', type:'Sprinkler Head', location:'Storage', status:'passed' },
  { id:'c-s3', system:'sys-wet', parentId:'c-storage', role:'individual',
    name:'Upright Head S-3', type:'Sprinkler Head', location:'Storage', status:'deficient' },
  { id:'c-s4', system:'sys-wet', parentId:'c-storage', role:'individual',
    name:'Upright Head S-4', type:'Sprinkler Head', location:'Storage — Mezzanine', status:'passed' },
  { id:'c-s5', system:'sys-wet', parentId:'c-storage', role:'individual',
    name:'Upright Head S-5', type:'Sprinkler Head', location:'Storage — Rack aisle', status:'passed' },
  { id:'c-s6', system:'sys-wet', parentId:'c-storage', role:'individual',
    name:'Upright Head S-6', type:'Sprinkler Head', location:'Storage — Loading', status:'untested' },
  { id:'c-s7', system:'sys-wet', parentId:'c-storage', role:'individual', name:'Upright Head S-7', type:'Sprinkler Head', location:'Storage — Rack aisle 2', status:'passed' },
  { id:'c-s8', system:'sys-wet', parentId:'c-storage', role:'individual', name:'Upright Head S-8', type:'Sprinkler Head', location:'Storage — Rack aisle 3', status:'passed' },
  { id:'c-s9', system:'sys-wet', parentId:'c-storage', role:'individual', name:'Upright Head S-9', type:'Sprinkler Head', location:'Storage — Cold room', status:'deficient' },
  { id:'c-s10', system:'sys-wet', parentId:'c-storage', role:'individual', name:'Upright Head S-10', type:'Sprinkler Head', location:'Storage — Bulk area', status:'passed' },
  { id:'c-s11', system:'sys-wet', parentId:'c-storage', role:'individual', name:'Upright Head S-11', type:'Sprinkler Head', location:'Storage — Returns', status:'passed' },
  { id:'c-s12', system:'sys-wet', parentId:'c-storage', role:'individual', name:'Dry Pendent S-12', type:'Sprinkler Head', location:'Storage — Dock', status:'untested' },

  { id:'c-riser', system:'sys-wet', parentId:null, role:'individual',
    name:'Riser 1 Control Valve', type:'Control Valve', location:'Mech Room', status:'passed' },
  // Single component with a mix of sub-component types → rollup reads "N components"
  { id:'c-riser-tamper', system:'sys-wet', parentId:'c-riser', role:'individual',
    name:'Riser 1 Tamper Switch', type:'Alarm Device', location:'Mech Room', status:'passed' },
  { id:'c-riser-gauge', system:'sys-wet', parentId:'c-riser', role:'individual',
    name:'Riser 1 Pressure Gauge', type:'Control Valve', location:'Mech Room', status:'untested' },
  { id:'c-riser-drain', system:'sys-wet', parentId:'c-riser', role:'individual',
    name:'Riser 1 Main Drain', type:'Control Valve', location:'Mech Room', status:'passed' },
  { id:'c-backflow', system:'sys-wet', parentId:null, role:'individual',
    name:'Backflow Preventer', type:'Backflow', location:'Mech Room', status:'deficient' },

  // ── Dry ─────────────────────────────────────────────────────────────────
  { id:'c-basement', system:'sys-dry', parentId:null, role:'group',
    name:'Basement Heads', type:'Sprinkler Head Group', location:'East Hall a' },
  { id:'c-b1', system:'sys-dry', parentId:'c-basement', role:'individual',
    name:'Dry Pendent B-1', type:'Sprinkler Head', location:'East Hall a', status:'passed' },
  { id:'c-b2', system:'sys-dry', parentId:'c-basement', role:'individual',
    name:'Dry Pendent B-2', type:'Sprinkler Head', location:'East Hall a', status:'untested' },
  { id:'c-b3', system:'sys-dry', parentId:'c-basement', role:'individual',
    name:'Dry Pendent B-3', type:'Sprinkler Head', location:'West Hall', status:'passed' },
  { id:'c-b4', system:'sys-dry', parentId:'c-basement', role:'individual',
    name:'Dry Upright B-4', type:'Sprinkler Head', location:'Parking ramp', status:'passed' },

  { id:'c-compressor', system:'sys-dry', parentId:null, role:'individual',
    name:'Air Compressor', type:'Compressor', location:'Mech Room', status:'passed' },

  // ── Fire Alarm — more ─────────────────────────────────────────────────────
  { id:'c-pull1', system:'sys-fa', parentId:null, role:'individual', name:'Pull Station — Lobby', type:'Alarm Device', location:'Lobby', status:'passed' },
  { id:'c-pull2', system:'sys-fa', parentId:null, role:'individual', name:'Pull Station — Exit B', type:'Alarm Device', location:'Exit B', status:'deficient' },
  { id:'c-smoke', system:'sys-fa', parentId:null, role:'group', name:'Smoke Detectors', type:'Alarm Group', location:'All floors' },
  { id:'c-sd1', system:'sys-fa', parentId:'c-smoke', role:'individual', name:'SD-101', type:'Alarm Device', location:'Floor 1', status:'passed' },
  { id:'c-sd2', system:'sys-fa', parentId:'c-smoke', role:'individual', name:'SD-201', type:'Alarm Device', location:'Floor 2', status:'passed' },
  { id:'c-sd3', system:'sys-fa', parentId:'c-smoke', role:'individual', name:'SD-301', type:'Alarm Device', location:'Floor 3', status:'untested' },
  { id:'c-sd4', system:'sys-fa', parentId:'c-smoke', role:'individual', name:'SD-102', type:'Alarm Device', location:'Floor 1 — Corridor', status:'passed' },
  { id:'c-sd5', system:'sys-fa', parentId:'c-smoke', role:'individual', name:'SD-202', type:'Alarm Device', location:'Floor 2 — Lobby', status:'passed' },
  { id:'c-sd6', system:'sys-fa', parentId:'c-smoke', role:'individual', name:'SD-401', type:'Alarm Device', location:'Floor 4', status:'deficient' },
  { id:'c-sd7', system:'sys-fa', parentId:'c-smoke', role:'individual', name:'SD-Mech', type:'Alarm Device', location:'Mech Room', status:'passed' },

  // Deep notification-appliance hierarchy (4 nested levels → showcases sticky stacking)
  { id:'c-na', system:'sys-fa', parentId:null, role:'group',
    name:'Notification Appliances', type:'Alarm Group', location:'All floors' },
  { id:'c-na-a', system:'sys-fa', parentId:'c-na', role:'group',
    name:'Building A NACs', type:'Alarm Group', location:'Building A' },
  { id:'c-na-a-f3', system:'sys-fa', parentId:'c-na-a', role:'group',
    name:'Floor 3 Circuit', type:'Alarm Group', location:'Floor 3' },
  { id:'c-hs301', system:'sys-fa', parentId:'c-na-a-f3', role:'individual', name:'Horn/Strobe HS-301', type:'Alarm Device', location:'Floor 3 — East', status:'passed' },
  { id:'c-hs302', system:'sys-fa', parentId:'c-na-a-f3', role:'individual', name:'Horn/Strobe HS-302', type:'Alarm Device', location:'Floor 3 — West', status:'passed' },
  { id:'c-hs303', system:'sys-fa', parentId:'c-na-a-f3', role:'individual', name:'Horn/Strobe HS-303', type:'Alarm Device', location:'Floor 3 — Core', status:'deficient' },
  { id:'c-na-a-f2', system:'sys-fa', parentId:'c-na-a', role:'group',
    name:'Floor 2 Circuit', type:'Alarm Group', location:'Floor 2' },
  { id:'c-hs201', system:'sys-fa', parentId:'c-na-a-f2', role:'individual', name:'Horn/Strobe HS-201', type:'Alarm Device', location:'Floor 2 — East', status:'passed' },
  { id:'c-hs202', system:'sys-fa', parentId:'c-na-a-f2', role:'individual', name:'Horn/Strobe HS-202', type:'Alarm Device', location:'Floor 2 — West', status:'passed' },
  { id:'c-na-b', system:'sys-fa', parentId:'c-na', role:'group',
    name:'Building B NACs', type:'Alarm Group', location:'Building B' },
  { id:'c-hs-b1', system:'sys-fa', parentId:'c-na-b', role:'individual', name:'Horn/Strobe HS-B1', type:'Alarm Device', location:'Building B — Lobby', status:'passed' },
  { id:'c-hs-b2', system:'sys-fa', parentId:'c-na-b', role:'individual', name:'Horn/Strobe HS-B2', type:'Alarm Device', location:'Building B — Corridor', status:'untested' },

  // ── Wet 1 — more ──────────────────────────────────────────────────────────
  { id:'c-office', system:'sys-wet', parentId:null, role:'group', name:'Office Heads', type:'Sprinkler Head Group', location:'Floor 2' },
  { id:'c-o1', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-1', type:'Sprinkler Head', location:'Office 201', status:'passed' },
  { id:'c-o2', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-2', type:'Sprinkler Head', location:'Office 202', status:'passed' },
  { id:'c-o3', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-3', type:'Sprinkler Head', location:'Office 203', status:'deficient' },
  { id:'c-o4', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-4', type:'Sprinkler Head', location:'Office 204', status:'passed' },
  { id:'c-o5', system:'sys-wet', parentId:'c-office', role:'individual', name:'Concealed O-5', type:'Sprinkler Head', location:'Conference Rm', status:'passed' },
  { id:'c-o6', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-6', type:'Sprinkler Head', location:'Open office', status:'untested' },
  { id:'c-o7', system:'sys-wet', parentId:'c-office', role:'individual', name:'Sidewall O-7', type:'Sprinkler Head', location:'Corridor 2N', status:'passed' },
  { id:'c-o8', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-8', type:'Sprinkler Head', location:'Office 205', status:'passed' },
  { id:'c-o9', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-9', type:'Sprinkler Head', location:'Office 206', status:'deficient' },
  { id:'c-o10', system:'sys-wet', parentId:'c-office', role:'individual', name:'Concealed O-10', type:'Sprinkler Head', location:'Break room', status:'passed' },
  { id:'c-o11', system:'sys-wet', parentId:'c-office', role:'individual', name:'Pendent O-11', type:'Sprinkler Head', location:'Copy room', status:'passed' },
  { id:'c-o12', system:'sys-wet', parentId:'c-office', role:'individual', name:'Sidewall O-12', type:'Sprinkler Head', location:'Corridor 2S', status:'untested' },
  { id:'c-fdc', system:'sys-wet', parentId:null, role:'individual', name:'FDC — North', type:'Backflow', location:'Exterior N', status:'passed' },
  { id:'c-gauge', system:'sys-wet', parentId:null, role:'individual', name:'Riser 1 Gauge', type:'Control Valve', location:'Mech Room', status:'untested' },

  // ── Standpipe ─────────────────────────────────────────────────────────────
  { id:'c-sp-riser', system:'sys-stand', parentId:null, role:'group', name:'Standpipe Risers', type:'Standpipe', location:'Stairwells' },
  { id:'c-sp1', system:'sys-stand', parentId:'c-sp-riser', role:'individual', name:'Riser SP-A', type:'Standpipe', location:'Stairwell A', status:'passed' },
  { id:'c-sp2', system:'sys-stand', parentId:'c-sp-riser', role:'individual', name:'Riser SP-B', type:'Standpipe', location:'Stairwell B', status:'passed' },
  { id:'c-sp3', system:'sys-stand', parentId:'c-sp-riser', role:'individual', name:'Riser SP-C', type:'Standpipe', location:'Stairwell C', status:'untested' },
  { id:'c-hose1', system:'sys-stand', parentId:null, role:'individual', name:'Hose Valve — 2F', type:'Control Valve', location:'Floor 2', status:'deficient' },
  { id:'c-hose2', system:'sys-stand', parentId:null, role:'individual', name:'Hose Valve — 3F', type:'Control Valve', location:'Floor 3', status:'passed' },

  // ── Fire Pump ─────────────────────────────────────────────────────────────
  { id:'c-pump-main', system:'sys-pump', parentId:null, role:'individual', name:'Electric Fire Pump', type:'Compressor', location:'Pump Room', status:'passed' },
  // Single component carrying mixed sub-component types
  { id:'c-pump-controller', system:'sys-pump', parentId:'c-pump-main', role:'individual', name:'Pump Controller', type:'Control Panel', location:'Pump Room', status:'passed' },
  { id:'c-pump-relief', system:'sys-pump', parentId:'c-pump-main', role:'individual', name:'Main Relief Valve', type:'Control Valve', location:'Pump Room', status:'deficient' },
  { id:'c-pump-flow', system:'sys-pump', parentId:'c-pump-main', role:'individual', name:'Flow Meter', type:'Control Valve', location:'Pump Room', status:'untested' },
  { id:'c-jockey', system:'sys-pump', parentId:null, role:'individual', name:'Jockey Pump', type:'Compressor', location:'Pump Room', status:'passed' },
  { id:'c-pump-gauges', system:'sys-pump', parentId:null, role:'group', name:'Pump Gauges', type:'Control Valve', location:'Pump Room' },
  { id:'c-pg1', system:'sys-pump', parentId:'c-pump-gauges', role:'individual', name:'Suction Gauge', type:'Control Valve', location:'Pump Room', status:'untested' },
  { id:'c-pg2', system:'sys-pump', parentId:'c-pump-gauges', role:'individual', name:'Discharge Gauge', type:'Control Valve', location:'Pump Room', status:'passed' },
  { id:'c-pg3', system:'sys-pump', parentId:'c-pump-gauges', role:'individual', name:'System Pressure Gauge', type:'Control Valve', location:'Pump Room', status:'passed' },

  // ── Kitchen Hood ──────────────────────────────────────────────────────────
  { id:'c-hood-noz', system:'sys-hood', parentId:null, role:'group', name:'Hood Nozzles', type:'Hood', location:'Kitchen' },
  { id:'c-hn1', system:'sys-hood', parentId:'c-hood-noz', role:'individual', name:'Nozzle H-1', type:'Hood', location:'Cookline', status:'passed' },
  { id:'c-hn2', system:'sys-hood', parentId:'c-hood-noz', role:'individual', name:'Nozzle H-2', type:'Hood', location:'Cookline', status:'deficient' },
  { id:'c-hn3', system:'sys-hood', parentId:'c-hood-noz', role:'individual', name:'Nozzle H-3', type:'Hood', location:'Fryer', status:'passed' },
  { id:'c-hn4', system:'sys-hood', parentId:'c-hood-noz', role:'individual', name:'Nozzle H-4', type:'Hood', location:'Griddle', status:'passed' },
  { id:'c-hn5', system:'sys-hood', parentId:'c-hood-noz', role:'individual', name:'Duct Nozzle H-5', type:'Hood', location:'Exhaust duct', status:'untested' },
  { id:'c-hood-pull', system:'sys-hood', parentId:null, role:'individual', name:'Manual Pull — Hood', type:'Alarm Device', location:'Kitchen exit', status:'passed' },
];

const COMPONENT_TYPES = [
  'Alarm Device', 'Alarm Group', 'Control Panel', 'Sprinkler Head',
  'Sprinkler Head Group', 'Control Valve', 'Backflow', 'Compressor',
  'Standpipe', 'Hydrant', 'Extinguisher', 'Hood',
];

// ── Component-specific questions ──────────────────────────────────────────
// These are the type-specific attributes configured when a component is
// created. They render below the standard fields in the component modal.
// kind: 'text' | 'multiline' | 'select' (options[])
const SPRINKLER_SPECS = [
  { key:'sprinklerType', label:'Sprinkler type', kind:'select', options:['Pendent','Upright','Sidewall','Concealed','Dry pendent'] },
  { key:'response',      label:'Response type', kind:'select', options:['Quick response','Standard response'] },
  { key:'tempRating',    label:'Temperature rating', kind:'select', options:['Ordinary (135–170°F)','Intermediate (175–225°F)','High (250–300°F)'] },
  { key:'kFactor',       label:'K-factor', kind:'text' },
  { key:'manufacturer',  label:'Manufacturer', kind:'text' },
  { key:'yearMfg',       label:'Year of manufacture', kind:'text' },
];
const ALARM_SPECS = [
  { key:'deviceType',  label:'Device type', kind:'select', options:['Smoke detector','Heat detector','Pull station','Horn/strobe','Control module','Monitor module'] },
  { key:'signaling',   label:'Signaling', kind:'select', options:['Addressable','Conventional'] },
  { key:'zone',        label:'Zone', kind:'text' },
  { key:'address',     label:'Device address', kind:'text' },
  { key:'mounting',    label:'Mounting height', kind:'text' },
];
const COMPONENT_SPECS = {
  'Sprinkler Head': SPRINKLER_SPECS,
  'Sprinkler Head Group': SPRINKLER_SPECS,
  'Alarm Device': ALARM_SPECS,
  'Alarm Group': ALARM_SPECS,
  'Control Panel': [
    { key:'manufacturer', label:'Manufacturer', kind:'text' },
    { key:'model',        label:'Model', kind:'text' },
    { key:'panelType',    label:'Panel type', kind:'select', options:['Addressable','Conventional'] },
    { key:'zones',        label:'Number of zones', kind:'text' },
    { key:'battery',      label:'Battery type', kind:'select', options:['Sealed lead-acid','NiCad'] },
  ],
  'Control Valve': [
    { key:'valveType', label:'Valve type', kind:'select', options:['OS&Y','Butterfly','Ball','PIV (post-indicator)'] },
    { key:'size',      label:'Size', kind:'select', options:['1"','1½"','2"','4"','6"','8"'] },
    { key:'position',  label:'Normal position', kind:'select', options:['Open','Closed'] },
    { key:'supervised',label:'Supervised', kind:'select', options:['Yes','No'] },
  ],
  'Backflow': [
    { key:'assembly',     label:'Assembly type', kind:'select', options:['Double check','Reduced pressure','Pressure vacuum breaker'] },
    { key:'size',         label:'Size', kind:'text' },
    { key:'manufacturer', label:'Manufacturer', kind:'text' },
    { key:'serial',       label:'Serial number', kind:'text' },
  ],
  'Compressor': [
    { key:'driveType',  label:'Drive type', kind:'select', options:['Electric','Diesel','Air maintenance device'] },
    { key:'horsepower', label:'Horsepower', kind:'text' },
    { key:'cutIn',      label:'Cut-in pressure', kind:'text' },
    { key:'cutOut',     label:'Cut-out pressure', kind:'text' },
  ],
  'Standpipe': [
    { key:'class',     label:'Standpipe class', kind:'select', options:['Class I','Class II','Class III'] },
    { key:'riserType', label:'Riser type', kind:'select', options:['Wet','Dry'] },
    { key:'size',      label:'Riser size', kind:'text' },
  ],
  'Hood': [
    { key:'nozzleType', label:'Nozzle type', kind:'select', options:['Appliance-specific','Duct','Plenum'] },
    { key:'agent',      label:'Agent type', kind:'select', options:['Wet chemical','Dry chemical'] },
    { key:'coverage',   label:'Coverage area', kind:'text' },
  ],
  'Hydrant': [
    { key:'hydrantType', label:'Hydrant type', kind:'select', options:['Wet barrel','Dry barrel'] },
    { key:'outlets',     label:'Number of outlets', kind:'text' },
    { key:'flowGpm',     label:'Flow rate (GPM)', kind:'text' },
  ],
  'Extinguisher': [
    { key:'agentClass', label:'Agent class', kind:'select', options:['ABC dry chemical','CO₂','Water','Wet chemical (K)','Clean agent'] },
    { key:'size',       label:'Size', kind:'text' },
    { key:'lastHydro',  label:'Last hydrostatic test', kind:'text' },
  ],
};
const specsFor = (type) => COMPONENT_SPECS[type] || [];

window.COMPONENT_SPECS = COMPONENT_SPECS;
// Merge any component types created in Settings → Component Setup (persisted to
// localStorage) so they show up in the building's "add component" Type dropdown.
try {
  const custom = JSON.parse(localStorage.getItem('ip_custom_types') || '[]');
  custom.forEach(n => { if (n && !COMPONENT_TYPES.includes(n)) COMPONENT_TYPES.push(n); });
} catch (e) {}
window.COMPONENT_TYPES = COMPONENT_TYPES;
window.specsFor = specsFor;
// Feature flag — status UI (status tags, health-bar rollup, modal Status field)
// is built but hidden for now. Flip to true to bring it all back.
window.SHOW_STATUS = false;

// ── v3 "bulk group" model ──────────────────────────────────────────────────
// When window.__GROUP_MODEL === 'bulk', a group is no longer a container that
// enumerates its devices. Every group collapses to a single bulk row carrying a
// `quantity` (the count of individual devices it stood for) and its member
// records are dropped. Individuals that are NOT inside a group keep their own
// sub-components, so a plain component still becomes an accordion only when it
// actually has children. Gated, so the v2 (children-list) pages are unaffected.
function toBulkGroups(comps) {
  const byId = Object.fromEntries(comps.map(c => [c.id, c]));
  const childrenOf = (id) => comps.filter(c => c.parentId === id);
  const leafCount = (id) => childrenOf(id).reduce((n, c) => n + (c.role === 'group' ? leafCount(c.id) : 1), 0);
  const hasGroupAncestor = (c) => {
    let cur = byId[c.parentId];
    while (cur) { if (cur.role === 'group') return true; cur = byId[cur.parentId]; }
    return false;
  };
  const out = [];
  comps.forEach(c => {
    if (hasGroupAncestor(c)) return;                       // absorbed into a group's quantity
    out.push(c.role === 'group' ? { ...c, quantity: leafCount(c.id) } : c);
  });
  return out;
}

window.SEED_SYSTEMS = SEED_SYSTEMS;
window.SEED_COMPONENTS = (window.__GROUP_MODEL === 'bulk') ? toBulkGroups(SEED_COMPONENTS) : SEED_COMPONENTS;
