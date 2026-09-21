const bcrypt = require('bcrypt');
const pool = require('./db');
const migrate = require('./migrate');

const PAL = {maroon:['#8a1c30','#3d0a14'],saffron:['#f2a541','#a8481a'],night:['#2b1a63','#0b0b28'],yellow:['#fff1a8','#f0b94a'],cream:['#fdf0d5','#f5b866'],holi:['#fff3e6','#ffc7dc'],moon:['#1f3a7a','#0a1234'],ivory:['#fbeed2','#e9c98a']};
const V0 = 'NSU Campus, Bashundhara, Dhaka';

const EVENTS = [
  {id:'durga-puja-2026',title:'Durga Puja 2026',cat:'Festival',start:'2026-10-16T09:00:00+06:00',end:'2026-10-20T21:00:00+06:00',venue:V0,motif:'mandala',palKey:'maroon',cd:true,blurb:'Five days of puja, aarti, bhog and student-led cultural evenings.',desc:['Durga Puja is the largest gathering of our year. For five days the campus fills with the sound of the dhak, the smell of dhoop and the colour of alpana at every doorway.','Come for the morning puja, stay for the evening aarti and the cultural night, where students from every department perform. Everyone is welcome, whatever their background.'],sched:[['Fri 16 Oct','Bodhon and inauguration, 9:00 AM'],['Sat 17 Oct','Saptami puja and cultural evening'],['Sun 18 Oct','Ashtami pushpanjali, aarti and dhunuchi naach'],['Mon 19 Oct','Navami puja and student cultural night'],['Tue 20 Oct','Dashami, farewell aarti and bisarjan']],tickets:[['General',0,'Puja entry, free registration',300],['Student',150,'Cultural night and bhog, NSU ID required',200],['Couple',400,'Two entries with bhog',80],['VIP',1200,'Reserved seating and bhog',40]],partners:['shonar-tori','bengal-bloom','kolpo'],pub:true},
  {id:'alpana-dhak-workshop-2026',title:'Alpana and Dhak Workshop Week',cat:'Workshop',start:'2026-09-14T16:00:00+06:00',end:'2026-09-26T18:00:00+06:00',venue:V0+' (Art Room)',motif:'mandala-light',palKey:'cream',cd:true,blurb:'Two weeks of hands-on alpana painting and dhak rhythm practice.',desc:['Learn to draw alpana with rice paste and a soft brush, and to keep time on the dhak, in small evening batches led by senior members.','No experience needed. Bring a cloth to sit on. The best designs will decorate the Durga Puja entrance.'],sched:[['Week 1','Alpana basics: lines, lotus and footprints'],['Week 2','Dhak rhythms for beginners'],['Sat 26 Sep','Showcase and tea']],tickets:[['Participant',0,'Free registration, limited seats',50]],partners:['campusprint'],pub:true},
  {id:'kali-puja-diwali-2026',title:'Deepotsav: Kali Puja and Diwali Night',cat:'Festival',start:'2026-11-08T18:00:00+06:00',end:'2026-11-08T22:00:00+06:00',venue:V0+' (Central Field)',motif:'diya',palKey:'night',cd:true,blurb:'An evening of a thousand clay lamps, music and prasad.',desc:['On the darkest night of the season we light the field with rows of diyas, hold the Kali Puja and end with music under the lamps.','Bring a friend, and a shawl for the evening breeze.'],sched:[['6:00 PM','Diya lighting'],['7:00 PM','Kali Puja and aarti'],['8:30 PM','Music and prasad']],tickets:[['General',100,'Entry with a diya kit',200],['Student',50,'NSU ID required',150]],partners:['pujo-bazaar'],pub:true},
  {id:'saraswati-puja-2027',title:'Saraswati Puja 2027',cat:'Festival',start:'2027-02-11T08:00:00+06:00',end:'2027-02-11T14:00:00+06:00',venue:V0+' (Auditorium)',motif:'lotus',palKey:'yellow',cd:true,blurb:'Offer your books and pens at the feet of the goddess of knowledge.',desc:['Students of every department gather in yellow to begin the day with puja, pushpanjali and a shared khichuri lunch.','Register your name in advance so the priest can read it during the anjali.'],sched:[['8:00 AM','Puja begins'],['11:00 AM','Pushpanjali'],['1:00 PM','Khichuri bhog']],tickets:[['Registration',0,'Free, add your name for the anjali',500]],partners:['bengal-bloom'],pub:true},
  {id:'pohela-boishakh-2027',title:'Pohela Boishakh Mela',cat:'Cultural',start:'2027-04-14T10:00:00+06:00',end:'2027-04-14T18:00:00+06:00',venue:V0+' (Central Field)',motif:'sun',palKey:'ivory',cd:true,blurb:'A day-long fair to welcome the Bengali New Year.',desc:['Stalls, folk songs, panta ilish and games on the lawn. Wear red and white.','Community members can book a stall for handmade crafts and food.'],sched:[['10:00 AM','Fair opens'],['1:00 PM','Folk music'],['5:00 PM','Closing song']],tickets:[['Entry',0,'Free registration',500]],partners:['shonar-tori'],pub:true},
  {id:'janmashtami-2026',title:'Janmashtami 2026',cat:'Festival',start:'2026-09-04T18:00:00+06:00',end:'2026-09-04T22:00:00+06:00',venue:V0+' (Auditorium)',motif:'moon',palKey:'moon',cd:false,blurb:'Kirtan, storytelling and midnight prasad for Krishna\'s birthday.',desc:['An evening of kirtan and stories from the life of Krishna, ending with prasad shared among everyone who came.'],sched:[],tickets:null,partners:['shonar-tori'],pub:true},
  {id:'holi-2026',title:'Basanta Utsav and Holi 2026',cat:'Festival',start:'2026-03-04T11:00:00+06:00',end:'2026-03-04T15:00:00+06:00',venue:V0+' (Central Field)',motif:'splash',palKey:'holi',cd:false,blurb:'Spring songs, dance and a field full of colour.',desc:['The campus field turned into a canvas of colour, with spring songs from the Basanta Utsav programme.'],sched:[],tickets:null,partners:['pujo-bazaar'],pub:true},
  {id:'saraswati-puja-2026',title:'Saraswati Puja 2026',cat:'Festival',start:'2026-01-23T08:00:00+06:00',end:'2026-01-23T14:00:00+06:00',venue:V0+' (Auditorium)',motif:'lotus',palKey:'yellow',cd:false,blurb:'A morning of puja, pushpanjali and khichuri.',desc:['Hundreds of students offered their books and pens and shared a khichuri lunch.'],sched:[],tickets:null,partners:['bengal-bloom','campusprint'],pub:true},
  {id:'durga-puja-2025',title:'Durga Puja 2025',cat:'Festival',start:'2025-09-28T09:00:00+06:00',end:'2025-10-02T21:00:00+06:00',venue:V0,motif:'mandala',palKey:'saffron',cd:false,blurb:'Five days of puja, drums and cultural nights.',desc:['Our biggest Puja yet: five days of ritual, food and student performances, closing with a tearful farewell to the goddess.'],sched:[],tickets:null,partners:['shonar-tori','bengal-bloom','kolpo'],pub:true}
];

