/** Mock seed data for the prototype; treated as in-memory source of truth for rendering. */
export const data = {
  projects: [
    {
      name:'Retention Hub', owner:'Chris', status:'Active', lastReview:'02 Mar 2026', cadence:'Monthly', attention:'Needs attention',
      description:'Cross-programme work focused on retention-related resources, actions, and reporting alignment.',
      startDate:'15 Jan 2026', targetDate:'30 Jun 2026', stage:'Delivery', health:'Amber',
      updates:[
        {dateLogged:'07 Mar 2026', text:'Retention Hub delivery window has slipped by two weeks', meeting:'Programme Board prep', inform:'1/3 informed', status:'Open'},
        {dateLogged:'04 Mar 2026', text:'Draft stakeholder pack prepared for review', meeting:'Retention Hub Review', inform:'0/2 informed', status:'Draft'}
      ],
      decisions:[
        {dateLogged:'06 Mar 2026', decision:'Delay phase gate by one week', rationale:'Dependency on finance approval', impact:'Milestone shift'},
        {dateLogged:'05 Mar 2026', decision:'Use merged reporting format', rationale:'Reduce duplication', impact:'Board update changes'}
      ],
      actions:[
        {title:'Confirm revised delivery milestone', owner:'Harri Evans', due:'06 Mar 2026', status:'Overdue'},
        {title:'Prepare revised programme narrative', owner:'Chris', due:'12 Mar 2026', status:'Open'},
        {title:'Escalate finance dependency', owner:'Sarah Jones', due:'10 Mar 2026', status:'Open'}
      ],
      raid:[
        {type:'Risk', title:'Finance approval delay', dateLogged:'07 Mar 2026', owner:'Harri Evans', due:'14 Mar 2026', status:'Open', severity:'High', mitigation:'Escalate to finance lead', meeting:'Programme Board prep', lastUpdated:'07 Mar 2026'},
        {type:'Issue', title:'Late stakeholder comments', dateLogged:'03 Mar 2026', owner:'Sarah Jones', due:'-', status:'Monitoring', severity:'Medium', mitigation:'Tighten turnaround time', meeting:'Retention Hub Review', lastUpdated:'05 Mar 2026'},
        {type:'Action', title:'Confirm revised delivery milestone', dateLogged:'05 Mar 2026', owner:'Harri Evans', due:'06 Mar 2026', status:'Overdue', severity:'High', mitigation:'Sponsor chase', meeting:'Harri Evans 1:1', lastUpdated:'06 Mar 2026'},
        {type:'Decision', title:'Use merged reporting format', dateLogged:'05 Mar 2026', owner:'Chris', due:'-', status:'Pending informs', severity:'-', mitigation:'Communicate change', meeting:'Programme Board prep', lastUpdated:'06 Mar 2026'}
      ],
      meetings:[
        {date:'11 Mar 2026', title:'Harri Evans 1:1', attendees:'Chris, Harri Evans', outputs:'1 action, 2 updates'},
        {date:'07 Mar 2026', title:'Retention Hub Review', attendees:'Chris, Sarah Jones, Jo Morgan', outputs:'1 issue, 1 update'}
      ],
      people:[
        {name:'Chris', role:'Owner', latestMeeting:'11 Mar 2026', pendingInforms:'0', openActions:'1'},
        {name:'Harri Evans', role:'Approver', latestMeeting:'11 Mar 2026', pendingInforms:'3', openActions:'1'},
        {name:'Sarah Jones', role:'SME', latestMeeting:'07 Mar 2026', pendingInforms:'1', openActions:'1'},
        {name:'Jo Morgan', role:'Other', latestMeeting:'07 Mar 2026', pendingInforms:'1', openActions:'0'}
      ]
    },
    {
      name:'Supervision Hub Phase 3', owner:'Chris', status:'Active', lastReview:'18 Feb 2026', cadence:'Monthly', attention:'On track',
      description:'Phase 3 enhancements and rollout readiness for the Supervision Hub capability.',
      startDate:'20 Feb 2026', targetDate:'15 May 2026', stage:'Delivery', health:'Green',
      updates:[{dateLogged:'03 Mar 2026', text:'Content pack signed off', meeting:'Phase 3 review', inform:'0/1 informed', status:'Open'}],
      decisions:[{dateLogged:'02 Mar 2026', decision:'Keep existing launch window', rationale:'Confidence in readiness', impact:'No date movement'}],
      actions:[{title:'Review risk scoring', owner:'Jo Morgan', due:'08 Mar 2026', status:'Due today'}],
      raid:[{type:'Issue', title:'Board papers submitted late', dateLogged:'01 Mar 2026', owner:'Sarah Jones', due:'-', status:'Monitoring', severity:'Medium', mitigation:'Tighten submission process', meeting:'Phase 3 review', lastUpdated:'03 Mar 2026'}],
      meetings:[{date:'03 Mar 2026', title:'Phase 3 review', attendees:'Chris, Jo Morgan, Sarah Jones', outputs:'1 update, 1 action'}],
      people:[
        {name:'Chris', role:'Owner', latestMeeting:'03 Mar 2026', pendingInforms:'0', openActions:'0'},
        {name:'Sarah Jones', role:'SME', latestMeeting:'03 Mar 2026', pendingInforms:'0', openActions:'0'},
        {name:'Jo Morgan', role:'Other', latestMeeting:'03 Mar 2026', pendingInforms:'0', openActions:'1'}
      ]
    },
    {
      name:'Board CPD Framework', owner:'Megan', status:'Planning', lastReview:'09 Jan 2026', cadence:'Monthly', attention:'Needs attention',
      description:'Board development framework workstream spanning learning design and governance approach.',
      startDate:'10 Jan 2026', targetDate:'31 Jul 2026', stage:'Design', health:'Amber',
      updates:[{dateLogged:'05 Mar 2026', text:'Board members requested revised reporting format', meeting:'Stakeholder review', inform:'0/2 informed', status:'Open'}],
      decisions:[{dateLogged:'06 Mar 2026', decision:'Approve merged governance template', rationale:'Reduce duplicate reporting overhead', impact:'Board reporting format changes'}],
      actions:[{title:'Draft board paper', owner:'Sarah Jones', due:'12 Mar 2026', status:'Open'}],
      raid:[{type:'Decision', title:'Approve merged governance template', dateLogged:'06 Mar 2026', owner:'Megan', due:'-', status:'Pending informs', severity:'-', mitigation:'Share rationale', meeting:'Stakeholder review', lastUpdated:'06 Mar 2026'}],
      meetings:[{date:'05 Mar 2026', title:'Stakeholder review', attendees:'Megan, Sarah Jones, Harri Evans', outputs:'1 decision, 1 update'}],
      people:[
        {name:'Megan', role:'Owner', latestMeeting:'05 Mar 2026', pendingInforms:'0', openActions:'0'},
        {name:'Sarah Jones', role:'SME', latestMeeting:'05 Mar 2026', pendingInforms:'1', openActions:'1'},
        {name:'Harri Evans', role:'Approver', latestMeeting:'05 Mar 2026', pendingInforms:'1', openActions:'0'}
      ]
    }
  ],
  people: [
    {name:'Harri Evans', role:'Programme Sponsor', lastMeeting:'29 Jan 2026', cadence:'Monthly', attention:'Needs meeting', summary:'Longest gap since last 1:1. Also has one overdue action.'},
    {name:'Sarah Jones', role:'Project Lead', lastMeeting:'26 Feb 2026', cadence:'Monthly', attention:'Current', summary:'Cadence healthy. Two pending informs remain.'},
    {name:'Jo Morgan', role:'PMO Analyst', lastMeeting:'05 Mar 2026', cadence:'Optional', attention:'Current', summary:'Recent conversation held. Light follow-up load.'}
  ],
  actions: [
    {title:'Confirm revised delivery milestone', owner:'Harri Evans', due:'06 Mar 2026', status:'Overdue', project:'Retention Hub', summary:'Milestone sign-off has slipped and now affects review status.', progress:['Reminder sent 05 Mar 2026','Still awaiting sponsor response']},
    {title:'Draft board paper', owner:'Sarah Jones', due:'12 Mar 2026', status:'Open', project:'Board CPD Framework', summary:'Decision paper for governance approach.', progress:['Initial outline complete']},
    {title:'Review risk scoring', owner:'Jo Morgan', due:'08 Mar 2026', status:'Due today', project:'Supervision Hub Phase 3', summary:'Needs same-day pass before project review.', progress:['Awaiting latest numbers']}
  ],
  updates: [
    {title:'Retention Hub delivery window has slipped by two weeks', date:'07 Mar 2026', project:'Retention Hub', meeting:'Programme Board prep', people:'Harri, Sarah, Jo', status:'Pending informs'},
    {title:'Board members requested revised reporting format', date:'05 Mar 2026', project:'Board CPD Framework', meeting:'Stakeholder review', people:'Harri, Sarah', status:'Pending informs'},
    {title:'Supervision Hub content pack signed off', date:'03 Mar 2026', project:'Supervision Hub Phase 3', meeting:'Phase 3 review', people:'Sarah', status:'Open'}
  ],
  decisions: [
    {title:'Approve merged governance template', date:'06 Mar 2026', project:'Programme', rationale:'Reduce duplicate reporting overhead.', status:'Pending informs'},
    {title:'Delay phase gate by one week', date:'01 Mar 2026', project:'Retention Hub', rationale:'Dependency on finance approval.', status:'Partially informed'}
  ],
  informs: [
    {person:'Harri Evans', pending:6, next:'1:1 on 11 Mar 2026'},
    {person:'Sarah Jones', pending:2, next:'Project review on 12 Mar 2026'},
    {person:'Jo Morgan', pending:1, next:'No meeting booked'}
  ],
  meeting: {
    title:'Harri Evans 1:1', context:'People > Harri Evans', date:'11 Mar 2026 · 10:00–10:30',
    agenda:['Programme status and immediate pressures','Retention Hub review cadence breach','Overdue action on milestone sign-off'],
    updates:[{title:'Retention Hub delivery window has slipped by two weeks', informed:false},{title:'Board members requested revised reporting format', informed:false}],
    decisions:[{title:'Approve merged governance template', informed:false}],
    actions:[{title:'Confirm new milestone dates', informed:false},{title:'Escalate dependency on finance input', informed:true}]
  },
  raidGlobal: [
    {type:'Risk', text:'Finance approval delay may impact launch date', owner:'Harri Evans', due:'14 Mar 2026', status:'Open', project:'Retention Hub', impact:'Likely schedule slippage unless finance sign-off is resolved.'},
    {type:'Issue', text:'Project board papers submitted late', owner:'Sarah Jones', due:'-', status:'Monitoring', project:'Supervision Hub Phase 3', impact:'Reduces confidence in governance rhythm.'},
    {type:'Action', text:'Confirm revised delivery milestone', owner:'Harri Evans', due:'06 Mar 2026', status:'Overdue', project:'Retention Hub', impact:'Blocks closure of schedule uncertainty.'},
    {type:'Decision', text:'Approve merged governance template', owner:'Chris', due:'-', status:'Pending informs', project:'Programme', impact:'Changes board reporting format.'}
  ]
};
