import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = process.env.CHANNEL_ID; // ID du salon ciblé

client.once(Events.ClientReady, async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel || !channel.isTextBased()) {
    console.error('❌ Channel non trouvé ou invalide');
    return;
  }

  await channel.send('🎨 Clique ici pour dessiner : https://dessin.onrender.com');
  console.log('📩 Message envoyé au démarrage dans le channel ciblé');
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.author.bot) return;

  try {
    await message.channel.send('🎨 Clique ici pour dessiner : https://dessin.onrender.com');
  } catch (err) {
    console.error('❌ Erreur lors de l\'envoi du message :', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