const PARTNERS = [
  {id:'shonar-tori',name:'Shonar Tori Café',kind:'Food and beverage',mono:'ST',color:'#B5541C'},
  {id:'bengal-bloom',name:'Bengal Bloom',kind:'Florals and decor',mono:'BB',color:'#2F7D5B'},
  {id:'kolpo',name:'Kolpo Studio',kind:'Photography and film',mono:'K',color:'#2b1a63'},
  {id:'pujo-bazaar',name:'Pujo Bazaar',kind:'Festival goods',mono:'PB',color:'#8A1C30'},
  {id:'campusprint',name:'CampusPrint',kind:'Printing and signage',mono:'CP',color:'#3B5A9D'}
];

const PARTNERSHIPS = [
  {id:'ps1',partner_id:'shonar-tori',event_id:'durga-puja-2025',text:'Ran the community kitchen and served bhog on all five days.'},
  {id:'ps2',partner_id:'bengal-bloom',event_id:'durga-puja-2025',text:'Decorated the mandap with marigold and jasmine garlands every morning.'},
  {id:'ps3',partner_id:'kolpo',event_id:'durga-puja-2025',text:'Photographed and filmed the festival, and lent us the lights for the cultural night.'},
  {id:'ps4',partner_id:'campusprint',event_id:'saraswati-puja-2026',text:'Printed the programme booklets and the welcome banners.'},
  {id:'ps5',partner_id:'pujo-bazaar',event_id:'holi-2026',text:'Supplied the herbal colours and set up a small festival goods stall.'}
];

