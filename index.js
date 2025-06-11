import 'dotenv/config';
import express from 'express';
import {
  Client,
  GatewayIntentBits,
  Events,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
} from 'discord.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '10mb' }));

// Client Discord
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Route Express de base
app.get('/', (req, res) => {
  res.send('🎨 Le bot de dessin est actif !');
});

// Réception des dessins du site
app.post('/submit-artwork', async (req, res) => {
  try {
    const { image, title } = req.body;
    if (!image || !title) {
      return res.status(400).json({ error: 'Image ou titre manquant.' });
    }

    const buffer = Buffer.from(image.split(',')[1], 'base64');
    const file = new AttachmentBuilder(buffer, { name: `${title}.png` });

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send({
      content: `🖌️ **${title}**`,
      files: [file],
    });

    // Réaffiche le bouton après l'œuvre
    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une œuvre')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: '🎨 Clique ci-dessous pour créer une nouvelle œuvre :',
      components: [row],
    });

    res.json({ status: '✅ Œuvre envoyée avec succès !' });
  } catch (err) {
    console.error('❌ Erreur dans /submit-artwork :', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// Quand le bot est prêt
client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Channel invalide.');

    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une œuvre')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: '🎨 Clique ci-dessous pour créer une œuvre artistique :',
      components: [row],
    });

    console.log('📨 Message de bienvenue envoyé dans le channel.');
  } catch (err) {
    console.error('❌ Erreur en envoyant le message initial :', err);
  }
});

// Gestion du bouton
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      content: `🖌️ Clique ici pour dessiner ton œuvre : https://dessin.onrender.com`,
      flags: 64, // équivalent à ephemeral: true
    });
  }
});

// Lancement du serveur Express
app.listen(PORT, () => {
  console.log(`🌐 Serveur Express en ligne sur http://localhost:${PORT}`);
});

// Connexion du bot à Discord
client.login(process.env.DISCORD_TOKEN);
