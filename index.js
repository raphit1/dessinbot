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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

app.get('/', (req, res) => {
  res.send('✅ Serveur de dessin actif !');
});

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
      content: `🖌️ Nouvelle œuvre : **${title}**`,
      files: [file],
    });

    const drawButton = new ButtonBuilder()
      .setCustomId('draw_button')
      .setLabel('✏️ Dessiner une nouvelle œuvre')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(drawButton);

    await channel.send({
      content: '🎨 Tu veux créer une autre œuvre ?',
      components: [row],
    });

    res.json({ status: '✅ Œuvre envoyée' });
  } catch (err) {
    console.error('❌ Erreur /submit-artwork:', err);
    res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);

  const drawButton = new ButtonBuilder()
    .setCustomId('draw_button')
    .setLabel('✏️ Dessiner une œuvre')
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(drawButton);

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    await channel.send({
      content: '🎨 Clique ci-dessous pour créer ta première œuvre artistique :',
      components: [row],
    });
    console.log('📨 Message de lancement envoyé');
  } catch (err) {
    console.error('❌ Erreur en envoyant le message initial :', err);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      content: '🖌️ Clique ici pour dessiner : https://dessin.onrender.com',
      flags: 64,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur web lancé sur http://localhost:${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
