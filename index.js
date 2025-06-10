import 'dotenv/config';
import express from 'express';
import { Client, GatewayIntentBits, ButtonBuilder, ButtonStyle, ActionRowBuilder, Events } from 'discord.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON des POST
app.use(express.json());

// Route simple pour vérifier que le serveur tourne
app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel !');
});

// Route pour recevoir les dessins postés depuis le frontend
app.post('/submit-drawing', async (req, res) => {
  const { title, imageData } = req.body;

  if (!title || !imageData) {
    return res.status(400).send('Titre ou image manquant');
  }

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      return res.status(500).send('Salon Discord introuvable ou non textuel');
    }

    // imageData est une data URL base64, on enlève le préfixe
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Envoyer le message avec titre et image en pièce jointe
    await channel.send({
      content: `🎨 Nouvelle œuvre : **${title}**`,
      files: [{ attachment: buffer, name: 'oeuvre.png' }],
    });

    // Après envoi, renvoyer un bouton "Dessiner" pour refaire une œuvre
    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une œuvre')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: 'Tu veux créer une nouvelle œuvre ? Clique ici 👇',
      components: [row],
    });

    return res.send('Image reçue et postée avec succès');
  } catch (error) {
    console.error('Erreur lors de l’envoi dans Discord :', error);
    return res.status(500).send('Erreur interne serveur');
  }
});

// Lancer le serveur Express
app.listen(PORT, () => {
  console.log(`🎉 Serveur Express lancé sur http://localhost:${PORT}`);
});

// Création du client Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

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

    console.log('✅ Message de bienvenue envoyé dans le salon');
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du message de bienvenue :', error);
  }
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

client.login(process.env.DISCORD_TOKEN);