const POSTS = [
  {id:'durga-puja-2026-schedule',title:'Durga Puja 2026: the five-day schedule is out',kind:'post',cat:'Event Updates',date:'2026-09-12',ev_id:'durga-puja-2026',motif:'mandala',palKey:'maroon',summary:'From Bodhon on Friday 16 October to the farewell aarti on Tuesday 20 October, here is what each day holds.',body:['Puja begins on Friday 16 October with Bodhon and the inauguration at 9:00 AM. Each evening after aarti, students from every department take the stage for music, dance and short plays.','Registration is open for all five days. Student and Couple passes include the cultural night and bhog, while General entry to the puja stays free.','Full timings are on the event page. Any change will be posted as a notice.'],pub:true},
  {id:'alpana-workshop-week',title:'Alpana and dhak workshop week has begun',kind:'post',cat:'Activities',date:'2026-09-14',ev_id:'alpana-dhak-workshop-2026',motif:'mandala-light',palKey:'cream',summary:'The first batch is already drawing lotus patterns in rice paste. A second evening batch has been added.',body:['Our senior members are teaching alpana in the Art Room every evening. Beginners start with straight lines and work up to the lotus.','Next week the same room turns into a dhak practice studio. The best designs will greet visitors at the Puja entrance.'],pub:true},
  {id:'volunteer-call',title:'We need volunteers for Durga Puja',kind:'post',cat:'Announcements',date:'2026-09-08',ev_id:'durga-puja-2026',motif:'diya',palKey:'night',summary:'Decor, bhog service, registration desk and stage crew: pick a team and join the orientation.',body:['Puja is run by students, and this year we are building five teams: decor, bhog service, registration, stage and guest care.','Volunteers get a team shirt and a seat at the community dinner. Come to the orientation and tell us where you would like to help.'],pub:true},
  {id:'janmashtami-2026-recap',title:'Janmashtami 2026: an evening of kirtan',kind:'post',cat:'Community News',date:'2026-09-06',ev_id:'janmashtami-2026',motif:'moon',palKey:'moon',summary:'Kirtan, stories and prasad brought the auditorium together on Friday night.',body:['More than a hundred students filled the auditorium for kirtan and storytelling. The youngest storyteller was a first-year student who had never spoken on stage before.','Photos and videos are now in the gallery.'],pub:true},
  {id:'first-puja-away-from-home',title:'My first Puja away from home',kind:'post',cat:'Stories',date:'2026-08-30',motif:'lotus',palKey:'yellow',summary:'A first-year student on finding a family at the campus mandap.',body:['I came to Dhaka not knowing anyone. On the first evening of Puja I stood at the back of the mandap, and a senior handed me a tray of flowers and said, "You are late, come help."','By the last day I knew the dhak players by name. That is what this community gave me: a place where I did not have to explain myself.'],pub:true},
  {id:'durga-puja-meaning',title:'Durga Puja: the story behind the festival',kind:'culture',sec:'festivals',cat:'Culture',date:'2026-08-20',motif:'mandala',palKey:'maroon',summary:'A story of good over arrogance, and a homecoming for Bengal.',body:['Durga Puja celebrates the goddess Durga\'s victory over the buffalo demon Mahishasura, a story of goodness overcoming arrogance and violence.','In Bengal it is also a homecoming. Families gather, neighbourhoods build pandals and the city stays awake for drums, food and lights.'],pub:true},
  {id:'saraswati-books',title:'Saraswati Puja: why books rest at the goddess\'s feet',kind:'culture',sec:'festivals',cat:'Culture',date:'2026-01-20',motif:'lotus',palKey:'yellow',summary:'The one day students are happy not to study.',body:['On Saraswati Puja, students traditionally place their books, notebooks and pens before the goddess of knowledge and do not study that day.','The pause is a form of respect. Learning is offered up, then taken back with a blessing.'],pub:true},
  {id:'alpana-art',title:'Alpana: the floor art of Bengal',kind:'culture',sec:'traditions',cat:'Culture',date:'2026-07-02',motif:'mandala-light',palKey:'cream',summary:'Rice paste, a bare hand and a pattern older than anyone remembers.',body:['Alpana is a folk art of Bengal in which patterns are drawn on floors and courtyards with rice paste, traditionally by women, for festivals and rituals.','Lotus flowers, sheaves of paddy, fish and the footprints of the goddess are common motifs.'],pub:true}
];

