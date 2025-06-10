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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser JSON avec limite adaptée (images base64 peuvent être lourdes)
app.use(express.json({ limit: '10mb' }));

// Page d'accueil basique
app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel !');
});

// Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Quand bot prêt
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

// Interaction bouton
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      content: `🖌️ Clique ici pour dessiner : https://dessin.onrender.com\nUne fois terminé, poste ton image ici avec un titre !`,
      flags: 64, // message éphémère
    });
  }
});

// Endpoint pour recevoir le dessin + titre
app.post('/submit-artwork', async (req, res) => {
  const { image, title } = req.body;

  console.log('Artwork reçu:', { title, image: image ? '[image data]' : null });

  if (!image || !title) {
    return res.status(400).json({ error: 'Image ou titre manquant' });
  }

  if (!client.isReady()) {
    return res.status(503).json({ error: 'Bot Discord pas encore prêt' });
  }

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) {
      console.error('Salon introuvable ou non textuel');
      return res.status(500).json({ error: 'Salon introuvable ou non textuel' });
    }

    // Si image est une data URL, convertir en Buffer
    let fileBuffer;
    if (image.startsWith('data:image')) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Sinon, on peut essayer de l'envoyer directement comme URL (attention)
      return res.status(400).json({ error: 'Format d\'image non supporté, utilisez une data URL base64.' });
    }

    await channel.send({
      content: `🎨 Nouvelle œuvre: **${title}**`,
      files: [{ attachment: fileBuffer, name: 'artwork.png' }],
    });

    console.log('✅ Artwork envoyé dans Discord');

    return res.json({ message: 'Artwork envoyé avec succès !' });
  } catch (error) {
    console.error('Erreur en envoyant dans Discord:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'envoi dans Discord' });
  }
});

// Lancer serveur Express
app.listen(PORT, () => {
  console.log(`🎉 Serveur Express lancé sur http://localhost:${PORT}`);
});

// Login bot Discord
client.login(process.env.DISCORD_TOKEN);
