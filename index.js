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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Page simple pour test
app.get('/', (req, res) => {
  res.send('🎨 Bot de dessin opérationnel !');
});

app.listen(PORT, () => {
  console.log(`🎉 Serveur Express lancé sur http://localhost:${PORT}`);
});

// Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const CHANNEL_ID = process.env.CHANNEL_ID;

// Fonction pour envoyer le message “Clique pour dessiner” dans le channel
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

    console.log('✅ Message de bienvenue envoyé dans le salon');
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi du message de bienvenue :', error);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);

  // Envoi du message initial au démarrage
  await sendDrawPrompt();
});

// Interaction bouton “Dessiner”
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'draw_button') {
    await interaction.reply({
      ephemeral: true,
      content: `🖌️ Clique ici pour dessiner : https://dessin.onrender.com\nUne fois terminé, poste ton image ici avec un titre !`,
    });
  }
});

// Route pour recevoir l'œuvre dessinée et la poster dans le channel Discord
app.post('/submit-artwork', async (req, res) => {
  const { image, title } = req.body;

  if (!image || !title) {
    return res.status(400).json({ error: 'Image et titre requis' });
  }

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel || !channel.isTextBased()) throw new Error('Salon introuvable ou non textuel');

    // Extraction base64 (enlève le "data:image/png;base64," si présent)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const attachment = new AttachmentBuilder(buffer, { name: 'oeuvre.png' });

    await channel.send({
      content: `🖼️ **Nouvelle œuvre :** ${title}`,
      files: [attachment],
    });

    // Après envoi, renvoyer le message pour proposer de dessiner à nouveau
    await sendDrawPrompt();

    return res.json({ status: 'Artwork envoyé avec succès !' });
  } catch (error) {
    console.error('❌ Erreur lors de l’envoi de l’œuvre :', error);
    return res.status(500).json({ error: 'Erreur serveur lors de l’envoi de l’œuvre' });
  }
});

// Connexion du bot à Discord
client.login(process.env.DISCORD_TOKEN);