const NOTICES = [
  {id:'puja-registration-open',title:'Durga Puja 2026 registration is open',cat:'Registration',date:'2026-09-15',short:'Reserve your pass before 10 October. Student passes need a valid NSU ID.',ev_id:'durga-puja-2026',body:['Registration for all five days of Durga Puja is now open. General entry is free, but you still need to register so we can plan the bhog.','Student, Couple and VIP passes include the cultural night. Student passes need a valid NSU ID at the gate.'],pub:true},
  {id:'volunteer-orientation',title:'Volunteer orientation this Friday',cat:'Volunteers',date:'2026-09-18',short:'Friday 25 September, 4:00 PM, Auditorium foyer.',ev_id:'durga-puja-2026',body:['Meet the five Puja teams and pick where you would like to help. Orientation takes about an hour and tea is provided.'],pub:true},
  {id:'workshop-seats',title:'Alpana workshop: a new evening batch is added',cat:'Event update',date:'2026-09-17',short:'Twenty more seats from 5:00 PM daily.',ev_id:'alpana-dhak-workshop-2026',body:['Because of demand we have added a second batch at 5:00 PM. Registered participants can switch batches from the event page.'],pub:true}
];

const ALBUMS = [
  {id:'durga-puja-2025',ev_id:'durga-puja-2025',n:12,vid:[3,9],pub:true},
  {id:'saraswati-puja-2026',ev_id:'saraswati-puja-2026',n:9,vid:[4],pub:true},
  {id:'holi-2026',ev_id:'holi-2026',n:10,vid:[2,7],pub:true},
  {id:'janmashtami-2026',ev_id:'janmashtami-2026',n:8,vid:[],pub:true}
];

const STATS = [
  {number:'24',label:'Events hosted',sort_order:0},
  {number:'3,200+',label:'Attendees across events',sort_order:1},
  {number:'15',label:'Partner organisations',sort_order:2},
  {number:'6',label:'Years together',sort_order:3}
];

const TIMELINE = [
  {year:'2020',title:'The community is founded',description:'A handful of students begin meeting for Saraswati Puja.',sort_order:0},
  {year:'2021',title:'First on-campus Puja',description:'The first Durga Puja mandap goes up on campus.',sort_order:1},
  {year:'2023',title:'Cultural nights begin',description:'Student performances become part of every major festival.',sort_order:2},
  {year:'2025',title:'Our biggest Durga Puja',description:'Five days, five partners and the first ticketed cultural night.',sort_order:3},
  {year:'2026',title:'This website',description:'Events, memories and stories in one place.',sort_order:4}
];

const SETTINGS = {
  siteName: 'Sanatani Community',
  university: 'North South University',
  tagline: 'Celebrating Our Culture. Connecting Our Community.',
  email: 'community@sanatani-nsu.example',
  address: 'Bashundhara R/A, Dhaka 1229',
  facebook: '',
  instagram: '',
  youtube: '',
  featured: 'auto',
  demoBar: true
};

