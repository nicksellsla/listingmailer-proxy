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
          open_tracking: true,
          link_tracking: true,
          campaign_schedule: {
            schedules: [{
              name: "Daily Schedule",
              timing: { from: "08:00", to: "21:00" },
              days: { "0": true, "1": true, "2": true, "3": true, "4": true, "5": true, "6": true },
              timezone: "Etc/GMT+7"
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

    if (action === 'get_replies') {
      const r = await fetch(BASE + '/emails?campaign_id=' + campId + '&reply=true&limit=100', {
        method: 'GET', headers
      });
      const d = await r.json();
      return res.status(r.status).json(d);
    }

    if (action === 'get_all_replies') {
      const r = await fetch(BASE + '/emails?reply=true&limit=100', {
        method: 'GET', headers
      });
      const d = await r.json();
      return res.status(r.status).json(d);
    }

    if (action === 'get_analytics') {
      const r = await fetch(BASE + '/campaigns/' + campId + '/analytics', {
        method: 'GET', headers
      });
      const d = await r.json();
      return res.status(r.status).json(d);
    }

    if (action === 'get_all_campaigns') {
      const r = await fetch(BASE + '/campaigns?limit=100', {
        method: 'GET', headers
      });
      const d = await r.json();
      return res.status(r.status).json(d);
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));
