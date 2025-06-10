// index.js
import 'dotenv/config';
import express from 'express';
import {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Events,
} from 'discord.js';

// Express Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Page de base (optionnelle)
app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel !');
});

// Lancer Express
app.listen(PORT, () => {
  console.log(`🎉 Serveur Express lancé sur http://localhost:${PORT}`);
});

// Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Lors du démarrage du bot
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
      content: '🎨 Clique ci-dessous pour créer une œuvre artistique :',
      components: [row],
    });

    console.log('✅ Message envoyé dans le salon');
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du message :', error);
  }
});

// Réaction au clic sur le bouton
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      ephemeral: true,
      content: `🖌️ Clique ici pour dessiner : https://ton-app-drawing.vercel.app\nUne fois terminé, poste ton image ici avec un titre !`,
    });
  }
});

// Connexion du bot à Discord
client.login(process.env.DISCORD_TOKEN);
