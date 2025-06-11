// index.js
import express from 'express';
import { Client, GatewayIntentBits, Partials, Events, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } from 'discord.js';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

// --- Express Setup ---
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.send('🎨 Interface de dessin en ligne');
});

// --- Discord Client ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel]
});

// Lors du lancement du bot
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Salon introuvable ou non textuel');

    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une œuvre')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: '🎨 Clique sur le bouton ci-dessous pour créer une œuvre artistique :',
      components: [row],
    });

    console.log('✅ Message de bienvenue envoyé dans le salon');
  } catch (err) {
    console.error('❌ Erreur lors de l’envoi du message :', err);
  }
});

// Lorsqu’un utilisateur clique sur le bouton
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      content: '🖌️ Clique ici pour dessiner : https://dessin.onrender.com',
      ephemeral: true,
    });
  }
});

// Endpoint pour recevoir les œuvres du site web
app.post('/submit', async (req, res) => {
  const { title, image } = req.body;
  if (!title || !image) {
    return res.status(400).json({ error: 'Titre ou image manquant.' });
  }

  try {
    const buffer = Buffer.from(image.split(',')[1], 'base64');
    const attachment = new AttachmentBuilder(buffer, { name: 'dessin.png' });

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Salon introuvable');

    await channel.send({
      content: `🖼️ **${title}**`,
      files: [attachment],
    });

    res.status(200).json({ success: true });
    console.log(`🎉 Dessin "${title}" posté dans le salon.`);
  } catch (err) {
    console.error('❌ Erreur lors de l’envoi du dessin :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Démarrage du serveur Express
app.listen(PORT, () => {
  console.log(`🚀 Serveur Express lancé sur http://localhost:${PORT}`);
});

// Connexion à Discord
client.login(process.env.DISCORD_TOKEN);
