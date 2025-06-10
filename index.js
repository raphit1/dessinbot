// index.js (bot + serveur express complet)

import 'dotenv/config';
import express from 'express';
import {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Events,
  AttachmentBuilder,
} from 'discord.js';

// Config
const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;
const PORT = process.env.PORT || 3000;

if (!TOKEN || !CHANNEL_ID) {
  console.error('❌ Variables d\'environnement manquantes !');
  process.exit(1);
}

// Express setup
const app = express();
app.use(express.json()); // Important pour parser JSON body

app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel !');
});

// Discord client setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

async function sendDrawPrompt() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Salon introuvable ou non textuel');

    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une œuvre')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: '🎨 Clique ci-dessous pour créer une œuvre artistique :',
      components: [row],
    });
  } catch (e) {
    console.error('❌ Erreur en envoyant le prompt de dessin:', e);
  }
}

// Route POST pour recevoir l'œuvre depuis le front
app.post('/submit-artwork', async (req, res) => {
  const { image, title } = req.body;

  if (!image || !title) {
    return res.status(400).json({ error: 'Image et titre requis' });
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Salon introuvable ou non textuel');

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const attachment = new AttachmentBuilder(buffer, { name: 'oeuvre.png' });

    await channel.send({
      content: `🖼️ **Nouvelle œuvre :** ${title}`,
      files: [attachment],
    });

    await sendDrawPrompt();

    return res.json({ status: 'Artwork envoyé avec succès !' });
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi de l’œuvre :', error);
    return res.status(500).json({ error: 'Erreur serveur lors de l’envoi de l’œuvre' });
  }
});

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
  await sendDrawPrompt();
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      ephemeral: true,
      content: `🖌️ Clique ici pour dessiner : https://dessin.onrender.com\nUne fois terminé, poste ton image ici avec un titre !`,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🎉 Serveur Express lancé sur http://localhost:${PORT}`);
});

client.login(TOKEN);