async function seed() {
  await migrate();

  // Seed events
  for (const e of EVENTS) {
    const pal = PAL[e.palKey] || PAL.maroon;
    await pool.query(
      `INSERT INTO events (id, title, cat, venue, start, "end", blurb, "desc", sched, tickets, partners, cover_image, cover_mode, cover_frame, motif, pal_key, pal, cd, pub, posts, notices)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       ON CONFLICT (id) DO NOTHING`,
      [e.id, e.title, e.cat, e.venue, e.start, e.end, e.blurb, JSON.stringify(e.desc), JSON.stringify(e.sched),
       e.tickets ? JSON.stringify(e.tickets) : null, JSON.stringify(e.partners || []),
       '', 'art', 'arch', e.motif, e.palKey, JSON.stringify(pal), e.cd, e.pub, '[]', '[]']
    );
  }
  console.log('Seeded ' + EVENTS.length + ' events');

  // Seed partners
  for (const p of PARTNERS) {
    await pool.query('INSERT INTO partners (id, name, kind, mono, color) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING', [p.id, p.name, p.kind, p.mono, p.color]);
  }
  console.log('Seeded ' + PARTNERS.length + ' partners');

  // Seed partnerships
  for (const ps of PARTNERSHIPS) {
    await pool.query('INSERT INTO partnerships (id, partner_id, event_id, text) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING', [ps.id, ps.partner_id, ps.event_id, ps.text]);
  }
  console.log('Seeded ' + PARTNERSHIPS.length + ' partnerships');

  // Seed posts
  for (const p of POSTS) {
    const pal = PAL[p.palKey] || PAL.maroon;
    await pool.query(
      `INSERT INTO posts (id, title, kind, cat, sec, date, summary, body, ev_id, cover_image, motif, pal_key, pal, pub)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.title, p.kind, p.cat, p.sec || null, p.date, p.summary, JSON.stringify(p.body),
       p.ev_id || null, '', p.motif, p.palKey, JSON.stringify(pal), p.pub]
    );
  }
  console.log('Seeded ' + POSTS.length + ' posts');

  // Seed notices
  for (const n of NOTICES) {
    await pool.query(
      'INSERT INTO notices (id, title, cat, date, short, body, ev_id, pub) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING',
      [n.id, n.title, n.cat, n.date, n.short, JSON.stringify(n.body), n.ev_id || null, n.pub]
    );
  }
  console.log('Seeded ' + NOTICES.length + ' notices');

  // Seed albums
  for (const a of ALBUMS) {
    await pool.query('INSERT INTO albums (id, ev_id, n, vid, pub) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING', [a.id, a.ev_id, a.n, JSON.stringify(a.vid), a.pub]);
  }
  console.log('Seeded ' + ALBUMS.length + ' albums');

  // Seed stats
  await pool.query('DELETE FROM stats');
  for (const s of STATS) {
    await pool.query('INSERT INTO stats (number, label, sort_order) VALUES ($1, $2, $3)', [s.number, s.label, s.sort_order]);
  }
  console.log('Seeded ' + STATS.length + ' stats');

  // Seed timeline
  await pool.query('DELETE FROM timeline');
  for (const t of TIMELINE) {
    await pool.query('INSERT INTO timeline (year, title, description, sort_order) VALUES ($1, $2, $3, $4)', [t.year, t.title, t.description, t.sort_order]);
  }
  console.log('Seeded ' + TIMELINE.length + ' timeline entries');

  // Seed settings
  for (const [key, value] of Object.entries(SETTINGS)) {
    await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', [key, JSON.stringify(value)]);
  }
  console.log('Seeded settings');

  // Create admin user
  const adminHash = await bcrypt.hash('admin', 10);
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, active) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING',
    ['u1', 'Community Admin', 'admin@sanatani-nsu.example', adminHash, 'Admin', true]
  );
  const editorHash = await bcrypt.hash('editor', 10);
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, active) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING',
    ['u2', 'Content Editor', 'editor@sanatani-nsu.example', editorHash, 'Editor', true]
  );
  const volHash = await bcrypt.hash('volunteer', 10);
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, active) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO NOTHING',
    ['u3', 'Gate Volunteer', 'gate@sanatani-nsu.example', volHash, 'Volunteer', true]
  );
  console.log('Created 3 users (admin/editor/volunteer)');

  // Seed some messages
  const now = Date.now();
  const msgs = [
    {id:'m1',name:'Ishita Mondal',email:'ishita.mondal@mail.example',subject:'Volunteering for decor',body:'Hello, I would like to join the decor team for Durga Puja. I have helped with alpana before.',read:false},
    {id:'m2',name:'Kolpo Studio',email:'hello@kolpo.example',subject:'Photography partnership',body:'We would love to cover the cultural night again this year. Can we set up a call?',read:false},
    {id:'m3',name:'Tuhin Das',email:'tuhin.das@mail.example',subject:'Ticket transfer',body:'Can I transfer my Student ticket to a friend? Thanks.',read:true}
  ];
  for (const m of msgs) {
    await pool.query('INSERT INTO messages (id, name, email, subject, body, read) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING', [m.id, m.name, m.email, m.subject, m.body, m.read]);
  }
  console.log('Seeded ' + msgs.length + ' messages');

  // Seed orders
  const NAMES = ['Anik Das','Mitali Roy','Sourav Paul','Ritu Sarkar','Debjit Ghosh','Tania Saha','Arnab Dey','Sneha Biswas'];
  const mailOf = n => n.toLowerCase().replace(/[^a-z]+/g, '.') + '@mail.example';
  const orders = [];
  let on = 0;
  const orderPlan = [['durga-puja-2026', 18], ['alpana-dhak-workshop-2026', 8], ['kali-puja-diwali-2026', 5]];
  for (const [evId, count] of orderPlan) {
    const ev = EVENTS.find(e => e.id === evId);
    if (!ev || !ev.tickets) continue;
    for (let i = 0; i < count; i++) {
      const name = NAMES[on % NAMES.length];
      const t = ev.tickets[Math.floor(Math.random() * ev.tickets.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      const st = Math.random() < 0.08 ? 'cancelled' : Math.random() < 0.1 ? 'pending' : 'paid';
      const at = new Date(Date.now() - Math.floor(Math.random() * 20 * 86400000)).toISOString();
      const total = t[1] * qty;
      const tickets = [];
      if (st === 'paid') for (let k = 0; k < qty; k++) tickets.push({id: 'NSUSC-2026-' + String(Math.floor(Math.random() * 900) + 100).padStart(6, '0'), type: t[0], used: false});
      const id = 'ORD-' + (1001 + on++);
      await pool.query(
        'INSERT INTO orders (id, event_id, name, email, phone, items, total, status, method, tickets, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (id) DO NOTHING',
        [id, evId, name, mailOf(name), '017' + String(Math.floor(Math.random() * 90000000) + 10000000), JSON.stringify([[t[0], qty]]), total, st, total ? ['bKash','Nagad','Card','Rocket'][Math.floor(Math.random() * 4)] : 'Free', JSON.stringify(tickets), at]
      );
    }
  }
  console.log('Seeded ' + on + ' orders');

  // Seed donations
  const donNames = ['Anik Das','Mitali Roy','Sourav Paul','Ritu Sarkar','Debjit Ghosh'];
  for (let i = 0; i < 12; i++) {
    const name = Math.random() < 0.2 ? 'Anonymous' : donNames[i % donNames.length];
    const id = 'DON-2026-' + String(100 + i).padStart(6, '0');
    const at = new Date(Date.now() - Math.floor(Math.random() * 40 * 86400000)).toISOString();
    await pool.query(
      'INSERT INTO donations (id, name, email, amount, method, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
      [id, name, mailOf(name), [200,500,500,1000,1000,2500,5000][Math.floor(Math.random() * 7)], ['bKash','Nagad','Card'][Math.floor(Math.random() * 3)], at]
    );
  }
  console.log('Seeded 12 donations');

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
