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

// === EXPRESS SETUP ===
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel !');
});

app.listen(PORT, () => {
  console.log(`🎉 Serveur Express lancé sur http://localhost:${PORT}`);
});

// === DISCORD BOT SETUP ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);

  try {
    console.log('🔍 Recherche du salon...');
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel) {
      console.error('❌ Salon non trouvé');
      return;
    }
    if (!channel.isTextBased()) {
      console.error('❌ Le salon trouvé n’est pas textuel');
      return;
    }
    console.log(`✅ Salon trouvé : ${channel.name}`);

    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une œuvre')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(drawButton);

    console.log('➡️ Envoi du message...');
    await channel.send({
      content: '🎨 Clique ci-dessous pour créer une œuvre artistique :',
      components: [row],
    });

    console.log('✅ Message envoyé dans le salon');
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du message :', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      ephemeral: true,
      content: `🖌️ Clique ici pour dessiner : https://dessin.onrender.com\nUne fois terminé, poste ton image ici avec un titre !`,
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
