import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, Events } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' })); // Important pour lire le JSON volumineux (image base64)

// Discord Client Setup
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Dès que le bot est prêt
client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Salon introuvable ou non textuel');

    // Envoie un message avec un bouton pour dessiner
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');

    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une œuvre')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: '🎨 Clique ci-dessous pour créer une œuvre artistique :',
      components: [row],
    });

    console.log('✅ Message de bienvenue envoyé dans le salon');
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du message :', error);
  }
});

// Réaction au clic sur le bouton dans Discord
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    // Répond en privé avec le lien vers ton app de dessin
    await interaction.reply({
      content: `🖌️ Clique ici pour dessiner : https://dessin.onrender.com\nUne fois terminé, poste ton image ici avec un titre !`,
      ephemeral: true,
    });
  }
});

// Endpoint pour recevoir l'œuvre dessinée (image base64 + titre)
app.post('/submit-artwork', async (req, res) => {
  try {
    const { image, title } = req.body;

    if (!image || !title) {
      return res.status(400).json({ error: 'Image et titre requis' });
    }

    // Extraire la base64 depuis data:image/png;base64,...
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Récupérer le channel Discord
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return res.status(500).json({ error: 'Salon Discord introuvable ou non textuel' });
    }

    // Envoyer le message avec le fichier image
    await channel.send({
      content: `🎨 **${title}**`,
      files: [{ attachment: buffer, name: 'oeuvre.png' }],
    });

    console.log(`✅ Œuvre envoyée dans le channel : ${title}`);

    return res.json({ message: 'Artwork envoyé avec succès !' });
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi de l’œuvre :', error);
    return res.status(500).json({ error: 'Erreur serveur lors de l’envoi' });
  }
});

// Démarrer Express et Discord
app.listen(PORT, () => {
  console.log(`🎉 Serveur Express lancé sur http://localhost:${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
