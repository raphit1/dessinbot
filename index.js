import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, Partials, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } from 'discord.js';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Page d'accueil simple
app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel avec serveur Express.');
});

// Endpoint pour recevoir l'image du dessin
app.post('/upload', async (req, res) => {
  const { title, image } = req.body;

  if (!title || !image) {
    return res.status(400).send('Titre ou image manquant');
  }

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send({
      content: `🖼️ **${title}**`,
      files: [{ attachment: image, name: 'dessin.png' }],
    });

    res.status(200).send('Image envoyée');
  } catch (err) {
    console.error('❌ Erreur lors de l’envoi de l’image :', err);
    res.status(500).send('Erreur serveur');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur web lancé sur http://localhost:${PORT}`);
});

// ===== DISCORD BOT SETUP =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Salon introuvable ou non textuel');

    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('🎨 Créer une œuvre')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: 'Bienvenue ! Cliquez sur le bouton ci-dessous pour dessiner.',
      components: [row],
    });

    console.log('✅ Message de bienvenue envoyé dans le salon');
  } catch (error) {
    console.error('❌ Erreur :', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      content: `🖌️ Cliquez ici pour dessiner : https://dessin.onrender.com`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
