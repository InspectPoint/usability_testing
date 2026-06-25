// setup-data.jsx — seed data for Settings → Component setup.
// Drives: Component Types list, the unified type-config page (path fork, attach-to,
// templates, compatibilities, inline questions, defaults), and the Questions library.
//
// Everything here is prototype seed. Net-new capabilities (default quantity +
// auto-include) are tagged so the annotation layer can point at them.

// ── System types (a component on the System path belongs to one of these) ──
const SETUP_SYSTEMS = [
  { id:'sys-wet',   name:'Wet sprinkler',   icon:'fa-droplet',          blurb:'Wet-pipe sprinkler system, water-filled at all times.' },
  { id:'sys-dry',   name:'Dry sprinkler',   icon:'fa-snowflake',        blurb:'Dry-pipe system charged with air; water held back by a valve.' },
  { id:'sys-fa',    name:'Fire alarm',      icon:'fa-bells',            blurb:'Detection, notification, and control devices.' },
  { id:'sys-stand', name:'Standpipe',       icon:'fa-arrows-up-to-line',blurb:'Hose connections and risers for manual firefighting.' },
  { id:'sys-pump',  name:'Fire pump',       icon:'fa-gauge-high',       blurb:'Pumps that boost water pressure for the system.' },
  { id:'sys-hood',  name:'Kitchen hood',    icon:'fa-fire-burner',      blurb:'Wet-chemical suppression over cooking appliances.' },
  { id:'sys-clean', name:'Clean agent',     icon:'fa-wind',             blurb:'Gaseous suppression for server rooms and sensitive spaces.' },
];

// ── Non-system "attach to" targets — grouped, plain-language, noise hidden ──
// The legacy picker dumped 10 raw model names. We group + describe the common
// ones and tuck three rarely-used types behind "Show more types".
const ATTACH_GROUPS = [
  {
    id:'structure', label:'Building & location',
    blurb:'Things that live on the property itself, not inside a fire system.',
    options:[
      { id:'building', name:'Building',  model:'Building',  blurb:'Attached to the building as a whole.' },
      { id:'asset',    name:'Asset / equipment', model:'Asset', blurb:'A tracked piece of equipment (e.g. a generator).' },
    ],
  },
  {
    id:'power', label:'Panels & power',
    blurb:'Control and power equipment that other devices report to.',
    options:[
      { id:'controlpanel', name:'Control panel', model:'ControlPanel', blurb:'A panel that supervises devices and circuits.' },
      { id:'aps',          name:'Additional power supply', model:'AdditionalPowerSupply', blurb:'Booster power for notification circuits.' },
    ],
  },
  {
    id:'storage', label:'Cylinders & storage',
    blurb:'Pressurized containers holding suppression agent.',
    options:[
      { id:'cylinder', name:'Cylinder', model:'Cylinder', blurb:'Agent or gas cylinder for a suppression system.' },
    ],
  },
];
// hidden by default — surfaced via "Show more types"
const ATTACH_MORE = [
  { id:'alarmdevice', name:'Alarm device', model:'AlarmDevice', blurb:'Rarely attached directly — usually nested in a system.' },
  { id:'exitsign',    name:'Fire exit sign', model:'FireExitSign', blurb:'Illuminated egress signage.' },
  { id:'alarmsystem', name:'Alarm system', model:'AlarmSystem', blurb:'Legacy container type; prefer the Fire alarm system path.' },
];

