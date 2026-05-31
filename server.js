const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const BASE = 'https://api.instantly.ai/api/v2';

app.post('/instantly', async (req, res) => {
  const { action, instKey, campName, fromEmail, campId, leads } = req.body;
  const headers = { 
    'Content-Type': 'application/json', 
    'Authorization': 'Bearer ' + instKey 
  };

  try {
    if (action === 'create_campaign') {
      const r = await fetch(BASE + '/campaigns', {
        method: 'POST', headers,
        body: JSON.stringify({
          name: campName,
          email_list: [fromEmail],
          daily_limit: 50,
          stop_on_reply: true,
          track_opens: true,
          track_clicks: true,
          campaign_schedule: {
            schedules: [{
              name: "Daily Schedule",
              timing: { from: "08:00", to: "21:00" },
              days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
              timezone: "America/Los_Angeles"
            }]
          },
          sequences: [{
            steps: [{
              type: "email",
              delay: 0,
              variants: [{ subject: "{{subject}}", body: "{{personalization}}" }]
            }]
          }]
        })
      });
      const d = await r.json();
      return res.status(r.status).json(d);
    }

    if (action === 'add_leads') {
      const formattedLeads = leads.map(l => ({
        email: l.email,
        first_name: l.first_name || '',
        last_name: l.last_name || '',
        personalization: l.personalization || '',
        custom_variables: { subject: l.subject || '' }
      }));
      const r = await fetch(BASE + '/leads/add', {
        method: 'POST', headers,
        body: JSON.stringify({ campaign_id: campId, leads: formattedLeads })
      });
      const d = await r.json();
      return res.status(r.status).json(d);
    }

    if (action === 'launch_campaign') {
      const r = await fetch(BASE + '/campaigns/' + campId, {
        method: 'PATCH', headers,
        body: JSON.stringify({ status: 1 })
      });
      const d = await r.json();
      return res.status(r.status).json(d);
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));
