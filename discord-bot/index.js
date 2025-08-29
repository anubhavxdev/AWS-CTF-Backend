require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events, PermissionsBitField } = require('discord.js');
// Helper: Assign role to user by Discord ID
async function assignRole(guild, userId, roleName) {
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;
  let role = guild.roles.cache.find(r => r.name === roleName);
  if (!role) {
    role = await guild.roles.create({ name: roleName, color: 'Random' });
  }
  await member.roles.add(role);
}

// Automation: Listen for registration events (simulate polling or webhook)
setInterval(async () => {
  // Example: Poll backend for new registrations and assign Discord roles
  try {
    const res = await axios.get(`${API_URL}/api/admin/teams`); // Should be admin-protected in production
    for (const team of res.data.teams) {
      for (const member of [team.leader, ...(team.members || [])]) {
        if (member.discordId && client.guilds.cache.size > 0) {
          const guild = client.guilds.cache.first();
          await assignRole(guild, member.discordId, member.role.charAt(0).toUpperCase() + member.role.slice(1));
        }
      }
    }
  } catch (e) {}
}, 60000); // Poll every 60 seconds

// Automation: Notify users of payment or join request updates (simulate polling)
setInterval(async () => {
  // Example: Poll backend for payment status changes or join request updates
  // In production, use webhooks or backend push
  // For demo, just log or DM a test user
  // Example: DM a user if registration is closing soon
  try {
    const res = await axios.get(`${API_URL}/api/admin/registration-status`);
    if (res.data.registrationOpen === false) {
      for (const [id, user] of client.users.cache) {
        user.send('Registration is now closed!').catch(() => {});
      }
    }
  } catch (e) {}
}, 300000); // Poll every 5 minutes

const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel]
});

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:4000';

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const [cmd, ...args] = message.content.trim().split(/\s+/);


  // Registration link

  // Link Discord account to backend (for automations)
  if (cmd === '!link' && args[0]) {
    // User provides their registration email
    try {
      await axios.post(`${API_URL}/api/auth/link-discord`, {
        email: args[0],
        discordId: message.author.id
      });
      message.reply('Your Discord account has been linked to your registration.');
    } catch (e) {
      message.reply('Could not link Discord account.');
    }
  }

  if (cmd === '!register') {
    message.reply('To register, visit: https://your-frontend-url/register');
  }

  // Payment status
  if (cmd === '!payment' && args[0]) {
    try {
      const res = await axios.get(`${API_URL}/api/payments/status`, { params: { email: args[0] } });
      message.reply(`Payment status for ${args[0]}: ${JSON.stringify(res.data)}`);
    } catch (e) {
      message.reply('Could not fetch payment status.');
    }
  }

  // Join team request (for solos)
  if (cmd === '!jointeam' && args[0]) {
    try {
      // This assumes Discord username is mapped to backend user email or registration
      // For demo, ask user to provide their email and team name
      const [teamName, email] = args;
      if (!email) return message.reply('Usage: !jointeam <team name> <your email>');
      // Find team ID by name
      const teamRes = await axios.get(`${API_URL}/api/dashboard/team`, { params: { teamName } });
      const teamId = teamRes.data.team?._id;
      if (!teamId) return message.reply('Team not found.');
      // Get user token (in production, use OAuth or DM for privacy)
      // For demo, backend should allow join request by email
      const jrRes = await axios.post(`${API_URL}/api/requests/request`, { teamId }, { headers: { 'x-user-email': email } });
      message.reply(`Join request sent to ${teamName}. Request ID: ${jrRes.data.requestId}`);
    } catch (e) {
      message.reply('Could not send join request.');
    }
  }

  // Announce (admin only, by Discord role or ID)
  if (cmd === '!announce' && message.member?.permissions.has('Administrator')) {
    const announcement = args.join(' ');
    if (!announcement) return message.reply('Usage: !announce <message>');
    // Broadcast to a channel (e.g., #announcements)
    const channel = message.guild.channels.cache.find(c => c.name === 'announcements');
    if (channel) channel.send(`📢 Announcement: ${announcement}`);
    else message.reply('Announcement channel not found.');
  }

  // List teams (admin)
  if (cmd === '!listteams' && message.member?.permissions.has('Administrator')) {
    try {
      const res = await axios.get(`${API_URL}/api/admin/teams`, { headers: { /* Add admin token if needed */ } });
      const teams = res.data.teams.map(t => t.teamName).join(', ');
      message.reply(`Teams: ${teams}`);
    } catch (e) {
      message.reply('Could not fetch teams.');
    }
  }

  if (cmd === '!status' && args[0]) {
    try {
      const res = await axios.get(`${API_URL}/api/auth/status`, { params: { email: args[0] } });
      message.reply(`Status for ${args[0]}: ${JSON.stringify(res.data)}`);
    } catch (e) {
      message.reply('Could not fetch status.');
    }
  }

  if (cmd === '!team' && args[0]) {
    try {
      const res = await axios.get(`${API_URL}/api/dashboard/team`, { params: { teamName: args[0] } });
      message.reply(`Team info: ${JSON.stringify(res.data)}`);
    } catch (e) {
      message.reply('Could not fetch team info.');
    }
  }


  if (cmd === '!help') {
    message.reply(
      'Commands:\n' +
      '!register\n' +
      '!link <your registration email>\n' +
      '!status <email>\n' +
      '!team <team name>\n' +
      '!payment <email>\n' +
      '!jointeam <team name> <your email>\n' +
      '!help\n' +
      (message.member?.permissions.has('Administrator') ? '!announce <msg>\n!listteams\n' : '')
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