// ── Recommended component types (curated InspectPoint starters) ─────────────
// A "template" is NOT a separate object — it's just a pre-configured component
// type. These are full type records (same shape as SETUP_TYPES) used as starting
// points. Counts shown in the UI are derived from this data, never hardcoded.
const RECOMMENDED_TYPES = [
  { id:'rec-wet-head', name:'Wet sprinkler head', path:'system', system:'sys-wet', category:'Sprinkler',
    questionSet:'qs-sprinkler', compatible:['Sprinkler Head'], defaultQty:0, autoInclude:false, defaultSubs:{},
    customFields:[{label:'K-factor',kind:'Number'},{label:'Temperature rating',kind:'Single select'},{label:'Response type',kind:'Single select'},{label:'Coverage',kind:'Single select'},{label:'Finish',kind:'Text'},{label:'SIN',kind:'Text'}],
    blurb:'Standard pendent/upright head with NFPA 25 visual checks.' },
  { id:'rec-riser', name:'Riser / control valve', path:'system', system:'sys-wet', category:'Valve',
    questionSet:'qs-valve', compatible:['Control Valve','Alarm Device'], defaultQty:1, autoInclude:true, defaultSubs:{'Alarm Device':1},
    customFields:[{label:'Valve size',kind:'Single select'},{label:'Valve type',kind:'Single select'},{label:'Location',kind:'Text'},{label:'Supervised',kind:'Yes / No'}],
    blurb:'Control valve assembly with tamper, gauge, and drain sub-components.' },
  { id:'rec-facp', name:'Fire alarm control panel', path:'system', system:'sys-fa', category:'Alarm',
    questionSet:'qs-panel', compatible:['Alarm Device','Control Panel'], defaultQty:1, autoInclude:true, defaultSubs:{},
    customFields:[{label:'Manufacturer',kind:'Text'},{label:'Model',kind:'Text'},{label:'Battery type',kind:'Single select'},{label:'Zones',kind:'Number'},{label:'Install date',kind:'Date'}],
    blurb:'Addressable FACP with battery and zone questions.' },
  { id:'rec-smoke', name:'Smoke / heat detector', path:'system', system:'sys-fa', category:'Alarm',
    questionSet:'qs-alarm', compatible:[], defaultQty:0, autoInclude:false, defaultSubs:{},
    customFields:[{label:'Device type',kind:'Single select'},{label:'Address',kind:'Text'},{label:'Location',kind:'Text'},{label:'Sensitivity',kind:'Number'},{label:'Install date',kind:'Date'}],
    blurb:'Initiating device with sensitivity and location checks.' },
  { id:'rec-backflow', name:'Backflow preventer', path:'non-system', attach:'asset', category:'Backflow',
    questionSet:'qs-backflow', compatible:[], defaultQty:0, autoInclude:false, defaultSubs:{},
    customFields:[{label:'Assembly type',kind:'Single select'},{label:'Size',kind:'Single select'},{label:'Serial number',kind:'Text'},{label:'Location',kind:'Text'}],
    blurb:'Standalone assembly with annual certification fields.' },
  { id:'rec-ext', name:'Fire extinguisher', path:'non-system', attach:'building', category:'Extinguisher',
    questionSet:'qs-ext', compatible:[], defaultQty:0, autoInclude:false, defaultSubs:{},
    customFields:[{label:'Class',kind:'Single select'},{label:'Size',kind:'Single select'},{label:'Location',kind:'Text'}],
    blurb:'Portable extinguisher with monthly + annual checks.' },
];

// ── Reusable question sets (library + inline attach in step 6) ──────────────
const QUESTION_SETS = [
  { id:'qs-sprinkler', name:'Sprinkler head — NFPA 25 visual', code:'SPK-VIS', category:'Sprinkler',
    usedBy:4, updated:'May 2026',
    questions:[
      { q:'Is the sprinkler free of corrosion, paint, or loading?', type:'Pass / Fail / N/A' },
      { q:'Is the deflector intact and unobstructed?', type:'Pass / Fail / N/A' },
      { q:'Are there at least the required spare heads on site?', type:'Pass / Fail / N/A' },
      { q:'Is the head within its 50/75-year test/replacement window?', type:'Pass / Fail / N/A' },
      { q:'Escutcheon / cover plate present and seated?', type:'Pass / Fail / N/A' },
    ] },
  { id:'qs-valve', name:'Control valve assembly', code:'CV-STD', category:'Valve',
    usedBy:2, updated:'Apr 2026',
    questions:[
      { q:'Valve in correct (open/closed) position?', type:'Open / Closed' },
      { q:'Valve sealed, locked, or supervised?', type:'Pass / Fail / N/A' },
      { q:'Tamper switch signals at panel?', type:'Pass / Fail / N/A' },
      { q:'Main drain test — static pressure (psi)', type:'Number' },
      { q:'Main drain test — residual pressure (psi)', type:'Number' },
      { q:'Gauges reading within range and in calibration?', type:'Pass / Fail / N/A' },
    ] },
  { id:'qs-panel', name:'FACP — control panel', code:'FACP', category:'Alarm',
    usedBy:3, updated:'May 2026',
    questions:[
      { q:'AC power present, indicator lit?', type:'Pass / Fail / N/A' },
      { q:'Battery voltage under load (V)', type:'Number' },
      { q:'Trouble signals clear?', type:'Pass / Fail / N/A' },
      { q:'Ground fault check', type:'Pass / Fail / N/A' },
      { q:'All zones report normal?', type:'Pass / Fail / N/A' },
      { q:'Event history reviewed?', type:'Pass / Fail / N/A' },
      { q:'Panel firmware / config version', type:'Text' },
    ] },
  { id:'qs-alarm', name:'Initiating device', code:'ALM-INIT', category:'Alarm',
    usedBy:5, updated:'Mar 2026',
    questions:[
      { q:'Device actuates and reports correct address?', type:'Pass / Fail / N/A' },
      { q:'Sensitivity within manufacturer range?', type:'Pass / Fail / N/A' },
      { q:'Device clean and unobstructed?', type:'Pass / Fail / N/A' },
      { q:'Mounting secure?', type:'Pass / Fail / N/A' },
    ] },
  { id:'qs-backflow', name:'Backflow certification', code:'BF-CERT', category:'Backflow',
    usedBy:1, updated:'Feb 2026',
    questions:[
      { q:'Assembly relief valve operates correctly?', type:'Pass / Fail / N/A' },
      { q:'Check valve #1 tight?', type:'Pass / Fail / N/A' },
      { q:'Check valve #2 tight?', type:'Pass / Fail / N/A' },
      { q:'Certification date', type:'Date' },
      { q:'Certifying tester name', type:'Text' },
    ] },
  { id:'qs-ext', name:'Portable extinguisher', code:'EXT-MON', category:'Extinguisher',
    usedBy:2, updated:'Jan 2026',
    questions:[
      { q:'Pressure gauge in green?', type:'Pass / Fail / N/A' },
      { q:'Pin and tamper seal intact?', type:'Pass / Fail / N/A' },
      { q:'Hose / nozzle clear?', type:'Pass / Fail / N/A' },
      { q:'Mounted at correct height and visible?', type:'Pass / Fail / N/A' },
      { q:'Last annual service date', type:'Date' },
      { q:'Within hydrostatic test window?', type:'Pass / Fail / N/A' },
    ] },
];

// ── Existing component types (the list page) ────────────────────────────────
// path: 'system' | 'non-system'. defaultQty / autoInclude are the NET-NEW fields.
const SETUP_TYPES = [
  { id:'t-spk', name:'Sprinkler head', path:'system', system:'sys-wet', category:'Sprinkler',
    questionSet:'qs-sprinkler', compatible:['Sprinkler Head'], defaultQty:0, autoInclude:false, inUse:248 },
  { id:'t-valve', name:'Control valve', path:'system', system:'sys-wet', category:'Valve',
    questionSet:'qs-valve', compatible:['Control Valve','Alarm Device'], defaultQty:1, autoInclude:true, inUse:36 },
  { id:'t-facp', name:'Control panel', path:'system', system:'sys-fa', category:'Alarm',
    questionSet:'qs-panel', compatible:['Alarm Device','Control Panel'], defaultQty:1, autoInclude:true, inUse:14 },
  { id:'t-alarm', name:'Alarm device', path:'system', system:'sys-fa', category:'Alarm',
    questionSet:'qs-alarm', compatible:[], defaultQty:0, autoInclude:false, inUse:412 },
  { id:'t-standpipe', name:'Standpipe', path:'system', system:'sys-stand', category:'Standpipe',
    questionSet:null, compatible:['Control Valve'], defaultQty:0, autoInclude:false, inUse:22 },
  { id:'t-backflow', name:'Backflow preventer', path:'non-system', attach:'asset', category:'Backflow',
    questionSet:'qs-backflow', compatible:[], defaultQty:0, autoInclude:false, inUse:31 },
  { id:'t-ext', name:'Fire extinguisher', path:'non-system', attach:'building', category:'Extinguisher',
    questionSet:'qs-ext', compatible:[], defaultQty:0, autoInclude:false, inUse:540 },
  { id:'t-hood', name:'Kitchen hood nozzle', path:'system', system:'sys-hood', category:'Hood',
    questionSet:null, compatible:[], defaultQty:0, autoInclude:false, inUse:88 },
];

// Sub-component types selectable as "compatible" (what can nest under a type)
const SUBCOMPONENT_TYPES = [
  'Sprinkler Head','Control Valve','Alarm Device','Control Panel',
  'Backflow','Compressor','Standpipe','Hood','Gauge','Tamper Switch',
];

// Category accent (tag color) for question sets / types
const CATEGORY_COLOR = {
  Sprinkler:'blue', Valve:'purple', Alarm:'red', Standpipe:'green',
  Backflow:'yellow', Extinguisher:'orange', Hood:'gray',
};

const QUESTION_TYPES = ['Pass / Fail / N/A','Yes / No','Number','Text','Date','Open / Closed','Single select','Multi select'];

Object.assign(window, {
  SETUP_SYSTEMS, ATTACH_GROUPS, ATTACH_MORE, RECOMMENDED_TYPES, QUESTION_SETS,
  SETUP_TYPES, SUBCOMPONENT_TYPES, CATEGORY_COLOR, QUESTION_TYPES,
});
